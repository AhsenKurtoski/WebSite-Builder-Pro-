"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ProviderReport = {
  id: string;
  label: string;
  ready: boolean;
  missing?: string;
  note: string;
  signupUrl: string;
};

type CloudReport = {
  configured: boolean;
  missing: string[];
};

type Health = {
  offlineReady: boolean;
  offlineNote: string;
  sessionSecretConfigured: boolean;
  authProviders: { id: string; configured: boolean }[];
  providers: ProviderReport[];
  cloud?: CloudReport;
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; report: Health; at: string }
  | { kind: "error"; message: string };

const PROVIDER_NAMES: Record<string, string> = { github: "GitHub", google: "Google" };

/**
 * Stato dell'istanza.
 *
 * Legge `/api/providers/health`, che non fa chiamate di rete: dice soltanto cosa
 * è configurato. Nessuna chiave viene mostrata, nemmeno parziale.
 */
export function StatusView() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/providers/health", { headers: { accept: "application/json" } });
      if (!response.ok) {
        setState({ kind: "error", message: `Il servizio ha risposto ${response.status}. Riprova fra poco.` });
        return;
      }
      const report = (await response.json()) as Health;
      // L'ora viene scritta solo nel browser: in questo modo server e client non
      // possono produrre due stringhe diverse durante l'idratazione.
      setState({ kind: "ready", report, at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) });
    } catch {
      setState({ kind: "error", message: "Non riesco a contattare il servizio: la rete sembra assente o la rotta non risponde." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const report = state.kind === "ready" ? state.report : null;
  const readyProviders = report?.providers.filter((provider) => provider.ready).length ?? 0;
  const authReady = report?.authProviders.filter((provider) => provider.configured).length ?? 0;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="chip">
          {state.kind === "loading" ? "lettura in corso" : state.kind === "ready" ? `letto alle ${state.at}` : "lettura non riuscita"}
        </span>
        <button type="button" className="btn" onClick={() => void load()} disabled={state.kind === "loading"}>
          Aggiorna
        </button>
      </div>

      {state.kind === "error" ? (
        <p className="card border-danger-500/40 p-5 text-sm text-ink-300">{state.message}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="card grid content-start gap-2 p-5">
          <span className="mono-label">motore offline</span>
          <p className="text-2xl font-semibold tracking-tight">{report ? (report.offlineReady ? "pronto" : "assente") : "—"}</p>
          <p className="text-[12px] leading-relaxed text-ink-500">
            {report?.offlineNote ??
              "Il composer deterministico genera siti completi senza chiavi: se è pronto, Atelier produce un sito anche con tutti i provider spenti."}
          </p>
        </article>

        <article className="card grid content-start gap-2 p-5">
          <span className="mono-label">chiave di sessione</span>
          <p className="text-2xl font-semibold tracking-tight">
            {report ? (report.sessionSecretConfigured ? "configurata" : "di ripiego") : "—"}
          </p>
          <p className="text-[12px] leading-relaxed text-ink-500">
            {report?.sessionSecretConfigured
              ? "Le sessioni sono firmate con il segreto dell'istanza."
              : "Manca ATELIER_SESSION_SECRET: le sessioni usano una chiave locale e i cookie non sono marcati Secure. Su un dominio pubblico va impostata."}
          </p>
        </article>

        <article className="card grid content-start gap-2 p-5">
          <span className="mono-label">accesso</span>
          <p className="text-2xl font-semibold tracking-tight">{report ? `${authReady}/2` : "—"}</p>
          <ul className="grid gap-1.5">
            {(report?.authProviders ?? [{ id: "github", configured: false }, { id: "google", configured: false }]).map((provider) => (
              <li key={provider.id} className="flex items-center justify-between gap-2 text-[12px] text-ink-500">
                <span>{PROVIDER_NAMES[provider.id] ?? provider.id}</span>
                <span className={provider.configured ? "text-ok-500" : "text-ink-600"}>
                  {report ? (provider.configured ? "configurato" : "non configurato") : "—"}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] leading-relaxed text-ink-600">
            Senza app OAuth resta attivo l&apos;accesso locale, che crea un workspace nel browser.
          </p>
        </article>

        <article className="card grid content-start gap-2 p-5">
          <span className="mono-label">provider AI</span>
          <p className="text-2xl font-semibold tracking-tight">
            {report ? `${readyProviders}/${report.providers.length}` : "—"}
          </p>
          <p className="text-[12px] leading-relaxed text-ink-500">
            I provider contano da due lati: la variabile d&apos;ambiente dell&apos;istanza e la chiave configurata sul server. Se sono
            tutti spenti, l&apos;AI resta opzionale e il sito arriva comunque.
          </p>
        </article>
      </div>

      <article className="card grid gap-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="mono-label">archivio cloud</span>
          <span className={report?.cloud?.configured ? "chip text-ok-500" : "chip"}>
            {report?.cloud ? (report.cloud.configured ? "configurato" : "non configurato") : "—"}
          </span>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-500">
          {report?.cloud?.configured
            ? "I progetti del workspace possono seguire l'account fra dispositivi: la sincronizzazione parte solo dal pulsante nella dashboard, mai da sola."
            : report?.cloud
              ? `I progetti restano nel browser di questo dispositivo. Per accendere l'archivio mancano: ${report.cloud.missing.join(", ")}.`
              : "Stato dell'archivio non leggibile."}
        </p>
      </article>

      {report ? (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <caption className="sr-only">Provider AI riconosciuti da questa istanza</caption>
            <thead>
              <tr className="border-b border-surface-800">
                <th scope="col" className="mono-label px-4 py-3 text-left">
                  provider
                </th>
                <th scope="col" className="mono-label px-4 py-3 text-left">
                  stato
                </th>
                <th scope="col" className="mono-label hidden px-4 py-3 text-left sm:table-cell">
                  note
                </th>
              </tr>
            </thead>
            <tbody>
              {report.providers.map((provider) => (
                <tr key={provider.id} className="border-b border-surface-800 last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-ink-300">
                    {provider.label}
                  </th>
                  <td className="px-4 py-3">
                    <span className={provider.ready ? "text-ok-500" : "text-ink-600"}>
                      {provider.ready ? "pronto" : "da configurare"}
                    </span>
                    {provider.missing ? <span className="ml-2 text-[11px] text-ink-600">manca {provider.missing}</span> : null}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">
                    {provider.note}
                    {provider.signupUrl ? (
                      <a
                        className="ml-2 text-accent-400 underline underline-offset-2"
                        href={provider.signupUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        chiave
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-ink-600">
        Questa pagina legge solo la configurazione dell&apos;istanza e non contatta nessun provider: serve a capire in un colpo
        d&apos;occhio cosa è attivo. Per il comportamento dell&apos;editor e dell&apos;export vedi{" "}
        <Link className="text-accent-400 underline underline-offset-2" href="/funzionalita">
          la pagina delle funzionalità
        </Link>
        .
      </p>
    </div>
  );
}
