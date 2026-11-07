import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, SectionHeading } from "@/components/site/marketing-shell";
import { AUTHOR_NAME, SITE_NAME, STUDIO_NAME, absoluteUrl } from "@/lib/util/site-url";

export const metadata: Metadata = {
  title: "Guida completa",
  description:
    "Come creare, modificare, verificare ed esportare un sito con Atelier: guida passo per passo, senza chiavi API e senza account.",
  alternates: { canonical: "/guida" },
  openGraph: {
    title: "Guida completa ad Atelier",
    description: "Dal brief al sito pubblicato: tutti i passaggi, le scorciatoie e la risoluzione dei problemi.",
    url: absoluteUrl("/guida"),
    type: "article",
  },
};

const STEPS = [
  {
    n: "01",
    title: "Apri Atelier e scegli come entrare",
    text: "Puoi usare GitHub o Google, oppure la sessione locale con un nome qualsiasi. La sessione locale non richiede account e tiene i progetti in questo browser. L’accesso serve solo a separare i workspace.",
    link: { href: "/login?next=/nuovo", label: "Apri l’accesso" },
  },
  {
    n: "02",
    title: "Descrivi l’attività in una frase",
    text: "Scrivi cosa fai, dove lavori e per chi. Puoi aggiungere nome, città, email, telefono, tono e settore. Se lasci vuoti i campi, il compilatore li ricava dal testo. La direzione visiva è opzionale: se non la scegli, viene scelta in base al settore.",
    link: { href: "/nuovo", label: "Crea il primo sito" },
  },
  {
    n: "03",
    title: "Lascia lavorare il compilatore",
    text: "Atelier genera subito un sito completo con 6-7 pagine, testi, palette, tipografia, SEO, pagine legali e dati strutturati. Senza chiavi API non parte nessuna chiamata di rete: il risultato è comunque professionale e pubblicabile.",
    link: null,
  },
  {
    n: "04",
    title: "Modifica nell’editor",
    text: "Scegli una pagina, seleziona un blocco e cambia testi, immagini, colori, spaziature e allineamento. Su telefono l’anteprima e il pannello si alternano; su tablet e desktop lavorano affiancati. Il salvataggio è automatico e lo stato compare in alto.",
    link: null,
  },
  {
    n: "05",
    title: "Verifica prima di pubblicare",
    text: "Apri “Verifica” per vedere contrasto, SEO, accessibilità, sicurezza del markup e peso. Gli errori bloccanti vanno corretti; gli avvisi sono indicazioni. Le pagine privacy e cookie sono già scritte e vanno adattate alla tua attività.",
    link: null,
  },
  {
    n: "06",
    title: "Esporta e pubblica",
    text: "Scarica lo ZIP per Vercel, Netlify o Cloudflare Pages, oppure il file HTML singolo. Il file di progetto permette di riaprire tutto in un altro browser. L’anteprima e l’export usano lo stesso markup: quello che vedi è quello che pubblichi.",
    link: null,
  },
];

const FAQ = [
  {
    q: "Serve una chiave API per creare un sito?",
    a: "No. Il compilatore deterministico genera un sito completo senza rete e senza chiavi. La chiave AI è un’accelerazione facoltativa: riscrive i testi dentro lo stesso schema, non è necessaria per pubblicare.",
  },
  {
    q: "Dove finiscono i progetti?",
    a: "Nel browser, in IndexedDB. Non esiste un database di progetti lato server. Esporta il file di progetto per conservarne una copia indipendente o per riaprirlo altrove.",
  },
  {
    q: "GitHub o Google non funzionano: cosa controllo?",
    a: "Verifica che le variabili AUTH_GITHUB_ID/AUTH_GITHUB_SECRET o AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET siano presenti nel server. Nel provider OAuth, il callback deve essere esattamente https://tuo-dominio/api/auth/github/callback (o /google/callback), senza slash finale. In locale usa http://localhost:3000 come origine.",
  },
  {
    q: "Posso usarlo da telefono o tablet?",
    a: "Sì. La vetrina, l’accesso, la dashboard e l’editor sono responsive. Nell’editor mobile il pulsante Anteprima/Modifica alterna i due pannelli; le azioni principali restano a portata di pollice.",
  },
  {
    q: "Le pagine privacy, cookie e termini sono già pronte?",
    a: "Sono scritte e complete, ma sono un punto di partenza: adattale ai trattamenti reali della tua attività e falle verificare da un consulente se necessario. La pagina Cookie spiega anche i cookie tecnici usati da Atelier.",
  },
  {
    q: "Come pubblico il sito?",
    a: "Lo ZIP contiene già index.html, pagine, CSS, JavaScript, sitemap, robots, llms.txt e configurazioni per Vercel e Netlify. Su Vercel trascini la cartella o colleghi il repository; su Netlify pubblichi la cartella. Imposta il dominio nelle impostazioni del progetto prima dell’export.",
  },
];

export default function GuidaPage() {
  return (
    <MarketingShell
      eyebrow="guida completa"
      title="Da una frase a un sito pubblicabile, senza passaggi nascosti"
      lead={
        <p>
          Questa guida copre il percorso completo: accesso, creazione, modifica, verifica, export e pubblicazione. Non serve
          un account e non serve una chiave API per iniziare.
        </p>
      }
      meta={["6 passaggi", "nessuna chiave obbligatoria", "telefono, tablet e desktop"]}
      cta={{
        title: "Pronto a provare?",
        text: "Apri l’editor, scrivi cosa fai e lascia che il compilatore costruisca la prima versione.",
        href: "/login?next=/nuovo",
        label: "Crea il primo sito",
        secondary: { href: "/domande-frequenti", label: "Leggi le domande" },
      }}
    >
      <section className="card p-6">
        <SectionHeading eyebrow="percorso rapido" title="Sei passaggi, un sito" text="Puoi tornare qui in qualsiasi momento dal menu e dall’editor." />
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.n} className="rounded-tool border border-surface-800 bg-surface-900/40 p-4">
              <div className="flex items-start gap-3">
                <span className="mono-label mt-0.5 text-accent-400">{step.n}</span>
                <div className="grid gap-1.5">
                  <h3 className="text-sm font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-[13px] leading-relaxed text-ink-500">{step.text}</p>
                  {step.link ? (
                    <Link className="text-[12px] text-accent-400 underline decoration-accent-500/40 underline-offset-4 hover:text-accent-300" href={step.link.href}>
                      {step.link.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Accesso con GitHub o Google</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            L’accesso è facoltativo. Per collegarlo, crea un’app OAuth e imposta come callback l’indirizzo esatto della tua
            istanza:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-tool border border-surface-800 bg-surface-950 p-3 text-[11px] text-ink-300">
{`GitHub: https://tuo-dominio/api/auth/github/callback
Google: https://tuo-dominio/api/auth/google/callback`}
          </pre>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-600">
            In locale: <code className="text-ink-400">http://localhost:3000/api/auth/github/callback</code>. Le variabili
            <code className="mx-1 text-ink-400">AUTH_GITHUB_ID</code>/<code className="text-ink-400">AUTH_GITHUB_SECRET</code> e
            <code className="mx-1 text-ink-400">AUTH_GOOGLE_ID</code>/<code className="text-ink-400">AUTH_GOOGLE_SECRET</code>
            restano sul server e non arrivano mai al browser.
          </p>
        </article>

        <article className="card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Chiavi AI: quando servono</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Non servono per creare o pubblicare. Se le aggiungi nelle impostazioni del server, il router prova i provider
            configurati e riscrive i testi; se nessuno risponde, il sito del compilatore viene consegnato lo stesso.
          </p>
          <ul className="mt-3 grid gap-1.5 text-[12px] text-ink-500">
            <li>• La chiave non viene salvata nel progetto esportato.</li>
            <li>• Il browser non riceve mai la chiave.</li>
            <li>• Ogni provider ha una quota e un tetto di tempo; la compilazione non resta appesa.</li>
            <li>• Senza chiavi, i testi sono deterministici e coerenti con il settore.</li>
          </ul>
        </article>
      </section>

      <section className="card p-6">
        <SectionHeading eyebrow="problemi comuni" title="Se qualcosa non torna" />
        <dl className="mt-4 grid gap-4">
          {FAQ.map((item) => (
            <div key={item.q} className="grid gap-1 border-t border-surface-800 pt-4 first:border-0 first:pt-0">
              <dt className="text-sm font-semibold">{item.q}</dt>
              <dd className="text-[13px] leading-relaxed text-ink-500">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Documenti e preferenze</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Atelier usa solo cookie tecnici necessari all’accesso e alle preferenze. Non ci sono cookie pubblicitari né
          tracciamenti di terze parti.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="btn btn-outline" href="/privacy">Privacy</Link>
          <Link className="btn btn-outline" href="/cookie">Cookie e preferenze</Link>
          <Link className="btn btn-outline" href="/termini">Termini d’uso</Link>
          <Link className="btn btn-outline" href="/domande-frequenti">Domande frequenti</Link>
        </div>
      </section>

      <p className="px-1 pb-2 text-center text-[11px] text-ink-600">
        {SITE_NAME} è un prodotto {STUDIO_NAME}. Progettato e sviluppato da {AUTHOR_NAME}.
      </p>
    </MarketingShell>
  );
}
