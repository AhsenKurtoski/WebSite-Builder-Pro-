import { generateText } from "ai";
import { z } from "zod";
import { classifyProviderError } from "@/lib/ai/quota-ledger";
import { PROVIDERS, providerSpec, resolveKeys, resolveModel, type ProviderId } from "@/lib/ai/providers";
import { assertSameOrigin, checkRateLimit, readJsonBody } from "@/lib/util/api-guard";
import { errorResponse } from "@/lib/util/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verifica una chiave già presente nell'ambiente del server con una richiesta
 * minuscola: costo trascurabile, esito immediato. La chiave non viene mai
 * accettata dal client né restituita in risposta.
 */

const RequestSchema = z.object({
  provider: z.enum(PROVIDERS.map((item) => item.id) as [ProviderId, ...ProviderId[]]),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    checkRateLimit(request, "provider-test", 5, 60_000);
  } catch (error) {
    return errorResponse(error, { route: "providers/test" });
  }

  let payload: z.infer<typeof RequestSchema>;
  try {
    payload = RequestSchema.parse(await readJsonBody(request, 8 * 1024));
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "Richiesta non valida",
        code: "VALIDATION",
        hint: error instanceof Error ? error.message.split("\n")[0] : undefined,
      },
      { status: 422 },
    );
  }

  const spec = providerSpec(payload.provider);
  const keys = resolveKeys();

  if (!keys[payload.provider]) {
    return Response.json({
      ok: false,
      provider: payload.provider,
      model: spec.defaultModel,
      kind: "missing",
      message: `Nessuna chiave configurata per ${spec.label}.`,
      hint: `Imposta ${spec.envKeys[0]} nelle variabili d'ambiente del server e riavvia l'app.`,
      ms: 0,
    });
  }

  const started = Date.now();
  try {
    const model = resolveModel(payload.provider, spec.defaultModel, keys);
    const { text, usage } = await generateText({
      model,
      prompt: "Rispondi esattamente con: ok",
      // Budget ampio: i modelli con ragionamento consumano token prima della risposta.
      maxOutputTokens: 256,
      abortSignal: request.signal,
    });

    const reply = text.trim().slice(0, 40);
    return Response.json({
      ok: true,
      provider: payload.provider,
      model: spec.defaultModel,
      message: reply ? `Chiave valida. Risposta: "${reply}"` : "Chiave valida.",
      tokens: usage?.totalTokens ?? null,
      ms: Date.now() - started,
    });
  } catch (error) {
    // Una chiave sbagliata non è un errore del server: si racconta e si va avanti.
    const classified = classifyProviderError(error);
    const status = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
    const billing = status === 402 || /payment required|billing|insufficient.*(credit|balance)/i.test(classified.message);
    const hint = billing
      ? "L'account del provider richiede un piano o una fatturazione attiva: la chiave c'è, ma non può essere usata finché non la si sistema dal pannello del provider."
      : classified.kind === "auth"
        ? "La chiave non è valida o non ha i permessi necessari."
        : classified.kind === "rate"
          ? "La chiave funziona ma la quota è momentaneamente esaurita: riprova fra poco."
          : classified.kind === "context"
            ? "Richiesta troppo lunga per il contesto di questo modello."
            : "Controlla la connessione e riprova.";
    return Response.json({
      ok: false,
      provider: payload.provider,
      model: spec.defaultModel,
      kind: classified.kind,
      message: classified.message.slice(0, 300),
      hint,
      ms: Date.now() - started,
    });
  }
}
