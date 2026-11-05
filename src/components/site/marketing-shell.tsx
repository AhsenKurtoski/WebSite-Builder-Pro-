import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type CtaProps = {
  title: string;
  text: string;
  href?: string;
  label?: string;
  secondary?: { href: string; label: string };
};

const DEFAULT_CTA: CtaProps = {
  title: "Descrivi l'attività: il primo sito è pronto in un minuto.",
  text: "Entra con GitHub o Google, oppure resta in locale. I progetti vivono nel tuo browser e le chiavi AI restano sul server, mai nel browser.",
  href: "/login?next=/nuovo",
  label: "Inizia gratis",
  secondary: { href: "/login?next=/dashboard", label: "Ho già un accesso" },
};

/**
 * Struttura comune delle pagine pubbliche: barra, apertura, contenuto, invito
 * finale e piè di pagina. Le pagine scrivono solo il proprio contenuto.
 */
export function MarketingShell({
  eyebrow,
  title,
  lead,
  meta,
  children,
  cta = DEFAULT_CTA,
  tone = "dark",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  meta?: string[];
  children: ReactNode;
  cta?: CtaProps | null;
  tone?: "dark" | "plain";
}) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteHeader />

      <main id="contenuto">
        <section className="relative isolate">
          {tone === "dark" ? <div className="aurora" /> : null}
          <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:pt-16">
            <div className="grid max-w-3xl gap-4">
              <span className="chip rise w-fit">{eyebrow}</span>
              <h1 className="rise rise-1 text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">{title}</h1>
              {lead ? <div className="rise rise-2 text-base leading-relaxed text-ink-500">{lead}</div> : null}
              {meta?.length ? (
                <ul className="rise rise-3 flex flex-wrap gap-2">
                  {meta.map((item) => (
                    <li key={item} className="chip">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-4 px-5 pb-14 [&>*]:min-w-0">{children}</div>

        {cta ? (
          <section className="mx-auto max-w-6xl px-5 pb-16">
            <div className="card relative overflow-hidden p-8 text-center">
              <div className="aurora opacity-30" />
              <div className="relative grid justify-items-center gap-4">
                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">{cta.title}</h2>
                <p className="max-w-xl text-sm leading-relaxed text-ink-500">{cta.text}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link className="btn btn-primary btn-lg" href={cta.href ?? "/login?next=/nuovo"}>
                    {cta.label ?? "Inizia gratis"}
                  </Link>
                  {cta.secondary ? (
                    <Link className="btn btn-outline btn-lg" href={cta.secondary.href}>
                      {cta.secondary.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}

/** Intestazione di una sezione interna: occhiello, titolo, testo. */
export function SectionHeading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: ReactNode }) {
  return (
    <header className="grid max-w-2xl gap-2">
      {eyebrow ? <span className="mono-label">{eyebrow}</span> : null}
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {text ? <p className="text-sm leading-relaxed text-ink-500">{text}</p> : null}
    </header>
  );
}

/** Scheda di approfondimento: titolo, testo, elenco di punti. */
export function InfoCard({
  title,
  text,
  points,
  note,
}: {
  title: string;
  text: string;
  points?: string[];
  note?: string;
}) {
  return (
    <article className="card grid content-start gap-3 p-5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-500">{text}</p>
      {points?.length ? (
        <ul className="grid gap-1.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13px] text-ink-300">
              <span className="mt-0.5 text-accent-400">◆</span>
              {point}
            </li>
          ))}
        </ul>
      ) : null}
      {note ? <p className="text-[11px] text-ink-600">{note}</p> : null}
    </article>
  );
}
