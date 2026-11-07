"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { HOME_SECTIONS, LEGAL_PAGES, PUBLIC_PAGES, STATUS_PAGE } from "@/lib/site/pages";

/**
 * Barra di vetro della vetrina.
 *
 * Sopra i 1024 px mostra anche le ancore della home; sotto i 768 px si riduce a
 * marchio, accesso e un menu apribile che contiene tutto. Il menu si chiude da
 * solo quando cambia pagina, con Esc o toccando un collegamento.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cambio pagina: il menu non deve restare aperto sopra la pagina nuova.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const mobileLinks = [
    ...(onHome ? HOME_SECTIONS : []),
    ...PUBLIC_PAGES.map((page) => ({ href: page.href, label: page.label })),
    { href: STATUS_PAGE.href, label: STATUS_PAGE.label },
    ...LEGAL_PAGES.map((page) => ({ href: page.href, label: page.label })),
  ];

  return (
    <header className={`glass safe-top sticky top-0 z-40 transition-shadow ${scrolled ? "shadow-[0_18px_50px_-40px_rgba(0,0,0,0.9)]" : ""}`}>
      <a
        href="#contenuto"
        className="sr-only rounded-tool bg-accent-600 px-3 py-2 text-sm font-semibold text-surface-950 focus:not-sr-only focus:absolute focus:left-5 focus:top-3 focus:z-50"
      >
        Vai al contenuto
      </a>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Atelier, torna alla vetrina">
          <span className="grid h-8 w-8 place-items-center rounded-[0.6rem] border border-accent-500/40 bg-accent-600/15 font-mono text-sm text-accent-400">
            A
          </span>
          <span className="grid leading-none">
            <span className="text-sm font-semibold tracking-tight">Atelier</span>
            <span className="text-[10px] text-ink-600">website builder AI</span>
          </span>
        </Link>

        <nav aria-label="Pagina corrente e sezioni" className="hidden items-center gap-0.5 md:flex">
          {PUBLIC_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="nav-link"
              aria-current={pathname === page.href ? "page" : undefined}
            >
              {page.label === "Domande frequenti" ? "Domande" : page.label}
            </Link>
          ))}
          {onHome ? (
            <span className="hidden items-center gap-0.5 lg:flex">
              {HOME_SECTIONS.map((section) => (
                <a key={section.href} href={section.href} className="nav-link">
                  {section.label}
                </a>
              ))}
            </span>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Link className="btn btn-primary hidden sm:inline-flex" href="/login?next=/nuovo">
            Inizia gratis
          </Link>
          <UserMenu compact guestLinks="signin" />

          <button
            type="button"
            className="btn btn-ghost px-2 md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Chiudi il menu" : "Apri il menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div id="menu-mobile" className="absolute inset-x-0 top-full border-b border-surface-800 bg-surface-950/95 backdrop-blur md:hidden">
          <nav aria-label="Menu" className="grid gap-0.5 px-5 py-4">
            {mobileLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="rounded-tool px-3 py-2.5 text-sm text-ink-300 hover:bg-surface-850 hover:text-ink-100"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="safe-bottom flex gap-2 px-5 pb-5">
            <Link className="btn btn-primary flex-1 justify-center" href="/login?next=/nuovo" onClick={() => setOpen(false)}>
              Crea il primo sito
            </Link>
            <Link className="btn btn-outline flex-1 justify-center" href="/login?next=/dashboard" onClick={() => setOpen(false)}>
              I miei progetti
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
