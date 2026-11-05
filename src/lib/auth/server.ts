import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  isLocalSecret,
  signSession,
  userKey,
  verifySession,
  type AuthUser,
} from "./session";
import { parseCookies, serializeCookie } from "./cookies";
import { OAUTH_PROVIDERS, providerConfig, type OAuthProviderId } from "./oauth";

/**
 * Ponte fra le sessioni firmate e Next: leggere il cookie, proteggere una
 * pagina, emettere o cancellare la sessione. Nessuna chiamata di rete.
 */

export async function getSession(): Promise<AuthUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Protegge una pagina: senza sessione si torna all'accesso, con il ritorno indicato. */
export async function requireUser(next: string): Promise<AuthUser> {
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export function sessionFromRequest(request: Request): AuthUser | null {
  const header = request.headers.get("cookie");
  return verifySession(parseCookies(header)[SESSION_COOKIE]);
}

/**
 * Il cookie diventa `Secure` quando la richiesta arriva in HTTPS: in produzione
 * (Vercel, qualunque dominio) lo è sempre, in locale no — e la sessione
 * funziona comunque su `http://localhost`.
 */
export function isSecureRequest(request: Request): boolean {
  try {
    if (new URL(request.url).protocol === "https:") return true;
  } catch {
    /* URL non leggibile: si resta sulla scelta prudente */
  }
  return request.headers.get("x-forwarded-proto") === "https";
}

export function sessionCookie(user: AuthUser, secure: boolean): string {
  return serializeCookie(SESSION_COOKIE, signSession(user), {
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
}

export function clearedSessionCookie(): string {
  return serializeCookie(SESSION_COOKIE, "", { maxAge: 0, httpOnly: true, sameSite: "lax" });
}

export type ProviderStatus = {
  id: OAuthProviderId;
  label: string;
  configured: boolean;
  missing: string[];
  docs: string;
  signInUrl: string;
};

export function providerStatuses(next = "/dashboard"): ProviderStatus[] {
  return (Object.keys(OAUTH_PROVIDERS) as OAuthProviderId[]).map((id) => {
    const config = providerConfig(id);
    return {
      id,
      label: config.label,
      configured: config.configured,
      missing: config.missing,
      docs: config.docs,
      signInUrl: `/api/auth/${id}?next=${encodeURIComponent(next)}`,
    };
  });
}

export function sessionOwner(user: AuthUser): string {
  return userKey(user);
}

/** Sessione locale (senza account): i progetti restano nel browser e le chiavi sul server. */
export function localUser(name: string): AuthUser {
  const clean = name.trim() || "Ospite";
  return {
    provider: "local",
    id: clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ospite",
    name: clean,
    email: "",
    avatar: "",
  };
}
