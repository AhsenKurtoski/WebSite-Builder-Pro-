import { keysReport, resolveKeys } from "@/lib/ai/providers";
import { QuotaLedger } from "@/lib/ai/quota-ledger";
import { errorResponse } from "@/lib/util/api-error";
import { isLocalSecret } from "@/lib/auth/session";
import { providerConfig } from "@/lib/auth/oauth";
import { cloudStatus } from "@/lib/cloud/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostica dei provider.
 *
 * Non fa chiamate di rete: dice cosa è configurato, cosa manca e quanta quota
 * resta secondo il registro locale. È la pagina "salute provider e quote".
 */
export async function GET(): Promise<Response> {
  try {
    return Response.json(healthPayload());
  } catch (error) {
    return errorResponse(error, { route: "providers/health" });
  }
}

function healthPayload(): Record<string, unknown> {
  const keys = resolveKeys();
  const ledgerState = (globalThis as unknown as { atelierLedger?: QuotaLedger }).atelierLedger;

  return {
    offlineReady: true,
    offlineNote:
      "Il composer deterministico genera siti completi senza alcuna chiave: l'AI è un'accelerazione, non un requisito.",
    // Controllo rapido dopo il deploy: senza questa variabile le sessioni sono
    // firmate con la chiave locale di ripiego.
    sessionSecretConfigured: !isLocalSecret(),
    authProviders: (["github", "google"] as const).map((id) => ({ id, configured: providerConfig(id).configured })),
    // Stato dell'archivio cloud: nessun contatto con Supabase, solo la lettura
    // della configurazione dell'istanza. Senza le variabili il pannello resta
    // spento e i progetti vivono nel browser.
    cloud: cloudStatus(),
    providers: keysReport(keys),
    quota: ledgerState ? ledgerState.snapshot(keysReport(keys).filter((item) => item.ready).map((item) => item.id)) : [],
  };
}
