#!/usr/bin/env node
/**
 * Variabili da incollare su Vercel, verificate prima del deploy.
 *
 *   npm run env:vercel              stampa i valori, pronti da copiare
 *   npm run env:vercel -- --maschera   nasconde i valori (per schermate condivise)
 *
 * Il controllo che conta è l'ultimo: il segreto di firma viene provato contro
 * il database vero. Se non combacia con il valore in `atelier.secrets`, il
 * deploy sembrerebbe riuscito e la sincronizzazione fallirebbe al primo clic —
 * meglio scoprirlo qui, dove il messaggio dice cosa fare.
 */

import { callEntry, mask, mergedEnv } from "./lib/atelier.mjs";

const masked = process.argv.includes("--maschera") || process.argv.includes("--mask");
const env = mergedEnv();

const REQUIRED = [
  { key: "ATELIER_SESSION_SECRET", why: "firma le sessioni: senza, ogni riavvio cambia la chiave di ripiego" },
  { key: "SUPABASE_URL", why: "indirizzo del progetto Supabase" },
  { key: "SUPABASE_PUBLISHABLE_KEY", why: "chiave pubblica: serve solo a indirizzare le RPC" },
  { key: "ATELIER_CLOUD_SECRET", why: "firma le richieste all'archivio: deve coincidere con il database" },
];

const OPTIONAL = [
  ["AUTH_GITHUB_ID", "accesso con GitHub — console GitHub, OAuth Apps"],
  ["AUTH_GITHUB_SECRET", "accesso con GitHub"],
  ["AUTH_GOOGLE_ID", "accesso con Google — console.cloud.google.com, credenziali OAuth"],
  ["AUTH_GOOGLE_SECRET", "accesso con Google"],
  ["GEMINI_API_KEY", "contenuti scritti dall'AI (aistudio.google.com/apikey)"],
  ["GROQ_API_KEY", "provider veloce (console.groq.com/keys)"],
  ["CEREBRAS_API_KEY", "milione di token al giorno (cloud.cerebras.ai)"],
  ["OPENROUTER_API_KEY", "router di riserva (openrouter.ai/keys)"],
  ["CLOUDFLARE_ACCOUNT_ID", "Cloudflare Workers AI — image e testo di riserva"],
  ["CLOUDFLARE_API_TOKEN", "Cloudflare Workers AI"],
  ["NEXT_PUBLIC_SITE_URL", "dominio canonico pubblico; se assente su Vercel vale VERCEL_PROJECT_PRODUCTION_URL"],
];

const problems = [];
const notes = [];

console.log("Atelier — variabili per Vercel");
console.log("Dove: Project → Settings → Environment Variables → Environment: Production (e Preview)");
console.log("Una casella per variabile, nome a sinistra e valore a destra.\n");

console.log("OBBLIGATORIE");
for (const entry of REQUIRED) {
  const label = entry.key.padEnd(26);
  if (!env[entry.key]) {
    problems.push(`${entry.key} assente: ${entry.why}`);
    console.log(`  [errore] ${label} — manca (${entry.why})`);
    continue;
  }
  const value = masked ? mask(env[entry.key]) : env[entry.key];
  console.log(`  [ok]     ${label} = ${value}`);
  console.log(`           ${entry.why}`);
}

console.log("\nOPZIONALI (se mancano, l'app funziona comunque in modalità offline)");
const missingOptional = [];
for (const [key, why] of OPTIONAL) {
  if (!env[key]) {
    missingOptional.push(key);
    continue;
  }
  const value = masked ? mask(env[key]) : env[key];
  console.log(`  [ok]     ${key.padEnd(26)} = ${value}`);
  console.log(`           ${why}`);
}
if (missingOptional.length) {
  console.log(`  [--]     non impostate: ${missingOptional.join(", ")}`);
}

console.log("\nCONTROLLI");

const sessionSecret = env.ATELIER_SESSION_SECRET ?? "";
if (sessionSecret && sessionSecret.length < 16) {
  problems.push(`ATELIER_SESSION_SECRET ha ${sessionSecret.length} caratteri: ne servono almeno 16`);
  console.log(`  [errore] ATELIER_SESSION_SECRET troppo corto (${sessionSecret.length} caratteri, minimo 16)`);
} else if (sessionSecret) {
  console.log(`  [ok]     ATELIER_SESSION_SECRET: ${sessionSecret.length} caratteri`);
}

const cloudSecret = env.ATELIER_CLOUD_SECRET ?? "";
if (cloudSecret && cloudSecret.length !== 43) {
  notes.push(
    `ATELIER_CLOUD_SECRET ha ${cloudSecret.length} caratteri invece di 43: va bene, ma il valore consueto è 32 byte in base64url`,
  );
  console.log(`  [!]      ATELIER_CLOUD_SECRET: ${cloudSecret.length} caratteri (di solito 43)`);
}

const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url.replace(/\/+$/, ""))) {
  notes.push(`SUPABASE_URL non sembra un progetto Supabase: ${url}`);
  console.log(`  [!]      SUPABASE_URL ha una forma insolita: ${url}`);
}

if (url && (env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && cloudSecret) {
  const result = await callEntry(
    {
      url,
      apiKey: env.SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      secret: cloudSecret,
    },
    { op: "stats" },
  );

  if (result.ok) {
    const stats = Array.isArray(result.data?.rows) ? result.data.rows[0] : null;
    console.log(
      `  [ok]     il segreto è accettato dal database (progetti archiviati: ${stats?.projects ?? "?"}, workspace: ${stats?.owners ?? "?"})`,
    );
  } else {
    problems.push(
      `il database ha rifiutato la firma (${result.message}): il valore di ATELIER_CLOUD_SECRET non coincide con quello in atelier.secrets`,
    );
    console.log(`  [errore] il database rifiuta la firma: ${result.message}`);
    console.log("           aggiorna il valore nel database con:");
    console.log("           insert into atelier.secrets (name, value) values ('atelier_cloud_secret', '<segreto>')");
    console.log("             on conflict (name) do update set value = excluded.value;");
  }
} else {
  notes.push("controllo della firma saltato: mancano URL, chiave o segreto");
  console.log("  [!]      firma non provata: mancano URL, chiave o segreto");
}

console.log("\nDopo aver salvato le variabili: Vercel → Deployments → Redeploy.");
console.log("Le variabili non entrano in un deploy già costruito: senza redeploy l'istanza resta senza.");
console.log("Poi: npm run check:deploy -- https://<il-tuo-dominio>\n");

for (const note of notes) console.log(`[!]  ${note}`);

if (problems.length) {
  console.log("");
  for (const problem of problems) console.log(`[errore] ${problem}`);
  console.log("\nRisultato: da sistemare prima del deploy.");
  process.exit(1);
}

console.log("Risultato: pronto per il deploy.");
