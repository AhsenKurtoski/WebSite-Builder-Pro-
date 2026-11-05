import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { SIGNATURE_TOLERANCE_MS, SIGNED_BODY_MAX_CHARS, signedBody, verifySignature } from "@/lib/cloud/sign";

/**
 * La busta `{ payload, ts, sig }` è l'unico modo di entrare nel database:
 * se la firma non è esatta, la richiesta non deve passare. Questi test
 * verificano il formato byte per byte e ogni tentativo di manomissione.
 */

const SECRET = "segreto-di-prova-0123456789";

/** La stessa formula del database: `hmac(sha256, payload || '.' || ts)`. */
function hmac(payload: string, ts: number, secret = SECRET): string {
  return createHmac("sha256", secret).update(`${payload}.${ts}`).digest("base64url");
}

describe("costruzione della busta", () => {
  it("produce i tre campi attesi e una firma verificabile", () => {
    const raw = signedBody({ op: "list", owner: "local:abc" }, SECRET);
    const parsed = JSON.parse(raw) as { payload: string; ts: number; sig: string };

    expect(typeof parsed.payload).toBe("string");
    expect(typeof parsed.ts).toBe("number");
    expect(Math.abs(Date.now() - parsed.ts)).toBeLessThan(2000);
    // `payload` è il JSON dell'operazione, non una stringa riserializzata.
    expect(JSON.parse(parsed.payload)).toEqual({ op: "list", owner: "local:abc" });
    expect(parsed.sig).toBe(hmac(parsed.payload, parsed.ts));
    expect(verifySignature(raw, SECRET).ok).toBe(true);
  });

  it("la firma è base64url: nessun carattere che PostgREST debba proteggere", () => {
    const parsed = JSON.parse(signedBody({ owner: "local:x".repeat(40) }, SECRET)) as { sig: string };
    expect(parsed.sig).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("la stessa operazione firmata con lo stesso istante dà la stessa firma (HMAC, non un nonce)", () => {
    const a = JSON.parse(signedBody({ op: "list" }, SECRET)) as { sig: string };
    const b = JSON.parse(signedBody({ op: "list" }, SECRET)) as { sig: string };
    expect(a.sig).toBe(b.sig);
    expect(verifySignature(signedBody({ op: "list" }, SECRET), SECRET).ok).toBe(true);
    vi.useRealTimers();
  });

  it("un corpo oltre il tetto non viene nemmeno costruito", () => {
    const huge = { op: "upserts", blob: "z".repeat(SIGNED_BODY_MAX_CHARS) };
    expect(() => signedBody(huge, SECRET)).toThrow(/troppo grande/i);
  });
});

describe("verifica della firma", () => {
  const raw = signedBody({ op: "list", owner: "github:42" }, SECRET);

  it("accetta la busta integra", () => {
    const result = verifySignature(raw, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) expect(JSON.parse(result.payload)).toEqual({ op: "list", owner: "github:42" });
  });

  it("rifiuta un altro segreto", () => {
    const result = verifySignature(raw, "segreto-sbagliato");
    expect(result).toEqual({ ok: false, reason: "Firma non valida" });
  });

  it("rifiuta un payload modificato dopo la firma", () => {
    const parsed = JSON.parse(raw) as { payload: string; ts: number; sig: string };
    const tampered = JSON.stringify({ ...parsed, payload: JSON.stringify({ op: "list", owner: "github:99" }) });
    expect(verifySignature(tampered, SECRET)).toEqual({ ok: false, reason: "Firma non valida" });
  });

  it("rifiuta una firma modificata", () => {
    const parsed = JSON.parse(raw) as { payload: string; ts: number; sig: string };
    const flipped = parsed.sig.slice(0, -1) + (parsed.sig.endsWith("A") ? "B" : "A");
    expect(verifySignature(JSON.stringify({ ...parsed, sig: flipped }), SECRET)).toEqual({
      ok: false,
      reason: "Firma non valida",
    });
  });

  it("rifiuta un istante spostato: la firma copre anche il tempo", () => {
    const parsed = JSON.parse(raw) as { payload: string; ts: number; sig: string };
    expect(verifySignature(JSON.stringify({ ...parsed, ts: parsed.ts + 1000 }), SECRET)).toEqual({
      ok: false,
      reason: "Firma non valida",
    });
  });

  it("rifiuta una busta troppo vecchia", () => {
    const ts = Date.now() - SIGNATURE_TOLERANCE_MS - 1000;
    const payload = JSON.stringify({ op: "list" });
    const stale = JSON.stringify({ payload, ts, sig: hmac(payload, ts) });
    expect(verifySignature(stale, SECRET)).toEqual({ ok: false, reason: "Firma fuori finestra" });
  });

  it("rifiuta una busta con l'orologio nel futuro", () => {
    const ts = Date.now() + SIGNATURE_TOLERANCE_MS + 1000;
    const payload = JSON.stringify({ op: "list" });
    const ahead = JSON.stringify({ payload, ts, sig: hmac(payload, ts) });
    expect(verifySignature(ahead, SECRET)).toEqual({ ok: false, reason: "Firma fuori finestra" });
  });

  it("accetta un lieve disallineamento di orologio", () => {
    const ts = Date.now() - SIGNATURE_TOLERANCE_MS + 5000;
    const payload = JSON.stringify({ op: "tombstones", owner: "local:abc" });
    const shifted = JSON.stringify({ payload, ts, sig: hmac(payload, ts) });
    expect(verifySignature(shifted, SECRET).ok).toBe(true);
  });

  it("rifiuta buste incomplete, senza dire cosa manca a chi non è autorizzato", () => {
    expect(verifySignature("non-json", SECRET)).toEqual({ ok: false, reason: "Corpo non leggibile" });
    expect(verifySignature("null", SECRET)).toEqual({ ok: false, reason: "Corpo non leggibile" });
    // Un JSON valido che non è una busta non ha i campi: manca il payload.
    expect(verifySignature("[]", SECRET)).toEqual({ ok: false, reason: "Payload assente o troppo grande" });
    expect(verifySignature(JSON.stringify({ ts: Date.now(), sig: "x" }), SECRET)).toEqual({
      ok: false,
      reason: "Payload assente o troppo grande",
    });
    expect(verifySignature(JSON.stringify({ payload: "{}", sig: "x" }), SECRET)).toEqual({
      ok: false,
      reason: "Istante assente",
    });
    expect(verifySignature(JSON.stringify({ payload: "{}", ts: Date.now() }), SECRET)).toEqual({
      ok: false,
      reason: "Firma assente",
    });
    expect(
      verifySignature(JSON.stringify({ payload: "z".repeat(SIGNED_BODY_MAX_CHARS + 1), ts: Date.now(), sig: "x" }), SECRET),
    ).toEqual({ ok: false, reason: "Payload assente o troppo grande" });
  });

  it("un ts non numerico non passa per una data", () => {
    expect(verifySignature(JSON.stringify({ payload: "{}", ts: "adesso", sig: "x" }), SECRET)).toEqual({
      ok: false,
      reason: "Istante assente",
    });
  });
});
