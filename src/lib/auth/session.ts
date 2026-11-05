import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/util/api-error";

/**
 * Sessioni firmate, senza database e senza servizi esterni.
 *
 * Il cookie contiene solo i dati pubblici dell'utente (nome, email, avatar) e
 * una scadenza; la firma HMAC impedisce di modificarlo. La chiave viene da
 * `ATELIER_SESSION_SECRET`; se manca, si usa una chiave locale stabile derivata
 * dall'ambiente, così l'app funziona comunque su una macchina di sviluppo.
 */

export type AuthProviderId = "github" | "google" | "local";

export type AuthUser = {
  provider: AuthProviderId;
  /** Identificativo stabile dell'utente per quel provider. */
  id: string;
  name: string;
  email: string;
  avatar: string;
};

type SessionPayload = AuthUser & { exp: number };

export const SESSION_COOKIE = "atelier_session";
export const OAUTH_STATE_COOKIE = "atelier_oauth_state";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function sessionSecret(): string {
  const fromEnv = process.env.ATELIER_SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  // In produzione la chiave di ripiego sarebbe prevedibile: meglio fallire.
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(
      "Sessione non configurata",
      503,
      "NOT_CONFIGURED",
      "Imposta ATELIER_SESSION_SECRET (almeno 16 caratteri) nelle variabili d'ambiente del server.",
    );
  }
  // Chiave di ripiego solo in sviluppo: stessa macchina, stesso processo ⇒ stessa firma.
  return `atelier-local-${process.env.USERNAME ?? process.env.USER ?? "sviluppo"}-v1`;
}

/** Chiave per verificare: `null` se in produzione non è configurata (nessuna sessione valida). */
function verificationSecret(): string | null {
  try {
    return sessionSecret();
  } catch {
    return null;
  }
}

export function isLocalSecret(): boolean {
  const fromEnv = process.env.ATELIER_SESSION_SECRET;
  return !(fromEnv && fromEnv.length >= 16);
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/** Crea il valore del cookie di sessione. */
export function signSession(user: AuthUser, secret = sessionSecret(), now = Date.now()): string {
  const payload: SessionPayload = { ...user, exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

/** Verifica firma e scadenza; restituisce `null` per qualunque cookie non valido. */
export function verifySession(token: string | undefined, secret = verificationSecret(), now = Date.now()): AuthUser | null {
  if (!token || !secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < now) return null;
    if (!payload.provider || !payload.id) return null;
    return {
      provider: payload.provider,
      id: payload.id,
      name: payload.name ?? "",
      email: payload.email ?? "",
      avatar: payload.avatar ?? "",
    };
  } catch {
    return null;
  }
}

/** Firma un valore di servizio (per esempio lo `state` OAuth con la destinazione). */
export function signValue(value: string, secret = sessionSecret()): string {
  const body = base64url(value);
  return `${body}.${sign(body, secret)}`;
}

export function verifyValue(token: string | undefined, secret = verificationSecret()): string | null {
  if (!token || !secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Buffer.from(body, "base64url").toString("utf8");
}

/** Identificativo dell'utente usato per separare i progetti in locale. */
export function userKey(user: AuthUser): string {
  return `${user.provider}:${user.id}`;
}

export function randomState(): string {
  return randomBytes(16).toString("hex");
}

/** Nome leggibile ricavato da un'email, per gli accessi senza account. */
export function displayName(value: string): string {
  const cleaned = value.trim().replace(/[<>"'`]/g, "");
  if (!cleaned) return "Ospite";
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}…` : cleaned;
}
