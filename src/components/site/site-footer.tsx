import Link from "next/link";
import { HOME_SECTIONS, LEGAL_PAGES, PUBLIC_PAGES, STATUS_PAGE } from "@/lib/site/pages";
import { AUTHOR_NAME, STUDIO_NAME } from "@/lib/util/site-url";

type Column = { title: string; links: { href: string; label: string }[] };

const COLUMNS: Column[] = [
  {
    title: "Prodotto",
    links: [
      { href: "/funzionalita", label: "Funzionalità" },
      { href: "/#come-funziona", label: "Come funziona" },
      { href: "/#stili", label: "Otto direzioni" },
      { href: "/#qualita", label: "Gate di qualità" },
      { href: "/#export", label: "Export" },
    ],
  },
  {
    title: "Approfondimenti",
    links: [
      ...PUBLIC_PAGES.filter((page) => page.href !== "/funzionalita").map((page) => ({ href: page.href, label: page.label })),
      { href: STATUS_PAGE.href, label: STATUS_PAGE.label },
    ],
  },
  {
    title: "Legale",
    links: LEGAL_PAGES.map((page) => ({ href: page.href, label: page.label })),
  },
  {
    title: "Il tuo accesso",
    links: [
      { href: "/login?next=/nuovo", label: "Crea il primo sito" },
      { href: "/login?next=/dashboard", label: "I tuoi progetti" },
      { href: "/login", label: "Accedi" },
      { href: "/#domande", label: "Serve un account?" },
    ],
  },
];

const TECNICA = [
  "motore offline incluso",
  "nessun tracciamento",
  "export senza lock-in",
];

/** Piè di pagina della vetrina: quattro colonne, poi la riga tecnica. */
export function SiteFooter() {
  return (
    <footer className="border-t border-surface-800 bg-surface-950/60">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="grid content-start gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[0.6rem] border border-accent-500/40 bg-accent-600/15 font-mono text-sm text-accent-400">
                A
              </span>
              <span className="grid leading-none">
                <span className="text-sm font-semibold tracking-tight">Atelier</span>
                <span className="text-[10px] text-ink-600">website builder AI</span>
              </span>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-ink-600">
              Descrivi l&apos;attività, ottieni un sito completo e pubblicabile. Il compilatore lavora nel tuo browser: nessuna chiave
              obbligatoria, nessun lock-in sull&apos;export.
            </p>
            <ul className="grid gap-1.5 pt-1">
              {TECNICA.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[11px] text-ink-600">
                  <span className="text-accent-400">◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="grid content-start gap-2.5">
              <span className="mono-label">{column.title}</span>
              <ul className="grid gap-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <Link className="text-[13px] text-ink-500 transition-colors hover:text-ink-100" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="hairline my-8" />

        <div className="flex flex-col gap-3 text-[11px] text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Atelier è un website builder AI local-first. I progetti restano nel tuo browser: cancellarli è un&apos;azione tua, non una
            richiesta a un servizio.
          </p>
          <p className="sm:text-right">
            Progettato e sviluppato da <span className="text-ink-400">{AUTHOR_NAME}</span> ·{" "}
            <span className="text-ink-400">{STUDIO_NAME}</span>
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-[11px] text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Atelier è un prodotto {STUDIO_NAME}. Contenuti e marchio appartengono al rispettivo titolare.</p>
          <nav aria-label="Collegamenti rapidi" className="flex flex-wrap gap-x-4 gap-y-2">
            {HOME_SECTIONS.slice(0, 3).map((section) => (
              <Link key={section.href} className="transition-colors hover:text-ink-300" href={section.href}>
                {section.label}
              </Link>
            ))}
            <Link className="transition-colors hover:text-ink-300" href="/login?next=/nuovo">
              Inizia gratis
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
