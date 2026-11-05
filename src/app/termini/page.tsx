import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/site/marketing-shell";
import { SITE_NAME, absoluteUrl } from "@/lib/util/site-url";

export const metadata: Metadata = {
  title: "Termini d'uso",
  description:
    "Cosa puoi fare con Atelier, di chi sono i contenuti generati, quali verifiche restano tue prima di pubblicare e quali responsabilità hai sui siti esportati.",
  alternates: { canonical: "/termini" },
  openGraph: {
    title: "Termini d'uso di Atelier",
    description: "Proprietà dei contenuti, verifiche prima della pubblicazione e limiti dello strumento.",
    url: absoluteUrl("/termini"),
    type: "article",
  },
};

export default function TerminiPage() {
  return (
    <MarketingShell
      eyebrow="termini d'uso"
      title="Regole semplici per uno strumento che lavora per te"
      lead={
        <p>
          {SITE_NAME} genera file: usarli è una tua decisione. Qui c&apos;è cosa ti viene garantito, cosa ti viene chiesto e cosa
          resta sotto la tua responsabilità quando il sito esce dall&apos;editor.
        </p>
      }
      meta={["contenuti tuoi", "verifiche dichiarate", "nessuna garanzia di risultato commerciale"]}
      cta={{
        title: "Pronto a generare il primo sito?",
        text: "Il compilatore offline non richiede account né chiavi: puoi capire se Atelier fa per te in un minuto.",
        href: "/login?next=/nuovo",
        label: "Inizia gratis",
        secondary: { href: "/domande-frequenti", label: "Leggi le domande" },
      }}
    >
      <article className="card p-6">
        <div className="doc">
          <p>
            <strong>In breve.</strong> Usi Atelier come strumento. Il sito che generi è tuo, comprese le modifiche che fai dopo
            l&apos;export. Noi non pubblichiamo niente al posto tuo e non possiamo garantirne i risultati commerciali.
          </p>

          <h2>1. Cos&apos;è Atelier</h2>
          <p>
            Atelier è un&apos;applicazione che compila un documento di sito a partire da una descrizione e lo esporta come sito
            statico. Può funzionare interamente nel browser, oppure usare un provider di intelligenza artificiale scelto da te con le
            tue credenziali. Il servizio può essere un&apos;istanza pubblica o un&apos;installazione tua: in entrambi i casi lo
            strumento è lo stesso.
          </p>

          <h2>2. Uso consentito</h2>
          <ul>
            <li>Puoi generare siti per te, per i tuoi clienti e per attività commerciali, senza limiti di numero.</li>
            <li>Puoi modificare il codice esportato a mano, senza obbligo di attribuzione.</li>
            <li>Puoi installare Atelier su un tuo server e adattarlo alle tue esigenze.</li>
            <li>
              Non puoi usare l&apos;istanza per generare contenuti illeciti, ingannevoli, diffamatori, discriminatori o che
              violino diritti di terzi, né per tentare di compromettere il servizio o le quote altrui.
            </li>
            <li>Non puoi rivendere l&apos;accesso a un&apos;istanza che non è tua come se fosse un servizio tuo.</li>
          </ul>

          <h2>3. Proprietà dei contenuti</h2>
          <p>
            I contenuti che scrivi nel brief e le pagine che ne derivano restano tuoi. Le immagini del sito sono generate dal tema:
            puoi usarle, modificarle e distribuirle senza vincoli. Il nome e il marchio dello strumento non diventano tuoi per il
            fatto che hai usato Atelier.
          </p>

          <h2>4. Verifiche che restano tue</h2>
          <p>Atelier scrive, ma non può conoscere la tua situazione. Prima di pubblicare:</p>
          <ul>
            <li>
              <strong>Leggi e adatta le pagine legali</strong> generate (privacy, cookie): sono un punto di partenza scritto bene,
              non una consulenza legale, e vanno allineate ai trattamenti che fai davvero.
            </li>
            <li>
              <strong>Controlla i dati tecnici</strong>: dominio, contatti, orari, partita IVA, link ai profili social e alle
              mappe.
            </li>
            <li>
              <strong>Verifica i contenuti di settore</strong>: se l&apos;attività è regolamentata (sanità, finanza, formazione),
              i testi generati vanno riletti da chi ha la competenza per approvarli.
            </li>
            <li>
              <strong>Controlla le immagini procedurali</strong>: sono astratte e non fotografiche; se ti serve una fotografia reale,
              sostituiscila dopo l&apos;export.
            </li>
          </ul>

          <h2>5. Provider AI e servizi di terze parti</h2>
          <p>
            Se inserisci una chiave di un provider, il tuo uso di quel servizio è regolato dalle sue condizioni e dai suoi prezzi.
            Atelier non è parte di quel rapporto, non rivende capacità di calcolo e non garantisce disponibilità, qualità o
            permanenza dei modelli di terzi. Se il provider non risponde entro il tempo previsto, lo strumento consegna il sito del
            compilatore deterministico e segnala cosa non è arrivato.
          </p>

          <h2>6. Nessuna garanzia</h2>
          <p>
            Atelier viene fornito così com&apos;è. Il servizio può cambiare, essere sospeso o aggiornato senza preavviso. Non
            garantiamo che i contenuti generati siano privi di errori, che raggiungano un risultato commerciale o che soddisfino
            requisiti specifici di un settore. I gate di qualità documentano ciò che viene verificato: contrasto, SEO,
            accessibilità, sicurezza del markup, peso — nient&apos;altro.
          </p>

          <h2>7. Limitazione di responsabilità</h2>
          <p>
            Nei limiti consentiti dalla legge, non rispondiamo di danni indiretti derivanti dall&apos;uso dello strumento o dei siti
            esportati, inclusi mancati guadagni, perdita di dati nel browser o interruzioni di servizi di terze parti. Conserva i
            tuoi lavori: il file di progetto esportato è la copia che non dipende da nessun browser.
          </p>

          <h2>8. Dati e privacy</h2>
          <p>
            Il trattamento dei dati è descritto nella pagina <Link href="/privacy">Privacy</Link>. In sintesi: i progetti vivono nel
            tuo browser, le chiavi AI sono variabili d&apos;ambiente del server e non arrivano mai al browser e l&apos;unico cookie è quello tecnico di sessione.
          </p>

          <h2>9. Modifiche a questi termini</h2>
          <p>
            Se cambiano, cambia la data qui sotto. Continuare a usare Atelier dopo un aggiornamento significa accettare la versione
            aggiornata. Se un&apos;istanza è tua, puoi adattare questi termini alla tua attività: sono scritti per essere riutilizzati.
          </p>

          <p className="text-[11px] text-ink-600">Ultimo aggiornamento: 27 settembre 2026.</p>
        </div>
      </article>
    </MarketingShell>
  );
}
