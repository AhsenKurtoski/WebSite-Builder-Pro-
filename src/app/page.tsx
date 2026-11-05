import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DemoFrame } from "@/components/site/demo-frame";
import { PresetGallery } from "@/components/site/preset-gallery";
import { STYLE_BRIEFS } from "@/lib/design/style-briefs";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/util/site-url";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: SITE_TAGLINE,
  openGraph: {
    title: `${SITE_NAME} — website builder AI`,
    description: SITE_TAGLINE,
    url: SITE_URL,
    type: "website",
  },
};

const PROMISES = [
  {
    title: "Funziona sempre",
    text: "Il composer deterministico costruisce un sito completo — pagine, testi, palette, SEO, pagine legali — senza una sola chiave API. L'AI, quando c'è, riscrive i contenuti: è un'accelerazione, non un requisito.",
    proof: "0 chiavi richieste · 0 chiamate di rete",
  },
  {
    title: "Anteprima = export",
    text: "Editor e archivio escono dallo stesso albero di markup e dallo stesso foglio di stile. Quello che vedi nell'anteprima è esattamente il file che pubblichi: nessuna sorpresa in produzione.",
    proof: "un solo renderer, due uscite",
  },
  {
    title: "Zero template",
    text: "Struttura, tipografia, palette e varianti nascono dal brief: il compilatore misura l'impronta strutturale di ogni sito e, se due si somigliano, cambia le scelte. Nessun tema da riempire.",
    proof: "firma strutturale verificata",
  },
];

const STAGES = [
  {
    step: "01",
    title: "Il brief diventa materiale",
    text: "Settore riconosciuto dal testo, nome, città, tono. Da qui escono palette OKLCH, accoppiamento tipografico, pagine e contenuti reali, con la voce del settore.",
  },
  {
    step: "02",
    title: "La direzione creativa",
    text: "Con una chiave AI il modello sceglie fra otto direzioni visive — ognuna con un brief di stile: atmosfera, elementi firma, cosa evitare, come suona il testo.",
  },
  {
    step: "03",
    title: "La scrittura",
    text: "Ogni pagina viene riscritta dentro il catalogo dei blocchi: l'AI non tocca il markup, quindi l'output resta valido per costruzione. Nessun lorem ipsum, nessun superlativo.",
  },
  {
    step: "04",
    title: "I controlli",
    text: "Contrasto calcolato coppia per coppia, SEO, immagini con testo alternativo, markup non eseguibile, peso della pagina. Gli errori bloccanti sono zero per progetto.",
  },
];

const PLANS = [
  {
    name: "Locale",
    price: "0 €",
    text: "Il compilatore deterministico, l'editor, i gate e l'export: nessun account, nessuna chiave, nessuna chiamata di rete.",
    note: "È il percorso predefinito di Atelier.",
  },
  {
    name: "Con le tue chiavi",
    price: "0 €",
    text: "Aggiungi una chiave di un provider AI e i testi vengono riscritti dal modello. La chiave resta nel tuo browser.",
    note: "Paghi il provider, non Atelier: nessun credito da comprare qui.",
  },
  {
    name: "Self-hosting",
    price: "0 €",
    text: "Installi il progetto sul tuo dominio, con le tue variabili e le tue app OAuth. Nessun servizio obbligatorio a monte.",
    note: "Guida al deploy e controlli post-pubblicazione inclusi.",
  },
];

const HOME_FAQ = [
  {
    q: "Serve un account o una chiave API?",
    a: "No. L'accesso locale crea un workspace nel browser e il composer deterministico genera il sito senza rete. GitHub, Google e i provider AI sono aggiunte facoltative.",
  },
  {
    q: "Dove finiscono i miei progetti?",
    a: "Nell'archivio del browser. Non c'è un database di progetti lato server: per portarli altrove esporti il file di progetto, che si reimporta identico.",
  },
  {
    q: "L'anteprima è davvero uguale al file scaricato?",
    a: "Sì, per costruzione: editor ed export nascono dallo stesso albero di markup e dallo stesso foglio di stile. Non esistono due renderer da tenere allineati.",
  },
  {
    q: "Quanto pesa un sito generato?",
    a: "Centinaia di kilobyte per un sito informativo completo: le immagini sono generate proceduralmente dal tema e il gate del peso mostra il numero reale prima dell'export.",
  },
];

const EXPORT_POINTS = [
  "6-7 pagine reali, con titoli, descrizioni e dati strutturati",
  "Privacy e Cookie policy scritte, non segnaposto",
  "Modulo di contatto funzionante senza servizi esterni",
  "Banner cookie con consenso granulare",
  "Immagini procedurali generate dal tema, zero file da cercare",
  "Archivio pronto per Vercel, Netlify o Cloudflare Pages",
  "File di progetto reimportabile per riprendere a modificare",
  "File HTML singolo, se ti serve una sola pagina autosufficiente",
];

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DesignApplication",
      operatingSystem: "Browser",
      description: SITE_TAGLINE,
      url: SITE_URL,
      inLanguage: "it-IT",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: [
        "Compilatore deterministico che funziona senza chiavi API",
        "Otto direzioni visive con brief di stile",
        "Editor visuale sullo stesso albero dell'export",
        "Gate di qualità su contrasto, SEO, accessibilità, sicurezza e peso",
        "Export in archivio statico, pagina singola e file di progetto reimportabile",
      ],
    },
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "it-IT",
      description: SITE_TAGLINE,
    },
  ],
};

export default function HomePage() {
  const presets = Object.values(STYLE_BRIEFS);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <SiteHeader />

      {/* Apertura */}
      <section className="relative isolate">
        <div className="aurora" />
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-16 sm:pt-24">
          <div className="grid max-w-3xl gap-5">
            <span className="chip rise w-fit">local-first · nessuna chiave obbligatoria</span>
            <h1 className="rise rise-1 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Un prompt. Un sito
              <br />
              che sembra fatto
              <span className="bg-gradient-to-r from-accent-400 to-violet-500 bg-clip-text text-transparent"> da uno studio.</span>
            </h1>
            <p className="rise rise-2 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
              Atelier compila un sito completo partendo dalla descrizione dell&apos;attività, poi lo apri in un editor visuale e lo
              scarichi come sito statico autosufficiente. Senza account e senza chiavi funziona lo stesso: quello che vedi qui sotto è
              generato nel tuo browser, adesso.
            </p>
            <div className="rise rise-3 flex flex-wrap items-center gap-3">
              <Link className="btn btn-primary btn-lg" href="/login?next=/nuovo">
                Inizia gratis
              </Link>
              <a className="btn btn-outline btn-lg" href="#come-funziona">
                Come funziona
              </a>
              <span className="text-xs text-ink-600">oppure guarda l&apos;anteprima qui sotto e scaricala</span>
            </div>
          </div>

          <div className="rise rise-4">
            <DemoFrame />
          </div>
        </div>
      </section>

      {/* Promesse */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-3 sm:grid-cols-3">
          {PROMISES.map((promise) => (
            <article key={promise.title} className="card grid content-start gap-3 p-5">
              <h2 className="text-lg font-semibold tracking-tight">{promise.title}</h2>
              <p className="text-sm leading-relaxed text-ink-500">{promise.text}</p>
              <span className="chip w-fit">{promise.proof}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <header className="grid max-w-2xl gap-2">
          <span className="mono-label">il compilatore</span>
          <h2 className="text-3xl font-semibold tracking-tight">Quattro stadi, sempre nello stesso ordine</h2>
          <p className="text-sm text-ink-500">
            Il primo stadio non dipende da nessun servizio esterno: se gli altri saltano o falliscono, il sito esiste già, completo e
            pubblicabile.
          </p>
        </header>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.step} className="card grid content-start gap-2 p-5">
              <span className="mono-label">{stage.step}</span>
              <h3 className="text-sm font-semibold">{stage.title}</h3>
              <p className="text-[13px] leading-relaxed text-ink-500">{stage.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Stili */}
      <section id="stili" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <header className="grid max-w-2xl gap-2">
          <span className="mono-label">otto direzioni, non otto temi</span>
          <h2 className="text-3xl font-semibold tracking-tight">Lo stile decide struttura, tipografia e ritmo</h2>
          <p className="text-sm text-ink-500">
            Ogni direzione porta con sé un brief: quale atmosfera comunica, quali mosse la rendono riconoscibile, cosa non fa mai e
            come deve suonare il testo che la abita. Il compilatore usa quel brief per scegliere le varianti di sezione, non per
            applicare un colore in più.
          </p>
        </header>

        <div className="mt-6">
          <PresetGallery />
        </div>

        <p className="mt-4 text-xs text-ink-600">
          {presets.length} direzioni · palette generate in OKLCH con armonia derivata dalla tinta dominante · contrasto corretto
          aritmeticamente, mai sperato.
        </p>
      </section>

      {/* Qualità */}
      <section id="qualita" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="grid gap-3">
            <span className="mono-label">gate di qualità</span>
            <h2 className="text-3xl font-semibold tracking-tight">Bello, ma anche leggibile</h2>
            <p className="text-sm text-ink-500">
              Nessun sito esce da Atelier senza passare i controlli. Non sono consigli: sono verifiche sul file prodotto, con
              numeri che puoi leggere.
            </p>
            <ul className="mt-2 grid gap-2 text-sm text-ink-300">
              {[
                ["contrasto", "ogni coppia testo/sfondo è portata ad almeno 4,5:1, in chiaro e in scuro"],
                ["seo", "titoli entro 60 caratteri, descrizioni 150-158, dati strutturati validi"],
                ["accessibilità", "gerarchia di intestazioni, testo alternativo, focus visibile"],
                ["sicurezza", "nessuno script eseguibile nel markup, form senza servizi esterni"],
                ["peso", "misurato in byte reali, con avviso oltre la soglia"],
              ].map(([label, text]) => (
                <li key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-surface-800 py-2">
                  <span className="mono-label pt-0.5">{label}</span>
                  <span className="text-[13px] text-ink-500">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card grid content-start gap-4 p-5">
            <h3 className="text-sm font-semibold">Misure lette dal file di esempio</h3>
            <p className="text-[13px] text-ink-500">
              Sono i valori mostrati accanto all&apos;anteprima in cima a questa pagina: il numero di parole, il peso stimato in KB, i
              confronti di contrasto superati. Vengono calcolati dai gate mentre il browser genera il sito — non sono stime di
              marketing.
            </p>
            <div className="grid gap-2 font-mono text-[11px] text-ink-600">
              <span>atl status --gates → 0 errori bloccanti</span>
              <span>atl contrast --min 4.5 → tutte le coppie OK</span>
              <span>atl export --zip → site/ + index.html + assets/</span>
            </div>
            <Link className="btn w-fit" href="/login?next=/nuovo">
              Genera il primo sito
            </Link>
          </div>
        </div>
      </section>

      {/* Export */}
      <section id="export" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <header className="grid content-start gap-2">
            <span className="mono-label">export</span>
            <h2 className="text-3xl font-semibold tracking-tight">Il risultato è tuo, in file normali</h2>
            <p className="text-sm text-ink-500">
              Niente piattaforma obbligatoria, niente lock-in: HTML, CSS e un JavaScript minuscolo. Carichi la cartella su qualunque
              hosting statico, oppure tieni il file singolo e lo mandi a chi vuole.
            </p>
          </header>
          <ul className="grid gap-2 sm:grid-cols-2">
            {EXPORT_POINTS.map((point) => (
              <li key={point} className="card card-hover flex items-start gap-2 p-3 text-[13px] text-ink-300">
                <span className="mt-0.5 text-accent-400">◆</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Piani */}
      <section id="piani" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <header className="grid max-w-2xl gap-2">
          <span className="mono-label">quanto costa</span>
          <h2 className="text-3xl font-semibold tracking-tight">Nessun abbonamento, nessun limite per progetto</h2>
          <p className="text-sm text-ink-500">
            Atelier non vende crediti e non mette un tetto ai siti che generi. L&apos;unica cosa che può costare qualcosa è la chiave
            del provider AI, pagata direttamente a chi la eroga.
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <article key={plan.name} className="card grid content-start gap-2 p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">{plan.name}</h3>
                <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-500">{plan.text}</p>
              <p className="text-[11px] text-ink-600">{plan.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link className="btn" href="/piani">
            Dettaglio dei piani
          </Link>
          <Link className="btn" href="/funzionalita">
            Tutte le funzionalità
          </Link>
          <span className="text-xs text-ink-600">0 € per il motore offline · 0 € per l&apos;export · chiavi AI tue</span>
        </div>
      </section>

      {/* Domande */}
      <section id="domande" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <header className="grid content-start gap-2">
            <span className="mono-label">domande frequenti</span>
            <h2 className="text-3xl font-semibold tracking-tight">Le quattro domande che arrivano per prime</h2>
            <p className="text-sm text-ink-500">
              Account, dati, parità fra anteprima ed export, peso del sito. Le altre risposte — con prezzi, self-hosting e limiti
              dichiarati — sono nella pagina dedicata.
            </p>
            <Link className="btn btn-outline w-fit" href="/domande-frequenti">
              Tutte le domande
            </Link>
          </header>

          <div className="grid gap-2">
            {HOME_FAQ.map((item) => (
              <details key={item.q} className="faq">
                <summary>{item.q}</summary>
                <div className="text-[13px] leading-relaxed text-ink-500">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Chiusura */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="card relative overflow-hidden p-8 text-center">
          <div className="aurora opacity-30" />
          <div className="relative grid justify-items-center gap-4">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
              Descrivi l&apos;attività. Il primo sito c&apos;è in un minuto.
            </h2>
            <p className="max-w-xl text-sm text-ink-500">
              Accedi con GitHub o Google, oppure entra in locale: i progetti restano nel tuo browser e le chiavi AI restano sul server
              e non arrivano mai al browser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link className="btn btn-primary btn-lg" href="/login?next=/nuovo">
                Inizia gratis
              </Link>
              <Link className="btn btn-outline btn-lg" href="/login?next=/dashboard">
                Ho già un accesso
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
