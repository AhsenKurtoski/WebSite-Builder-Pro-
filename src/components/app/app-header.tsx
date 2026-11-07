"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, FolderOpen, KeyRound, Plus } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

const NAV = [
  { href: "/dashboard", label: "Progetti", Icon: FolderOpen },
  { href: "/nuovo", label: "Nuovo sito", Icon: Plus },
  { href: "/guida", label: "Guida", Icon: BookOpen },
  { href: "/impostazioni", label: "Chiavi AI", Icon: KeyRound },
];

/** Testata comune a dashboard, creazione e impostazioni. */
export function AppHeader({ active, children }: { active?: string; children?: ReactNode }) {
  return (
    <header className="glass safe-top sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[0.6rem] border border-accent-500/40 bg-accent-600/15 font-mono text-sm text-accent-400">
            A
          </span>
          <span className="hidden leading-none sm:grid">
            <span className="text-sm font-semibold tracking-tight">Atelier</span>
            <span className="text-[10px] text-ink-600">studio</span>
          </span>
        </Link>

        {/* Su schermo stretto solo icone: la barra resta una riga sola. */}
        <nav className="flex items-center gap-1 sm:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={
                item.href === active
                  ? "rounded-tool bg-surface-850 p-2 text-ink-100"
                  : "rounded-tool p-2 text-ink-500 hover:bg-surface-850 hover:text-ink-100"
              }
            >
              <item.Icon size={16} aria-hidden />
            </Link>
          ))}
        </nav>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.href === active
                  ? "rounded-tool bg-surface-850 px-3 py-1.5 text-xs text-ink-100"
                  : "rounded-tool px-3 py-1.5 text-xs text-ink-500 hover:bg-surface-850 hover:text-ink-100"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children ? <div className="flex flex-1 items-center gap-2">{children}</div> : <div className="flex-1" />}

        <UserMenu />
      </div>
    </header>
  );
}
