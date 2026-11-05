import { el, raw, type Child, type El } from "@/lib/render/node";
import { renderDocument, renderHtml } from "@/lib/render/toHtml";
import { buildBlock } from "@/lib/schema/registry";
import { EXPORT_SHEET } from "./export-sheet";
import { SITE_JS } from "./site-js";
import { resolveTheme, tokensCss, type ResolvedTheme } from "./tokens-css";
import type { Article, Collection, Page, Site } from "@/lib/schema/site";

export type ExportFile = {
  path: string;
  contents: string;
  kind: "html" | "css" | "js" | "xml" | "txt" | "json" | "svg" | "toml";
};

/** Normalizza il dominio del progetto. Vuoto significa "non ancora impostato". */
function normalizedDomain(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/** Escape per il contenuto di <script type="application/ld+json">. */
function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Settori con un indirizzo dove si ricevono i clienti (schema.org → LocalBusiness). */
const LOCAL_BUSINESS_SECTORS: readonly Site["sector"][] = [
  "restaurant",
  "medical",
  "legal",
  "architecture",
  "artisan",
  "realestate",
  "education",
  "fitness",
];

/** Dove finisce una pagina dentro l'archivio esportato. */
export function pageFileName(page: Page): string {
  return page.path === "/" ? "index.html" : `${page.path.replace(/^\/+|\/+$/g, "")}/index.html`;
}

function depthOf(fileName: string): number {
  return fileName.split("/").length - 1;
}

/**
 * Rende relativi i link assoluti, così il sito funziona sia servito da HTTP
 * sia aperto direttamente dal file system (e in una sottocartella qualunque).
 */
export function relativizeLinks(html: string, depth: number): string {
  const prefix = "../".repeat(depth);
  return html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_match, attr: string, path: string) => {
    if (path === "") return `${attr}="${prefix}index.html"`;
    const clean = path.replace(/^\/+/, "");
    if (/\.[a-z0-9]{2,5}$/i.test(clean)) return `${attr}="${prefix}${clean}"`;
    return `${attr}="${prefix}${clean.replace(/\/+$/, "")}/index.html"`;
  });
}

function baseUrl(site: Site): string {
  return normalizedDomain(site.meta.domain);
}

function jsonLd(site: Site, page: Page): string {
  const domain = baseUrl(site);
  const { contact } = site.brand;
  const organization: Record<string, unknown> = {
    // Studio e bottega hanno una sede in cui si ricevono i clienti: per il
    // vocabolario dei motori di ricerca sono attività locali, non organizzazioni.
    "@type": LOCAL_BUSINESS_SECTORS.includes(site.sector) ? "LocalBusiness" : "Organization",
    ...(domain ? { "@id": `${domain}/#organizzazione`, url: domain } : {}),
    name: site.businessName,

    description: site.pages[0]?.seo.description ?? site.brand.tagline,
  };
  if (contact.email) organization.email = contact.email;
  if (contact.phone) organization.telephone = contact.phone;
  if (contact.address || contact.city) {
    organization.address = {
      "@type": "PostalAddress",
      streetAddress: contact.address || undefined,
      addressLocality: contact.city || undefined,
      addressCountry: "IT",
    };
  }
  if (contact.vat) organization.vatID = contact.vat;

  const graph: Record<string, unknown>[] = [
    organization,
    {
      "@type": "WebPage",
      name: page.seo.title,
      description: page.seo.description,
      inLanguage: site.locale,
      ...(domain ? { "@id": `${domain}${page.path}#pagina`, url: `${domain}${page.path}`, isPartOf: { "@id": `${domain}/#organizzazione` } } : {}),
    },
  ];

  const faq = page.blocks.find((block) => block.type === "faq");
  if (faq) {
    const items = (faq.props as { items?: { question: string; answer: string }[] }).items ?? [];
    if (items.length > 0) {
      graph.push({
        "@type": "FAQPage",
        ...(domain ? { "@id": `${domain}${page.path}#faq` } : {}),
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      });
    }
  }

  return `<script type="application/ld+json">${escapeJsonLd(JSON.stringify({ "@context": "https://schema.org", "@graph": graph }))}</script>`;
}

function headNodes(site: Site, page: Page, resolved: ResolvedTheme, inline = false): Child[] {
  const domain = baseUrl(site);
  const canonical = domain ? `${domain}${page.path}` : "";
  const title = page.seo.title || site.businessName;
  // In un file unico anche l'icona viaggia dentro il documento (data URI):
  // altrimenti il browser chiederebbe un /favicon.svg che non esiste.
  const faviconHref = inline
    ? `data:image/svg+xml,${encodeURIComponent(faviconSvg(site, resolved))}`
    : "/favicon.svg";

  return [
    el("meta", { charset: "utf-8" }),
    el("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
    el("title", null, title),
    el("meta", { name: "description", content: page.seo.description }),
    ...(page.seo.keywords.length > 0 ? [el("meta", { name: "keywords", content: page.seo.keywords.join(", ") })] : []),
    ...(canonical ? [el("link", { rel: "canonical", href: canonical })] : []),
    el("meta", { name: "robots", content: page.seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large" }),
    el("meta", { property: "og:type", content: page.kind === "home" ? "website" : "article" }),
    el("meta", { property: "og:site_name", content: site.businessName }),
    el("meta", { property: "og:title", content: page.seo.ogTitle || title }),
    el("meta", { property: "og:description", content: page.seo.ogDescription || page.seo.description }),
    ...(canonical ? [el("meta", { property: "og:url", content: canonical })] : []),
    ...(domain ? [el("meta", { property: "og:image", content: `${domain}/og-image.svg` })] : []),
    el("meta", { property: "og:locale", content: site.locale.replace("-", "_") }),
    el("meta", { name: "twitter:card", content: "summary_large_image" }),
    el("meta", { name: "generator", content: "Atelier" }),
    el("link", { rel: "icon", href: faviconHref, type: "image/svg+xml" }),
    el("link", { rel: "apple-touch-icon", href: faviconHref }),
    el("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }),
    el("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }),
    el("link", { rel: "stylesheet", href: `https://fonts.googleapis.com/css2?${resolved.googleFamilies}&display=swap` }),
    // Con `inline` i fogli locali sono incorporati nel documento: un file unico
    // che non chiede nulla al file system (file:// e iframe dell'editor).
    ...(inline
      ? []
      : [
          el("link", { rel: "stylesheet", href: "/tokens.css" }),
          el("link", { rel: "stylesheet", href: "/styles.css" }),
        ]),
    el("link", { rel: "alternate", href: "/llms.txt", type: "text/plain", title: "llms.txt" }),
    raw(jsonLd(site, page)),
  ];
}

function bodyNodes(site: Site, page: Page, resolved: ResolvedTheme, inline = false): Child[] {
  const ctx = { site, page, tokens: resolved.tokens, preset: resolved.preset };
  return [
    el("a", { class: "atl-skip", href: "#contenuto" }, "Salta al contenuto"),
    el("main", { id: "contenuto" }, ...page.blocks.map((block) => buildBlock(block, ctx))),
    // Il comportamento è lo stesso in entrambi i casi, ma in un file unico va
    // incorporato: altrimenti lo script verrebbe eseguito due volte.
    ...(inline ? [] : [el("script", { src: "/site.js", defer: true }, "")]),
  ];
}

export type PageRenderOptions = {
  /** CSS e JS inclusi nel documento: un unico file autosufficiente. */
  inline?: boolean;
  /** Aggiunge il livello di selezione usato dall'editor (solo anteprima). */
  preview?: boolean;
  /** Rende relativi i link assoluti (per l'archivio esportato). */
  relativize?: boolean;
};

/** Costruisce l'HTML completo di una pagina, con o senza risorse inline. */
export function renderPageHtml(site: Site, page: Page, options: PageRenderOptions = {}): string {
  const resolved = resolveTheme(site);
  const head: Child[] = headNodes(site, page, resolved, options.inline);
  const body: Child[] = bodyNodes(site, page, resolved, options.inline);

  if (options.inline) {
    head.push(el("style", null, `${tokensCss(site, resolved)}\n${EXPORT_SHEET}`));
    body.push(el("script", null, SITE_JS));
  }
  if (options.preview) {
    body.push(el("style", null, PREVIEW_CSS));
    body.push(el("script", null, PREVIEW_JS));
  }

  const html = renderDocument(head, body, { pretty: !options.inline, lang: site.locale });
  if (options.relativize) return relativizeLinks(html, depthOf(pageFileName(page)));
  return html;
}

/** Un unico documento HTML con tutto incluso: anteprima dell'editor e condivisione. */
export function renderSingleFileHtml(site: Site, pagePath = "/", options: PageRenderOptions = {}): string {
  const page = site.pages.find((item) => item.path === pagePath) ?? site.pages[0];
  if (!page) throw new Error("Il sito non ha pagine");
  return renderPageHtml(site, page, { inline: true, ...options });
}

function articleDocument(site: Site, collection: Collection, article: Article, basePath: string): Page {
  return {
    id: `${collection.id}-${article.id}`,
    path: `${basePath}/${article.id}`,
    title: article.title,
    kind: "page",
    seo: {
      title: `${article.title} — ${site.businessName}`,
      description: article.excerpt,
      noindex: false,
      keywords: [article.tag].filter(Boolean),
    },
    blocks: [],
  };
}

function renderArticleHtml(site: Site, collection: Collection, article: Article, basePath: string): string {
  const resolved = resolveTheme(site);
  const page = articleDocument(site, collection, article, basePath);
  const paragraphs = article.body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const body: El[] = [
    el("a", { class: "atl-skip", href: "#contenuto" }, "Salta al contenuto"),
    el(
      "main",
      { id: "contenuto" },
      el(
        "article",
        { class: "atl-section atl-section--prose" },
        el(
          "div",
          { class: "atl-container" },
          el("p", { class: "atl-eyebrow" }, `${article.date}${article.tag ? ` · ${article.tag}` : ""}`),
          el("h1", { class: "atl-heading atl-heading--page" }, article.title),
          el("p", { class: "atl-lead" }, article.excerpt),
          el(
            "div",
            { class: "atl-prose" },
            ...paragraphs.map((text) => el("p", { class: "atl-text" }, text)),
            paragraphs.length === 0 ? el("p", { class: "atl-text atl-text--muted" }, "Contenuto in preparazione.") : null,
          ),
          article.author ? el("p", { class: "atl-text atl-text--muted" }, `di ${article.author}`) : null,
          el("p", null, el("a", { class: "atl-link", href: basePath }, "← Torna all'elenco")),
        ),
      ),
    ),
    el("script", { src: "/site.js", defer: true }, ""),
  ];

  const html = renderDocument(headNodes(site, page, resolved), body, { pretty: true, lang: site.locale });
  return relativizeLinks(html, depthOf(pageFileName(page)));
}

function faviconSvg(site: Site, resolved: ResolvedTheme): string {
  const initials = (site.brand.initials || site.businessName.slice(0, 2)).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${site.businessName}">
  <rect width="64" height="64" rx="14" fill="${resolved.tokens.primary}"/>
  <text x="32" y="41" text-anchor="middle" font-family="system-ui, sans-serif" font-size="26" font-weight="700" fill="${resolved.tokens.primaryText}">${initials}</text>
</svg>
`;
}

function ogImageSvg(site: Site, resolved: ResolvedTheme): string {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const title = escape(site.pages[0]?.seo.title || site.businessName).slice(0, 70);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escape(site.businessName)}">
  <rect width="1200" height="630" fill="${resolved.tokens.bg}"/>
  <circle cx="1040" cy="90" r="260" fill="${resolved.tokens.primary}" opacity="0.16"/>
  <circle cx="150" cy="580" r="200" fill="${resolved.tokens.accent}" opacity="0.14"/>
  <text x="80" y="150" font-family="system-ui, sans-serif" font-size="26" letter-spacing="4" fill="${resolved.tokens.textMuted}">${escape(site.businessName).toUpperCase()}</text>
  <text x="80" y="330" font-family="system-ui, sans-serif" font-size="64" font-weight="700" fill="${resolved.tokens.text}">${title}</text>
  <rect x="80" y="400" width="120" height="6" fill="${resolved.tokens.primary}"/>
  <text x="80" y="470" font-family="system-ui, sans-serif" font-size="30" fill="${resolved.tokens.textMuted}">${escape(site.brand.tagline).slice(0, 80)}</text>
</svg>
`;
}

function sitemapXml(site: Site): string {
  const domain = baseUrl(site);
  if (!domain) return "";
  const urls = site.pages
    .filter((page) => !page.seo.noindex)
    .map(
      (page) =>
        `  <url><loc>${domain}${page.path}</loc><lastmod>${site.updatedAt.slice(0, 10)}</lastmod><changefreq>${
          page.kind === "home" ? "weekly" : "monthly"
        }</changefreq><priority>${page.kind === "home" ? "1.0" : "0.7"}</priority></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robotsTxt(site: Site): string {
  const domain = baseUrl(site);
  const sitemap = domain ? `\nSitemap: ${domain}/sitemap.xml\n` : "";
  return `User-agent: *\nAllow: /${sitemap}`;
}

/** AEO: un riassunto leggibile dalle macchine, come indicato dalla pratica llms.txt. */
function llmsTxt(site: Site): string {
  const domain = baseUrl(site);
  const contact = site.brand.contact;
  const lines = [
    `# ${site.businessName}`,
    "",
    `> ${site.brand.tagline || site.pages[0]?.seo.description || ""}`,
    "",
    "## Pagine principali",
    ...site.pages.map((page) => `- [${page.title}](${domain ? `${domain}${page.path}` : page.path}): ${page.seo.description}`),
    "",
    "## Contatti",
    contact.email ? `- Email: ${contact.email}` : null,
    contact.phone ? `- Telefono: ${contact.phone}` : null,
    contact.city ? `- Sede: ${[contact.address, contact.city].filter(Boolean).join(", ")}` : null,
    "",
    "_Sito statico pubblicato con Atelier._",
    "",
  ];
  return lines.filter((line) => line !== null).join("\n");
}

function readmeForExport(site: Site): string {
  const domain = baseUrl(site);
  return `# ${site.businessName} — sito esportato da Atelier

Questa cartella è un sito statico completo: HTML, CSS e un solo file JavaScript.
Non dipende da Atelier e non richiama alcuna API.

## Provarlo subito

\`\`\`bash
npx serve .          # oppure: python3 -m http.server
\`\`\`

Si apre anche direttamente con doppio clic su \`index.html\`: i link interni sono relativi.

## Pubblicarlo

- **Vercel**: trascina la cartella nella dashboard, oppure \`npx vercel deploy --prod\`.
- **Cloudflare Pages**: crea un progetto e carica questa cartella.
- **Netlify**: trascina la cartella su app.netlify.com/drop (i moduli funzionano già, se hai scelto quella modalità).
- **Qualsiasi hosting**: carica i file così come sono.

## Prima di andare online

1. **Dominio** — ${domain ? `ora impostato a \`${domain}\`. Aggiornalo nel progetto per correggere canonical, sitemap e og:url.` : "non ancora impostato. Impostalo nel progetto per generare canonical, sitemap e og:url."}
2. **Modulo di contatto** — in modalità email apre il programma di posta del visitatore (funziona sempre,
   senza servizi esterni). Per ricevere i messaggi in automatico collega un endpoint nel progetto.
3. **Google Fonts** — i font sono caricati dal CDN di Google. Per una versione senza richieste esterne,
   scarica i file woff2 e sostituisci il \`<link>\` in ogni pagina.
4. **Immagine social** — \`og-image.svg\` è generata dal marchio; molti social preferiscono PNG:
   aprila e riesportala in PNG se serve.

## Cosa contiene

| File | A cosa serve |
|---|---|
| \`index.html\`, \`<pagina>/index.html\` | le pagine del sito |
| \`styles.css\` | foglio di stile (identico per tutti i siti, pilotato dai token) |
| \`tokens.css\` | colori, font, spaziature, raggi, ombre del tuo brand |
| \`site.js\` | menu, animazioni, modulo, consenso cookie |
| \`sitemap.xml\`, \`robots.txt\`, \`llms.txt\` | SEO e accesso ai crawler AI |
| \`vercel.json\`, \`netlify.toml\`, \`_headers\` | configurazioni pronte per i tre hosting più usati |
| \`progetto.atelier.json\` | il progetto completo: reimportandolo in Atelier riprendi a modificarlo |
`;
}

function vercelJson(): string {
  return `${JSON.stringify(
    {
      cleanUrls: true,
      trailingSlash: false,
      headers: [
        { source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }] },
        { source: "/(.*)\\.(css|js|svg|woff2)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      ],
    },
    null,
    2,
  )}\n`;
}

function netlifyToml(): string {
  return `[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "SAMEORIGIN"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`;
}

function headersFile(): string {
  return `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.css
  Cache-Control: public, max-age=31536000, immutable
`;
}

/** Tutti i file dell'archivio esportato. Ordine deterministico. */
export function renderSite(site: Site): ExportFile[] {
  const resolved = resolveTheme(site);
  const files: ExportFile[] = [];

  for (const page of site.pages) {
    files.push({ path: pageFileName(page), contents: renderPageHtml(site, page, { relativize: true }), kind: "html" });
  }

  // Le raccolte diventano pagine reali: nessun link verso pagine inesistenti.
  for (const collection of site.collections) {
    const basePath = collection.kind === "articles" ? "/blog" : `/${collection.id}`;
    for (const article of collection.items) {
      const page = articleDocument(site, collection, article, basePath);
      files.push({ path: pageFileName(page), contents: renderArticleHtml(site, collection, article, basePath), kind: "html" });
    }
  }

  const notFound: Page = {
    id: "not-found",
    path: "/404",
    title: "Pagina non trovata",
    kind: "utility",
    seo: { title: `Pagina non trovata — ${site.businessName}`, description: "La pagina richiesta non esiste.", noindex: true, keywords: [] },
    blocks: [
      {
        id: "404-hero",
        type: "hero",
        variant: "centered",
        props: {
          eyebrow: "Errore 404",
          title: "Questa pagina non esiste",
          subtitle: "Il link potrebbe essere vecchio o la pagina è stata spostata.",
          primaryCta: { label: "Torna alla home", href: "/", emphasis: "primary", external: false },
        },
        style: { width: "narrow", background: "none", align: "center", space: "loose", hideOnMobile: false },
        motion: "none",
      },
    ],
  };
  files.push({ path: "404.html", contents: renderPageHtml(site, notFound, { relativize: true }), kind: "html" });

  files.push({ path: "styles.css", contents: EXPORT_SHEET, kind: "css" });
  files.push({ path: "tokens.css", contents: tokensCss(site, resolved), kind: "css" });
  files.push({ path: "site.js", contents: SITE_JS, kind: "js" });
  files.push({ path: "favicon.svg", contents: faviconSvg(site, resolved), kind: "svg" });
  files.push({ path: "og-image.svg", contents: ogImageSvg(site, resolved), kind: "svg" });
  const sitemap = sitemapXml(site);
  if (sitemap) files.push({ path: "sitemap.xml", contents: sitemap, kind: "xml" });
  files.push({ path: "robots.txt", contents: robotsTxt(site), kind: "txt" });
  files.push({ path: "llms.txt", contents: llmsTxt(site), kind: "txt" });
  files.push({ path: "vercel.json", contents: vercelJson(), kind: "json" });
  files.push({ path: "netlify.toml", contents: netlifyToml(), kind: "toml" });
  files.push({ path: "_headers", contents: headersFile(), kind: "txt" });
  files.push({ path: "README.md", contents: readmeForExport(site), kind: "txt" });
  files.push({ path: "progetto.atelier.json", contents: `${JSON.stringify(site, null, 2)}\n`, kind: "json" });

  return files;
}

/** Riassunto leggibile (e testabile) di ciò che verrà esportato. */
export function exportSummary(files: ExportFile[]): { total: number; bytes: number; html: number } {
  return {
    total: files.length,
    bytes: files.reduce((sum, file) => sum + Buffer.byteLength(file.contents, "utf8"), 0),
    html: files.filter((file) => file.kind === "html").length,
  };
}

/** Stile del livello di selezione attivo solo nell'anteprima dell'editor. */
const PREVIEW_CSS = `
[data-block] { position: relative; }
[data-block]:hover { outline: 1px dashed color-mix(in oklab, var(--primary) 60%, transparent); outline-offset: -2px; }
[data-block].atl-selected { outline: 2px solid var(--primary); outline-offset: -2px; }
.atl-skip { position: absolute; left: -9999px; }
`;

/** Selezione dei blocchi nell'anteprima: comunica con l'editor, non modifica il sito. */
const PREVIEW_JS = `(function () {
  var selected = null;
  document.addEventListener("click", function (event) {
    var node = event.target && event.target.closest ? event.target.closest("[data-block]") : null;
    if (!node) return;
    event.preventDefault();
    if (selected) selected.classList.remove("atl-selected");
    selected = node;
    node.classList.add("atl-selected");
    parent.postMessage({ source: "atelier-preview", type: "select", blockId: node.getAttribute("data-block") }, "*");
  }, true);
  window.addEventListener("message", function (event) {
    var data = event.data || {};
    if (data.source !== "atelier-editor") return;
    if (data.type === "scrollTo") {
      var node = document.querySelector('[data-block="' + data.blockId + '"]');
      if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();`;
