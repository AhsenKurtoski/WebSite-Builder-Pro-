# Atelier

Website builder AI **local-first**: da un prompt a un sito completo (testi, struttura, palette, SEO, pagine legali), editor visuale ed export statico autosufficiente.

Prodotto: Atelier · Studio: Ahsen Studio · Autore: Ahsen Kurtoski.

Tre promesse di progetto:

1. **Funziona sempre.** Il composer deterministico genera un sito senza rete e senza chiavi API. L'AI, quando c'è, riscrive i contenuti: la struttura e la qualità minima non dipendono da lei.
2. **Anteprima = export.** Una sola sorgente di markup (`src/lib/render/node.ts`) alimenta l'anteprima nell'editor, il file HTML singolo e l'archivio statico. Non esistono due implementazioni da tenere allineate.
3. **Zero template.** Nessun layout preconfezionato: ogni sito nasce da un brief, con controlli di unicità strutturale e di voce del settore.

## Sicurezza e affidabilità

- **Export sicuro**: JSON-LD escapato; URL sanificati (`href/action/formaction/src`, blocco `javascript:`/`data:` non sicuri). Senza dominio omessi canonical, `og:url`/`og:image`, URL assoluti JSON-LD e `sitemap.xml` (robots senza `Sitemap`), senza inventare domini.
- **Form reali**: nessun indirizzo email inventato. Senza email/endpoint il modulo resta disabilitato con avviso; modalità Netlify con `name`, `form-name` e honeypot, campi con ID univoci.
- **API AI hardening**: controllo same-origin, rate limit in memoria, limite body e abort su disconnessione per le route di compilazione/test provider.
- **UX robusta**: navbar mobile funzionante su tutte le varianti, skip link visibile al focus, animazioni visibili anche senza JS, riapertura preferenze cookie dal footer, conferma prima dell’eliminazione progetto, stato autosave e validazione `postMessage` dell’anteprima.

## Comandi

```bash
npm install
npm run dev        # http://localhost:3000
npm run verify     # typecheck + test (187 test)
npm run build
npm start
```

Su questa macchina il binario nativo di SWC è bloccato da una policy di sistema, quindi Turbopack non parte: `dev` e `build` usano Webpack. Dove Turbopack funziona ci sono `npm run dev:turbo` e `npm run build:turbo`.

## Mappa del codice

| Percorso | Ruolo |
| --- | --- |
| `src/lib/render/` | albero `El` unico → HTML e React (parità anteprima/export) |
| `src/lib/design/` | OKLCH, contrasto WCAG calcolato, 8 preset, 8 coppie di font |
| `src/lib/schema/` | schema zod del sito + 29 blocchi (`blocks/registry`) |
| `src/lib/compiler/` | composer offline, profili di settore con la loro voce, unicità |
| `src/lib/ai/` | catena multi-provider gratuita, quota ledger, compilazione a stadi |
| `src/lib/export/` | foglio di stile, site.js, pagine, sitemap, config deploy, ZIP |
| `src/lib/quality/` | sanitizzazione del markup e gate di qualità |
| `src/lib/auth/` | sessioni firmate HMAC, OAuth GitHub/Google, cookie e ritorni sicuri |
| `src/components/site/` | vetrina: barra, galleria delle direzioni, anteprima generata dal vivo |
| `src/components/app/` | area di lavoro: elenco progetti, creazione, chiavi, impostazioni |
| `src/components/studio/` | editor: canvas, inspector, aggiunta blocchi, export |

## Percorso dell'utente

```
/                  vetrina: promesse, stili, anteprima generata adesso nel browser
/login             GitHub, Google oppure sessione locale (senza account)
/dashboard         i progetti del workspace, con copertina dal tema reale
/nuovo             il brief → compilazione a stadi → lo Studio
/studio/[siteId]   editor: canvas (l'HTML vero), inspector, AI, export
/impostazioni      account, note di riservatezza, stato dei provider AI (chiavi nel server)
```

### Sito pubblico

```
/                   vetrina con anteprima generata nel browser, piani e domande principali
/funzionalita       il compilatore, i gate, l'editor, l'export, i limiti dichiarati
/piani              cosa è incluso, cosa costa zero, self-hosting
/domande-frequenti  20 risposte con dati strutturati FAQPage
/privacy            mappa dei dati: progetti nel browser, un solo cookie tecnico
/termini            uso, proprietà dei contenuti, verifiche che restano all'utente
/stato              diagnostica reale dell'istanza (noindex): cosa è configurato, senza chiavi
```

Header, footer, sitemap e dati strutturati leggono dall'anagrafica in `src/lib/site/pages.ts`: un link aggiunto una volta compare ovunque. L'URL canonico vive in `src/lib/util/site-url.ts` (prima la variabile di dominio di produzione, poi i fallback Vercel e `NEXT_PUBLIC_SITE_URL`). L'immagine social è generata da `src/app/opengraph-image.tsx`.

L'accesso non è un cancello: le pagine interne chiedono una sessione, ma la sessione può nascere in locale con un nome e una firma HMAC, senza alcun provider configurato. I progetti sono separati per workspace (`provider:id`) dentro IndexedDB; i record creati prima dell'accesso restano visibili alla sessione ospite.

Dalla dashboard un progetto si scarica in tre modi — archivio ZIP, HTML singolo, `progetto.atelier.json` — e si **reimporta** dallo stesso file: viene riletto con lo stesso schema con cui è stato scritto, quindi un file corrotto viene rifiutato con un motivo leggibile invece di entrare nell'editor.

### Accesso con GitHub o Google

Le credenziali si leggono solo dall'ambiente (mai dal client). Il flusso è OAuth 2 authorization code, scritto a mano: nessuna libreria di autenticazione, nessun database utenti.

1. Crea l'app OAuth e imposta come callback `http://localhost:3000/api/auth/github/callback` (o `.../google/callback`).
2. Metti le credenziali in `.env.local`: `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` oppure `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`.
3. Imposta `ATELIER_SESSION_SECRET` (almeno 16 caratteri) per firmare le sessioni fra macchine diverse.

Se una coppia di credenziali manca, la pagina di accesso lo dice indicando il nome esatto della variabile e l'indirizzo dove crearle; il pulsante "Entra in locale" funziona comunque.

### Archivio cloud (opzionale)

I progetti vivono nel browser e ci restano: l'archivio cloud è un'aggiunta, non un requisito. Con tre variabili in più — `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ATELIER_CLOUD_SECRET` — il pannello «Archivio cloud» della dashboard fa seguire i progetti al workspace fra dispositivi.

- **La sincronizzazione parte solo dal pulsante.** Nessun dato attraversa la rete senza una decisione esplicita; senza variabili il pannello resta spento e dice quali mancano.
- **Last-write-wins sull'istante di modifica**, applicato dal database con `where t.updated_at <= excluded.updated_at`: due dispositivi possono spingere in qualunque ordine senza cancellarsi il lavoro a vicenda.
- **Le tombe impediscono le resurrezioni.** Una cancellazione è un istante, non un'assenza: senza di essa una sincronizzazione riporterebbe indietro il progetto eliminato altrove. Quando la tomba non è più vecchia di nessuna copia viva, la cancellazione vince su entrambi gli archivi; una riscrittura successiva alla tomba è invece una resurrezione lecita.
- **A parità di istante non si muove niente.** Dopo una spinta il cloud conserva lo stesso istante del documento locale: se il pari contasse come «vince il locale», ogni giro rispederebbe tutto e il sistema non direbbe mai «tutto già allineato».
- **L'owner non lo sceglie il client.** Un account GitHub/Google usa `github:<id>` o `google:<id>`; una sessione locale riceve dal server un identificativo di dispositivo in un cookie `atelier_device` (HttpOnly, un anno), così due browser non finiscono nello stesso bucket.
- **Le tabelle non hanno un endpoint.** Vivono nello schema `atelier`, che non è fra gli schemi esposti via REST e su cui i ruoli Web non hanno nemmeno l'`usage`: l'unica porta è la RPC `atelier_cloud_entry`, che verifica una busta HMAC-SHA256 su `payload.ts` (finestra di 5 minuti) e inoltra l'operazione. Con la sola chiave publishable non si legge e non si scrive.

Lo schema completo sta in `docs/migrations/001-cloud-archive.sql` (tabelle, indici, funzioni interne) e `docs/migrations/002-cloud-entry.sql` (la porta firmata); i passi operativi sono in `docs/DEPLOY.md`. I progetti `local:ospite` vengono adottati dal workspace corrente durante la sincronizzazione; senza sessione autenticata la compilazione resta local-first ma le route AI sono protette da guardie (origine/rate/body/abort).

### Deploy e verifica

```bash
npm run env:vercel                # le variabili da incollare su Vercel, già provate contro il database
npm run check:deploy -- https://<tuo-dominio>   # verifica il rilascio, dal di fuori
```

Il secondo comando è un controllo di rilascio, non un test unitario: chiede alla pagina pubblica di rispondere, alle pagine interne di proteggersi, al cookie di essere `HttpOnly` e `Secure`, all'istanza di leggere davvero l'archivio (prova del segreto di firma) e al dominio di essere quello giusto in sitemap, `robots.txt` e indirizzo canonico. Esce con codice 1 se qualcosa non torna e dice cosa sistemare. Gli stessi controlli — meno quelli che richiedono una configurazione esterna — girano in CI a ogni push, contro l'artefatto di produzione appena costruito.

## Dispositivi

- **Telefono (≤ 640 px):** barra dell'area di lavoro a icone, una colonna, nello Studio l'anteprima e il pannello di modifica si alternano (selettore pagina + Anteprima/Modifica), rail e inspector a piena larghezza.
- **Tablet (640-1024 px):** due colonne nell'area di lavoro, controlli essenziali nello Studio, anteprima larga quanto lo schermo.
- **Desktop (≥ 1024 px):** editor a tre pannelli (pagine/blocchi, canvas, inspector) con dispositivo e zoom.

Le misure sono state verificate a 390, 768 e 1440 px: nessuno scorrimento orizzontale in nessuna pagina.

## Test

`tests/parity.test.ts` confronta l'anteprima React e l'HTML esportato nodo per nodo (linkedom), `tests/composer.test.ts` blocca regressioni di determinismo, unicità, contrasto e voce del settore, `tests/export.test.ts` verifica l'autosufficienza dell'export (compreso che script e CSS inline restino codice e non testo escapato), `tests/gates.test.ts` i gate di qualità e la sicurezza del markup, `tests/pipeline.test.ts` la scadenza degli stadi AI e la lettura tollerante del blueprint, `tests/cloud-plan.test.ts` il piano di sincronizzazione (convergenza, tombe, resurrezioni, lotti), `tests/cloud-sign.test.ts` la busta firmata e ogni tentativo di manomissione, `tests/port.test.ts` i brief di stile, il contratto d'errore delle API e le sessioni firmate.

## Robustezza

- **Un provider lento non blocca il sito.** Ogni stadio AI ha una scadenza (25 s blueprint, 20 s per pagina, 90 s in totale) e la richiesta viene annullata davvero; alla scadenza si consegna il sito del composer, con un avviso che spiega cosa è successo.
- **Una risposta approssimativa non rompe niente.** Il blueprint è letto con tolleranza ("Tech", "  tech " e "Brutalist (manifesto)" sono riconosciuti), i campi mancanti lasciano intatte le scelte del composer.
- **Il contratto d'errore è unico.** Tutte le route rispondono `{ error, code, hint? }` con codici stabili (`NOT_CONFIGURED`, `VALIDATION`, `UPSTREAM_ERROR`, …) e gli errori non previsti finiscono in una riga JSON, mai in faccia all'utente.

## Note operative

- `.atelier-preview/` contiene un export di esempio generato a scopo di verifica visiva: è materiale derivato, si può cancellare.
- `website-builder-pro-main.zip` è lo snapshot di riferimento usato per estrarre idee (brief di stile, contratto d'errore): non è una dipendenza del progetto.
- `docs/PIANO.md` — specifica operativa; `docs/INTEGRAZIONI.md` — decisioni su Vercel, Supabase, Canva e limiti dei provider gratuiti; `docs/migrations/` — lo schema dell'archivio cloud e il suo contratto di firma.
