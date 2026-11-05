import { describe, expect, it } from "vitest";
import { candidates, withCascade, type RouteContext } from "@/lib/ai/router";
import { QuotaLedger } from "@/lib/ai/quota-ledger";
import { availableProviders, keysReport, resolveKeys } from "@/lib/ai/providers";

function context(overrides: Partial<RouteContext> & Pick<RouteContext, "keys">): RouteContext {
  return {
    task: "brief",
    ledger: new QuotaLedger({ now: () => 1_000_000 }),
    ...overrides,
  };
}

describe("chiavi Gemini a due slot", () => {
  it("GEMINI_API_KEY e GEMINI_API_KEY_FALLBACK finiscono in slot distinti", () => {
    const keys = resolveKeys({ GEMINI_API_KEY: " primaria ", GEMINI_API_KEY_FALLBACK: "riserva" });
    expect(keys.gemini).toBe("primaria");
    expect(keys["gemini-fallback"]).toBe("riserva");
  });

  it("la sola chiave di riserva rende utilizzabile solo il fallback", () => {
    const keys = resolveKeys({ GEMINI_API_KEY_FALLBACK: "riserva" });
    expect(availableProviders(keys)).toEqual(["gemini-fallback"]);
  });

  it("senza nessuna chiave Gemini nessuno slot è pronto", () => {
    const keys = resolveKeys({});
    expect(availableProviders(keys)).not.toContain("gemini");
    expect(availableProviders(keys)).not.toContain("gemini-fallback");
  });

  it("la diagnostica riporta lo slot e non contiene mai il valore della chiave", () => {
    const keys = resolveKeys({ GEMINI_API_KEY: "segreto-primario-123", GEMINI_API_KEY_FALLBACK: "segreto-riserva-456" });
    const report = keysReport(keys);
    const primary = report.find((item) => item.id === "gemini");
    const fallback = report.find((item) => item.id === "gemini-fallback");
    expect(primary).toMatchObject({ ready: true, slot: "default", envKey: "GEMINI_API_KEY" });
    expect(fallback).toMatchObject({ ready: true, slot: "fallback", envKey: "GEMINI_API_KEY_FALLBACK" });
    expect(JSON.stringify(report)).not.toContain("segreto");
  });
});

describe("catena dei provider", () => {
  it("con entrambe le chiavi la predefinita viene prima del fallback", () => {
    const keys = resolveKeys({ GEMINI_API_KEY: "a", GEMINI_API_KEY_FALLBACK: "b" });
    const chain = candidates(context({ keys })).map((candidate) => candidate.provider);
    expect(chain.indexOf("gemini")).toBeGreaterThanOrEqual(0);
    expect(chain.indexOf("gemini")).toBeLessThan(chain.indexOf("gemini-fallback"));
  });

  it("se la predefinita è in pausa per quota, la catena parte dal fallback", () => {
    const keys = resolveKeys({ GEMINI_API_KEY: "a", GEMINI_API_KEY_FALLBACK: "b" });
    const ledger = new QuotaLedger({ now: () => 1_000_000 });
    ledger.coolDown("gemini", 60, "quota");
    const chain = candidates(context({ keys, ledger })).map((candidate) => candidate.provider);
    expect(chain[0]).toBe("gemini-fallback");
    expect(chain).not.toContain("gemini");
  });

  it("con la sola chiave predefinita il fallback non compare", () => {
    const keys = resolveKeys({ GEMINI_API_KEY: "a" });
    const chain = candidates(context({ keys })).map((candidate) => candidate.provider);
    expect(chain).toContain("gemini");
    expect(chain).not.toContain("gemini-fallback");
  });

  it("se la predefinita fallisce, withCascade prosegue con il fallback", async () => {
    const keys = resolveKeys({ GEMINI_API_KEY: "a", GEMINI_API_KEY_FALLBACK: "b" });
    const result = await withCascade(context({ keys }), async (_model, candidate) => {
      if (candidate.provider === "gemini") throw new Error("429 Too Many Requests");
      return "ok";
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe("gemini-fallback");
      expect(result.value).toBe("ok");
    }
  });

  it("un errore generico mette in pausa il provider: lo stadio successivo non lo ritenta", async () => {
    const keys = resolveKeys({ GROQ_API_KEY: "g", GEMINI_API_KEY: "a" });
    const ledger = new QuotaLedger({ now: () => 1_000_000 });
    const calls: string[] = [];
    const run = async (_model: unknown, candidate: { provider: string }) => {
      calls.push(candidate.provider);
      if (candidate.provider === "groq") throw new Error("This operation was aborted");
      return "ok";
    };

    // Il primo stadio paga l'errore: Groq non risponde e la cascata prosegue.
    const first = await withCascade(context({ keys, ledger, task: "section" }), run);
    expect(first.ok).toBe(true);
    expect(calls).toContain("groq");

    // Il secondo stadio non deve spendere un altro timeout sullo stesso provider.
    calls.length = 0;
    const second = await withCascade(context({ keys, ledger, task: "section" }), run);
    expect(calls).not.toContain("groq");
    expect(ledger.waitSeconds("groq")).toBeGreaterThan(0);
  });

  it("una richiesta troppo lunga non mette in pausa il provider", async () => {
    const keys = resolveKeys({ GROQ_API_KEY: "g" });
    const ledger = new QuotaLedger({ now: () => 1_000_000 });
    const result = await withCascade(context({ keys, ledger, task: "section" }), async () => {
      throw new Error("maximum context length exceeded");
    });
    expect(result.ok).toBe(false);
    expect(ledger.waitSeconds("groq")).toBe(0);
    expect(ledger.available("groq")).toBe(true);
  });

  it("senza nessuna chiave la cascata dichiara il problema senza chiamare provider", async () => {
    const result = await withCascade(context({ keys: {} }), async () => {
      throw new Error("non doveva essere chiamato");
    });
    expect(result.ok).toBe(false);
  });
});
