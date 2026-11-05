import { buildBlock } from "@/lib/schema/registry";
import { collectText } from "@/lib/render/node";
import { auditThemeContrast, buildThemeTokens, STYLE_PRESETS } from "@/lib/design/tokens";
import { containsExecutableMarkup } from "@/lib/quality/sanitize";
import type { Site } from "@/lib/schema/site";
import { byteLength } from "@/lib/util/bytes";


/**
 * Gate di qualità: l'export si blocca (o avverte in modo esplicito) prima di
 * consegnare un sito che non rispetta gli standard minimi.
 *
 * Ogni controllo dichiara cosa ha trovato e come risolverlo: un gate che non
 * spiega il rimedio è solo un ostacolo.
 */

export type GateSeverity = "error" | "warning" | "info";

export type GateIssue = {
  id: string;
  severity: GateSeverity;
  title: string;
  detail: string;
  fix: string;
  /** Dove intervenire: pagina e blocco, se applicabile. */
  where?: { page?: string; blockId?: string };
};

export type GateReport = {
  ok: boolean;
  errors: number;
  warnings: number;
  issues: GateIssue[];
  /** Misure utili mostrate nell'interfaccia. */
  stats: {
    pages: number;
    blocks: number;
    words: number;
    imagesNeedingAttention: number;
    contrastPairs: number;
    contrastFailures: number;
    estimatedKb: number;
  };
};

const MAX_PAGE_KB = 500;

export function runGates(site: Site, renderedFiles: { path: string; contents: string }[] = []): GateReport {
  const issues: GateIssue[] = [];
  let blocks = 0;
  let words = 0;
  let imagesNeedingAttention = 0;

  // I token reali servono ai blocchi durante l'estrazione del testo.
  const tokens = buildThemeTokens(site.theme.palette, site.theme.mode);
  const preset = STYLE_PRESETS[site.theme.preset] ?? STYLE_PRESETS.editorial;

  for (const page of site.pages) {
    const plainText = page.blocks
      .map((block) => {
        blocks += 1;
        // Il testo del blocco va estratto dall'albero reale, non da euristiche:
        // è l'unico modo per sapere cosa leggerà davvero una persona.
        try {
          return collectText(
            buildBlock(block, { site, page, tokens, preset }),
          );
        } catch {
          return "";
        }
      })
      .join(" ");
    words += plainText.split(/\s+/).filter(Boolean).length;

    if (!page.seo.title || page.seo.title.length < 8) {
      issues.push({
        id: "seo-title",
        severity: "error",
        title: "Titolo SEO troppo corto",
        detail: `La pagina "${page.title}" ha un titolo di ${page.seo.title.length} caratteri.`,
        fix: "Scrivi un titolo fra 30 e 60 caratteri che contenga l'attività e il luogo.",
        where: { page: page.path },
      });
    }
    if (!page.seo.description || page.seo.description.length < 50) {
      issues.push({
        id: "seo-description",
        severity: "warning",
        title: "Meta description assente o breve",
        detail: `"${page.title}" ha una descrizione di ${page.seo.description.length} caratteri.`,
        fix: "Aggiungi una descrizione di 120-160 caratteri: è il testo che appare su Google.",
        where: { page: page.path },
      });
    }

    const headings = page.blocks.filter((block) => block.type === "hero").length;
    if (headings === 0 && page.kind === "home") {
      issues.push({
        id: "hero-missing",
        severity: "warning",
        title: "La home non ha una sezione di apertura",
        detail: "La pagina iniziale non contiene un hero: il visitatore non capisce subito di cosa si tratta.",
        fix: "Aggiungi un blocco hero all'inizio della pagina iniziale.",
        where: { page: page.path },
      });
    }

    const hasContact = page.blocks.some((block) => block.type === "contact" || block.type === "cta");
    if (page.kind === "home" && !hasContact) {
      issues.push({
        id: "cta-missing",
        severity: "warning",
        title: "Nessuna via di contatto nella home",
        detail: "La pagina iniziale non ha moduli o inviti all'azione.",
        fix: "Aggiungi un blocco Contatti o un invito all'azione prima del footer.",
        where: { page: page.path },
      });
    }

    for (const block of page.blocks) {
      const media = JSON.stringify(block.props);
      if (/"src"\s*:/.test(media) === false && /"alt"\s*:\s*""/.test(media)) {
        imagesNeedingAttention += 1;
        issues.push({
          id: "alt-empty",
          severity: "error",
          title: "Immagine senza testo alternativo",
          detail: `Un blocco ${block.type} ha un'immagine con alt vuoto.`,
          fix: "Descrivi l'immagine in modo utile: serve a chi usa un lettore di schermo e alla SEO.",
          where: { page: page.path, blockId: block.id },
        });
      }
    }
  }

  // Contrasto: calcolato sui token reali, non stimato a occhio.
  const contrastPairs: { pair: string; ratio: number; ok: boolean }[] = [];
  for (const mode of ["light", "dark"] as const) {
    try {
      const modeTokens = buildThemeTokens(site.theme.palette, mode);
      for (const pair of auditThemeContrast(modeTokens)) contrastPairs.push(pair);
    } catch {
      /* il controllo contrasto non deve mai bloccare l'export */
    }
  }
  const contrastFailures = contrastPairs.filter((pair) => !pair.ok);
  if (contrastFailures.length > 0) {
    issues.push({
      id: "contrast",
      severity: "error",
      title: "Contrasto insufficiente",
      detail: contrastFailures.map((pair) => `${pair.pair} (${pair.ratio}:1)`).join(", "),
      fix: "Rigenera la palette o schiarisci/scurisci il colore: i token vengono corretti automaticamente.",
    });
  }

  if (!site.meta.domain) {
    issues.push({
      id: "domain",
      severity: "warning",
      title: "Dominio non impostato",
      detail: "Canonical, sitemap, og:url e URL assoluti JSON-LD non vengono generati finche il dominio non e impostato.",
      fix: "Imposta il dominio prima di pubblicare, così i motori indicizzano l'indirizzo giusto.",
    });
  }

  const contactForms = site.pages.flatMap((page) => page.blocks.filter((block) => block.type === "contact"));
  for (const form of contactForms) {
    const mode = (form.props as { formMode?: string }).formMode;
    if (!mode || mode === "mailto") {
      issues.push({
        id: "form-mailto",
        severity: "info",
        title: "Modulo in modalità email",
        detail: "Il modulo apre il programma di posta del visitatore: funziona sempre, ma richiede un passaggio in più.",
        fix: "Per ricevere i messaggi nella posta in automatico collega un endpoint (Formspree, Netlify Forms o Supabase).",
        where: { blockId: form.id },
      });
    }
  }

  // Il markup esportato non deve contenere codice eseguibile non previsto.
  for (const file of renderedFiles) {
    if (!file.path.endsWith(".html")) continue;
    const check = containsExecutableMarkup(file.contents);
    if (!check.safe) {
      issues.push({
        id: "unsafe-markup",
        severity: "error",
        title: "Markup non sicuro nel file esportato",
        detail: `${file.path}: ${check.reasons.join(", ")}`,
        fix: "Rimuovi lo script o il gestore di evento: nell'export è ammesso solo site.js.",
      });
    }
    if (!file.path.includes("/")) {
      const kb = byteLength(file.contents) / 1024;
      if (kb > MAX_PAGE_KB) {
        issues.push({
          id: "page-weight",
          severity: "warning",
          title: "Pagina troppo pesante",
          detail: `${file.path} pesa ${kb.toFixed(0)} KB di solo HTML.`,
          fix: "Riduci il numero di sezioni o sposta i contenuti lunghi in pagine dedicate.",
        });
      }
    }
  }

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;

  return {
    ok: errors === 0,
    errors,
    warnings,
    issues,
    stats: {
      pages: site.pages.length,
      blocks,
      words,
      imagesNeedingAttention,
      contrastPairs: contrastPairs.length,
      contrastFailures: contrastFailures.length,
      estimatedKb: Math.round(renderedFiles.reduce((total, file) => total + byteLength(file.contents), 0) / 1024),
    },
  };
}
