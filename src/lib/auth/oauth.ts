import { ApiError } from "@/lib/util/api-error";
import type { AuthUser } from "./session";
import { displayName } from "./session";

/**
 * Accesso con GitHub o Google, senza librerie: flusso authorization code
 * standard, due chiamate di rete, nessuno stato sul server.
 *
 * Le credenziali si leggono dall'ambiente (mai dal client). Se una coppia non è
 * configurata, la route risponde con `NOT_CONFIGURED` e la pagina di accesso
 * spiega esattamente quali variabili mancano — l'app resta utilizzabile in
 * locale senza alcun provider configurato.
 */

export type OAuthProviderId = "github" | "google";

type ProviderSpec = {
  id: OAuthProviderId;
  label: string;
  accent: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientIdVars: string[];
  clientSecretVars: string[];
  userUrl: string;
  emailUrl?: string;
  docs: string;
};

export const OAUTH_PROVIDERS: Record<OAuthProviderId, ProviderSpec> = {
  github: {
    id: "github",
    label: "GitHub",
    accent: "#e6edf3",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    clientIdVars: ["AUTH_GITHUB_ID", "GITHUB_CLIENT_ID"],
    clientSecretVars: ["AUTH_GITHUB_SECRET", "GITHUB_CLIENT_SECRET"],
    userUrl: "https://api.github.com/user",
    emailUrl: "https://api.github.com/user/emails",
    docs: "https://github.com/settings/developers",
  },
  google: {
    id: "google",
    label: "Google",
    accent: "#4285f4",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    clientIdVars: ["AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID", "GOOGLE_GMAIL_ID"],
    clientSecretVars: ["AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"],
    userUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    docs: "https://console.cloud.google.com/apis/credentials",
  },
};

export function isOAuthProvider(value: string): value is OAuthProviderId {
  return value === "github" || value === "google";
}

/**
 * Google usa il percorso registrato nel client OAuth esistente; GitHub resta
 * sul percorso API standard. Il percorso deve essere identico fra authorize e
 * scambio del codice, altrimenti il provider rifiuta il callback.
 */
export function oauthCallbackPath(id: OAuthProviderId): string {
  return id === "google" ? "/google/callback" : `/api/auth/${id}/callback`;
}

function firstEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export type ProviderConfig = {
  id: OAuthProviderId;
  label: string;
  docs: string;
  clientId: string;
  clientSecret: string;
  configured: boolean;
  missing: string[];
};

export function providerConfig(id: OAuthProviderId): ProviderConfig {
  const spec = OAUTH_PROVIDERS[id];
  const clientId = firstEnv(spec.clientIdVars);
  const clientSecret = firstEnv(spec.clientSecretVars);
  const missing: string[] = [];
  if (!clientId) missing.push(spec.clientIdVars[0]);
  if (!clientSecret) missing.push(spec.clientSecretVars[0]);
  return { id, label: spec.label, docs: spec.docs, clientId, clientSecret, configured: missing.length === 0, missing };
}

export function requireProviderConfig(id: OAuthProviderId): ProviderConfig {
  const config = providerConfig(id);
  if (!config.configured) {
    throw new ApiError(
      `Accesso con ${config.label} non configurato`,
      503,
      "NOT_CONFIGURED",
      `Aggiungi ${config.missing.join(" e ")} in .env.local (credenziali: ${config.docs}), oppure entra in locale.`,
    );
  }
  return config;
}

export function authorizeUrl(id: OAuthProviderId, params: { redirectUri: string; state: string }): string {
  const spec = OAUTH_PROVIDERS[id];
  const config = requireProviderConfig(id);
  const url = new URL(spec.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", spec.scope);
  url.searchParams.set("state", params.state);
  if (id === "google") {
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
  }
  return url.toString();
}

type TokenResponse = { access_token?: string; error?: string; error_description?: string };

export async function exchangeCode(
  id: OAuthProviderId,
  params: { code: string; redirectUri: string },
): Promise<string> {
  const spec = OAUTH_PROVIDERS[id];
  const config = requireProviderConfig(id);

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
  });
  if (id === "google") body.set("grant_type", "authorization_code");

  const response = await fetch(spec.tokenUrl, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new ApiError(
      payload.error_description ?? payload.error ?? "Scambio del codice non riuscito",
      502,
      "UPSTREAM_ERROR",
      `Verifica che l'app OAuth di ${spec.label} punti a questo indirizzo di callback.`,
    );
  }
  return payload.access_token;
}

type GitHubUser = { id?: number; login?: string; name?: string | null; email?: string | null; avatar_url?: string };
type GitHubEmail = { email?: string; primary?: boolean; verified?: boolean };
type GoogleUser = { sub?: string; name?: string; email?: string; picture?: string };

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json", "user-agent": "atelier" },
  });
  if (!response.ok) {
    throw new ApiError("Il provider non ha riconosciuto il token", 502, "UPSTREAM_ERROR");
  }
  return (await response.json()) as T;
}

export async function fetchUser(id: OAuthProviderId, token: string): Promise<AuthUser> {
  if (id === "github") {
    const user = await fetchJson<GitHubUser>(OAUTH_PROVIDERS.github.userUrl, token);
    let email = user.email ?? "";
    if (!email && OAUTH_PROVIDERS.github.emailUrl) {
      const emails = await fetchJson<GitHubEmail[]>(OAUTH_PROVIDERS.github.emailUrl, token).catch(() => []);
      email = emails.find((item) => item.primary && item.verified)?.email ?? emails[0]?.email ?? "";
    }
    return {
      provider: "github",
      id: String(user.id ?? user.login ?? "sconosciuto"),
      name: displayName(user.name || user.login || "Utente GitHub"),
      email,
      avatar: user.avatar_url ?? "",
    };
  }

  const user = await fetchJson<GoogleUser>(OAUTH_PROVIDERS.google.userUrl, token);
  return {
    provider: "google",
    id: String(user.sub ?? "sconosciuto"),
    name: displayName(user.name || user.email || "Utente Google"),
    email: user.email ?? "",
    avatar: user.picture ?? "",
  };
}
