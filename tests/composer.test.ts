import { describe, expect, it } from "vitest";
import { composeSite } from "@/lib/compiler/offline-composer";
import { detectSector } from "@/lib/compiler/sector-profiles";
import { structuralSignature, checkUniqueness } from "@/lib/compiler/uniqueness";
import { auditThemeContrast, buildThemeTokens } from "@/lib/design/tokens";
import { contrastRatio, ensureContrast, oklchToRgb } from "@/lib/design/oklch";
import { BriefSchema } from "@/lib/schema/site";
import { buildBlock } from "@/lib/schema/registry";
import { collectText } from "@/lib/render/node";
import { SECTOR_PROFILES } from "@/lib/compiler/sector-profiles";
import type { Sector, Site } from "@/lib/schema/site";
import { resolveTheme } from "@/lib/export/tokens-css";

const NOW = "2026-09-26T10:00:00.000Z";

function site(prompt: string, extra: Record<string, unknown> = {}) {
  return composeSite(BriefSchema.parse({ prompt, ...extra }), { now: NOW });
}

describe("riconoscimento del settore", () => {
  const cases: [string, string][] = [
    ["Pizzeria napoletana a Milano con forno a legna", "restaurant"],
    ["Studio legale a Roma specializzato in diritto del lavoro", "legal"],
    ["Studio dentistico a Torino con impianti e ortodonzia", "medical"],
    ["Personal trainer a Firenze esperto in dimagrimento", "fitness"],
    ["Software gestionale per studi medici", "saas"],
    ["Negozio online di ceramiche artigianali", "ecommerce"],
    ["Agenzia di comunicazione a Padova", "agency"],
    ["Falegnameria artigiana a Verona", "artisan"],
    // Un sopralluogo in un appartamento da ristrutturare non fa di un architetto
    // un'agenzia immobiliare: lo studio deve restare tale.
    ["Studio di architettura a Bologna specializzato in ristrutturazioni di appartamenti storici", "architecture"],
    ["Interior design per uffici a Milano", "architecture"],
    ["Impresa di ristrutturazioni a Monza", "artisan"],
    ["Agenzia immobiliare a Bari", "realestate"],
    ["Scuola di inglese a Bologna", "education"],
    ["Consulenza aziendale generica", "generic"],
  ];

  for (const [prompt, expected] of cases) {
    it(`"${prompt.slice(0, 32)}…" → ${expected}`, () => {
      expect(detectSector(prompt).sector).toBe(expected);
    });
  }
});

describe("composer deterministico (nessuna rete, nessuna chiave)", () => {
  const pizza = site("Pizzeria napoletana a Milano con forno a legna e menu senza glutine");

  it("genera un sito completo di più pagine", () => {
    expect(pizza.pages.length).toBeGreaterThanOrEqual(6);
    for (const page of pizza.pages) {
      expect(page.blocks.length).toBeGreaterThanOrEqual(3);
      expect(page.seo.title.length).toBeGreaterThan(8);
      expect(page.seo.description.length).toBeGreaterThan(50);
    }
    expect(pizza.meta.generatedBy).toBe("offline-composer");
  });

  it("non lascia mai contenuti vuoti o segnaposto", () => {
    const violations: string[] = [];
    for (const page of pizza.pages) {
      for (const block of page.blocks) {
        const text = collectText(buildBlock(block, { site: pizza, page, ...resolveTheme(pizza) }));
        if (/lorem|ipsum|segnaposto|da compilare|placeholder/i.test(text)) {
          violations.push(`${page.path} · ${block.type}: ${text.slice(0, 140)}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("include dati di contatto e pagine legali reali", () => {
    const privacy = pizza.pages.find((page) => page.path === "/privacy")!;
    const cookie = pizza.pages.find((page) => page.path === "/cookie")!;
    expect(privacy.kind).toBe("legal");
    expect(cookie.kind).toBe("legal");
    const withEmail = site("Pizzeria napoletana a Milano", { contacts: { email: "info@pizzeria.it" } });
    expect(withEmail.brand.contact.email).toContain("@");
    expect(pizza.brand.contact.email).toBe("");
  });

  it("è riproducibile: stesso brief, stesso sito", () => {
    const again = site("Pizzeria napoletana a Milano con forno a legna e menu senza glutine");
    expect(JSON.stringify(again)).toBe(JSON.stringify(pizza));
  });

  it("varia la firma strutturale cambiando la variazione", () => {
    const first = structuralSignature(composeSite(BriefSchema.parse({ prompt: "Pizzeria napoletana a Milano" }), { now: NOW, variation: 0 }));
    const second = structuralSignature(composeSite(BriefSchema.parse({ prompt: "Pizzeria napoletana a Milano" }), { now: NOW, variation: 1 }));
    expect(second).not.toBe(first);
  });

  it("usa il nome e la città indicati nel brief", () => {
    const named = site("Studio di architettura", { businessName: "Atelier Nord", contacts: { city: "Bologna" } });
    expect(named.businessName).toBe("Atelier Nord");
    expect(named.brand.contact.city).toBe("Bologna");
    expect(named.pages[0]!.seo.title).toContain("Bologna");
  });
});

describe("unicità fra siti generati", () => {
  it("dieci brief dello stesso settore danno dieci strutture diverse", () => {
    const prompts = [
      "Pizzeria a Milano",
      "Trattoria a Roma con cucina romana",
      "Osteria a Bologna specializzata in vini",
      "Ristorante di pesce a Bari",
      "Bistrot a Torino",
      "Gelateria artigianale a Firenze",
      "Panetteria a Napoli",
      "Sushi bar a Milano",
      "Osteria vegana a Padova",
      "Cucina tipica a Lecce",
    ];

    const signatures = prompts.map((prompt) => structuralSignature(site(prompt)));
    const unique = new Set(signatures);
    expect(unique.size).toBe(prompts.length);
  });

  it("rileva una collisione quando la firma è già presente", () => {
    const candidate = site("Pizzeria a Milano");
    const report = checkUniqueness(candidate, [{ id: "altro-sito", signature: structuralSignature(candidate) }]);
    expect(report.unique).toBe(false);
    expect(report.collidesWith).toBe("altro-sito");
  });
});

describe("voce del settore", () => {
  /** Tutto il testo che una persona legge davvero, pagina per pagina. */
  function spokenText(site: Site): string {
    const resolved = resolveTheme(site);
    return site.pages
      .flatMap((page) => page.blocks.map((block) => collectText(buildBlock(block, { site, page, ...resolved }))))
      .join("\n");
  }

  const cases: { prompt: string; must: RegExp; mustNot: RegExp }[] = [
    // Il ristorante non deve parlare di cantieri né di preventivi da concordare.
    { prompt: "Pizzeria napoletana a Milano con forno a legna", must: /prenota un tavolo/i, mustNot: /sopralluogo|preventiv|incaric|cantiere|consulenz/i },
    { prompt: "Studio legale a Roma specializzato in diritto del lavoro", must: /pratic|incaric/i, mustNot: /cantiere|menù|allenament/i },
    { prompt: "Studio dentistico a Torino con impianti", must: /visit|pazient/i, mustNot: /sopralluogo|cantiere|provvigion/i },
    { prompt: "Personal trainer a Firenze esperto in dimagrimento", must: /allenament|sala/i, mustNot: /sopralluogo|preventiv|cantiere|pratic/i },
    { prompt: "Software gestionale per studi medici", must: /prova|utent/i, mustNot: /sopralluogo|preventiv|cantiere|menù/i },
    { prompt: "Negozio online di ceramiche artigianali", must: /ordine|spedizion/i, mustNot: /sopralluogo|preventiv|cantiere|pazient/i },
    { prompt: "Agenzia di comunicazione a Padova", must: /campagn|obiettiv/i, mustNot: /sopralluogo|cantiere|pazient|ricovero/i },
    // L'artigiano invece sopralluogo e preventivo li usa davvero: il test verifica
    // che li usi LUI, non che spariscano da tutti.
    { prompt: "Falegnameria artigiana a Verona", must: /sopralluogo|preventivo/i, mustNot: /pazient|ricovero|utente\/mese|campagn/i },
    { prompt: "Agenzia immobiliare a Bari", must: /valutazione|immobil/i, mustNot: /cantiere|pazient|allenament/i },
    { prompt: "Studio di architettura a Bologna specializzato in ristrutturazioni", must: /sopralluogo|progett/i, mustNot: /pazient|allenament|annunc/i },
    { prompt: "Scuola di inglese a Bologna", must: /modul|lezion/i, mustNot: /sopralluogo|cantiere|preventiv/i },
    { prompt: "Consulenza aziendale generica", must: /preventivo/i, mustNot: /lorem|ipsum|pazient|menù/i },
  ];

  for (const { prompt, must, mustNot } of cases) {
    it(`"${prompt.slice(0, 28)}…" parla la lingua del suo settore`, () => {
      const text = spokenText(site(prompt));
      expect(text).toMatch(must);
      const leaked = mustNot.exec(text);
      expect(leaked === null, `espressione fuori contesto: "${leaked?.[0]}"`).toBe(true);
    });
  }

  it("ogni settore ha la sua voce: nessun profilo ripete quella generica", () => {
    const generic = SECTOR_PROFILES.generic.voice;
    for (const [sector, profile] of Object.entries(SECTOR_PROFILES) as [Sector, (typeof SECTOR_PROFILES)[Sector]][]) {
      if (sector === "generic") continue;
      for (const [field, value] of Object.entries(profile.voice) as [string, string][]) {
        expect(value, `${sector}.${field} usa ancora la voce generica`).not.toBe(
          (generic as Record<string, string>)[field],
        );
      }
    }
  });
});

describe("colore e contrasto", () => {
  it("converte OKLCH in RGB senza uscire dallo spazio colore", () => {
    const rgb = oklchToRgb({ l: 0.7, c: 0.15, h: 250 });
    for (const channel of [rgb.r, rgb.g, rgb.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    }
  });

  it("corregge un colore fino al contrasto richiesto", () => {
    const background = { l: 0.98, c: 0, h: 0 };
    const weak = { l: 0.9, c: 0.05, h: 200 };
    expect(contrastRatio(weak, background)).toBeLessThan(4.5);
    const fixed = ensureContrast(weak, background, 4.5);
    expect(contrastRatio(fixed, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("ogni tema generato rispetta il contrasto AA, in chiaro e in scuro", () => {
    for (const prompt of ["Pizzeria a Milano", "Studio legale a Roma", "Palestra a Torino"]) {
      const generated = site(prompt);
      for (const mode of ["light", "dark"] as const) {
        const tokens = buildThemeTokens(generated.theme.palette, mode);
        for (const pair of auditThemeContrast(tokens)) {
          expect(pair.ok, `${prompt} (${mode}) → ${pair.pair} = ${pair.ratio}:1`).toBe(true);
        }
      }
    }
  });
});
