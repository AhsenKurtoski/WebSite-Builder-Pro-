import { describe, expect, it } from "vitest";
import { composeSite } from "@/lib/compiler/offline-composer";
import { renderPageHtml, renderSingleFileHtml, renderSite, relativizeLinks, pageFileName } from "@/lib/export/render-site";
import { containsExecutableMarkup } from "@/lib/quality/sanitize";
import { parseImportedSite, projectFileName } from "@/lib/storage/import-site";
import { BriefSchema, type Site } from "@/lib/schema/site";

const NOW = "2026-09-26T10:00:00.000Z";

function withDomain(site: Site, domain = "https://esempio.it"): Site {
  return { ...site, meta: { ...site.meta, domain } };
}

function buildSite(overrides: Partial<Parameters<typeof composeSite>[0]> = {}): Site {
  const brief = BriefSchema.parse({
    prompt: "Pizzeria napoletana a Milano con forno a legna e menu senza glutine",
    ...overrides,
  });
  return composeSite(brief, { now: NOW });
}

describe("script inline", () => {
  const site = buildSite();

  it("il JavaScript inline resta codice: `&&` sopravvive all'export", () => {
    const html = renderSingleFileHtml(site, "/", { inline: true, preview: true });
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? "");
    const behaviour = scripts.find((chunk) => chunk.includes("comportamento del sito")) ?? "";
    const preview = scripts.find((chunk) => chunk.includes("atelier-preview")) ?? "";

    expect(behaviour.length).toBeGreaterThan(500);
    expect(behaviour).toContain("querySelectorAll");
    expect(preview).toContain("&&");
    expect(scripts.join("")).not.toContain("&amp;");
    expect(scripts.join("")).not.toContain("&lt;");
  });

  it("anche il CSS inline resta codice: i combinatori non diventano entità", () => {
    const html = renderSingleFileHtml(site, "/", { inline: true });
    const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1] ?? "").join("\n");

    expect(styles.length).toBeGreaterThan(1000);
    expect(styles).not.toContain("&gt;");
    expect(styles).not.toContain("&amp;");
    // Il CSS esportato come file e quello inline devono essere lo stesso testo.
    const file = renderSite(site).find((item) => item.path === "styles.css")?.contents.trim() ?? "";
    expect(file.length).toBeGreaterThan(1000);
    expect(file).toContain(" > ");
    expect(styles).toContain(file);
  });
});

describe("reimportazione del progetto", () => {
  const site = buildSite();

  it("il file esportato rientra nel progetto, identico", () => {
    const file = renderSite(site).find((item) => item.path === "progetto.atelier.json");
    expect(file).toBeDefined();

    const result = parseImportedSite(file!.contents);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.site.id).toBe(site.id);
    expect(result.site.theme.preset).toBe(site.theme.preset);
    expect(result.site.meta.structuralHash).toBe(site.meta.structuralHash);
    expect(renderSingleFileHtml(result.site)).toBe(renderSingleFileHtml(site));
  });

  it("un file corrotto viene rifiutato con un motivo leggibile", () => {
    const broken = parseImportedSite("{ non è json }");
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.error).toContain("JSON");

    const wrongShape = parseImportedSite(JSON.stringify({ ciao: true }));
    expect(wrongShape.ok).toBe(false);
    if (!wrongShape.ok) expect(wrongShape.error).toContain("progetto Atelier");

    const empty = parseImportedSite("   ");
    expect(empty.ok).toBe(false);
  });

  it("accetta anche un oggetto che contiene il progetto", () => {
    const wrapped = parseImportedSite(JSON.stringify({ version: 2, site }));
    expect(wrapped.ok).toBe(true);
    if (wrapped.ok) expect(wrapped.site.id).toBe(site.id);
  });

  it("il nome del file di progetto è prevedibile", () => {
    expect(projectFileName(site)).toBe(`${site.slug}.atelier.json`);
  });
});

describe("export statico", () => {
  const site = withDomain(buildSite());

  it("produce tutti i file necessari a pubblicare", () => {
    const paths = renderSite(site).map((file) => file.path);
    for (const required of [
      "index.html",
      "styles.css",
      "tokens.css",
      "site.js",
      "favicon.svg",
      "og-image.svg",
      "sitemap.xml",
      "robots.txt",
      "llms.txt",
      "vercel.json",
      "netlify.toml",
      "_headers",
      "README.md",
      "404.html",
      "progetto.atelier.json",
    ]) {
      expect(paths, `manca ${required}`).toContain(required);
    }
    expect(paths).toContain(pageFileName(site.pages[1]!));
  });

  it("è deterministico: due esecuzioni identiche producono gli stessi byte", () => {
    const first = JSON.stringify(renderSite(site));
    const second = JSON.stringify(renderSite(site));
    expect(second).toBe(first);
  });

  it("usa link relativi, così il sito si apre anche dal file system", () => {
    const files = renderSite(site);
    for (const file of files.filter((item) => item.kind === "html")) {
      expect(/(href|src)="\/(?!\/)/.test(file.contents), `${file.path} contiene un link assoluto`).toBe(false);
    }
    const nested = files.find((file) => file.path.includes("/") && file.kind === "html");
    expect(nested?.contents).toContain("../styles.css");
  });

  it("non contiene markup eseguibile oltre a site.js e ai dati strutturati", () => {
    for (const file of renderSite(site).filter((item) => item.kind === "html")) {
      const check = containsExecutableMarkup(file.contents);
      expect(check.safe, `${file.path}: ${check.reasons.join(", ")}`).toBe(true);
    }
  });

  it("relativizza correttamente i percorsi a diverse profondità", () => {
    expect(relativizeLinks('<a href="/contatti">x</a>', 0)).toContain('href="contatti/index.html"');
    expect(relativizeLinks('<a href="/">x</a>', 1)).toContain('href="../index.html"');
    expect(relativizeLinks('<link href="/styles.css">', 2)).toContain('href="../../styles.css"');
    expect(relativizeLinks('<a href="https://example.com">x</a>', 1)).toContain('href="https://example.com"');
  });

  it("omette canonical e sitemap quando il dominio non e impostato", () => {
    const noDomain = buildSite();
    const files = renderSite(noDomain);
    const home = files.find((file) => file.path === "index.html")!;
    expect(home.contents).not.toContain('rel="canonical"');
    expect(home.contents).not.toContain("example.com");
    expect(files.some((file) => file.path === "sitemap.xml")).toBe(false);
  });

  it("include SEO, dati strutturati e file per i crawler AI", () => {
    const files = renderSite(site);
    const home = files.find((file) => file.path === "index.html")!;
    expect(home.contents).toContain('application/ld+json');
    expect(home.contents).toContain('rel="canonical"');
    expect(home.contents).toContain('property="og:image"');

    const sitemap = files.find((file) => file.path === "sitemap.xml")!;
    expect(sitemap.contents).toContain("<urlset");
    expect(sitemap.contents).toContain("/contatti");

    const llms = files.find((file) => file.path === "llms.txt")!;
    expect(llms.contents).toContain("# ");
    expect(llms.contents).toContain("## Pagine principali");
  });

  it("il file singolo è autosufficiente", () => {
    const single = renderSingleFileHtml(site, "/");
    expect(single).toContain("<style>");
    expect(single).toContain("--primary:");
    expect(single).not.toContain('href="/styles.css"');
    expect(single).toContain("atl-motion");
  });

  it("genera le pagine delle raccolte, così nessun link resta appeso", () => {
    const withBlog = buildSite({ prompt: "Software gestionale per studi medici con appuntamenti e referti" });
    const paths = renderSite(withBlog).map((file) => file.path);
    expect(withBlog.collections.length).toBeGreaterThan(0);
    for (const article of withBlog.collections[0]!.items) {
      expect(paths).toContain(`blog/${article.id}/index.html`);
    }
  });

  it("rispetta l'anteprima: la stessa funzione alimenta editor ed export", () => {
    const fromZip = renderSite(site).find((file) => file.path === "index.html")!.contents;
    const direct = renderPageHtml(site, site.pages[0]!, { relativize: true });
    expect(direct).toBe(fromZip);
  });
});
