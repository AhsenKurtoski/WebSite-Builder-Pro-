import { createCerebras } from "@ai-sdk/cerebras";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Provider gratuiti.
 *
 * Le chiavi vivono solo nell'ambiente del server (variabili d'ambiente): il
 * browser non le vede mai né le invia. Gemini ha due slot indipendenti:
 *   - `gemini`           → GEMINI_API_KEY           (chiave predefinita)
 *   - `gemini-fallback`  → GEMINI_API_KEY_FALLBACK  (chiave di riserva)
 * Idealmente la seconda chiave nasce da un progetto Google Cloud diverso, così
 * la quota gratuita è davvero separata: se la prima si esaurisce, la seconda
 * prende il lavoro senza interrompere la compilazione.
 *
 * I limiti sono quelli verificati a ottobre 2026 e servono al ledger per
 * stimare le quote residue. Il modello Gemini si può cambiare con GEMINI_MODEL.
 */

export type ProviderId = "gemini" | "gemini-fallback" | "groq" | "cerebras" | "openrouter" | "cloudflare";

export type ProviderSpec = {
  id: ProviderId;
  label: string;
  /** Variabili d'ambiente accettate, in ordine di preferenza. */
  envKeys: string[];
  defaultModel: string;
  limits: { rpm: number; rpd: number; tpm: number; tpd: number };

  /** 1 = qualità migliore, 5 = più economico. Usato per ordinare le catene. */
  tier: number;
  signupUrl: string;
  note: string;
  requiresAccountId?: boolean;
  /** Ruolo dello slot Gemini: chiave predefinita o di riserva. */
  slot?: "default" | "fallback";
};

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

/**
 * Il modello di un provider si può cambiare dall'ambiente, senza toccare il
 * codice: i cataloghi gratuiti si muovono in fretta.
 *   GROQ_MODEL, CEREBRAS_MODEL, OPENROUTER_MODEL, CLOUDFLARE_MODEL
 */
function modelFromEnv(id: ProviderId, fallback: string): string {
  const name = `${id.replace(/-/g, "_").toUpperCase()}_MODEL`;
  return process.env[name]?.trim() || fallback;
}

export const PROVIDERS: ProviderSpec[] = [
  {
    id: "gemini",
    label: "Google Gemini (predefinita)",
    envKeys: ["GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    defaultModel: GEMINI_MODEL,
    limits: { rpm: 15, rpd: 1_500, tpm: 1_000_000, tpd: 4_000_000 },
    tier: 1,
    signupUrl: "https://aistudio.google.com/apikey",
    note: "Chiave principale: legge immagini e produce output strutturato affidabile.",
    slot: "default",
  },
  {
    id: "gemini-fallback",
    label: "Google Gemini (fallback)",
    envKeys: ["GEMINI_API_KEY_FALLBACK"],
    defaultModel: GEMINI_MODEL,
    limits: { rpm: 15, rpd: 1_500, tpm: 1_000_000, tpd: 4_000_000 },
    tier: 1,
    signupUrl: "https://aistudio.google.com/apikey",
    note: "Chiave di riserva, idealmente da un altro progetto Google Cloud: prende il lavoro se la principale è esaurita.",
    slot: "fallback",
  },
  {
    id: "groq",
    label: "Groq",
    envKeys: ["GROQ_API_KEY"],
    // gpt-oss-120b è il modello gratuito di punta e risponde ai vincoli di
    // schema che servono a blueprint e copy: i llama non li reggevano più.
    defaultModel: modelFromEnv("groq", "openai/gpt-oss-120b"),
    limits: { rpm: 30, rpd: 1_000, tpm: 12_000, tpd: 200_000 },
    tier: 2,
    signupUrl: "https://console.groq.com/keys",
    note: "Il più veloce: ideale per iterare sulle sezioni. Limite giornaliero di token contenuto.",
  },
  {
    id: "cerebras",
    label: "Cerebras",
    envKeys: ["CEREBRAS_API_KEY"],
    defaultModel: modelFromEnv("cerebras", "gpt-oss-120b"),
    limits: { rpm: 30, rpd: 14_400, tpm: 60_000, tpd: 1_000_000 },
    tier: 3,
    signupUrl: "https://cloud.cerebras.ai",
    note: "Un milione di token al giorno gratis: perfetto per grandi volumi di testo. Contesto limitato a 8k.",
  },
  {
    id: "openrouter",
    label: "OpenRouter (modelli gratuiti)",
    envKeys: ["OPENROUTER_API_KEY"],
    defaultModel: modelFromEnv("openrouter", "openrouter/free"),
    limits: { rpm: 20, rpd: 50, tpm: 20_000, tpd: 200_000 },
    tier: 4,
    signupUrl: "https://openrouter.ai/keys",
    note: "Fallback universale: il router `/free` sceglie fra i modelli gratuiti disponibili.",
  },
  {
    id: "cloudflare",
    label: "Cloudflare Workers AI",
    envKeys: ["CLOUDFLARE_API_TOKEN"],
    defaultModel: modelFromEnv("cloudflare", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    limits: { rpm: 300, rpd: 10_000, tpm: 100_000, tpd: 500_000 },
    tier: 4,
    signupUrl: "https://dash.cloudflare.com/profile/api-tokens",
    note: "10.000 neurons al giorno gratis. Richiede l'ID account.",
    requiresAccountId: true,
  },
];

export const PROVIDER_IDS = PROVIDERS.map((provider) => provider.id);

export function providerSpec(id: ProviderId): ProviderSpec {
  const spec = PROVIDERS.find((provider) => provider.id === id);
  if (!spec) throw new Error(`Provider sconosciuto: ${id}`);
  return spec;
}

/** Chiavi effettive, lette solo dall'ambiente del server. */
export type ProviderKeys = Partial<Record<ProviderId, string>> & { cloudflareAccountId?: string };

export function resolveKeys(env: Record<string, string | undefined> = process.env): ProviderKeys {
  const resolved: ProviderKeys = {};

  for (const spec of PROVIDERS) {
    for (const envKey of spec.envKeys) {
      const value = env[envKey]?.trim();
      if (value) {
        resolved[spec.id] = value;
        break;
      }
    }
  }
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (accountId) resolved.cloudflareAccountId = accountId;
  return resolved;
}

/** Provider realmente utilizzabili con le chiavi presenti. */
export function availableProviders(keys: ProviderKeys): ProviderId[] {
  return PROVIDERS.filter((spec) => Boolean(keys[spec.id]) && (!spec.requiresAccountId || Boolean(keys.cloudflareAccountId))).map(
    (spec) => spec.id,
  );
}

/** Costruisce il modello AI SDK per un provider. */
export function resolveModel(id: ProviderId, model: string, keys: ProviderKeys): LanguageModel {
  const apiKey = keys[id];
  if (!apiKey) throw new Error(`Chiave mancante per ${id}`);

  switch (id) {
    case "gemini":
    case "gemini-fallback":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "groq":
      return createGroq({ apiKey })(model);
    case "cerebras":
      return createCerebras({ apiKey })(model);
    case "openrouter":
      return createOpenAICompatible({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        headers: { "HTTP-Referer": "https://atelier.local", "X-Title": "Atelier" },
      })(model);
    case "cloudflare": {
      const accountId = keys.cloudflareAccountId;
      if (!accountId) throw new Error("Serve l'ID account Cloudflare per usare Workers AI");
      return createOpenAICompatible({
        name: "cloudflare",
        baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
        apiKey,
      })(model);
    }
    default: {
      const exhaustive: never = id;
      throw new Error(`Provider non gestito: ${String(exhaustive)}`);
    }
  }
}

export type ProviderReport = {
  id: ProviderId;
  label: string;
  ready: boolean;
  missing?: string;
  note: string;
  signupUrl: string;
  envKey: string;
  slot?: "default" | "fallback";
};

/**
 * Diagnostica senza rete: dice cosa è configurato e cosa manca, senza mai
 * restituire il valore di una chiave.
 */
export function keysReport(keys: ProviderKeys): ProviderReport[] {
  return PROVIDERS.map((spec) => {
    const hasKey = Boolean(keys[spec.id]);
    const needsAccount = Boolean(spec.requiresAccountId) && !keys.cloudflareAccountId;
    return {
      id: spec.id,
      label: spec.label,
      ready: hasKey && !needsAccount,
      missing: !hasKey ? "chiave assente nell'ambiente del server" : needsAccount ? "ID account assente" : undefined,
      note: spec.note,
      signupUrl: spec.signupUrl,
      envKey: spec.envKeys[0],
      slot: spec.slot,
    };
  });
}
