import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/site/marketing-shell";
import { SITE_NAME, STUDIO_NAME, absoluteUrl } from "@/lib/util/site-url";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Cosa raccoglie Atelier e cosa non raccoglie mai: progetti nel browser, chiavi AI solo sul server, solo cookie tecnici di sessione, nessun tracciamento.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy di Atelier",
    description: "Progetti nel browser, chiavi solo sul server, solo cookie tecnici: la mappa dei dati in una pagina.",
    url: absoluteUrl("/privacy"),
    type: "article",
  },
};

const DATA_MAP = [
  {
    what: "Progetti (brief, pagine, sezioni, testi)",
    where: "Nel tuo browser",
    why: "Sono il contenuto del tuo lavoro. Non vengono inviati a un database di Atelier: restano nell'archivio locale del dispositivo.",
  },
  {
    what: "Chiavi dei provider AI",
    where: "Nel tuo browser, in memoria per la singola richiesta",
    why: "Servono a inoltrare la richiesta al provider che scegli. Il server dell'istanza le usa per quella chiamata e non le salva su disco.",
  },
  {
    what: "Sessione di accesso",
    where: "Un cookie firmato, 30 giorni",
    why: "Tiene l'accesso fra una visita e l'altra. È tecnico, HttpOnly, SameSite=Lax e Secure quando il sito è in HTTPS.",
  },
  {
    what: "Stato temporaneo dell'accesso OAuth",
    where: "Un cookie, 10 minuti",
    why: "Evita le richieste contraffatte durante il ritorno da GitHub o Google. Si cancella alla fine del flusso.",
  },
  {
    what: "Dati dell'account, se usi GitHub o Google",
    where: "Nel cookie di sessione",
    why: "Identificativo dell'account, nome visualizzato e indirizzo email. Servono a riconoscere il tuo workspace, non vengono conservati altrove.",
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell
      eyebrow="privacy"
      title="La mappa dei dati, in una pagina"
      lead={
        <p>
          {SITE_NAME} è costruito local-first: la maggior parte dei dati che ti riguardano non arriva mai a un server. Qui c&apos;è
          l&apos;elenco esatto di quello che esiste, dove vive e per quanto.
        </p>
      }
      meta={["nessun tracciamento", "solo cookie tecnici", "progetti nel browser"]}
      cta={{
        title: "Vuoi provare senza lasciare nulla indietro?",
        text: "Entra in locale: nessun servizio esterno coinvolto, i progetti restano nel browser e li cancelli quando vuoi.",
        href: "/login?next=/nuovo",
        label: "Entra in locale",
        secondary: { href: "/funzionalita", label: "Vedi cosa fa" },
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <article className="card min-w-0 p-6">
          <div className="doc">
            <p>
              <strong>In breve.</strong> Atelier non ha un archivio di progetti lato server, non vende dati e non profila chi lo usa.
              Non esistono statistiche di terze parti, pixel pubblicitari o script esterni nella vetrina.
            </p>

            <h2>Cosa esiste, dove e perché</h2>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-[13px]">
              <caption className="sr-only">Mappa dei dati trattati da Atelier</caption>
              <thead>
                <tr>
                  <th scope="col" className="mono-label border-b border-surface-700 px-3 py-2 text-left">
                    Dato
                  </th>
                  <th scope="col" className="mono-label border-b border-surface-700 px-3 py-2 text-left">
                    Dove vive
                  </th>
                  <th scope="col" className="mono-label border-b border-surface-700 px-3 py-2 text-left">
                    Perché
                  </th>
                </tr>
              </thead>
              <tbody>
                {DATA_MAP.map((row) => (
                  <tr key={row.what} className="border-b border-surface-800 last:border-0">
                    <th scope="row" className="px-3 py-3 text-left align-top font-medium text-ink-300">
                      {row.what}
                    </th>
                    <td className="px-3 py-3 align-top text-ink-500">{row.where}</td>
                    <td className="px-3 py-3 align-top text-ink-500">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="doc mt-6">
            <h2>Provider AI: chi vede cosa</h2>
            <p>
              Quando generi con una chiave, il brief e il contenuto da riscrivere vengono inviati al provider che hai scelto (Google,
              Groq, Cerebras, OpenRouter o Cloudflare) insieme alla tua chiave. Sui dati inviati valgono le condizioni di quel
              provider: è il tuo rapporto con lui, non un passaggio attraverso un nostro servizio. Senza chiave, nessuna richiesta a
              terzi viene fatta: il compilatore lavora nel browser.
            </p>

            <h2>Cookie</h2>
            <ul>
              <li>
                <code>atelier_session</code>: sessione di accesso, firmata con HMAC-SHA256, durata 30 giorni.
              </li>
              <li>
                <code>atelier_oauth_state</code>: solo durante l&apos;accesso con GitHub o Google, durata 10 minuti.
              </li>
              <li>
                <code>atelier_device</code>: identificativo casuale del browser usato dall&apos;archivio cloud per tenere separati i workspace locali, durata 1 anno. È leggibile da JavaScript e non contiene dati personali.
              </li>
            </ul>
            <p>
              Non ci sono cookie di profilazione, pixel o statistiche di terze parti. L&apos;avviso che vedi nel sito è informativo: “Solo necessari” e “Va bene” hanno lo stesso effetto, perché non esiste un consenso opzionale da raccogliere. Puoi riaprirlo dalla pagina <Link href="/cookie">Cookie e preferenze</Link>.
            </p>

            <h2>Conservazione e cancellazione</h2>
            <p>
              I progetti si cancellano dove vivono: nell&apos;archivio del tuo browser. L&apos;uscita dall&apos;account cancella il
              cookie di sessione. Non abbiamo copie da eliminare su richiesta, perché non conserviamo i tuoi lavori su un server.
            </p>

            <h2>Sicurezza</h2>
            <ul>
              <li>Sessioni firmate crittograficamente e cookie non leggibili da JavaScript.</li>
              <li>Markup dei siti generati trattato come testo: nessuno script iniettato dai contenuti.</li>
              <li>Contenuti del brief e del sito mai scritti in un database dell&apos;istanza.</li>
              <li>Errori registrati come codice e contesto tecnico, senza contenuti del tuo progetto.</li>
            </ul>

            <h2>Minori e finalità</h2>
            <p>
              Atelier è uno strumento di lavoro: non è destinato a minori di 14 anni e non prevede pubblicità comportamentale. I dati
              trattati servono solo a far funzionare l&apos;accesso e la generazione che richiedi.
            </p>

            <h2>Modifiche</h2>
            <p>
              Se questa informativa cambia, la data qui sotto cambia con lei. I progetti generati dai siti esportati hanno una loro
              pagina privacy: è materiale tuo, da adattare alla tua attività prima della pubblicazione.
            </p>
            <p className="text-[11px] text-ink-600">Titolare e autore del progetto: Ahsen Kurtoski ({STUDIO_NAME}). Ultimo aggiornamento: 7 novembre 2026.</p>
          </div>
        </article>

        <aside className="grid min-w-0 content-start gap-3">
          <div className="card grid content-start gap-2 p-5">
            <span className="mono-label">verificabile, non solo dichiarato</span>
            <h2 className="text-sm font-semibold">Come controllare</h2>
            <ul className="grid gap-1.5 text-[13px] text-ink-500">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent-400">◆</span>
                Apri gli strumenti del browser: nella rete non troverai chiamate a domini pubblicitari.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent-400">◆</span>
                Guarda i cookie salvati: sono solo quelli elencati qui.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent-400">◆</span>
                La pagina di stato dice cosa è configurato, senza mostrare nessuna chiave.
              </li>
            </ul>
            <Link className="btn w-fit" href="/stato">
              Stato del servizio
            </Link>
          </div>

          <div className="card grid content-start gap-2 p-5">
            <span className="mono-label">se ospiti tu</span>
            <h2 className="text-sm font-semibold">Sei il titolare del trattamento</h2>
            <p className="text-[13px] leading-relaxed text-ink-500">
              Quando installi Atelier su un tuo dominio, i dati di questa pagina li tratti tu: aggiungi il tuo titolare, i tuoi
              contatti e la tua base giuridica. La struttura di questa informativa è già la mappa da cui partire.
            </p>
          </div>
        </aside>
      </div>
    </MarketingShell>
  );
}
