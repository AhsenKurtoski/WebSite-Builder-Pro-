"use client";

import Link from "next/link";
import { initials, useSession, useSignOut } from "@/lib/auth/session-client";

/** Avatar, nome e menu: identico nell'area di lavoro e nello Studio. */
export function UserMenu({
  compact = false,
  guestLinks = "both",
}: {
  compact?: boolean;
  /** Sulla vetrina il pulsante principale è già nella barra: evita il doppione. */
  guestLinks?: "both" | "signin";
}) {
  const { user, loading, localSecret } = useSession();
  const signOut = useSignOut();

  if (loading) {
    return <span className="chip">sessione…</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn btn-ghost">
          Accedi
        </Link>
        {guestLinks === "both" ? (
          <Link href="/login?next=/nuovo" className="btn btn-primary">
            Inizia gratis
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-tool border border-surface-700 bg-surface-850 px-2 py-1.5 text-xs hover:bg-surface-800">
        <Avatar user={user} />
        {compact ? null : (
          <span className="grid leading-tight">
            <span className="max-w-[12rem] truncate">{user.name}</span>
            <span className="text-[10px] text-ink-600">{user.provider === "local" ? "sessione locale" : user.provider}</span>
          </span>
        )}
        <span className="text-ink-600">▾</span>
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-64 rounded-tool border border-surface-700 bg-surface-900 p-2 shadow-2xl">
        <div className="grid gap-0.5 px-2 py-1.5">
          <span className="text-sm">{user.name}</span>
          <span className="text-[11px] text-ink-600">{user.email || "nessuna email (sessione locale)"}</span>
        </div>
        <div className="my-1 hairline" />
        <nav className="grid">
          <Link className="rounded-tool px-2 py-1.5 text-sm hover:bg-surface-850" href="/dashboard">
            I miei progetti
          </Link>
          <Link className="rounded-tool px-2 py-1.5 text-sm hover:bg-surface-850" href="/nuovo">
            Nuovo sito
          </Link>
          <Link className="rounded-tool px-2 py-1.5 text-sm hover:bg-surface-850" href="/impostazioni">
            Chiavi AI e account
          </Link>
        </nav>
        <div className="my-1 hairline" />
        {localSecret ? (
          <p className="px-2 py-1 text-[10px] text-warn-500">
            Sessione firmata con la chiave locale: aggiungi ATELIER_SESSION_SECRET per usarla fra macchine.
          </p>
        ) : null}
        <button type="button" className="w-full rounded-tool px-2 py-1.5 text-left text-sm text-danger-500 hover:bg-surface-850" onClick={() => void signOut()}>
          Esci
        </button>
      </div>
    </details>
  );
}

export function Avatar({ user, size = 24 }: { user: { name: string; avatar: string }; size?: number }) {
  if (user.avatar) {
    return (
      // Le immagini arrivano dai provider (GitHub/Google), non da input libero.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatar} alt="" width={size} height={size} className="rounded-full border border-surface-700" />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full border border-surface-700 bg-surface-800 font-mono text-[10px] text-ink-300"
      style={{ width: size, height: size }}
    >
      {initials(user.name)}
    </span>
  );
}
