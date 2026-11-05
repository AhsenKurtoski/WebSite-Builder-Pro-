import { ApiError, errorResponse, validationFailed } from "@/lib/util/api-error";
import { clearCookie, parseCookies, redirectWithCookies, serializeCookie } from "@/lib/auth/cookies";
import { OAUTH_STATE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession, verifyValue } from "@/lib/auth/session";
import { exchangeCode, fetchUser, isOAuthProvider, requireProviderConfig } from "@/lib/auth/oauth";
import { safeNext } from "@/lib/auth/navigation";
import { isSecureRequest } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ritorno dal provider: `state` verificato, codice scambiato, sessione firmata. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider } = await params;
  const url = new URL(request.url);

  try {
    if (!isOAuthProvider(provider)) validationFailed(`Provider sconosciuto: ${provider}`);
    requireProviderConfig(provider);

    const query = url.searchParams;
    const cookies = parseCookies(request.headers.get("cookie"));
    const stateCookie = verifyValue(cookies[OAUTH_STATE_COOKIE]);

    if (query.get("error")) {
      const errorQuery = new URLSearchParams({
        error: "access-denied",
        provider,
        detail: query.get("error_description") ?? query.get("error") ?? "Accesso annullato",
      });
      return redirectWithCookies(`/login?${errorQuery.toString()}`, [clearCookie(OAUTH_STATE_COOKIE)]);
    }

    const [expectedState, nextFromState] = (stateCookie ?? "").split("|");
    const state = query.get("state") ?? "";
    const code = query.get("code") ?? "";

    if (!stateCookie || !expectedState || state !== expectedState) {
      // Lo state è monouso e legato al browser che ha iniziato il flusso.
      return redirectWithCookies(`/login?error=state-mismatch&provider=${provider}`, [
        clearCookie(OAUTH_STATE_COOKIE),
      ]);
    }
    if (!code) {
      return redirectWithCookies(`/login?error=missing-code&provider=${provider}`, [
        clearCookie(OAUTH_STATE_COOKIE),
      ]);
    }

    const redirectUri = `${url.origin}/api/auth/${provider}/callback`;
    const token = await exchangeCode(provider, { code, redirectUri });
    const user = await fetchUser(provider, token);

    return redirectWithCookies(safeNext(nextFromState), [
      clearCookie(OAUTH_STATE_COOKIE),
      serializeCookie(SESSION_COOKIE, signSession(user), {
        maxAge: SESSION_MAX_AGE_SECONDS,
        httpOnly: true,
        sameSite: "lax",
        // Su Vercel la richiesta è sempre HTTPS: cookie Secure senza eccezioni.
        secure: isSecureRequest(request),
      }),
    ]);
  } catch (error) {
    if (error instanceof ApiError) {
      // Codici interni → chiavi leggibili dalla pagina di accesso.
      const reason =
        error.code === "NOT_CONFIGURED"
          ? "not-configured"
          : error.code === "UPSTREAM_ERROR"
            ? "provider-unavailable"
            : error.code.toLowerCase().replace(/_/g, "-");
      const query = new URLSearchParams({ error: reason, provider, detail: error.message });
      if (error.hint) query.set("hint", error.hint);
      return redirectWithCookies(`/login?${query.toString()}`, [clearCookie(OAUTH_STATE_COOKIE)]);
    }
    return errorResponse(error, { route: "auth/callback", provider });
  }
}
