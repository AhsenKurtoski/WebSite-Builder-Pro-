# Atelier — Integrazioni reali e decisioni di infrastruttura

Stato: **verificato sul campo** il 26 settembre 2026, interrogando direttamente i connettori MCP e la API npm.

---

## 1. La distinzione fondamentale

Atelier è pensato per funzionare **da solo**: chiavi del server (variabili d'ambiente), export statico, zero dipendenze esterne obbligatorie. I connettori MCP invece sono **superpoteri miei** (dell'agente), non del runtime dell'app. Vale per ogni riga di questa tabella:

| Connettore | Cosa può fare l'**agente** (io) | Cosa deve fare **l'app da sola** |
|---|---|---|
| Vercel | creare il progetto, deployare, leggere log, gestire domini, deployare un sito generato | export ZIP + deploy via token dell'utente (o nessun deploy) |
| Supabase | applicare migrazioni, eseguire SQL, generare tipi TS, creare bucket | archivio cloud opzionale: la chiave publishable indirizza le RPC, ma i contenuti passano solo con il segreto di firma dell'istanza |
| Canva | generare logo/design on-brand, esportare PNG/JPG, leggere i brand kit | catena immagini con chiavi proprie (Gemini Image, FLUX) |
| Playwright | navigare, screenshot, emulare dark/print/reduced-motion, verificare l'export | test E2E nel repo (Playwright installato come dipendenza) |

Conseguenza pratica: **nessuna funzionalità del prodotto può dipendere da un connettore**. Se domani un connettore non è autenticato, Atelier continua a generare, modificare ed esportare.

---

## 2. Decisioni sugli account (approvate)

| Ambito | Decisione | Dettagli |
|---|---|---|
| **Supabase** | schema isolato `atelier` dentro il progetto **`Dev Duos`** (`enodoptlvntdtfjchpmx`, region **eu-west-1**) | Nessun nuovo progetto, nessun costo, nessun rischio sui dati esistenti |
| **Vercel** | **nuovo progetto dedicato `atelier-builder`**, team `team_iUJUaOjZnfAZQQAzeap5CntM` | Non si tocca `websitebuilder` né gli altri 10 progetti. Sorgente: repository privato `AxsenXzc/WebSite-Builder-Pro-` |
| **Vercel (token)** | da **ri-autorizzare** per deploy | Lo scope `axsenxzcs-projects` oggi non è autorizzato su alcune operazioni (vedi §5) |
| **Canva** | usato come **generatore di logo e asset di marca**, non come libreria di template | `generate-design` + `export-design` + brand kit |

### Perché `Dev Duos` è sicuro ma va maneggiato con cura

Il progetto contiene **un'applicazione reale già in produzione** nello schema `public`:

```
public.profiles · public.quotes · public.inquiries
public.admin_notifications · public.analytics_events · public.analytics_visits
public.whatsapp_auth_otps · public.whatsapp_auth_profiles · public.whatsapp_auth_sessions
estensioni: pg_net (net.http_request_queue), pg_stat_statements
```

Quindi: **tutto ciò che è di Atelier vive in `atelier.*`**, con RLS propria, e nessuna migrazione toccherà `public`, `auth`, `storage` (schema) o i bucket esistenti. Due avvertenze da tenere presenti:

1. **`auth.users` è condiviso** a livello di progetto: se Atelier userà Supabase Auth, gli utenti di Atelier e quelli dell'altra app finiscono nello stesso elenco identità. Accettabile per uso singolo/agenzia, da separare (progetto dedicato) se Atelier diventa un prodotto multi-tenant pubblico.
2. Le **RLS** di Atelier non devono basarsi su dati in `public.*` dell'altra app.

Mitigazione già prevista dal piano: il repository di persistenza è un adapter, quindi la modalità locale resta il default e il cloud si attiva dopo, su un branch di test quando serve (`create_branch`).

**Stato:** l'archivio cloud è implementato e verificato end-to-end (generazione → salvataggio nel browser → spinta → riga in `atelier.projects` → secondo giro «tutto già allineato» → cancellazione propagata con tomba). Si accende con tre variabili d'ambiente e resta spento senza, senza errori. Lo schema è documentato in `docs/migrations/`.

---

## 3. Catena di generazione immagini/asset (aggiornata con Canva)

Canva alza la qualità dell'output in modo sostanziale, perché sa produrre un **logo professionale** e riesportarlo con sfondo trasparente alle dimensioni richieste.

| Priorità | Provider | Uso | Limite gratuito |
|---|---|---|---|
| 1 | **Canva** (via agente) | logo, varianti social/OG, materiali on-brand dal brand kit | piano dell'utente |
| 2 | **Gemini 2.5 Flash Image** | hero/foto prodotto on-brand, editing guidato | ~10 RPM, ~100+ img/giorno |
| 3 | **Cloudflare FLUX.1-schnell** | volume, sfondi, varianti rapide | 10.000 neurons/giorno |
| 4 | **SVG generato dall'LLM** | icone, illustrazioni, pattern | zero quota (testo) |
| 5 | **Fondini procedurali locali** | gradiente/mesh/noise/pattern | zero quota, sempre disponibile |

Percorso Canva documentato (chiamate reali dispobili sul connettore):

- `generate-design` con `design_type: "logo"` e `brand_kit_id` → candidati logo
- `create-design-from-candidate` → design editabile
- `export-design` con `format: { type: "png", transparent_background: true, width, height }` → file finale
- `list-brand-kits` / `search-brand-templates` → fonte autorevole di palette, font e logo per il **BrandKit** di Atelier
- `upload-asset-from-url` / `create-upload-url` → importare asset già generati

Nota di conformità: usare Canva significa far uscire l'asset dall'UE. Va segnalato all'utente nel flusso di generazione, con l'alternativa "solo provider europei" (fondini procedurali + FLUX via account Cloudflare UE) per i progetti sensibili.

---

## 4. LimitI gratuiti verificati (fondamento del router a cascata)

| Provider | Limite reale | Ruolo in Atelier |
|---|---|---|
| Gemini 2.5 Flash / Flash-Lite | ~1.500 req/giorno, vision, structured output | blueprint, vision, SEO, audit |
| Gemini 2.5 Pro | ridotto sul free tier | usato solo se disponibile |
| Cerebras | 1.000.000 token/giorno, 30 RPM, **cap contesto 8k** | copy di massa, traduzioni |
| Groq | ~30 RPM, 1k–14.4k req/giorno, Whisper | iterazioni rapide, sezioni, voce |
| OpenRouter `/free` | ~50 req/giorno (1.000 con $10 di credito) | fallback universale |
| Cloudflare Workers AI | 10.000 neurons/giorno, `/ai/run` + `/v1/chat/completions` OpenAI-compatibile | immagini e testo di riserva |
| Supabase | progetto esistente, region EU | cloud opzionale |
| **Composer deterministico locale** | illimitato, offline | garanzia "funziona sempre" |

Pollinations **non** è più keyless/illimitato: escluso dalle dipendenze, resta come provider opzionale.

---

## 5. Stato dei permessi Vercel (da sistemare prima del deploy)

Test effettuati sul connettore Vercel:

| Operazione | Esito | Nota |
|---|---|---|
| `list_projects` | ✅ | 11 progetti visibili |
| `list_deployments` **senza** `teamId` | ✅ | 4 deploy di `websitebuilder` |
| `list_deployments` **con** `teamId` esplicito | ❌ 403 | *Non passare `teamId`: rompe l'autorizzazione* |
| `list_deployment_files` | ❌ 404 | deployment da Git, l'API non espone l'albero |
| `get_access_to_vercel_url` | ❌ | "chiedi all'utente di aggiornare la connessione Vercel" |

**Azione richiesta per abilitare il deploy:** ri-autorizzare la connessione Vercel includendo il team `axsenxzcs-projects` / il progetto di destinazione. Finché non è fatto, il flusso di pubblicazione resta: export ZIP locale → deploy manuale (o deploy via CLI con token dell'utente).

---

## 6. Ispezione del tentativo precedente (`websitebuilder`)

Ho ispezionato tutto ciò che era raggiungibile, senza modificare nulla.

**Cosa era.** Un prodotto SaaS chiamato internamente `website-builder-pro` (repo GitHub `AxsenXzc/website-builder-pro`, oggi 404/privato), 4 deployment tra il 5 e il 7 giugno 2026, l'ultimo `READY` in produzione, protetto da deployment protection (401 per il pubblico).

**Stack ricostruito dai messaggi di commit:**

| Indizio | Tecnologia |
|---|---|
| `scripts/check-env.js`, "validates required env vars", "fails the build with clear error report" | validazione env in prebuild |
| `DATABASE_URL`, "not SQLite in prod", `prisma.user.count` | **Prisma + Postgres** |
| `AUTH_SECRET` (controllo lunghezza), login/register, "production responses remain opaque" | auth custom, errori opachi in prod |
| `/api/health` con check di `Stripe`, `Gemini`, `Resend` | **Stripe** (pagamenti), **Gemini** (AI), **Resend** (email) |
| "complete Netlify guide" | deploy su Vercel **e** Netlify |

**Cosa riusare — le idee, non il codice:** l'architettura è server-first e centralizzata (Prisma, auth custom, billing), incompatibile con Atelier local-first ed export statico. Adotto però tre pratiche che quel tentativo aveva già capito bene:

1. **Validazione delle env in prebuild**, che fa fallire la build con un report chiaro invece di rompersi a runtime.
2. **Endpoint `/api/health`** che diagnostica provider e quota in un colpo solo (in Atelier diventa la pagina "Salute provider e quote").
3. **Errori opachi in produzione, dettagliati in sviluppo**: la stessa regola vale per le chiavi API del server — mai un messaggio che riveli una chiave o un payload sensibile.
4. **Doppio target di deploy** (Vercel + Netlify): l'export deve includere entrambe le configurazioni.

**Cosa non è recuperabile** senza un tuo intervento: il codice sorgente (repo privato) e i deployment (permessi del connettore). Se vuoi che riprenda qualcosa da lì, servono o l'accesso al repo o la ri-autorizzazione di Vercel.

---

## 7. Playwright come parte dei gate di qualità

Non solo verifica mia: lo stesso ciclo diventa parte della pipeline di Atelier.

1. **Parità preview ↔ export**: aprire l'export statico in un browser reale e confrontarlo con l'anteprima React (già previsto dal piano) — Playwright lo rende letterale invece che teorico.
2. **Matrice visiva**: screenshot per blocco × 4 viewport × dark/light → regressione visiva.
3. **Emulazione contesti difficili**: `reduced-motion`, `print`, `forced-colors` (utenti ipovedenti) grazie a `browser_emulate_media`.
4. **Verifica del funnel pubblicato**: navigare il sito deployato, compilare il form, controllare che il lead arrivi.
5. **Audit prima della consegna**: il sito esportato viene visitato davvero, non solo analizzato staticamente.

---

## 8. Rischi residui e contromisure

| Rischio | Contromisura |
|---|---|
| Connettori non autorizzati bloccano il deploy | export locale sempre funzionante; deploy come passo assistito, mai bloccante |
| `auth.users` condiviso con l'altra app in `Dev Duos` | schema `atelier` + RLS proprie; progetto dedicato se diventa multi-tenant |
| Uscita di asset dall'UE tramite Canva | avviso nel flusso + modalità "solo provider UE" |
| `teamId` esplicito rompe le chiamate Vercel | non passare `teamId`; documentato qui |
| Deriva dei limiti gratuiti nel tempo | il router a cascata è data-driven: aggiungere un provider è una riga di configurazione, non un refactor |

---

## 9. Accesso (GitHub / Google) — cosa serve per attivarlo

L'accesso è già implementato e funzionante in locale (`/login`, sessioni firmate HMAC, nessuna libreria di autenticazione, nessun database utenti). Per attivare i due provider serve solo creare le credenziali e metterle in `.env.local`:

| Provider | Dove | Callback da registrare | Variabili |
|---|---|---|---|
| GitHub | github.com/settings/developers → New OAuth App | `http://localhost:3000/api/auth/github/callback` (e l'equivalente in produzione) | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` |
| Google | console.cloud.google.com/apis/credentials → OAuth client ID (Web) | `http://localhost:3000/api/auth/google/callback` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |

In più: `ATELIER_SESSION_SECRET` (almeno 16 caratteri) per firmare le sessioni fra macchine. Senza variabili configurate la pagina di accesso indica il nome esatto della variabile mancante e il pulsante "Entra in locale" resta disponibile — l'app non richiede un account per funzionare.

Quando si passerà al deploy su Vercel (`atelier-builder`), le stesse variabili vanno aggiunte al progetto e la callback registrata deve puntare al dominio di produzione.

---

*Prosegue in `docs/PIANO.md` (architettura del compilatore) — questo file copre solo integrazioni, account e stato reale dell'infrastruttura.*
