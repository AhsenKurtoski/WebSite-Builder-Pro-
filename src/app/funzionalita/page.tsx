import type { Metadata } from "next";
import Link from "next/link";
import { InfoCard, MarketingShell, SectionHeading } from "@/components/site/marketing-shell";
import { absoluteUrl } from "@/lib/util/site-url";
import { STYLE_BRIEFS } from "@/lib/design/style-briefs";

export const metadata: Metadata = {
  title: "Funzionalità",
  description:
    "Come Atelier costruisce un sito: compilatore a quattro stadi, catalogo di sezioni tipizzate, design system in OKLCH, gate di qualità, editor visuale, export statico e import del progetto.",
  alternates: { canonical: "/funzionalita" },
  openGraph: {
    title: "Funzionalità di Atelier",
    description:
      "Compilatore a stadi, catalogo di sezioni, design system, gate di qualità, editor e export: cosa fa Atelier, pezzo per pezzo.",
    url: absoluteUrl("/funzionalita"),
    type: "article",
  },
};

const STAGES = [
  {
    step: "01",
    title: "Materiale",
    text: "Il brief viene letto per settore, nome, città e tono. Non è riassunto: è interpretazione. Da qui nascono palette in OKLCH, coppia tipografica, elenco delle pagine e struttura delle sezioni.",
    points: ["nessuna rete coinvolta", "funziona a chiavi spente", "settore riconosciuto dal testo"],
  },
  {
    step: "02",
    title: "Direzione creativa",
    text: "Se c'è una chiave AI, il modello sceglie una delle otto direzioni visive. Ognuna porta un brief: atmosfera, mosse di firma, cosa non fare, come deve suonare il testo che la abita.",
    points: ["scelta fra otto direzioni", "vincolo di stile rispettato", "preset coerente con le varianti"],
  },
  {
    step: "03",
    title: "Scrittura",
    text: "Le pagine vengono riscritte dentro il catalogo di blocchi: titoli, paragrafi, elenchi, tabelle, FAQ, moduli. Il modello non tocca il markup, quindi l'output resta valido per costruzione.",
    points: ["niente lorem ipsum", "nessuna sezione vuota", "testi allineati alla direzione scelta"],
  },
  {
    step: "04",
    title: "Controlli",
    text: "Il documento passa i gate prima dell'export. Gli errori bloccanti sono zero per progetto: se qualcosa non passa, viene corretto o segnalato con il numero che lo prova.",
    points: ["contrasto calcolato", "SEO verificata", "peso misurato in byte reali"],
  },
];

const GATES = [
  {
    label: "contrasto",
    title: "Contrasto calcolato",
    text: "Ogni coppia testo/sfondo del tema viene misurata e portata ad almeno 4,5:1 (3:1 per i testi grandi), in chiaro e in scuro. Non è una speranza: è aritmetica su luminanze WCAG.",
  },
  {
    label: "seo",
    title: "SEO verificata",
    text: "Titoli entro i 60 caratteri, descrizioni fra 150 e 158, un solo H1 per pagina, dati strutturati validi, collegamenti interni presenti, canonical e sitemap coerenti.",
  },
  {
    label: "accessibilità",
    title: "Accessibilità",
    text: "Gerarchia di intestazioni senza salti, testo alternativo su ogni immagine, focus visibile, etichette sui campi, ordine di tabulazione sensato, contrasto dei bordi dei controlli.",
  },
  {
    label: "sicurezza",
    title: "Markup non eseguibile",
    text: "Il documento viene trattato come testo: niente script iniettati dai contenuti, moduli senza servizi esterni, nessun tracciante, nessun iframe di terze parti nel sito esportato.",
  },
  {
    label: "peso",
    title: "Peso misurato",
    text: "Il sito esportato viene pesato in byte reali. Oltre la soglia compare un avviso con il numero: le immagini sono generate dal tema, quindi il peso resta prevedibile.",
  },
  {
    label: "coerenza",
    title: "Firma strutturale",
    text: "Il compilatore calcola l'impronta strutturale del sito e, se due progetti risultano somiglianti, cambia le varianti di sezione. È il controllo che tiene in piedi la promessa zero template.",
  },
];

const EDITOR = [
  {
    title: "Selezione dentro il documento",
    text: "Clicchi l'elemento nell'anteprima, si apre l'ispettore con i campi giusti: testo, elenco, immagine, disposizione, tono del blocco. Nessun pannello generico con opzioni che non si applicano.",
  },
  {
    title: "Pagine e sezioni",
    text: "Il binario laterale elenca le pagine e le sezioni di quella pagina, con riordino, duplicazione e rimozione. Su mobile diventa una barra con il selettore di pagina e il passaggio fra Anteprima e Modifica.",
  },
  {
    title: "Salvataggio automatico",
    text: "Ogni modifica viene scritta nel browser dopo un secondo di quiete, con la versione precedente conservata come istantanea: tornare indietro è un'azione, non una speranza.",
  },
  {
    title: "Anteprima isolata",
    text: "L'anteprima gira in una cornice isolata con lo stesso foglio di stile dell'export: quello che vedi nell'editor è il file che scarichi, alla stessa larghezza del dispositivo che stai usando.",
  },
];

export default function FunzionalitaPage() {
  const presets = Object.values(STYLE_BRIEFS);

  return (
    <MarketingShell
      eyebrow="funzionalità"
      title="Un compilatore, non un generatore di pagine"
      lead={
        <p>
          Atelier trasforma una descrizione in un documento tipizzato: pagine, sezioni, testi, immagini procedurali, dati strutturati e
          pagine legali. Su quel documento lavorano l&apos;editor visuale e l&apos;export — due uscite dello stesso albero, mai due
          prodotti diversi.
        </p>
      }
      meta={[`${STAGES.length} stadi`, `${presets.length} direzioni visive`, "gate di qualità inclusi", "export statico autosufficiente"]}
    >
      <section className="grid gap-4 pt-2">
        <SectionHeading
          eyebrow="il compilatore"
          title="Quattro stadi, sempre nello stesso ordine"
          text="Il primo stadio non dipende da nessun servizio: se gli altri saltano, sono lenti o falliscono, il sito esiste già, completo e pubblicabile. È il motivo per cui Atelier funziona anche senza chiavi API."
        />
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.step} className="card grid content-start gap-3 p-5">
              <span className="mono-label">{stage.step}</span>
              <h3 className="text-sm font-semibold">{stage.title}</h3>
              <p className="text-[13px] leading-relaxed text-ink-500">{stage.text}</p>
              <ul className="grid gap-1.5 pt-1">
                {stage.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[12px] text-ink-600">
                    <span className="mt-0.5 text-accent-400">◆</span>
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section id="qualita" className="grid scroll-mt-24 gap-4 pt-10">
        <SectionHeading
          eyebrow="gate di qualità"
          title="Sei controlli sul file, non consigli"
          text="I gate lavorano sul documento prodotto e restituiscono numeri leggibili: quanti confronti di contrasto sono passati, quanti byte pesa la pagina, quali immagini non hanno testo alternativo. Gli errori bloccanti bloccano davvero."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GATES.map((gate) => (
            <article key={gate.label} className="card grid content-start gap-2 p-5">
              <span className="mono-label">{gate.label}</span>
              <h3 className="text-sm font-semibold">{gate.title}</h3>
              <p className="text-[13px] leading-relaxed text-ink-500">{gate.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="editor" className="grid scroll-mt-24 gap-4 pt-10">
        <SectionHeading
          eyebrow="editor visuale"
          title="Modificare senza rompere"
          text="L'editor non riscrive il documento a mano libera: agisce sui nodi tipizzati, quindi ogni modifica resta valida per costruzione e l'anteprima si aggiorna subito."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {EDITOR.map((item) => (
            <InfoCard key={item.title} title={item.title} text={item.text} />
          ))}
        </div>
      </section>

      <section id="design" className="grid scroll-mt-24 gap-4 pt-10">
        <SectionHeading
          eyebrow="design system"
          title="Otto direzioni che cambiano struttura, non solo colore"
          text="Ogni direzione definisce atmosfera, elementi firma, cose da evitare e voce del testo. La variabilità vive in variabili CSS: il markup resta pulito e identico in anteprima e in export."
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {presets.map((preset) => (
            <li key={preset.preset} className="card grid content-start gap-2 p-4">
              <h3 className="text-sm font-semibold">{preset.label}</h3>
              <p className="text-[12px] leading-relaxed text-ink-500">{preset.mood}</p>
              <span className="mono-label">evita: {preset.avoid[0]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="export" className="grid scroll-mt-24 gap-4 pt-10">
        <SectionHeading
          eyebrow="export e import"
          title="Tre uscite, tutte reversibili"
          text="Il risultato è materiale normale: file che si aprono con un doppio clic, che carichi dove vuoi e che puoi riportare dentro Atelier per continuare a lavorarci."
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <InfoCard
            title="Archivio del sito"
            text="Una cartella con le pagine HTML, il foglio di stile, il JavaScript minimo e gli asset generati. La carichi su Vercel, Netlify, Cloudflare Pages o qualunque hosting statico."
            points={["HTML + CSS + JS, niente runtime", "link interni già corretti", "sitemap e robots inclusi"]}
          />
          <InfoCard
            title="Pagina singola"
            text="Un solo file HTML autosufficiente, con stile e immagini incorporati: utile per una landing da mandare via email o da caricare su un host che accetta un file soltanto."
            points={["nessuna dipendenza esterna", "si apre anche da chiavetta", "stesse classi dell'anteprima"]}
          />
          <InfoCard
            title="File di progetto"
            text="Il documento tipizzato, con brief, preset, tipografia e contenuti. Si reimporta identico e produce lo stesso HTML byte per byte: serve per riprendere, duplicare o archiviare un lavoro."
            points={["reimport verificato dai test", "nessuna perdita di campi", "errore leggibile se il file è corrotto"]}
          />
        </div>
      </section>

      <section id="accesso" className="grid scroll-mt-24 gap-4 pt-10">
        <SectionHeading
          eyebrow="accesso e dati"
          title="Le chiavi restano sul server, i progetti restano nel tuo browser"
          text="Atelier non ha un database di progetti: l'archivio è l'archivio del tuo browser, diviso per accesso. Le chiavi dei provider AI sono configurate sul server: il browser non le vede e non le invia mai."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <InfoCard
            title="Tre modi di entrare"
            text="GitHub, Google o accesso locale. L'accesso locale non chiede niente a nessuno e crea un workspace tuo; con GitHub o Google il workspace segue l'identità dell'account."
            points={["sessione firmata, cookie HttpOnly", "scadenza a 30 giorni", "nessun token di accesso conservato"]}
          />
          <InfoCard
            title="Robustezza dichiarata"
            text="Ogni stadio dell'AI ha un budget di tempo. Se il provider si impianta, Atelier consegna il sito del composer e ti dice cosa è successo: la generazione non resta appesa e non perde il lavoro."
            points={["limiti per stadio, non per pazienza", "avviso invece di errore", "suite di test sul comportamento"]}
          />
        </div>
      </section>

      <section id="limiti" className="grid scroll-mt-24 gap-4 pt-10">
        <SectionHeading eyebrow="senza promesse gonfiate" title="Cosa Atelier non fa" />
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Non pubblica al posto tuo: esporti l'archivio e decidi tu dove metterlo.",
            "Non fa e-commerce, aree riservate o pagamenti: il catalogo è di siti informativi e di servizi.",
            "Non scrive in lingue diverse dall'italiano in questa versione.",
            "Non sostituisce un consulente legale: privacy e cookie policy sono scritte, ma vanno adattate alla tua attività.",
            "Non conserva i tuoi progetti su un server: se svuoti i dati del browser, spariscono — l'archivio esportato resta la copia.",
            "Non inventa recensioni, certificazioni o numeri: i contenuti stanno su ciò che scrivi nel brief.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 rounded-tool border border-surface-800 px-4 py-3 text-[13px] text-ink-500">
              <span className="mt-0.5 text-ink-600">—</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-600">
          Il dettaglio tecnico, con i numeri dei test, è nel README del progetto. Per capire cosa è configurato su questa istanza c&apos;è{" "}
          <Link className="text-accent-400 underline underline-offset-2" href="/stato">
            la pagina di stato
          </Link>
          .
        </p>
      </section>
    </MarketingShell>
  );
}
