/** Origine e protocollo pubblici, indipendenti da Next (testabili da soli). */

export function isSecureRequest(request: Request): boolean {
  try {
    if (new URL(request.url).protocol === "https:") return true;
  } catch {
    /* URL non leggibile: si resta sulla scelta prudente */
  }
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

/**
 * Origine pubblica della richiesta.
 *
 * Dietro un proxy (Vercel, Netlify, reverse proxy) `request.url` può contenere
 * un host interno: il callback OAuth deve invece usare l'indirizzo con cui il
 * browser ha raggiunto l'istanza, altrimenti GitHub/Google rifiutano il codice.
 * Gli header inoltrati hanno la precedenza; `NEXT_PUBLIC_SITE_URL` è il ripiego
 * per installazioni che non li impostano.
 */
export function requestOrigin(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host")?.trim();
  if (host) {
    const scheme = proto === "https" || proto === "http" ? proto : isSecureRequest(request) ? "https" : "http";
    return `${scheme}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  return new URL(request.url).origin;
}
