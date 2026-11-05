"use client";

import Link from "next/link";
import { AppHeader } from "./app-header";
import { KeysPanel } from "./keys-panel";
import { Avatar } from "@/components/auth/user-menu";
import { ownerOf, useSession, useSignOut } from "@/lib/auth/session-client";

export function SettingsView({ pendingLogin }: { pendingLogin: boolean }) {
  const { user, localSecret, loading } = useSession();
  const signOut = useSignOut();

  return (
    <div className="min-h-screen">
      <AppHeader active="/impostazioni" />

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_1.35fr]">
        <section className="grid content-start gap-4">
          <header className="grid gap-2">
            <span className="mono-label">account</span>
            <h1 className="text-3xl font-semibold tracking-tight">Chi sta lavorando</h1>
            <p className="text-sm text-ink-500">
              L&apos;accesso serve solo a separare i workspace. Nessun contenuto viene caricato: la sessione è un cookie firmato, i
              progetti stanno in questo browser.
            </p>
          </header>

          <div className="card grid gap-3 p-5">
            {loading ? (
              <p className="text-sm text-ink-600">Leggo la sessione…</p>
            ) : user ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar user={user} size={42} />
                  <div className="grid">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-[11px] text-ink-600">{user.email || "nessuna email"}</span>
                  </div>
                  <span className="chip ml-auto">{user.provider === "local" ? "locale" : user.provider}</span>
                </div>
                <dl className="grid gap-1 border-t border-surface-800 pt-3 text-[11px] text-ink-600">
                  <div className="flex justify-between gap-3">
                    <dt>workspace</dt>
                    <dd className="font-mono text-ink-500">{ownerOf(user)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>firma della sessione</dt>
                    <dd className="font-mono text-ink-500">{localSecret ? "chiave locale di sviluppo" : "ATELIER_SESSION_SECRET"}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-surface-800 pt-3">
                  <Link className="btn" href="/dashboard">
                    I miei progetti
                  </Link>
                  {pendingLogin ? (
                    <Link className="btn btn-outline" href="/login">
                      Collega GitHub o Google
                    </Link>
                  ) : null}
                  <button type="button" className="btn btn-ghost text-danger-500" onClick={() => void signOut()}>
                    Esci
                  </button>
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <p className="text-sm text-ink-500">Nessuna sessione attiva.</p>
                <Link className="btn btn-primary w-fit" href="/login?next=/impostazioni">
                  Accedi
                </Link>
              </div>
            )}
          </div>

          <div className="card grid gap-2 p-5">
            <h2 className="text-sm font-semibold">Note sulla riservatezza</h2>
            <ul className="grid gap-1.5 text-xs text-ink-500">
              <li>· Le chiavi AI sono variabili d&apos;ambiente del server: il browser non le riceve né le invia mai.</li>
              <li>· Nessun dato di chiave viene salvato nel browser o nei progetti esportati.</li>
              <li>· La sessione è un cookie HttpOnly firmato HMAC, valido 30 giorni.</li>
              <li>· I progetti restano in IndexedDB: puoi esportarli quando vuoi, anche senza account.</li>
            </ul>
          </div>
        </section>

        <section className="grid content-start gap-4">
          <header className="grid gap-2">
            <span className="mono-label">provider</span>
            <h2 className="text-2xl font-semibold tracking-tight">Chiavi AI</h2>
            <p className="text-sm text-ink-500">
              Gemini ha due chiavi: la principale e una di riserva da un altro progetto Google Cloud. Se la principale finisce la
              quota, il router passa alla riserva e la compilazione continua senza interruzioni.
            </p>
          </header>

          <div className="card p-5">
            <KeysPanel />
          </div>
        </section>
      </main>
    </div>
  );
}
