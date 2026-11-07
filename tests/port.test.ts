import { describe, expect, it } from "vitest";
import { STYLE_BRIEFS, pickStyleVariant, styleBriefForPrompt, styleMenuForPrompt } from "@/lib/design/style-briefs";
import { STYLE_PRESET_NAMES } from "@/lib/schema/site";
import { STYLE_PRESETS } from "@/lib/design/tokens";
import { composeSite } from "@/lib/compiler/offline-composer";
import { BriefSchema } from "@/lib/schema/site";
import { briefPrompt, copyPrompt } from "@/lib/ai/prompts";
import {
  ApiError,
  STATUS_TO_CODE,
  errorResponse,
  logError,
  notConfigured,
  rateLimited,
  readErrorCode,
} from "@/lib/util/api-error";
import { signSession, verifySession, signValue, verifyValue, displayName, userKey } from "@/lib/auth/session";
import { parseCookies, serializeCookie, clearCookie } from "@/lib/auth/cookies";
import { safeNext } from "@/lib/auth/navigation";
import { ownerOf } from "@/lib/auth/session-client";

const NOW = "2026-09-27T09:00:00.000Z";

describe("brief di stile", () => {
  it("ogni direzione visiva ha un brief completo e non vuoto", () => {
    for (const preset of STYLE_PRESET_NAMES) {
      const brief = STYLE_BRIEFS[preset];
      expect(brief, `manca il brief di ${preset}`).toBeDefined();
      expect(brief.preset).toBe(preset);
      expect(brief.label.length).toBeGreaterThan(2);
      expect(brief.mood.length).toBeGreaterThan(20);
      expect(brief.voice.length).toBeGreaterThan(20);
      expect(brief.signatureElements.length).toBeGreaterThanOrEqual(3);
      expect(brief.avoid.length).toBeGreaterThanOrEqual(2);
      expect(brief.heroVariants.length).toBeGreaterThan(0);
      expect(brief.featuresVariants.length).toBeGreaterThan(0);
    }
  });

  it("non promette colori: il brief non contiene valori esadecimali", () => {
    for (const brief of Object.values(STYLE_BRIEFS)) {
      const text = [brief.mood, brief.voice, ...brief.signatureElements, ...brief.avoid].join(" ");
      expect(text).not.toMatch(/#[0-9a-f]{3,8}/i);
    }
  });

  it("le varianti dichiarate esistono davvero fra i blocchi", () => {
    const heroes = new Set(["split", "centered", "editorial"]);
    const features = new Set(["grid", "bento", "alternating"]);
    for (const preset of STYLE_PRESET_NAMES) {
      for (const variant of STYLE_BRIEFS[preset].heroVariants) expect(heroes.has(variant)).toBe(true);
      for (const variant of STYLE_BRIEFS[preset].featuresVariants) expect(features.has(variant)).toBe(true);
    }
  });

  it("gli stili tipografici hanno un brief per ogni preset, con lo stesso conteggio", () => {
    expect(Object.keys(STYLE_PRESETS).length).toBe(STYLE_PRESET_NAMES.length);
    expect(Object.keys(STYLE_BRIEFS).length).toBe(STYLE_PRESET_NAMES.length);
  });

  it("il compositore usa solo le varianti ammesse dallo stile scelto", () => {
    for (const preset of STYLE_PRESET_NAMES) {
      const site = composeSite(
        BriefSchema.parse({ prompt: "Pizzeria napoletana a Milano con forno a legna", stylePreset: preset }),
        { now: NOW },
      );
      const brief = STYLE_BRIEFS[preset];
      const hero = site.pages.flatMap((page) => page.blocks).find((block) => block.type === "hero");
      const features = site.pages.flatMap((page) => page.blocks).find((block) => block.type === "features");

      expect(site.theme.preset).toBe(preset);
      expect(brief.heroVariants).toContain(hero?.variant);
      expect(brief.featuresVariants).toContain(features?.variant);
    }
  });

  it("lo stesso brief produce lo stesso sito: il brief di stile non introduce casualità", () => {
    const brief = BriefSchema.parse({ prompt: "Studio legale a Roma specializzato in diritto del lavoro" });
    const first = composeSite(brief, { now: NOW });
    const second = composeSite(brief, { now: NOW });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("pickStyleVariant resta dentro l'elenco ammesso, anche con numeri estremi", () => {
    const options = ["split", "centered"] as const;
    expect(pickStyleVariant(options, () => 0)).toBe("split");
    expect(pickStyleVariant(options, () => 0.99)).toBe("centered");
    expect(pickStyleVariant(options, () => 1.5)).toBe("split");
    expect(pickStyleVariant(options, () => -0.2)).toBe("split");
  });

  it("i prompt ricevono lo stile attivo in chiaro", () => {
    const site = composeSite(BriefSchema.parse({ prompt: "Falegnameria artigiana a Verona" }), { now: NOW });
    const prompt = copyPrompt(site, site.pages[0]!);
    const brief = STYLE_BRIEFS[site.theme.preset];

    expect(prompt).toContain("Direzione visiva attiva");
    expect(prompt).toContain(brief.label);
    expect(prompt).toContain(brief.voice);
    expect(prompt).toContain("Da evitare");
  });

  it("il prompt del brief elenca tutte le direzioni, con l'atmosfera di ciascuna", () => {
    const menu = styleMenuForPrompt();
    for (const preset of STYLE_PRESET_NAMES) {
      expect(menu).toContain(preset);
      expect(menu).toContain(STYLE_BRIEFS[preset].mood.slice(0, 24));
    }

    const requested = briefPrompt(
      BriefSchema.parse({ prompt: "Software gestionale per studi medici" }),
      composeSite(BriefSchema.parse({ prompt: "Software gestionale per studi medici" }), { now: NOW }),
    );
    expect(requested).toContain("Direzioni visive disponibili");
    expect(requested).toContain("Scegli la direzione visiva più adatta");
  });

  it("se lo stile è già scelto, il prompt lo impone invece di proporre il menù", () => {
    const input = BriefSchema.parse({ prompt: "Studio legale a Roma specializzato in diritto del lavoro", stylePreset: "luxury" });
    const site = composeSite(input, { now: NOW });
    const requested = briefPrompt(input, site);

    expect(requested).toContain("Direzione visiva richiesta (non cambiarla)");
    expect(requested).toContain(STYLE_BRIEFS.luxury.mood.slice(0, 24));
    expect(requested).not.toContain("Direzioni visive disponibili");
  });
});

describe("contratto d'errore delle API", () => {
  it("la mappa degli stati copre i casi che usiamo", () => {
    expect(STATUS_TO_CODE[400]).toBe("BAD_REQUEST");
    expect(STATUS_TO_CODE[401]).toBe("UNAUTHORIZED");
    expect(STATUS_TO_CODE[403]).toBe("FORBIDDEN");
    expect(STATUS_TO_CODE[404]).toBe("NOT_FOUND");
    expect(STATUS_TO_CODE[409]).toBe("CONFLICT");
    expect(STATUS_TO_CODE[422]).toBe("VALIDATION");
    expect(STATUS_TO_CODE[429]).toBe("RATE_LIMITED");
    expect(STATUS_TO_CODE[503]).toBe("NOT_CONFIGURED");
  });

  it("un ApiError conserva stato, codice e suggerimento", async () => {
    const response = errorResponse(new ApiError("Sessione assente", 401, "UNAUTHORIZED", "Accedi di nuovo."));
    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string; code: string; hint?: string };
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.error).toBe("Sessione assente");
    expect(body.hint).toBe("Accedi di nuovo.");
  });

  it("un errore non previsto diventa 500 generico, senza dettagli interni", async () => {
    const lines: string[] = [];
    const original = console.error;
    console.error = (value?: unknown) => lines.push(String(value));

    try {
      const response = errorResponse(new Error("connessione al database scaduta"), { route: "test" });
      expect(response.status).toBe(500);
      const body = (await response.json()) as { error: string; code: string };
      expect(body.code).toBe("INTERNAL");
      expect(body.error).not.toContain("database");
    } finally {
      console.error = original;
    }

    expect(lines.length).toBe(1);
    const logged = JSON.parse(lines[0]!) as { level: string; type: string; message: string; route: string; ts: string };
    expect(logged.level).toBe("error");
    expect(logged.type).toBe("unhandled_api_error");
    expect(logged.message).toContain("database");
    expect(logged.route).toBe("test");
    expect(Number.isNaN(Date.parse(logged.ts))).toBe(false);
  });

  it("gli helper lanciano con il codice giusto", () => {
    expect(() => notConfigured("Manca la chiave")).toThrowError(ApiError);
    try {
      rateLimited("Troppe richieste");
    } catch (error) {
      expect(error instanceof ApiError ? error.code : null).toBe("RATE_LIMITED");
      expect(error instanceof ApiError ? error.status : null).toBe(429);
    }
  });

  it("readErrorCode riconosce solo i codici noti", () => {
    expect(readErrorCode({ code: "NOT_CONFIGURED" })).toBe("NOT_CONFIGURED");
    expect(readErrorCode({ code: "QUALCOSA" })).toBeNull();
    expect(readErrorCode("stringa")).toBeNull();
  });

  it("logError scrive una riga JSON con il contesto", () => {
    const lines: string[] = [];
    const original = console.error;
    console.error = (value?: unknown) => lines.push(String(value));
    try {
      logError(new Error("esploso"), { route: "auth/callback" });
    } finally {
      console.error = original;
    }
    const logged = JSON.parse(lines[0]!) as { route: string; type: string };
    expect(logged.route).toBe("auth/callback");
    expect(logged.type).toBe("unhandled_api_error");
  });
});

describe("sessioni firmate", () => {
  const user = { provider: "github" as const, id: "42", name: "Marco Rossi", email: "marco@example.it", avatar: "" };

  it("una sessione valida torna indietro identica", () => {
    const token = signSession(user, "segreto-di-prova-lungo", Date.parse(NOW));
    const read = verifySession(token, "segreto-di-prova-lungo", Date.parse(NOW) + 1000);
    expect(read).toEqual(user);
  });

  it("un cookie manomesso o scaduto non passa", () => {
    const token = signSession(user, "segreto-di-prova-lungo", Date.parse(NOW));
    expect(verifySession(token, "altro-segreto", Date.parse(NOW))).toBeNull();
    expect(verifySession(`${token}x`, "segreto-di-prova-lungo", Date.parse(NOW))).toBeNull();
    expect(verifySession(undefined, "segreto-di-prova-lungo", Date.parse(NOW))).toBeNull();

    const expired = verifySession(token, "segreto-di-prova-lungo", Date.parse(NOW) + 40 * 24 * 3600 * 1000);
    expect(expired).toBeNull();
  });

  it("i valori di servizio (state OAuth) sono firmati allo stesso modo", () => {
    const signed = signValue("abc123|/studio/sito-1", "segreto-di-prova-lungo");
    expect(verifyValue(signed, "segreto-di-prova-lungo")).toBe("abc123|/studio/sito-1");
    expect(verifyValue(`${signed}0`, "segreto-di-prova-lungo")).toBeNull();
    expect(verifyValue("abc.def", "segreto-di-prova-lungo")).toBeNull();
  });

  it("il workspace distingue le persone", () => {
    expect(userKey(user)).toBe("github:42");
    expect(userKey({ ...user, provider: "local", id: "marco" })).toBe("local:marco");
    expect(ownerOf(null)).toBe("local:ospite");
    expect(ownerOf(user)).toBe("github:42");
    expect(ownerOf({ ...user, provider: "local", id: "marco" })).toBe("local:marco");
    expect(displayName("   ")).toBe("Ospite");
    expect(displayName("<script>alert(1)</script>")).not.toContain("<");
    expect(displayName("x".repeat(80)).length).toBeLessThanOrEqual(41);
  });
});

describe("cookie e navigazione", () => {
  it("serializza i cookie con le protezioni giuste", () => {
    const cookie = serializeCookie("atelier_session", "valore con spazi", { maxAge: 60, sameSite: "lax" });
    expect(cookie).toContain("atelier_session=valore%20con%20spazi");
    expect(cookie).toContain("Max-Age=60");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(clearCookie("atelier_session")).toContain("Max-Age=0");
  });

  it("rilegge i cookie, compresi quelli con caratteri codificati", () => {
    const jar = parseCookies("a=1; atelier_session=abc.def%3D; vuoto=");
    expect(jar.a).toBe("1");
    expect(jar.atelier_session).toBe("abc.def=");
    expect(jar.vuoto).toBe("");
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies("spazzatura")).toEqual({});
  });

  it("solo destinazioni interne sono accettate dopo l'accesso", () => {
    expect(safeNext("/studio/abc")).toBe("/studio/abc");
    expect(safeNext("/nuovo?prompt=pizza")).toBe("/nuovo?prompt=pizza");
    expect(safeNext("https://evil.example")).toBe("/dashboard");
    expect(safeNext("//evil.example")).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
    expect(safeNext("/ok\\..\\windows")).toBe("/dashboard");
  });
});
