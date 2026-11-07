import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/site/marketing-shell";
import { CookiePreferencesButton } from "@/components/site/cookie-preferences-button";
import { AUTHOR_NAME, SITE_NAME, STUDIO_NAME, absoluteUrl } from "@/lib/util/site-url";

export const metadata: Metadata = {
  title: "Cookie e preferenze",
  description:
    "Quali cookie usa Atelier, perché sono tecnici, quanto durano e come gestire le preferenze. Nessun tracciamento pubblicitario.",
  alternates: { canonical: "/cookie" },
  openGraph: {
    title: "Cookie e preferenze di Atelier",
    description: "Solo cookie tecnici: sessione, protezione OAuth e identificativo del workspace.",
    url: absoluteUrl("/cookie"),
    type: "article",
  },
};

const COOKIES = [
  {
    name: "atelier_session",
    purpose: "Mantiene la sessione firmata e riconosce il workspace.",
    duration: "30 giorni",
    flags: "HttpOnly, SameSite=Lax, Secure in HTTPS",
  },
  {
    name: "atelier_oauth_state",
    purpose: "Protegge il ritorno da GitHub o Google da richieste contraffatte.",
    duration: "10 minuti",
    flags: "HttpOnly, SameSite=Lax, Secure in HTTPS",
  },
  {
    name: "atelier_device",
    purpose: "Identificativo casuale usato dall'archivio cloud per non mescolare workspace locali diversi.",
    duration: "1 anno",
    flags: "SameSite=Lax, Secure in HTTPS",
  },
];

const STORAGE = [
  {
    name: "atelier_cookie_notice_v1",
    purpose: "Ricorda che hai già visto l’avviso cookie.",
    where: "localStorage",
  },
  {
    name: "IndexedDB (atelier)",
    purpose: "Conserva progetti, versioni e tombe di sincronizzazione sul tuo dispositivo.",
    where: "IndexedDB",
  },
];

export default function CookiePage() {
  return (
    <MarketingShell
      eyebrow="cookie e preferenze"
      title="Solo cookie tecnici, spiegati uno per uno"
      lead={
        <p>
          {SITE_NAME} non usa cookie pubblicitari, non profila e non carica statistiche di terze parti. I cookie presenti
          servono a farti restare dentro il tuo workspace e a proteggere l’accesso.
        </p>
      }
      meta={["nessun tracciamento", "nessuna pubblicità", "preferenze modificabili"]}
      cta={{
        title: "Vuoi vedere i cookie mentre navighi?",
        text: "Apri gli strumenti del browser, scheda Application o Storage: trovi solo le voci elencate qui.",
        href: "/guida",
        label: "Apri la guida",
        secondary: { href: "/privacy", label: "Leggi la privacy" },
      }}
    >
      <article className="card p-6">
        <div className="doc">
          <p>
            <strong>In breve.</strong> Non c’è nulla da autorizzare oltre ai cookie tecnici necessari. L’avviso che vedi
            nel sito serve a spiegarlo, non a raccogliere un consenso che non serve. Puoi riaprirlo quando vuoi.
          </p>

          <h2>Cookie tecnici</h2>
          <div className="mt-4 overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Perché</th>
                  <th>Durata</th>
                  <th>Attributi</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((cookie) => (
                  <tr key={cookie.name}>
                    <td>
                      <code>{cookie.name}</code>
                    </td>
                    <td>{cookie.purpose}</td>
                    <td>{cookie.duration}</td>
                    <td>{cookie.flags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Dati nel browser</h2>
          <p>
            I progetti non sono cookie e non vengono inviati a un server. Restano in IndexedDB finché non li esporti o
            cancelli. La preferenza dell’avviso cookie è un semplice valore in <code>localStorage</code>.
          </p>
          <ul>
            {STORAGE.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>: {item.purpose} ({item.where}).
              </li>
            ))}
          </ul>

          <h2 id="preferenze">Preferenze</h2>
          <p>
            Poiché i cookie sono solo tecnici, “Solo necessari” e “Va bene” hanno lo stesso effetto. Puoi comunque
            riaprire l’avviso e cambiare la scelta salvata sul dispositivo.
          </p>
          <div className="not-prose mt-3 flex flex-wrap gap-2">
            <CookiePreferencesButton />
            <Link className="btn" href="/privacy">
              Privacy
            </Link>
            <Link className="btn btn-outline" href="/guida">
              Guida completa
            </Link>
          </div>

          <h2>Revoca e cancellazione</h2>
          <p>
            Puoi cancellare i cookie e i dati del sito dalle impostazioni del browser. L’uscita dall’account elimina il
            cookie di sessione; i progetti restano nel browser finché non li elimini dalla dashboard o non cancelli i dati
            del sito.
          </p>

          <h2>Titolare e contatti</h2>
          <p>
            {SITE_NAME} è un prodotto di {STUDIO_NAME}. Autore e responsabile del progetto: {AUTHOR_NAME}. Per richieste
            relative a privacy e cookie usa i contatti indicati nella pagina <Link href="/privacy">Privacy</Link>.
          </p>

          <p className="text-[11px] text-ink-600">Ultimo aggiornamento: 7 novembre 2026.</p>
        </div>
      </article>
    </MarketingShell>
  );
}
