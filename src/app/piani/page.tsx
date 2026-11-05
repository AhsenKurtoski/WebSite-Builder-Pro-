import type { Metadata } from "next";
import Link from "next/link";
import { InfoCard, MarketingShell, SectionHeading } from "@/components/site/marketing-shell";
import { absoluteUrl } from "@/lib/util/site-url";

export const metadata: Metadata = {
  title: "Piani",
  description:
    "Atelier non ha abbonamenti: il compilatore offline è incluso, l'accelerazione AI usa le tue chiavi e il codice del sito esportato è tuo. Cosa è incluso e cosa costa zero.",
  alternates: { canonical: "/piani" },
  openGraph: {
    title: "Piani di Atelier",
    description: "Nessun abbonamento e nessun costo per progetto: cosa è incluso, cosa è gratis e cosa paghi solo al provider che scegli.",
    url: absoluteUrl("/piani"),
    type: "article",
  },
};

const PLANS = [
  {
    name: "Locale",
    price: "0 €",
    unit: "sempre",
    summary: "Il compilatore deterministico, l'editor, i gate e l'export. Nessun account, nessuna chiave, nessuna chiamata di rete.",
    points: [
      "siti completi da un brief",
      "editor visuale e anteprima isolata",
      "gate di qualità e report numerico",
      "export in archivio, pagina singola e file di progetto",
      "import di un progetto esportato",
    ],
    note: "È il percorso predefinito: se non configuri nulla, funziona così.",
    highlight: true,
  },
  {
    name: "Con le tue chiavi",
    price: "0 €",
    unit: "per Atelier",
    summary: "Aggiungi una chiave di un provider AI e i testi vengono riscritti dal modello: la direzione creativa e i contenuti diventano specifici.",
    points: [
      "Google Gemini, Groq, Cerebras, OpenRouter, Cloudflare Workers AI",
      "chiavi AI configurate solo sul server",
      "nessun costo per progetto, nessun credito da comprare qui",
      "se il provider è lento o fallisce, il sito arriva comunque",
    ],
    note: "Paghi direttamente il provider, con il suo piano gratuito o a consumo. Atelier non fa da intermediario.",
  },
  {
    name: "Self-hosting",
    price: "0 €",
    unit: "codice tuo",
    summary: "Il progetto è un'applicazione Next.js: la installi dove vuoi, con il tuo dominio e le tue variabili.",
    points: [
      "un deploy su Vercel, Netlify o Cloudflare Pages",
      "accesso GitHub/Google facoltativo (crei tu le app OAuth)",
      "nessun servizio obbligatorio a monte",
      "nessun dato di progetto su un server, per costruzione",
    ],
    note: "La guida al deploy è inclusa nel repository, con le variabili e i controlli da fare dopo la pubblicazione.",
  },
];

const INCLUDED = [
  ["Pagine per progetto", "da 6 a 7, scelte dal settore"],
  ["Direzioni visive", "8, con brief di stile"],
  ["Accoppiamenti tipografici", "8, scelti per tono"],
  ["Provider AI supportati", "5, più endpoint compatibili OpenAI"],
  ["Controlli di qualità", "contrasto, SEO, accessibilità, sicurezza, peso, coerenza"],
  ["Costo per sito pubblicato", "zero, senza limiti imposti da Atelier"],
  ["Richieste di cancellazione dati", "nessuna: i progetti sono nel tuo browser"],
];

export default function PianiPage() {
  return (
    <MarketingShell
      eyebrow="piani"
      title="Nessun abbonamento, nessun costo per progetto"
      lead={
        <p>
          Atelier non vende crediti e non mette un limite al numero di siti: il compilatore gira nel tuo browser. L&apos;unica cosa che
          può costare qualcosa è la chiave del provider AI, e la paghi direttamente a chi la eroga.
        </p>
      }
      meta={["0 € per il motore offline", "0 € per l'export", "chiavi AI tue", "self-hosting incluso"]}
    >
      <section className="grid gap-3 pt-2 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article key={plan.name} className={`card grid content-start gap-3 p-6 ${plan.highlight ? "border-accent-500/40" : ""}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight">{plan.name}</h2>
              {plan.highlight ? <span className="chip">predefinito</span> : null}
            </div>
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-xs text-ink-600">{plan.unit}</span>
            </p>
            <p className="text-sm leading-relaxed text-ink-500">{plan.summary}</p>
            <ul className="grid gap-1.5">
              {plan.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-[13px] text-ink-300">
                  <span className="mt-0.5 text-accent-400">◆</span>
                  {point}
                </li>
              ))}
            </ul>
            <p className="text-[11px] leading-relaxed text-ink-600">{plan.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 pt-10">
        <SectionHeading
          eyebrow="incluso in ogni piano"
          title="Cosa trovi dentro, senza asterischi"
          text="Sono le stesse funzioni per tutti: non c'è una versione ridotta che toglie l'export o i controlli di qualità."
        />
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Funzioni incluse in ogni piano di Atelier</caption>
            <tbody>
              {INCLUDED.map(([label, value]) => (
                <tr key={label} className="border-b border-surface-800 last:border-0">
                  <th scope="row" className="w-1/2 px-4 py-3 text-left text-[13px] font-medium text-ink-300">
                    {label}
                  </th>
                  <td className="px-4 py-3 text-[13px] text-ink-500">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 pt-10">
        <SectionHeading eyebrow="trasparenza" title="Dove finiscono i soldi, se ne spendi" />
        <div className="grid gap-3 lg:grid-cols-3">
          <InfoCard
            title="Provider AI"
            text="Le chiavi sono tue: il piano gratuito dei provider copre tranquillamente l'uso di un sito alla volta. Solo se superi le quote paghi il consumo, al prezzo pubblico del provider."
            points={["nessun ricarico", "nessun credito bloccato", "cambi provider quando vuoi"]}
          />
          <InfoCard
            title="Hosting del sito esportato"
            text="L'archivio è statico: i piani gratuiti dei principali hosting bastano. Non ci sono funzioni server obbligatorie, quindi non c'è un piano che ti viene imposto."
            points={["file normali", "nessun runtime", "spostabile senza rifare il sito"]}
          />
          <InfoCard
            title="Questo servizio"
            text="Se stai usando un'istanza pubblica di Atelier, la paghi chi la ospita: in genere è un deploy personale con i piani gratuiti di hosting e database."
            points={["nessun tracciamento pubblicitario", "nessuna rivendita di dati", "self-hosting sempre possibile"]}
          />
        </div>
      </section>

      <section className="grid gap-4 pt-10">
        <SectionHeading eyebrow="domande sui costi" title="Le tre obiezioni normali" />
        <div className="grid gap-2">
          {[
            {
              q: "Se non pago, cosa mi manca?",
              a: "Niente di strutturale: senza chiavi AI i testi sono quelli del composer, completi e coerenti ma generici. Con una chiave gratuita diventano specifici per la tua attività. Editor, gate ed export sono identici in entrambi i casi.",
            },
            {
              q: "C'è un limite al numero di progetti?",
              a: "No. I progetti stanno nel tuo browser, quindi il limite è lo spazio del browser. Puoi esportare il file di progetto per archiviarli o spostarli su un altro dispositivo.",
            },
            {
              q: "Cosa succede se smetto di usare Atelier?",
              a: "Ti restano i siti esportati, che sono file HTML normali, e i file di progetto, che sono JSON leggibili. Non serve nessun servizio per aprirli o pubblicarli.",
            },
          ].map((item) => (
            <details key={item.q} className="faq">
              <summary>{item.q}</summary>
              <div className="text-[13px] leading-relaxed text-ink-500">{item.a}</div>
            </details>
          ))}
        </div>
        <p className="text-xs text-ink-600">
          Hai bisogno del dettaglio tecnico di ogni funzione?{" "}
          <Link className="text-accent-400 underline underline-offset-2" href="/funzionalita">
            La pagina delle funzionalità
          </Link>{" "}
          entra pezzo per pezzo.
        </p>
      </section>
    </MarketingShell>
  );
}
