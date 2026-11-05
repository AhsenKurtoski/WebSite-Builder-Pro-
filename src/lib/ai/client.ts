"use client";

import type { CompileEvent } from "@/lib/ai/compile";
import type { Brief, Site } from "@/lib/schema/site";
import type { ProviderReport } from "@/lib/ai/providers";

/**
 * Consumo dello streaming di compilazione.
 *
 * Il server invia eventi tipizzati mentre lavora: l'interfaccia mostra gli
 * stadi reali, non una barra di caricamento inventata.
 */

export type CompileRequest = {
  prompt: string;
  businessName?: string;
  sector?: Brief["sector"];
  stylePreset?: Brief["stylePreset"];
  tone?: string;
  contacts?: { email?: string; phone?: string; city?: string; address?: string };
  knownSignatures?: string[];
  variation?: number;
  maxAiPages?: number;
};

export async function streamCompile(
  payload: CompileRequest,
  onEvent: (event: CompileEvent) => void,
  signal?: AbortSignal,
): Promise<Site | null> {
  const response = await fetch("/api/ai/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    onEvent({ type: "warning", message: `Compilazione non riuscita (${response.status})` });
    return null;
  }

  let produced: Site | null = null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const event = JSON.parse(line.slice(5).trim()) as CompileEvent;
        if (event.type === "done") produced = event.site;
        onEvent(event);
      } catch {
        // Un evento malformato non deve interrompere gli altri.
      }
    }
  }

  return produced;
}

export async function fetchProviderHealth(): Promise<{
  offlineReady: boolean;
  offlineNote: string;
  providers: ProviderReport[];
}> {
  const response = await fetch("/api/providers/health", { cache: "no-store" });
  if (!response.ok) throw new Error("Diagnostica non disponibile");
  return response.json();
}

/** Verifica la chiave del server per un provider: il browser passa solo l'identificativo. */
export async function testProvider(provider: string): Promise<{ ok: boolean; message: string; hint?: string; ms?: number }> {
  const response = await fetch("/api/providers/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
  const payload = (await response.json()) as {
    ok?: boolean;
    message?: string;
    error?: string;
    hint?: string;
    ms?: number;
  };
  return {
    ok: Boolean(payload.ok),
    message: payload.message ?? payload.error ?? `Verifica non riuscita (${response.status})`,
    hint: payload.hint,
    ms: payload.ms,
  };
}
