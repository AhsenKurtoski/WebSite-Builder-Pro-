"use client";

import { useEffect, useState } from "react";
import type { ProviderId, ProviderReport } from "@/lib/ai/providers";
import { fetchProviderHealth, testProvider } from "@/lib/ai/client";

type CheckState = { status: "idle" | "verifica" | "ok" | "errore"; message?: string };

/**
 * Stato delle chiavi AI.
 *
 * Le chiavi sono variabili d'ambiente del server: qui si vede solo se ci sono,
 * mai il valore. «Verifica» chiede al server di provare la chiave configurata.
 * Senza chiavi l'app genera comunque un sito completo con il composer.
 */
export function KeysPanel({ compact = false }: { compact?: boolean }) {
  const [providers, setProviders] = useState<ProviderReport[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [checks, setChecks] = useState<Partial<Record<ProviderId, CheckState>>>({});

  useEffect(() => {
    let active = true;
    fetchProviderHealth()
      .then((report) => {
        if (active) setProviders(report.providers);
      })
      .catch(() => {
        if (active) setFailure("Stato delle chiavi non disponibile: ricarica la pagina.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function verify(id: ProviderId) {
    setChecks((current) => ({ ...current, [id]: { status: "verifica" } }));
    const result = await testProvider(id);
    setChecks((current) => ({
      ...current,
      [id]: {
        status: result.ok ? "ok" : "errore",
        message: result.ok ? result.message : `${result.hint ?? ""} ${result.message}`.trim(),
      },
    }));
  }

  if (failure) return <p className="text-xs text-danger-500">{failure}</p>;
  if (!providers) return <p className="text-xs text-ink-500">Controllo delle chiavi in corso…</p>;

  const configured = providers.filter((item) => item.ready).length;

  return (
    <div className="grid gap-3">
      <p className="text-xs text-ink-500">
        {configured > 0
          ? `${configured} chiave/i attiva/e sul server. `
          : "Nessuna chiave AI attiva: l'app genera comunque un sito completo con il composer. "}
        Le chiavi si impostano nelle variabili d&apos;ambiente del server (vedi <span className="text-ink-400">.env.example</span>):
        il browser non le vede mai.
      </p>

      {providers.map((provider) => {
        const check = checks[provider.id] ?? { status: "idle" as const };
        return (
          <div key={provider.id} className="grid gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="label">
                {provider.label}
                {provider.slot ? <span className="ml-2 text-[10px] text-ink-600">{provider.slot === "default" ? "principale" : "riserva"}</span> : null}
              </span>
              <span className={provider.ready ? "text-[10px] text-ok-500" : "text-[10px] text-ink-600"}>
                {provider.ready ? "attiva" : "non configurata"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-[10px] text-ink-600">{provider.envKey}</code>
              <div className="flex gap-2">
                {!provider.ready && !compact ? (
                  <a className="text-[10px] text-accent-400 underline" href={provider.signupUrl} target="_blank" rel="noreferrer">
                    ottieni gratis
                  </a>
                ) : null}
                {provider.ready ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void verify(provider.id)}
                    disabled={check.status === "verifica"}
                  >
                    {check.status === "verifica" ? "…" : "Verifica"}
                  </button>
                ) : null}
              </div>
            </div>
            <span
              className={
                check.status === "ok"
                  ? "text-[10px] text-ok-500"
                  : check.status === "errore"
                    ? "text-[10px] text-danger-500"
                    : "text-[10px] text-ink-600"
              }
            >
              {check.message ?? (provider.ready ? provider.note : provider.missing ?? provider.note)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
