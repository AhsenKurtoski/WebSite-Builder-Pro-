import { errorResponse, unauthorized } from "@/lib/util/api-error";
import { clearedSessionCookie } from "@/lib/auth/server";
import { SESSION_COOKIE, isLocalSecret, verifySession } from "@/lib/auth/session";
import { parseCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Chi sono io adesso: la usa il client per l'interfaccia, non per i permessi. */
export async function GET(request: Request): Promise<Response> {
  try {
    const user = verifySession(parseCookies(request.headers.get("cookie"))[SESSION_COOKIE]);
    return Response.json({
      user,
      localSecret: isLocalSecret(),
      note: user
        ? "Sessione attiva. Le chiavi AI sono configurate sul server e non vengono mai inviate al browser."
        : "Nessuna sessione: i progetti sono comunque in questo browser.",
    });
  } catch (error) {
    return errorResponse(error, { route: "auth/session" });
  }
}

/** Uscita: il cookie viene azzerato, i progetti locali restano dove sono. */
export async function DELETE(): Promise<Response> {
  try {
    return Response.json(
      { ok: true, note: "Sessione chiusa. I progetti restano in questo browser." },
      { headers: { "set-cookie": clearedSessionCookie() } },
    );
  } catch (error) {
    return errorResponse(error, { route: "auth/logout" });
  }
}

/** Uso improprio del verbo: meglio dirlo che rispondere 405 vuoto. */
export async function POST(): Promise<Response> {
  unauthorized("Usa DELETE per chiudere la sessione.");
}
