"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "atelier_cookie_notice_v1";
const OPEN_EVENT = "atelier:cookie-open";

/** Rotte interne dove l'avviso non serve e disturberebbe il lavoro. */
const APP_ROUTES = ["/dashboard", "/studio", "/nuovo", "/impostazioni"];

export function CookieNotice() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(!localStorage.getItem(STORAGE_KEY));
    } catch {
      setOpen(false);
    }
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  if (APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;
  if (!open) return null;

  function choose(value: "accepted" | "essential") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Storage bloccato: l'avviso si chiude comunque. */
    }
    setOpen(false);
  }

  return (
    <aside
      role="dialog"
      aria-label="Cookie e preferenze"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-tool border border-surface-700 bg-surface-950/95 p-4 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] backdrop-blur sm:bottom-5 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <p className="text-sm font-semibold">Cookie e preferenze</p>
          <p className="text-[12px] leading-relaxed text-ink-500">
            Usiamo solo cookie tecnici: sessione, protezione dell’accesso e identificativo del workspace. Nessun cookie
            pubblicitario, nessun tracciamento, nessuna statistica di terze parti.
          </p>
          <Link className="w-fit text-[12px] text-accent-400 underline decoration-accent-500/40 underline-offset-4 hover:text-accent-300" href="/cookie">
            Leggi la Cookie policy
          </Link>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="btn btn-outline text-xs" onClick={() => choose("essential")}>
            Solo necessari
          </button>
          <button type="button" className="btn btn-primary text-xs" onClick={() => choose("accepted")}>
            Va bene
          </button>
        </div>
      </div>
    </aside>
  );
}
