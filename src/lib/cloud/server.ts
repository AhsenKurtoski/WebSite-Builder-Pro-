import { randomBytes } from "node:crypto";
import { parseCookies, serializeCookie } from "@/lib/auth/cookies";
import { isSecureRequest, sessionFromRequest } from "@/lib/auth/server";
import { userKey } from "@/lib/auth/session";
import { cloudConfig, type CloudConfig } from "./config";
import { notConfigured, unauthorized } from "@/lib/util/api-error";

/**
 * Contesto delle route cloud.
 *
 * L'owner (workspace) deriva sempre dalla sessione firmata: il client non può
 * mai dichiarare di quale archivio leggere o scrivere. Le sessioni con GitHub o
 * Google usano l'identità dell'account; quelle locali non possono condividere
 * un bucket (chiunque entri come «ospite» altrimenti vedrebbe i progetti di
 * tutti), quindi ogni browser riceve un identificativo di dispositivo firmato
 * dal server in un cookie di un anno.
 *
 * La configurazione va verificata prima di qualunque lavoro: senza segreto la
 * rotta dichiara di non essere configurata invece di fallire in modo opaco.
 */

export const DEVICE_COOKIE = "atelier_device";
const DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CloudContext = {
  owner: string;
  config: CloudConfig;
  /** Da mettere in `Set-Cookie` quando il dispositivo è appena stato creato. */
  deviceCookie?: string;
};

export function requireCloudContext(request: Request): CloudContext {
  const user = sessionFromRequest(request);
  if (!user) unauthorized("Serve una sessione per usare l'archivio cloud");

  const config = cloudConfig();
  if (!config) {
    notConfigured(
      "L'archivio cloud non è configurato su questa istanza",
      "Servono SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e ATELIER_CLOUD_SECRET: i progetti restano nel browser.",
    );
  }

  let owner = userKey(user);
  let deviceCookie: string | undefined;

  if (user.provider === "local") {
    const jar = parseCookies(request.headers.get("cookie"));
    const device = jar[DEVICE_COOKIE];
    if (device && /^[a-f0-9]{16,64}$/.test(device)) {
      owner = `local:${device}`;
    } else {
      // Cookie assente o manomesso: se ne emette uno nuovo. Il bucket nasce
      // vuoto e la prima sincronizzazione vi spinge i progetti locali.
      const fresh = randomBytes(16).toString("hex");
      deviceCookie = serializeCookie(DEVICE_COOKIE, fresh, {
        maxAge: DEVICE_MAX_AGE_SECONDS,
        httpOnly: false,
        sameSite: "lax",
        secure: isSecureRequest(request),
      });
      owner = `local:${fresh}`;
    }
  }

  return { owner, config, deviceCookie };
}

/** Risposta JSON che, se serve, installa il cookie del dispositivo. */
export function cloudJson(data: unknown, context: CloudContext, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (context.deviceCookie) headers.append("set-cookie", context.deviceCookie);
  return Response.json(data, { ...init, headers });
}
