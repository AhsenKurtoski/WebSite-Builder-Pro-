import type { LanguageModel } from "ai";
import { classifyProviderError, QuotaLedger } from "./quota-ledger";
import { availableProviders, providerSpec, resolveModel, type ProviderId, type ProviderKeys } from "./providers";

/**
 * Router a cascata.
 *
 * Ogni task ha una catena ordinata di provider. Se il primo è esaurito o
 * risponde male, si passa al successivo senza che l'utente perda il lavoro.
 * La catena è data-driven: aggiungere un provider significa aggiungere una riga.
 */

export type Task = "brief" | "blueprint" | "copy" | "section" | "audit" | "repair";

export const TASK_CHAINS: Record<Task, ProviderId[]> = {
  // Serve ragionamento e output strutturato affidabile. Gemini predefinita, poi
  // la chiave di riserva (quota separata), poi gli altri provider opzionali.
  brief: ["gemini", "gemini-fallback", "groq", "cerebras", "openrouter"],
  blueprint: ["gemini", "gemini-fallback", "groq", "cerebras", "openrouter"],
  // Volume alto di testo: Cerebras ha il milione di token al giorno.
  copy: ["cerebras", "groq", "gemini", "gemini-fallback", "openrouter", "cloudflare"],
  // Iterazione rapida: Groq è il più veloce.
  section: ["groq", "gemini", "gemini-fallback", "cerebras", "cloudflare"],
  audit: ["gemini", "gemini-fallback", "groq", "cerebras"],
  repair: ["gemini", "gemini-fallback", "groq", "cerebras"],
};

export type Candidate = { provider: ProviderId; model: string };

export type RouteContext = {
  task: Task;
  keys: ProviderKeys;
  ledger: QuotaLedger;
  /** Provider con chiave disponibile; se assente viene calcolato dalle chiavi. */
  ready?: ProviderId[];
};

/** Catena effettiva: solo provider con chiave, disponibili secondo il ledger. */
export function candidates(context: RouteContext): Candidate[] {
  const { task, keys, ledger } = context;
  const ready = context.ready ?? availableProviders(keys);
  const chain = TASK_CHAINS[task];

  const usable = chain
    .filter((provider) => ready.includes(provider))
    .map((provider) => ({ provider, model: providerSpec(provider).defaultModel }));

  const readyNow = usable.filter((candidate) => ledger.available(candidate.provider));
  // Se nessuno è disponibile ora, restituiamo comunque la catena: il chiamante
  // decide se aspettare o proseguire con il composer offline.
  return readyNow.length > 0 ? readyNow : usable;
}

/**
 * Quanto tenere in pausa un provider dopo un errore.
 *
 * La pausa non è una punizione: senza di essa ogni stadio della stessa
 * compilazione ritenta il provider rotto e ne aspetta la scadenza, così un
 * modello che non risponde fa perdere un minuto all'utente per ogni pagina.
 * Con la pausa il primo tentativo paga l'errore e i successivi passano avanti.
 *   - quota esaurita  → quanto chiede il provider (o un minuto);
 *   - chiave rifiutata → un'ora: è inutile riprovare;
 *   - contesto troppo lungo → nessuna pausa: dipende dalla singola richiesta;
 *   - errore generico → due minuti: coprono il resto della compilazione.
 */
function cooldownFor(classified: { kind: string; retryAfter?: number }): number {
  if (classified.kind === "rate") return classified.retryAfter ?? 60;
  if (classified.kind === "auth") return 3600;
  if (classified.kind === "context") return 0;
  return 120;
}

export type CascadeAttempt = { provider: ProviderId; model: string; error: string; kind: string };

export type CascadeResult<T> =
  | { ok: true; value: T; provider: ProviderId; model: string; attempts: CascadeAttempt[] }
  | { ok: false; error: string; attempts: CascadeAttempt[]; skipped: { provider: ProviderId; waitSeconds: number }[] };

/**
 * Esegue `run` provando i provider in cascata.
 * Su errore di quota mette in pausa il provider e passa al successivo.
 */
export async function withCascade<T>(
  context: RouteContext,
  run: (model: LanguageModel, candidate: Candidate) => Promise<T>,
): Promise<CascadeResult<T>> {
  const chain = candidates(context);
  const attempts: CascadeAttempt[] = [];
  const skipped: { provider: ProviderId; waitSeconds: number }[] = [];

  if (chain.length === 0) {
    return { ok: false, error: "Nessun provider configurato", attempts, skipped };
  }

  for (const candidate of chain) {
    if (!context.ledger.available(candidate.provider)) {
      skipped.push({ provider: candidate.provider, waitSeconds: context.ledger.waitSeconds(candidate.provider) });
      continue;
    }

    try {
      const model = resolveModel(candidate.provider, candidate.model, context.keys);
      const value = await run(model, candidate);
      return { ok: true, value, provider: candidate.provider, model: candidate.model, attempts };
    } catch (error) {
      const classified = classifyProviderError(error);
      const cooldown = cooldownFor(classified);
      if (cooldown > 0) context.ledger.coolDown(candidate.provider, cooldown, classified.message);
      attempts.push({ provider: candidate.provider, model: candidate.model, error: classified.message.slice(0, 240), kind: classified.kind });

      // Chiave non valida: inutile riprovare lo stesso provider, si prosegue.
      continue;
    }
  }

  return {
    ok: false,
    error: attempts.length > 0 ? attempts[attempts.length - 1].error : "Tutti i provider sono in attesa di quota",
    attempts,
    skipped,
  };
}

/** Messaggio leggibile per l'interfaccia, senza gergo tecnico. */
export function describeCascade(attempts: CascadeAttempt[], skipped: { provider: ProviderId; waitSeconds: number }[]): string {
  const parts: string[] = [];
  for (const attempt of attempts) {
    const label = providerSpec(attempt.provider).label;
    parts.push(
      attempt.kind === "rate"
        ? `${label} ha esaurito la quota`
        : attempt.kind === "auth"
          ? `${label} ha rifiutato la chiave`
          : `${label} ha risposto con un errore`,
    );
  }
  for (const skip of skipped) {
    parts.push(`${providerSpec(skip.provider).label} è in pausa per altri ${skip.waitSeconds}s`);
  }
  return parts.length > 0 ? `${parts.join(", ")}. Ho continuato con gli altri provider.` : "";
}
