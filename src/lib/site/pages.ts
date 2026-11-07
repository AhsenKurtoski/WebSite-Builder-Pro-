/**
 * Anagrafica delle pagine pubbliche.
 *
 * Header, footer, sitemap e dati strutturati leggono da qui: un link aggiunto
 * una volta compare in tutti i posti, senza possibilità di divergenze.
 */

export type PublicPage = {
  href: string;
  label: string;
  /** Descrizione breve usata nei riquadri e nella sitemap. */
  blurb: string;
  priority: number;
};

/** Pagine di approfondimento indicate nei motori di ricerca. */
export const PUBLIC_PAGES: PublicPage[] = [
  {
    href: "/guida",
    label: "Guida",
    blurb: "Il percorso completo dal brief al sito pubblicato: accesso, creazione, modifica, verifica, export e problemi comuni.",
    priority: 0.9,
  },
  {
    href: "/funzionalita",
    label: "Funzionalità",
    blurb: "Il compilatore a stadi, il catalogo di sezioni, il design system, i gate di qualità, l'editor e l'export.",
    priority: 0.9,
  },
  {
    href: "/piani",
    label: "Piani",
    blurb: "Nessun abbonamento: cosa è incluso, cosa costa zero e cosa paghi solo se vuoi l'accelerazione AI.",
    priority: 0.8,
  },
  {
    href: "/domande-frequenti",
    label: "Domande frequenti",
    blurb: "Le risposte brevi su account, chiavi API, dati, export, qualità dei testi e self-hosting.",
    priority: 0.7,
  },
];

/** Pagine legali: informative, non promozionali. */
export const LEGAL_PAGES: PublicPage[] = [
  {
    href: "/privacy",
    label: "Privacy",
    blurb: "Dove finiscono progetti, chiavi API e cookie di sessione. In una pagina, senza giri di parole.",
    priority: 0.4,
  },
  {
    href: "/cookie",
    label: "Cookie e preferenze",
    blurb: "I cookie tecnici usati da Atelier, le preferenze salvate nel browser e come revocare il consenso.",
    priority: 0.4,
  },
  {
    href: "/termini",
    label: "Termini d'uso",
    blurb: "Cosa puoi fare con Atelier, di chi sono i contenuti generati e quali verifiche restano tue.",
    priority: 0.4,
  },
];

/**
 * Pagina di diagnostica: utile a chi installa il progetto, non è materiale di
 * vetrina: per questo resta fuori dall'indice dei motori di ricerca.
 */
export const STATUS_PAGE: PublicPage = {
  href: "/stato",
  label: "Stato del servizio",
  blurb: "Cosa è configurato su questa istanza: motore offline, segreto di sessione, provider di accesso e provider AI.",
  priority: 0.2,
};

/** Sezioni della home raggiungibili con un'ancora. */
export const HOME_SECTIONS: { href: string; label: string }[] = [
  { href: "/#come-funziona", label: "Come funziona" },
  { href: "/#stili", label: "Stili" },
  { href: "/#qualita", label: "Qualità" },
  { href: "/#export", label: "Export" },
];

/** Tutti i percorsi pubblici, nell'ordine con cui compaiono nella sitemap. */
export const ALL_PUBLIC_PAGES: PublicPage[] = [...PUBLIC_PAGES, ...LEGAL_PAGES, STATUS_PAGE];
