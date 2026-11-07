/**
 * URL canonico dell'istanza.
 *
 * `NEXT_PUBLIC_SITE_URL` esplicita ha la precedenza: serve quando il progetto
 * Vercel ha più domini e quello canonico non coincide con il dominio generato
 * dalla piattaforma. In sua assenza si usa il dominio stabile di produzione
 * Vercel, anche mentre si guarda un deploy di anteprima.
 */
const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

export const SITE_URL =
  explicitSiteUrl ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

/** Nome usato in titoli, dati strutturati e immagine di anteprima social. */
export const SITE_NAME = "Atelier";
export const STUDIO_NAME = "Ahsen Studio";
export const AUTHOR_NAME = "Ahsen Kurtoski";

/** Descrizione breve riusata da metadata, Open Graph e dati strutturati. */
export const SITE_TAGLINE =
  "Website builder AI local-first: da un prompt a un sito completo, con editor visuale ed export statico autosufficiente.";

/** Costruisce l'URL assoluto di un percorso interno. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
