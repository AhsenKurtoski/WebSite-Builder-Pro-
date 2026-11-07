import { ApiError, errorResponse, validationFailed } from "@/lib/util/api-error";
import { redirectWithCookies, serializeCookie } from "@/lib/auth/cookies";
import { isSecureRequest, requestOrigin } from "@/lib/auth/server";
import { OAUTH_STATE_COOKIE, randomState, signValue } from "@/lib/auth/session";
import { authorizeUrl, isOAuthProvider, requireProviderConfig } from "@/lib/auth/oauth";
import { safeNext } from "@/lib/auth/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Avvio dell'accesso con GitHub o Google.
 *
 * Il browser arriva qui, noi lo mandiamo dal provider con uno `state` firmato
 * che contiene anche dove tornare. Se le credenziali non sono configurate,
 * l'utente torna alla pagina di accesso con il motivo scritto in chiaro: nessun
 * JSON in faccia a una persona.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider } = await params;

  try {
    if (!isOAuthProvider(provider)) {
      validationFailed(`Provider sconosciuto: ${provider}`, "I provider disponibili sono GitHub e Google.");
    }
    requireProviderConfig(provider);

    const url = new URL(request.url);
    const next = safeNext(url.searchParams.get("next"));
    const state = randomState();
    const redirectUri = `${requestOrigin(request)}/api/auth/${provider}/callback`;

    return redirectWithCookies(authorizeUrl(provider, { redirectUri, state }), [
      serializeCookie(OAUTH_STATE_COOKIE, signValue(`${state}|${next}`), {
        maxAge: 600,
        httpOnly: true,
        sameSite: "lax",
        // Stessa regola del cookie di sessione: `Secure` quando la richiesta è HTTPS.
        secure: isSecureRequest(request),
      }),
    ]);
  } catch (error) {
    if (error instanceof ApiError) {
      const reason = error.code === "NOT_CONFIGURED" ? "not-configured" : "provider-unavailable";
      const query = new URLSearchParams({ error: reason, provider, detail: error.message });
      if (error.hint) query.set("hint", error.hint);
      return redirectWithCookies(`/login?${query.toString()}`, []);
    }
    return errorResponse(error, { route: "auth/start", provider });
  }
}
