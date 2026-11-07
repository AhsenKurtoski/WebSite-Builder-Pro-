import { describe, expect, it, vi } from "vitest";
import {
  applyBlueprint,
  describeStageFailure,
  normalizeFontPairing,
  normalizePreset,
  attemptSliceMs,
  structuredProviderOptions,
  withFormatRetry,
  withStageDeadline,
} from "@/lib/ai/compile";
import { composeSite } from "@/lib/compiler/offline-composer";
import { BriefSchema } from "@/lib/schema/site";

// Il modulo `ai` viene sostituito: qui interessa il comportamento del
// compilatore quando un provider non risponde, non il provider stesso.
vi.mock("ai", () => ({
  generateText: vi.fn(async () => {
    throw new Error("in questa suite non si chiamano provider");
  }),
  Output: { object: (input: unknown) => input },
}));

describe("scadenza degli stadi AI", () => {
  it("una chiamata che risponde passa liscia, con il segnale pronto", async () => {
    const seen: string[] = [];
    const value = await withStageDeadline(1500, async (signal) => {
      seen.push(`abortito: ${signal.aborted}`);
      return "ok";
    });
    expect(value).toBe("ok");
    expect(seen).toEqual(["abortito: false"]);
  });

  it("una chiamata che ignora l'abortSignal viene comunque abbandonata", async () => {
    const started = Date.now();
    const controller = { signal: null as AbortSignal | null };

    await expect(
      withStageDeadline(300, (signal) => {
        controller.signal = signal;
        return new Promise<string>(() => {
          /* un provider che non risponde mai */
        });
      }),
    ).rejects.toThrow(/tempo massimo/i);

    expect(Date.now() - started).toBeLessThan(2000);
    expect(controller.signal?.aborted).toBe(true);
  });

  it("un errore del provider arriva al chiamante, senza essere mascherato", async () => {
    await expect(
      withStageDeadline(1000, async () => {
        throw new Error("429 Too Many Requests");
      }),
    ).rejects.toThrow("429");
  });

  it("il limite viene contenuto fra 250 ms e 60 s", async () => {
    // Un budget assurdo non deve diventare un'attesa infinita.
    const started = Date.now();
    await expect(withStageDeadline(0, () => new Promise<string>(() => {}))).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(1500);
  });
});

describe("output strutturato dei provider", () => {
  it("Groq chiede JSON semplice e ragionamento minimo", () => {
    expect(structuredProviderOptions("groq")).toEqual({
      groq: { structuredOutputs: false, reasoningEffort: "low" },
    });
  });

  it("Cerebras resta in json_schema, non stretto e con ragionamento minimo", () => {
    expect(structuredProviderOptions("cerebras")).toEqual({
      cerebras: { strictJsonSchema: false, reasoningEffort: "low" },
    });
  });

  it("Gemini resta leggero per non consumare il budget in ragionamento", () => {
    expect(structuredProviderOptions("gemini")).toEqual({
      google: { thinkingConfig: { thinkingLevel: "low" } },
    });
  });

  it("gli altri provider restano senza opzioni aggiuntive", () => {
    expect(structuredProviderOptions("gemini-fallback")).toBeUndefined();
    expect(structuredProviderOptions("openrouter")).toBeUndefined();
    expect(structuredProviderOptions("cloudflare")).toBeUndefined();
  });
});

describe("budget di uno stadio AI", () => {
  it("un tentativo riceve il tempo che resta allo stadio, non un budget nuovo", () => {
    const now = 1_000_000;
    expect(attemptSliceMs(now + 25_000, now, 25_000)).toBe(25_000);
    expect(attemptSliceMs(now + 3_000, now, 25_000)).toBe(4_000);
    expect(attemptSliceMs(now - 5_000, now, 25_000)).toBe(4_000);
  });

  it("non supera mai il tetto dello stadio", () => {
    expect(attemptSliceMs(1_000_000 + 90_000, 1_000_000, 20_000)).toBe(20_000);
  });
});

describe("ritentativo sugli errori di formato", () => {
  it("un JSON non conforme viene riprovato una volta e poi passa", async () => {
    let calls = 0;
    const value = await withFormatRetry(async () => {
      calls += 1;
      if (calls === 1) {
        const error = new Error("No object generated: could not parse the response.");
        error.name = "AI_NoObjectGeneratedError";
        throw error;
      }
      return "ok";
    });
    expect(value).toBe("ok");
    expect(calls).toBe(2);
  });

  it("gli altri errori risalgono subito: il ritentativo non nasconde un guasto", async () => {
    let calls = 0;
    await expect(
      withFormatRetry(async () => {
        calls += 1;
        throw new Error("429 Too Many Requests");
      }),
    ).rejects.toThrow("429");
    expect(calls).toBe(1);
  });
});

describe("messaggi di errore leggibili", () => {
  it("un aborto non arriva all'utente come testo interno", () => {
    expect(describeStageFailure("This operation was aborted")).toBe("Nessun provider ha risposto entro il tempo previsto");
    expect(describeStageFailure("Stadio AI oltre il tempo massimo (25000 ms)")).toContain("Nessun provider");
  });

  it("traduce i casi noti e lascia passare gli altri", () => {
    expect(describeStageFailure("Tempo di compilazione esaurito per gli stadi AI")).toBe("Tempo degli stadi AI esaurito");
    expect(describeStageFailure("Nessun provider configurato")).toBe("Nessuna chiave AI configurata sul server");
    expect(describeStageFailure("429 Too Many Requests")).toBe("429 Too Many Requests");
  });
});

describe("lettura tollerante del blueprint", () => {
  const brief = BriefSchema.parse({ prompt: "Studio di architettura a Bologna, ristrutturazioni di interni" });

  it("riconosce lo stile anche scritto male", () => {
    expect(normalizePreset("tech")).toBe("tech");
    expect(normalizePreset("  Editorial ")).toBe("editorial");
    expect(normalizePreset("Brutalist (manifesto)")).toBe("brutalist");
    expect(normalizePreset("Luxury minimal")).toBe("luxury");
    expect(normalizePreset("" )).toBeNull();
    expect(normalizePreset("fantasia")).toBeNull();
  });

  it("riconosce la tipografia per id o per nome leggibile", () => {
    expect(normalizeFontPairing("grotesk-inter")).toBe("grotesk-inter");
    expect(normalizeFontPairing("Playfair + Source Sans")).toBe("playfair-source");
    expect(normalizeFontPairing("JetBrains Mono + Work Sans")).toBe("jetbrains-work");
    expect(normalizeFontPairing("comic sans")).toBeNull();
  });

  it("un blueprint approssimativo non rompe il sito: si applica ciò che è valido", () => {
    const site = composeSite(brief, { now: "2026-09-27T09:00:00.000Z" });
    const applied = applyBlueprint(site, {
      preset: "NON ESISTE",
      fontPairing: "FS Albert",
      paletteHue: undefined,
      tagline: "Ristrutturiamo appartamenti storici senza snaturarli.",
      tone: "semplice e concreto",
      pages: [],
    });

    expect(applied.site.theme.preset).toBe(site.theme.preset);
    expect(applied.site.theme.fontPairing).toBe(site.theme.fontPairing);
    expect(applied.site.theme.palette).toEqual(site.theme.palette);
    expect(applied.site.brand.tagline).toContain("Ristrutturiamo");
    expect(applied.warnings.length).toBe(2);
  });

  it("quando il modello è preciso, il blueprint si applica per intero", () => {
    const site = composeSite(brief, { now: "2026-09-27T09:00:00.000Z" });
    const applied = applyBlueprint(site, {
      preset: "tech",
      fontPairing: "jetbrains-work",
      paletteHue: 210,
      tagline: "Studio di architettura a Bologna: ristrutturazioni con progetto e cantiere seguiti.",
      tone: "tecnico",
      pages: [{ path: "/", seoTitle: "Titolo nuovo", seoDescription: "Descrizione nuova" }],
    });

    expect(applied.site.theme.preset).toBe("tech");
    expect(applied.site.theme.fontPairing).toBe("jetbrains-work");
    expect(applied.site.theme.palette.primary.h).toBe(210);
    expect(applied.site.pages[0]?.seo.title).toBe("Titolo nuovo");
    expect(applied.warnings.length).toBe(0);
  });
});
