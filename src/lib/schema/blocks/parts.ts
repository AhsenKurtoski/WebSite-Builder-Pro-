import { cls, el, raw, type AttrValue, type Child, type El } from "@/lib/render/node";
import { icon } from "@/lib/render/icons";
import type { Block, Link, Media, Page, Site } from "@/lib/schema/site";
import type { PresetVars, ThemeTokens } from "@/lib/design/tokens";

/**
 * Mattoni condivisi da tutti i blocchi.
 *
 * Le classi sono SEMANTICHE (atl-*): il CSS esportato le definisce una volta e le
 * pilota con le variabili di tema. Così lo stesso markup può diventare editorial,
 * brutalist o glass cambiando solo i token.
 */

export type BlockContext = {
  site: Site;
  page: Page;
  tokens: ThemeTokens;
  preset: PresetVars;
};

export const MOTION_ATTR = "data-motion";

/** Wrapper di sezione: applica larghezza, sfondo, spaziatura, motion e ancoraggio. */
export function section(block: Block, children: Child[], extraClass?: string, extraAttrs?: Record<string, AttrValue>, tag = "section"): El {
  const style = block.style;
  return el(
    tag,
    {
      class: cls(
        "atl-section",
        `atl-section--w-${style.width}`,
        style.background !== "none" && `atl-section--bg-${style.background}`,
        `atl-section--space-${style.space}`,
        style.align === "center" && "atl-center",
        style.hideOnMobile && "atl-hide-mobile",
        block.motion !== "none" && "atl-motion",
        extraClass,
      ),
      id: style.anchor,
      "data-block": block.id,
      "data-motion": block.motion !== "none" ? block.motion : undefined,
      ...extraAttrs,
    },
    ...children,
  );
}

export function container(children: Child[], extraClass?: string): El {
  return el("div", { class: cls("atl-container", extraClass) }, ...children);
}

export function heading(level: 1 | 2 | 3 | 4, text: string, extraClass?: string): El {
  return el(`h${level}`, { class: cls("atl-heading", `atl-heading--h${level}`, extraClass) }, text);
}

export function eyebrow(text: string, iconName?: string): El {
  if (!text) return el("span", { class: "atl-eyebrow atl-hidden" }, "");
  return el(
    "p",
    { class: "atl-eyebrow" },
    ...(iconName ? [icon(iconName, 15, "atl-eyebrow__icon")] : []),
    el("span", null, text),
  );
}

export function paragraph(text: string, extraClass?: string): El {
  return el("p", { class: cls("atl-text", extraClass) }, text);
}

export function lead(text: string): El {
  return el("p", { class: "atl-lead" }, text);
}

/** Pulsante o link con enfasi. */
export function cta(link: Link): El {
  const emphasis = link.emphasis ?? "link";
  return el(
    "a",
    {
      class: cls("atl-cta", `atl-cta--${emphasis}`),
      href: link.href,
      ...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
    },
    el("span", null, link.label),
    emphasis === "primary" || emphasis === "secondary" ? icon("arrowRight", 16, "atl-cta__icon") : null,
  );
}

export function ctaRow(links: Link[], extraClass?: string): El {
  return el("div", { class: cls("atl-cta-row", extraClass) }, ...links.map((link) => cta(link)));
}

/** Gradiente procedurale: riempie uno spazio immagine senza consumare quota. */
export function artStyle(art: {
  hue: number;
  style: string;
  intensity: number;
  seed: number;
}): string {
  const h = art.hue;
  const h2 = (h + 38) % 360;
  const h3 = (h + 320) % 360;
  const i = Math.max(0.15, Math.min(1, art.intensity));

  switch (art.style) {
    case "stripes":
      return `background-image: repeating-linear-gradient(${115 + (art.seed % 40)}deg, oklch(0.56 0.15 ${h} / ${0.34 * i}) 0 12px, transparent 12px 40px)`;
    case "dots":
      return `background-image: radial-gradient(oklch(0.55 0.14 ${h} / ${0.42 * i}) 1.6px, transparent 1.7px); background-size: 18px 18px`;
    case "waves":
      return `background-image: radial-gradient(130% 90% at 50% 118%, oklch(0.62 0.15 ${h} / ${0.55 * i}) 0 32%, transparent 33%), radial-gradient(100% 70% at 20% 120%, oklch(0.7 0.13 ${h2} / ${0.4 * i}) 0 28%, transparent 29%)`;
    case "grid":
      return `background-image: linear-gradient(oklch(0.6 0.1 ${h} / ${0.28 * i}) 1px, transparent 1px), linear-gradient(90deg, oklch(0.6 0.1 ${h} / ${0.28 * i}) 1px, transparent 1px); background-size: 34px 34px`;
    default:
      return `background-image: radial-gradient(at 18% 22%, oklch(0.74 0.16 ${h} / ${0.8 * i}), transparent 62%), radial-gradient(at 82% 28%, oklch(0.68 0.15 ${h2} / ${0.62 * i}), transparent 58%), radial-gradient(at 52% 88%, oklch(0.6 0.13 ${h3} / ${0.55 * i}), transparent 62%)`;
  }
}

/**
 * Media: immagine reale se disponibile, altrimenti arte procedurale.
 * In entrambi i casi lascia un `role="img"` con `aria-label`, quindi il
 * controllo di accessibilità non trova mai un'immagine senza testo alternativo.
 */
export function media(item: Media, extraClass?: string): El {
  const inner = item.src
    ? el("img", {
        class: "atl-media__img",
        src: item.src,
        alt: item.alt,
        loading: "lazy",
        decoding: "async",
        width: item.width,
        height: item.height,
      })
    : el("div", {
        class: cls("atl-art", item.art ? `atl-art--${item.art.style}` : "atl-art--mesh"),
        style: artStyle(
          item.art ?? { hue: 240, style: "mesh", intensity: 0.6, seed: 1 },
        ),
        role: "img",
        "aria-label": item.alt,
      });

  return el(
    "figure",
    { class: cls("atl-media", extraClass) },
    inner,
    item.caption ? el("figcaption", { class: "atl-media__caption" }, item.caption) : null,
  );
}

export function grid(columns: 2 | 3 | 4, children: Child[], extraClass?: string): El {
  return el("div", { class: cls("atl-grid", `atl-grid--${columns}`, extraClass) }, ...children);
}

export function card(children: Child[], extraClass?: string): El {
  return el("article", { class: cls("atl-card", extraClass) }, ...children);
}

export function iconBadge(name: string, size = 22): El {
  return el("span", { class: "atl-icon-badge" }, icon(name, size));
}

/** `tel:` e `mailto:` normalizzati: link sempre utilizzabili. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function mailHref(email: string): string {
  return `mailto:${email.trim()}`;
}

/**
 * Data in forma italiana, scritta a mano: `toLocaleDateString` dipende dagli
 * archivi ICU dell'ambiente e farebbe divergere l'HTML generato su Node da
 * quello generato nel browser (che è esattamente ciò che non deve succedere).
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** Contenuto legale generato: nessun blocco vuoto, sempre testo utile. */
export function legalBody(site: Site, kind: "privacy" | "cookie" | "terms"): El[] {
  const name = site.businessName;
  const email = site.brand.contact.email.trim();
  const updated = formatDate(site.updatedAt);

  if (kind === "cookie") {
    return [
      heading(2, "Cookie policy"),
      paragraph(`Ultimo aggiornamento: ${updated}.`),
      heading(3, "Cookies tecnici"),
      paragraph(
        `Questo sito utilizza esclusivamente cookie e memorizzazioni locali necessari al funzionamento delle pagine e alla memorizzazione delle preferenze. Non vengono impostati cookie di profilazione senza il consenso dell'utente.`,
      ),
      heading(3, "Cookie di terze parti"),
      paragraph(
        `Eventuali servizi di terze parti (mappe, video, statistiche) possono impostare cookie propri. Prima del consenso nessuno di questi script viene caricato.`,
      ),
      heading(3, "Gestione delle preferenze"),
      paragraph(
        `Puoi modificare o revocare il consenso in qualsiasi momento dal link "Preferenze cookie" nel footer${email ? `, oppure scrivendo a ${email}` : ""}.`,
      ),
      heading(3, "Titolare del trattamento"),
      paragraph(`${name}${site.brand.contact.vat ? `, P.IVA ${site.brand.contact.vat}` : ""}.${email ? ` Contatti: ${email}.` : " I recapiti sono indicati nella pagina Contatti."}`),
    ];
  }

  if (kind === "terms") {
    return [
      heading(2, "Termini e condizioni"),
      paragraph(`Ultimo aggiornamento: ${updated}.`),
      heading(3, "Oggetto"),
      paragraph(
        `I presenti termini regolano l'utilizzo del sito di ${name} e la richiesta di informazioni o preventivi tramite i moduli presenti.`,
      ),
      heading(3, "Preventivi e prezzi"),
      paragraph(
        `Le informazioni pubblicate hanno valore indicativo e non costituiscono offerta contrattuale vincolante fino a conferma scritta.`,
      ),
      heading(3, "Responsabilità"),
      paragraph(
        `${name} cura i contenuti pubblicati ma non garantisce l'assenza di errori materiali; segnalazioni possono essere inviate ${email ? `a ${email}` : "tramite la pagina Contatti"}.`,
      ),
    ];
  }

  return [
    heading(2, "Informativa privacy"),
    paragraph(`Ultimo aggiornamento: ${updated}.`),
    heading(3, "Titolare del trattamento"),
    paragraph(
      `${name}${site.brand.contact.vat ? `, P.IVA ${site.brand.contact.vat}` : ""}, con sede in ${
        site.brand.contact.address || site.brand.contact.city || "Italia"
      }.${email ? ` Contatto per la privacy: ${email}.` : " I recapiti sono indicati nella pagina Contatti."}`,
    ),
    heading(3, "Finalità e base giuridica"),
    paragraph(
      `I dati inviati tramite i moduli di contatto sono trattati per rispondere alla richiesta (art. 6.1.b GDPR) e, previo consenso, per comunicazioni commerciali (art. 6.1.a GDPR).`,
    ),
    heading(3, "Categorie di dati"),
    paragraph(
      `Dati identificativi e di contatto (nome, email, telefono), contenuto del messaggio ed eventuali dati tecnici di navigazione necessari alla sicurezza del sito.`,
    ),
    heading(3, "Conservazione"),
    paragraph(
      `I dati sono conservati per il tempo necessario a gestire la richiesta e, per gli obblighi di legge, per i termini previsti dalla normativa fiscale e contabile.`,
    ),
    heading(3, "Diritti dell'interessato"),
    paragraph(
      `Puoi richiedere accesso, rettifica, cancellazione, limitazione e portabilità dei dati, oppure opporti al trattamento, scrivendo a ${email}. Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali.`,
    ),
    heading(3, "Destinatari e trasferimenti"),
    paragraph(
      `I dati sono trattati da fornitori tecnici (hosting, posta elettronica) nominati responsabili del trattamento. I servizi di hosting utilizzati sono localizzati nell'Unione Europea; eventuali trasferimenti extra-UE avvengono sulla base di clausole contrattuali standard.`,
    ),
  ];
}
