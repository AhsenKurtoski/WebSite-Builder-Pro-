import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, SectionHeading } from "@/components/site/marketing-shell";
import { StatusView } from "@/components/site/status-view";
import { absoluteUrl } from "@/lib/util/site-url";

export const metadata: Metadata = {
  title: "Stato del servizio",
  description:
    "Cosa è configurato su questa istanza di Atelier: motore offline, chiave di sessione, provider di accesso e provider AI. Nessuna chiave viene mostrata.",
  alternates: { canonical: "/stato" },
  // Pagina operativa: utile a chi installa, non materiale da indice.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Stato del servizio",
    description: "Motore offline, sessione, accesso e provider AI: cosa è configurato su questa istanza.",
    url: absoluteUrl("/stato"),
    type: "article",
  },
};

const CHECKLIST = [
  {
    title: "ATELIER_SESSION_SECRET",
    text: "Obbligatoria su un dominio pubblico: senza, le sessioni usano una chiave di ripiego e i cookie non sono marcati Secure.",
  },
  {
    title: "AUTH_GITHUB_ID e AUTH_GITHUB_SECRET",
    text: "Servono solo se vuoi l'accesso con GitHub. Si creano come OAuth App, con la callback /api/auth/github/callback.",
  },
  {
    title: "AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET",
    text: "Come sopra, per l'accesso con Google: callback /api/auth/google/callback e scope email e profilo.",
  },
  {
    title: "Chiavi dei provider AI",
    text: "Facoltative e sostituibili: se mancano, resta attivo il compilatore deterministico. Le chiavi si configurano come variabili d'ambiente del server.",
  },
];

export default function StatoPage() {
  return (
    <MarketingShell
      eyebrow="stato del servizio"
      title="Cosa è configurato su questa istanza"
      lead={
        <p>
          Una lettura sola, presa dalla diagnostica dell&apos;applicazione: non contatta nessun provider e non espone nessuna chiave,
          nemmeno in parte. Chi installa Atelier la usa per capire cosa manca prima di aprire il sito.
        </p>
      }
      meta={["nessuna chiave mostrata", "nessuna chiamata esterna", "risposta in tempo reale"]}
      tone="plain"
      cta={{
        title: "Configurato o no, il sito si genera lo stesso",
        text: "Il primo stadio del compilatore lavora nel browser: puoi provare Atelier anche su un'istanza appena installata e senza chiavi.",
        href: "/login?next=/nuovo",
        label: "Prova il compilatore",
        secondary: { href: "/funzionalita", label: "Cosa fa Atelier" },
      }}
    >
      <StatusView />

      <section className="grid gap-4 pt-10">
        <SectionHeading
          eyebrow="per chi installa"
          title="Le quattro variabili che contano"
          text="Atelier parte senza configurazione. Queste variabili servono solo ad alzare il livello: sessione, accesso social e accelerazione AI."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {CHECKLIST.map((item) => (
            <article key={item.title} className="card grid content-start gap-2 p-5">
              <code className="mono-label">{item.title}</code>
              <p className="text-[13px] leading-relaxed text-ink-500">{item.text}</p>
            </article>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-ink-600">
          Il modello completo delle variabili è nel file <code className="text-ink-300">.env.example</code> del repository, con la
          guida al deploy passo per passo. Le sessioni sono firmate con HMAC-SHA256 e il cookie è leggibile solo dal server: la
          pagina{" "}
          <Link className="text-accent-400 underline underline-offset-2" href="/privacy">
            Privacy
          </Link>{" "}
          spiega per intero la mappa dei dati.
        </p>
      </section>
    </MarketingShell>
  );
}
