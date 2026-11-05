"use client";

import { useCallback, useEffect, useState } from "react";
import { ownerOf, useSession } from "@/lib/auth/session-client";
import { syncWithCloud } from "@/lib/storage/cloud-client";

type CloudState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "syncing" }
  | { kind: "ready"; info: StatusInfo }
  | { kind: "error"; message: string };

type StatusInfo = {
  configured: boolean;
  reachable?: boolean;
  missing?: string[];
  message?: string;
  ownerKind?: string;
  remoteProjects?: number;
  remoteTombstones?: number;
  newest?: string | null;
};

type Outcome = {
  ok: boolean;
  note: string;
  pushed: number;
  pulled: number;
  deletedHere: number;
  propagated: number;
  message?: string;
};

/**
 * Pannello dell'archivio cloud.
 *
 * Tre stati chiari: non configurato (con le variabili che mancano), non
 * raggiungibile (con il messaggio del server), pronto (con i numeri del
 * bucket). La sincronizzazione parte solo dal pulsante: nessun dato attraversa
 * la rete senza una decisione della persona.
 */
export function CloudPanel() {
  const { user } = useSession();
  const [state, setState] = useState<CloudState>({ kind: "idle" });
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/cloud/status", { cache: "no-store" });
      if (!response.ok) {
        setState({ kind: "error", message: response.status === 401 ? "Serve una sessione per usare l'archivio." : `Il servizio ha risposto ${response.status}.` });
        return;
      }
      const info = (await response.json()) as StatusInfo;
      if (!info.configured) {
        setState({ kind: "ready", info });
        return;
      }
      setState({ kind: "ready", info });
    } catch {
      setState({ kind: "error", message: "Non riesco a contattare il servizio." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sync() {
    setOutcome(null);
    setState({ kind: "syncing" });
    const result = await syncWithCloud(ownerOf(user));
    setOutcome(result);
    await load();
  }

  const info = state.kind === "ready" ? state.info : null;

  return (
    <section className="card grid content-start gap-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">Archivio cloud</h2>
        <span className="chip">
          {state.kind === "loading"
            ? "verifica in corso"
            : state.kind === "syncing"
              ? "sincronizzazione…"
              : info?.configured
                ? info.reachable === false
                  ? "non raggiungibile"
                  : "configurato"
                : "non configurato"}
        </span>
      </div>

      {!info || !info.configured ? (
        <p className="text-[13px] leading-relaxed text-ink-500">
          {info?.missing?.length ? (
            <>
              L&apos;archivio cloud è disattivato su questa istanza: mancano le variabili{" "}
              <code className="text-ink-300">{info.missing.join(", ")}</code>. I progetti restano nel browser, come sempre; puoi
              portarli su un altro dispositivo con l&apos;esportazione del file di progetto.
            </>
          ) : (
            "Stato dell'archivio non ancora letto."
          )}
        </p>
      ) : info.reachable === false ? (
        <p className="text-[13px] leading-relaxed text-ink-500">
          Il cloud è configurato ma non risponde: {info.message ?? "errore di rete"}.
        </p>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-ink-500">
            Il bucket dell&apos;archivio segue {info.ownerKind === "account" ? "il tuo account" : "questo dispositivo"}: contiene{" "}
            <strong className="text-ink-100">{info.remoteProjects ?? 0}</strong>{(info.remoteProjects ?? 0) === 1 ? " progetto" : " progetti"}
            {info.newest ? `, l'ultimo aggiornamento è del ${new Date(info.newest).toLocaleString("it-IT")}` : ""}.
          </p>
          <p className="text-[12px] leading-relaxed text-ink-600">
            La sincronizzazione confronta gli istanti di modifica: vince la copia più recente, le cancellazioni fatte su un
            dispositivo si propagano sugli altri. I conflitti non esistono perché non ci sono modifiche parallele alla stessa
            versione: chi ha salvato per ultimo ha ragione, e i tuoi progetti restano comunque qui finché il pull non li supera.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" disabled={state.kind === "syncing"} onClick={() => void sync()}>
              {state.kind === "syncing" ? "Sincronizzo…" : "Sincronizza ora"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={state.kind === "syncing"}>
              Aggiorna stato
            </button>
          </div>
        </>
      )}

      {outcome ? (
        <p
          className={`rounded-tool border px-3 py-2 font-mono text-[11px] ${
            outcome.ok ? "border-surface-700 bg-surface-900 text-ink-500" : "border-danger-500/40 bg-surface-900 text-ink-300"
          }`}
        >
          {outcome.ok
            ? outcome.note
            : `${outcome.note}: ${outcome.message ?? ""}${
                outcome.pushed || outcome.pulled
                  ? ` — già trasferiti: ${outcome.pushed} inviati, ${outcome.pulled} scaricati.`
                  : ""
              }`}
        </p>
      ) : null}
    </section>
  );
}
