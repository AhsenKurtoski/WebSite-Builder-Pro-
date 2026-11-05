import { ApiError } from "./api-error";

/**
 * Guardie leggere per le route API: limite di richieste in memoria, controllo
 * dell'origine e lettura con tetto di dimensione. Non sostituiscono un WAF, ma
 * evitano che un endpoint aperto venga usato come proxy gratuito verso i model.
 */

type Bucket = { count: number; resetAt: number };

const globalScope = globalThis as unknown as { atelierRateBuckets?: Map<string, Bucket> };
const buckets = (globalScope.atelierRateBuckets ??= new Map<string, Bucket>());

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

export function checkRateLimit(request: Request, scope: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const key = `${scope}:${clientKey(request)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    const seconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new ApiError(`Troppe richieste: riprova fra ${seconds} secondi.`, 429, "RATE_LIMITED");
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  try {
    if (new URL(origin).host !== new URL(request.url).host) {
      throw new ApiError("Richiesta da un'origine non consentita.", 403, "FORBIDDEN");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Origine non valida.", 403, "FORBIDDEN");
  }
}

export async function readJsonBody(request: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) {
    throw new ApiError("Corpo della richiesta troppo grande.", 413, "BAD_REQUEST");
  }
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new ApiError("Corpo della richiesta troppo grande.", 413, "BAD_REQUEST");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("Corpo JSON non valido.", 400, "BAD_REQUEST");
  }
}
