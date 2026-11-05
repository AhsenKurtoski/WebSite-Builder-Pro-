import { z } from "zod";
import { errorResponse, validationFailed } from "@/lib/util/api-error";
import { isSecureRequest, localUser, sessionCookie } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ name: z.string().max(60).default("") });

/**
 * Accesso in locale: nessun account, nessuna password.
 *
 * Serve a due cose: far provare l'editor a chi non vuole collegare GitHub o
 * Google, e tenere separati i progetti quando sullo stesso browser entrano
 * persone diverse. La sessione è firmata come le altre, ma resta su questa
 * macchina (e infatti la chiave di firma può essere quella di ripiego).
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) validationFailed("Dati di accesso non validi", "Serve solo un nome, anche di fantasia.");

    const user = localUser(parsed.data.name);
    return Response.json(
      { user, mode: "local", note: "Sessione locale: i progetti restano in questo browser." },
      { headers: { "set-cookie": sessionCookie(user, isSecureRequest(request)) } },
    );
  } catch (error) {
    return errorResponse(error, { route: "auth/local" });
  }
}
