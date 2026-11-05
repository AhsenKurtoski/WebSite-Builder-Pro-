import { generateText, Output } from "ai";
import { z } from "zod";
import { FONT_PAIRINGS, type StylePreset } from "@/lib/design/tokens";
import { harmonyHue } from "@/lib/design/oklch";
import { composeSite } from "@/lib/compiler/offline-composer";
import { structuralSignature } from "@/lib/compiler/uniqueness";
import { findDefinition } from "@/lib/schema/registry";
import { runGates, type GateReport } from "@/lib/quality/gates";
import { estimateTokens, QuotaLedger } from "@/lib/ai/quota-ledger";
import { describeCascade, withCascade, type CascadeAttempt } from "@/lib/ai/router";
import { BRIEF_SYSTEM, COPY_SYSTEM, briefPrompt, copyPrompt } from "@/lib/ai/prompts";
import { availableProviders, providerSpec, resolveKeys, type ProviderId } from "@/lib/ai/providers";
import {
  STYLE_PRESET_NAMES,
  type Block,
  type Brief,
  type Page,
  type Site,
} from "@/lib/schema/site";

/**
 * Compilatore.
 *
 * Ordine dei fatti, sempre lo stesso:
 *   1. il composer deterministico produce subito un sito completo e valido;
 *   2. se c'è almeno una chiave, l'AI RISCRIVE I CONTENUTI di quel sito;
 *   3. ogni scrittura passa dallo schema del blocco, quindi non può rompere nulla;
 *   4. i gate di qualità misurano il risultato.
 *
 * Se l'AI non è disponibile o fallisce, il punto 1 è già il risultato finale.
 */

/**
 * Blueprint: la direzione creativa proposta dal modello.
 *
 * I campi sono volutamente tolleranti: un modello che risponde "Tech" invece di
 * "tech", una tinta come "210", una tagline più lunga del richiesto o un campo
 * mancante non devono far perdere il lavoro fatto finora. `.catch()` tiene il
 * valore quando è conforme e mette il ripiego quando non lo è, invece di far
 * fallire l'intera risposta; la normalizzazione avviene qui sotto.
 *
 * L'unico esito che consideriamo un fallimento è una risposta senza nessun campo
 * utilizzabile: se ne occupa `isUsefulBlueprint`.
 */
export const BlueprintResponse = z.object({
  preset: z.string().catch(""),
  fontPairing: z.string().catch(""),
  // Una tinta fuori scala è un errore del modello, non del sito: meglio nessuna
  // tinta che una tinta sbagliata.
  paletteHue: z.coerce.number().min(0).max(360).optional().catch(undefined),
  tagline: z.string().catch(""),
  tone: z.string().catch(""),
  pages: z
    .array(
      z.object({
        path: z.string().catch(""),
        seoTitle: z.string().catch(""),
        seoDescription: z.string().catch(""),
      }),
    )
    .catch([]),
});
export type BlueprintResponse = z.infer<typeof BlueprintResponse>;

/** Vero se il blueprint contiene almeno un elemento applicabile al sito. */
export function isUsefulBlueprint(value: BlueprintResponse): boolean {
  return Boolean(
    value.preset || value.fontPairing || value.tagline || value.tone || value.paletteHue !== undefined || value.pages.length > 0,
  );
}

/** Vero se la riscrittura contiene almeno un campo applicabile alla pagina. */
export function isUsefulCopy(value: CopyResponse): boolean {
  return Boolean(
    value.seoTitle ||
      value.heroTitle ||
      value.heroSubtitle ||
      value.ctaTitle ||
      value.ctaText ||
      value.services.length > 0 ||
      value.process.length > 0 ||
      value.faq.length > 0 ||
      value.testimonials.length > 0,
  );
}

/**
 * Errore di "risposta inutilizzabile".
 *
 * Porta lo stesso nome che usa l'SDK per gli errori di formato, così il
 * ritentativo di `withFormatRetry` si attiva anche quando il modello risponde
 * nel modo giusto ma senza niente dentro.
 */
function emptyResponseError(detail: string): Error {
  const error = new Error(`No object generated: ${detail}`);
  error.name = "AI_NoObjectGeneratedError";
  return error;
}

/** Riconosce lo stile anche se il modello lo scrive in modo approssimativo. */
export function normalizePreset(value: string): StylePreset | null {
  const cleaned = value.toLowerCase().replace(/[^a-z\s]/g, " ").trim();
  if (!cleaned) return null;
  return (
    STYLE_PRESET_NAMES.find((name) => name === cleaned) ??
    STYLE_PRESET_NAMES.find((name) => cleaned.startsWith(name)) ??
    STYLE_PRESET_NAMES.find((name) => cleaned.includes(name)) ??
    null
  );
}

/** Riconosce l'accoppiamento tipografico per id o per nome leggibile. */
export function normalizeFontPairing(value: string): string | null {
  const cleaned = value.toLowerCase().trim();
  if (!cleaned) return null;
  const byId = FONT_PAIRINGS.find((item) => item.id === cleaned);
  if (byId) return byId.id;
  const byLabel = FONT_PAIRINGS.find((item) => item.label.toLowerCase() === cleaned);
  if (byLabel) return byLabel.id;
  return FONT_PAIRINGS.find((item) => cleaned.includes(item.heading.split(",")[0]!.replace(/'/g, "").toLowerCase()))?.id ?? null;
}

export const CopyResponse = z.object({
  seoTitle: z.string().catch(""),
  seoDescription: z.string().catch(""),
  heroEyebrow: z.string().catch(""),
  heroTitle: z.string().catch(""),
  heroSubtitle: z.string().catch(""),
  services: z.array(z.object({ title: z.string().catch(""), text: z.string().catch("") })).catch([]),
  process: z.array(z.object({ title: z.string().catch(""), text: z.string().catch("") })).catch([]),
  faq: z.array(z.object({ question: z.string().catch(""), answer: z.string().catch("") })).catch([]),
  testimonials: z
    .array(z.object({ quote: z.string().catch(""), author: z.string().catch(""), role: z.string().catch("") }))
    .catch([]),
  ctaTitle: z.string().catch(""),
  ctaText: z.string().catch(""),
});
export type CopyResponse = z.infer<typeof CopyResponse>;

export type CompileStageId = "brief" | "blueprint" | "copy" | "hardening";

export type CompileEvent =
  | { type: "stage"; id: CompileStageId; status: "running" | "done" | "skipped" | "failed"; detail?: string; ms?: number }
  | { type: "provider"; provider: ProviderId; label: string; model: string; task: string }
  | { type: "page"; path: string; title: string }
  | { type: "warning"; message: string }
  | { type: "done"; provider?: string; elapsedMs: number; gates: GateReport; site: Site };

/**
 * Applica una modifica alle props di un blocco facendola passare dallo schema.
 * Se la patch non è valida, il blocco resta com'era: l'AI non può corrompere il sito.
 */
export function patchBlock(block: Block, patch: Record<string, unknown>): Block {
  const definition = findDefinition(block.type, block.variant);
  if (!definition) return block;
  const parsed = definition.schema.safeParse({ ...block.props, ...patch });
  return parsed.success ? { ...block, props: parsed.data as Record<string, unknown> } : block;
}

function patchBlocks(page: Page, type: string, patch: (block: Block) => Record<string, unknown>): Page {
  return {
    ...page,
    blocks: page.blocks.map((block) => (block.type === type ? patchBlock(block, patch(block)) : block)),
  };
}

/**
 * Opzioni di provider per gli stadi che chiedono un output strutturato.
 *
 * Due trappole note, entrambe dei modelli gpt-oss su provider gratuiti:
 *
 * 1. Ragionamento. Sono modelli che pensano prima di scrivere e, con gli scopi
 *    predefiniti, possono consumare tutto lo spazio in ragionamento e consegnare
 *    una risposta vuota: il provider la rifiuta con `json_validate_failed`
 *    (verificato: 2/2 risposte vuote con lo sforzo predefinito, 4/4 corrette con
 *    `reasoningEffort: "low"`). Chiediamo quindi lo sforzo minimo.
 * 2. Schema stretto. La modalità `strict` pretende che ogni campo compaia in
 *    `required`, ma i nostri schemi hanno campi con valore predefinito (devono
 *    essere tolleranti): la richiesta verrebbe respinta con 400 prima di
 *    generare. La validazione, in ogni caso, la ripete lo schema zod.
 *
 * Groq vuole anche la parola "json" nel prompt quando si chiede un oggetto JSON:
 * se ne occupa `systemWithFormat`.
 */
export function structuredProviderOptions(
  provider: ProviderId,
): Record<string, Record<string, string | boolean>> | undefined {
  if (usesPlainJson(provider)) return { [provider]: { structuredOutputs: false, reasoningEffort: "low" } };
  if (provider === "cerebras") return { cerebras: { strictJsonSchema: false, reasoningEffort: "low" } };
  return undefined;
}

/** Provider a cui chiediamo un JSON semplice al posto di uno schema. */
function usesPlainJson(provider: ProviderId): boolean {
  return provider === "groq";
}

/**
 * Istruzione di formato.
 *
 * Groq accetta `response_format: json_object` solo se nei messaggi compare la
 * parola "json" (altrimenti risponde 400), e chiederlo esplicitamente aiuta
 * anche gli altri modelli a non incorniciare la risposta con testo o commenti.
 */
const JSON_INSTRUCTION = "Rispondi esclusivamente con un oggetto JSON valido: nessun testo prima o dopo, nessun blocco di codice.";

/** Prompt di sistema con l'istruzione di formato, dove serve. */
function systemWithFormat(system: string, provider: ProviderId): string {
  return usesPlainJson(provider) ? `${system}\n${JSON_INSTRUCTION}` : system;
}

/**
 * Traduce l'errore di uno stadio in una frase leggibile.
 *
 * Il chiamante non deve leggere "This operation was aborted": chi usa l'app
 * vuole sapere cosa è successo e che il sito c'è comunque.
 */
export function describeStageFailure(message: string): string {
  if (/abort|tempo massimo/i.test(message)) return "Nessun provider ha risposto entro il tempo previsto";
  if (/tempo di compilazione esaurito/i.test(message)) return "Tempo degli stadi AI esaurito";
  if (/nessun provider/i.test(message)) return "Nessuna chiave AI configurata sul server";
  if (/in attesa di quota/i.test(message)) return "Provider in pausa per quota";
  return message;
}

/** Applica il blueprint: preset, font, tinta e SEO. Non tocca i contenuti. */
export function applyBlueprint(site: Site, blueprint: BlueprintResponse): { site: Site; warnings: string[] } {
  const warnings: string[] = [];
  const preset = normalizePreset(blueprint.preset);
  const pairingId = normalizeFontPairing(blueprint.fontPairing);
  const pairing = FONT_PAIRINGS.find((item) => item.id === pairingId);
  const hue = blueprint.paletteHue;

  if (blueprint.preset && !preset) {
    warnings.push(`Il modello ha proposto uno stile che non esiste (${blueprint.preset.slice(0, 40)}): ho mantenuto ${site.theme.preset}.`);
  }

  // Senza tinta valida la palette del composer resta intatta: meglio un colore
  // coerente che un colore a caso.
  const palette =
    hue === undefined
      ? site.theme.palette
      : {
          ...site.theme.palette,
          primary: { ...site.theme.palette.primary, h: Math.round(hue) },
          accent: {
            ...site.theme.palette.accent,
            h: Math.round(harmonyHue(hue, site.theme.palette.harmony)),
          },
        };

  const pages = site.pages.map((page) => {
    const match = blueprint.pages.find((candidate) => candidate.path === page.path);
    if (!match) return page;
    return {
      ...page,
      seo: {
        ...page.seo,
        title: match.seoTitle || page.seo.title,
        description: match.seoDescription || page.seo.description,
      },
    };
  });

  if (blueprint.fontPairing && !pairing) warnings.push(`Il modello ha proposto un font non disponibile (${blueprint.fontPairing.slice(0, 40)}): ho mantenuto il precedente.`);
  if (blueprint.pages.length > 0 && !blueprint.pages.some((candidate) => pages.some((page) => page.path === candidate.path))) {
    warnings.push("Il modello non ha riconosciuto i percorsi delle pagine: SEO invariata.");
  }

  return {
    site: {
      ...site,
      theme: {
        ...site.theme,
        preset: preset ?? site.theme.preset,
        fontPairing: pairing ? pairing.id : site.theme.fontPairing,
        palette,
      },
      brand: {
        ...site.brand,
        tagline: blueprint.tagline || site.brand.tagline,
        tone: { ...site.brand.tone, personality: blueprint.tone || site.brand.tone.personality },
      },
      pages,
    },
    warnings,
  };
}

/** Applica la riscrittura dei contenuti di una pagina, blocco per blocco. */
export function applyCopy(site: Site, path: string, copy: CopyResponse): Site {
  const pages = site.pages.map((page) => {
    if (page.path !== path) return page;

    let next: Page = page;

    next = patchBlocks(next, "hero", (block) => ({
      eyebrow: copy.heroEyebrow || (block.props as { eyebrow?: string }).eyebrow,
      title: copy.heroTitle || (block.props as { title?: string }).title,
      subtitle: copy.heroSubtitle || (block.props as { subtitle?: string }).subtitle,
    }));

    if (copy.services.length > 0) {
      next = patchBlocks(next, "features", (block) => {
        const existing = (block.props as { items?: { icon?: string }[] }).items ?? [];
        return {
          items: copy.services.map((item, index) => ({
            icon: existing[index]?.icon ?? "sparkles",
            title: item.title,
            text: item.text,
          })),
        };
      });
    }

    if (copy.process.length > 0) {
      next = patchBlocks(next, "steps", () => ({ items: copy.process }));
    }

    if (copy.faq.length > 0) {
      next = patchBlocks(next, "faq", () => ({ items: copy.faq }));
    }

    if (copy.testimonials.length > 0) {
      next = patchBlocks(next, "testimonials", (block) => {
        const existing = (block.props as { items?: { rating?: number; city?: string }[] }).items ?? [];
        return {
          items: copy.testimonials.map((item, index) => ({
            quote: item.quote,
            author: item.author,
            role: item.role,
            rating: existing[index]?.rating ?? 5,
            city: existing[index]?.city ?? "",
          })),
        };
      });
    }

    if (copy.ctaTitle || copy.ctaText) {
      next = patchBlocks(next, "cta", (block) => ({
        title: copy.ctaTitle || (block.props as { title?: string }).title,
        text: copy.ctaText || (block.props as { text?: string }).text,
      }));
    }

    return {
      ...next,
      seo: {
        ...next.seo,
        title: copy.seoTitle || next.seo.title,
        description: copy.seoDescription || next.seo.description,
      },
    };
  });

  return { ...site, pages };
}

export type CompileOptions = {
  brief: Brief;
  ledger?: QuotaLedger;
  knownSignatures?: string[];
  variation?: number;
  now?: string;
  /** Quante pagine riscrivere con l'AI (le altre restano quelle del composer). */
  maxAiPages?: number;
  /**
   * Tempo massimo complessivo per gli stadi AI. Oltre, il compilatore consegna
   * il sito del composer: un provider lento non deve mai bloccare il lavoro.
   */
  budgetMs?: number;
  /** Abort esterno (disconnessione del client): interrompe gli stadi AI in corso. */
  signal?: AbortSignal;
  onEvent?: (event: CompileEvent) => void;
};

/** Limiti degli stadi AI: oltre queste soglie il provider viene abbandonato. */
const BLUEPRINT_BUDGET_MS = 25_000;
const COPY_BUDGET_MS = 20_000;
const TOTAL_BUDGET_MS = 90_000;
const MIN_SLICE_MS = 4_000;

/**
 * Budget di risposta, ragionamento incluso.
 *
 * I modelli di ragionamento consumano token prima di scrivere: un tetto troppo
 * basso tronca il JSON a metà e fa fallire lo stadio per un problema di spazio,
 * non di contenuto.
 */
const BLUEPRINT_MAX_TOKENS = 2_048;
const COPY_MAX_TOKENS = 4_096;

/** Un modello può sbagliare il formato una volta: un secondo tentativo salva lo stadio. */
const STRUCTURED_ATTEMPTS = 2;

/** Vero se l'errore è di formato (JSON non conforme), non di rete o di quota. */
function isFormatFailure(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name ?? "";
  const message = error instanceof Error ? error.message : String(error);
  // Il provider può anche rifiutare la risposta per formato ("Failed to
  // validate JSON"): è comunque un problema di forma, non di sostanza.
  return (
    name === "AI_NoObjectGeneratedError" ||
    /no object generated|could not parse the response|failed to validate json/i.test(message)
  );
}

/**
 * Fetta di tempo per un singolo tentativo di uno stadio.
 *
 * Il budget dello stadio non si rinnova a ogni provider: se il primo candidato
 * consuma tutto, i successivi ricevono solo la fetta minima e la cascata si
 * chiude, invece di sommare un timeout per candidato (era il caso peggiore:
 * quattro provider che non rispondono = oltre un minuto di attesa).
 */
export function attemptSliceMs(stageDeadline: number, now: number, capMs: number): number {
  return Math.max(MIN_SLICE_MS, Math.min(capMs, stageDeadline - now));
}

/**
 * Ripete una chiamata strutturata solo se il modello ha sbagliato il formato.
 *
 * Un secondo tentativo costa pochi secondi; senza di esso un errore di forma
 * butterebbe via l'intero stadio, e l'utente perderebbe la riscrittura dei testi.
 */
export async function withFormatRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= STRUCTURED_ATTEMPTS || !isFormatFailure(error)) throw error;
    }
  }
}

/**
 * Chiamata AI con scadenza.
 *
 * Doppia garanzia: la richiesta riceve un `abortSignal` (il provider libera la
 * connessione) e una corsa contro un timer (se il provider ignora l'abort, non
 * ci trascina con sé). In entrambi i casi la cascata passa al candidato dopo.
 */
export async function withStageDeadline<T>(
  limitMs: number,
  run: (signal: AbortSignal) => Promise<T>,
  external?: AbortSignal,
): Promise<T> {
  const limit = Math.min(Math.max(limitMs, 250), 60_000);
  const controller = new AbortController();
  const abortExternal = () => controller.abort();
  if (external?.aborted) controller.abort();
  else external?.addEventListener("abort", abortExternal, { once: true });
  const aborter = setTimeout(() => controller.abort(), limit);
  let killer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      run(controller.signal),
      new Promise<never>((_resolve, reject) => {
        killer = setTimeout(() => reject(new Error(`Stadio AI oltre il tempo massimo (${limit} ms)`)), limit + 250);
      }),
    ]);
  } finally {
    clearTimeout(aborter);
    if (killer) clearTimeout(killer);
    external?.removeEventListener("abort", abortExternal);
  }
}

export type CompileOutput = {
  site: Site;
  gates: GateReport;
  provider?: string;
  events: CompileEvent[];
  elapsedMs: number;
};

export async function compileSite(options: CompileOptions): Promise<CompileOutput> {
  const started = Date.now();
  const events: CompileEvent[] = [];
  const emit = (event: CompileEvent) => {
    events.push(event);
    options.onEvent?.(event);
  };

  // Le chiavi arrivano solo dall'ambiente del server: il client non le invia mai.
  const keys = resolveKeys();
  const ledger = options.ledger ?? new QuotaLedger();
  const warnings: string[] = [];
  const maxAiPages = options.maxAiPages ?? 4;
  const deadline = started + (options.budgetMs ?? TOTAL_BUDGET_MS);
  const timeLeft = () => deadline - Date.now();
  let budgetExhausted = false;

  // Stadio 1 — il composer deterministico: da qui in poi il sito esiste comunque.
  const briefStarted = Date.now();
  emit({ type: "stage", id: "brief", status: "running", detail: "Analisi del brief e scelta di settore, palette e tipografia" });
  let site = composeSite(options.brief, { now: options.now, variation: options.variation ?? 0 });
  emit({ type: "stage", id: "brief", status: "done", ms: Date.now() - briefStarted, detail: `${site.pages.length} pagine, ${site.pages.reduce((sum, page) => sum + page.blocks.length, 0)} sezioni` });

  const ready = availableProviders(keys);

  if (ready.length === 0) {
    emit({
      type: "stage",
      id: "blueprint",
      status: "skipped",
      detail: "Nessuna chiave API configurata: il sito è stato generato dal composer offline, completo e pubblicabile",
    });
    emit({ type: "warning", message: "Stai lavorando in modalità offline: aggiungi una chiave gratuita per far riscrivere i testi dall'AI." });
  } else {
    // Stadio 2 — blueprint: stile, font, tinta, SEO.
    const blueprintStarted = Date.now();
    // Il budget vale per lo stadio, non per ogni tentativo.
    const blueprintDeadline = blueprintStarted + attemptSliceMs(deadline, blueprintStarted, BLUEPRINT_BUDGET_MS);
    emit({ type: "stage", id: "blueprint", status: "running", detail: "Scelta della direzione creativa" });

    const blueprintResult = await withCascade(
      { task: "blueprint", keys, ledger, ready },
      async (model, candidate) => {
        // Tempo finito: ogni tentativo successivo fallisce subito, così la
        // cascata si chiude invece di sommare un timeout per provider.
        if (timeLeft() < MIN_SLICE_MS) throw new Error("Tempo di compilazione esaurito per gli stadi AI");
        const { output, usage } = await withStageDeadline(
          attemptSliceMs(blueprintDeadline, Date.now(), BLUEPRINT_BUDGET_MS),
          (abortSignal) =>
            withFormatRetry(async () => {
              const result = await generateText({
                model,
                system: systemWithFormat(BRIEF_SYSTEM, candidate.provider),
                prompt: briefPrompt(options.brief, site),
                output: Output.object({ schema: BlueprintResponse }),
                providerOptions: structuredProviderOptions(candidate.provider),
                maxOutputTokens: BLUEPRINT_MAX_TOKENS,
                abortSignal,
              });
              // Una risposta formalmente valida ma vuota non è un risultato: vale
              // un altro tentativo, o il passaggio al provider successivo.
              if (!isUsefulBlueprint(result.output)) throw emptyResponseError("blueprint senza contenuti utilizzabili");
              return result;
            }),
          options.signal,
        );
        ledger.record(candidate.provider, estimateTokens(usage, options.brief.prompt));
        return output;
      },
    );

    if (blueprintResult.ok) {
      const firstPass = applyBlueprint(site, blueprintResult.value);
      const applied =
        firstPass.site.theme.preset === site.theme.preset
          ? firstPass
          : // Lo stile scelto dall'AI non è solo un vestito: cambia le varianti di
            // sezione. Rigenero la struttura con quel preset e riapplico il
            // blueprint, così la pagina non resta "luxury" dentro un tema tech.
            (() => {
              const recomposed = composeSite(
                { ...options.brief, stylePreset: firstPass.site.theme.preset },
                { now: options.now, variation: options.variation ?? 0 },
              );
              const secondPass = applyBlueprint(recomposed, blueprintResult.value);
              return { site: secondPass.site, warnings: [...firstPass.warnings, ...secondPass.warnings] };
            })();
      site = applied.site;
      warnings.push(...applied.warnings);
      emit({
        type: "provider",
        provider: blueprintResult.provider,
        label: providerSpec(blueprintResult.provider).label,
        model: blueprintResult.model,
        task: "blueprint",
      });
      site = {
        ...site,
        meta: { ...site.meta, generatedBy: "ai-compiler", provider: blueprintResult.provider, model: blueprintResult.model },
      };
      emit({
        type: "stage",
        id: "blueprint",
        status: "done",
        ms: Date.now() - blueprintStarted,
        detail: `Direzione: ${site.theme.preset}, tinta ${Math.round(site.theme.palette.primary.h)}°`,
      });
    } else {
      emit({
        type: "stage",
        id: "blueprint",
        status: "failed",
        ms: Date.now() - blueprintStarted,
        detail: describeStageFailure(blueprintResult.error),
      });
      const message = describeCascade(blueprintResult.attempts as CascadeAttempt[], blueprintResult.skipped);
      if (message) {
        emit({ type: "warning", message });
        warnings.push(message);
      }
    }

    // Stadio 3 — contenuti pagina per pagina.
    const pagePaths: string[] = site.pages
      .filter((page) => page.kind === "home" || page.kind === "page")
      .filter((page) => page.blocks.some((block) => block.type === "features" || block.type === "hero"))
      .slice(0, maxAiPages)
      .map((page) => page.path);

    if (pagePaths.length > 0) {
      emit({ type: "stage", id: "copy", status: "running", detail: `Riscrittura dei testi su ${pagePaths.length} pagine` });

      for (const path of pagePaths) {
        const page = site.pages.find((item) => item.path === path);
        if (!page) continue;

        if (timeLeft() < MIN_SLICE_MS) {
          budgetExhausted = true;
          break;
        }

        // Ogni pagina ha il suo budget: una pagina lenta non toglie tempo alle altre.
        const copyDeadline = Date.now() + attemptSliceMs(deadline, Date.now(), COPY_BUDGET_MS);

        const copyResult = await withCascade({ task: "copy", keys, ledger, ready }, async (model, candidate) => {
          if (timeLeft() < MIN_SLICE_MS) throw new Error("Tempo di compilazione esaurito per gli stadi AI");
          const { output, usage } = await withStageDeadline(
            attemptSliceMs(copyDeadline, Date.now(), COPY_BUDGET_MS),
            (abortSignal) =>
              withFormatRetry(async () => {
                const result = await generateText({
                  model,
                  system: systemWithFormat(COPY_SYSTEM, candidate.provider),
                  prompt: copyPrompt(site, page),
                  output: Output.object({ schema: CopyResponse }),
                  providerOptions: structuredProviderOptions(candidate.provider),
                  maxOutputTokens: COPY_MAX_TOKENS,
                  abortSignal,
                });
                if (!isUsefulCopy(result.output)) throw emptyResponseError("contenuti non riscritti dal modello");
                return result;
              }),
            options.signal,
          );
          ledger.record(candidate.provider, estimateTokens(usage, page.title));
          return output;
        });

        if (copyResult.ok) {
          site = applyCopy(site, path, copyResult.value);
          emit({ type: "provider", provider: copyResult.provider, label: providerSpec(copyResult.provider).label, model: copyResult.model, task: "copy" });
          emit({ type: "page", path, title: copyResult.value.seoTitle || page.title });
        } else {
          emit({
            type: "warning",
            message: `Contenuti di "${page.title}" non riscritti: ${describeStageFailure(copyResult.error).toLowerCase()}`,
          });
        }
      }

      emit({
        type: "stage",
        id: "copy",
        status: budgetExhausted ? "skipped" : "done",
        ms: Date.now() - started,
        detail: budgetExhausted ? "Tempo esaurito: le pagine restanti restano quelle del composer" : undefined,
      });
      if (budgetExhausted) {
        const message =
          "I provider hanno impiegato troppo tempo: ho consegnato il sito generato dal composer, completo e pubblicabile. Puoi riprovare più tardi o aggiungere un'altra chiave.";
        emit({ type: "warning", message });
        warnings.push(message);
      }
    } else {
      emit({ type: "stage", id: "copy", status: "skipped", detail: "Nessuna pagina da riscrivere" });
    }
  }

  // Stadio 4 — hardening: unicità, gate, impronta strutturale.
  const hardeningStarted = Date.now();
  emit({ type: "stage", id: "hardening", status: "running", detail: "Controlli di qualità, unicità e accessibilità" });

  site = { ...site, meta: { ...site.meta, structuralHash: structuralSignature(site), warnings } };

  const known = options.knownSignatures ?? [];
  if (known.includes(site.meta.structuralHash) && (options.variation ?? 0) < 3) {
    emit({ type: "warning", message: "Struttura identica a un sito già generato: applico una variazione creativa." });
    const varied = composeSite(options.brief, { now: options.now, variation: (options.variation ?? 0) + 1 });
    site = { ...varied, meta: { ...varied.meta, structuralHash: structuralSignature(varied), warnings } };
  }

  const files = await renderForGates(site);
  const gates = runGates(site, files);
  for (const issue of gates.issues.filter((item) => item.severity === "error")) {
    emit({ type: "warning", message: `${issue.title}: ${issue.fix}` });
  }

  emit({ type: "stage", id: "hardening", status: "done", ms: Date.now() - hardeningStarted, detail: `${gates.errors} errori, ${gates.warnings} avvisi` });

  const elapsedMs = Date.now() - started;
  emit({ type: "done", provider: site.meta.provider, elapsedMs, gates, site });

  return { site, gates, provider: site.meta.provider, events, elapsedMs };
}

/** I gate hanno bisogno dei file reali: li generiamo senza scrivere nulla su disco. */
async function renderForGates(site: Site): Promise<{ path: string; contents: string }[]> {
  const { renderSite } = await import("@/lib/export/render-site");
  return renderSite(site).map((file) => ({ path: file.path, contents: file.contents }));
}
