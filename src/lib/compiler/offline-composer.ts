import { FONT_PAIRINGS, type StylePreset } from "@/lib/design/tokens";
import { pickStyleVariant, styleBrief } from "@/lib/design/style-briefs";
import { buildPalette, hashString, mulberry32 } from "@/lib/design/oklch";
import { SECTOR_PROFILES, detectSector, type SectorProfile } from "@/lib/compiler/sector-profiles";
import { mk, link, art, resetBlockCounter } from "@/lib/compiler/compose-helpers";
import { structuralSignature } from "@/lib/compiler/uniqueness";
import { resetBlockIds, slugify, type Block, type Brief, type Site } from "@/lib/schema/site";

/**
 * Composer deterministico.
 *
 * Genera un sito completo — testo, palette, tipografia, struttura, SEO, pagine
 * legali — senza rete e senza chiavi. Stesso brief ⇒ stesso sito (riproducibile);
 * brief diversi ⇒ hash strutturali diversi (verificato dai test).
 *
 * È la garanzia che Atelier funzioni sempre. L'AI, quando c'è, riscrive i
 * contenuti: la struttura e la qualità minima restano queste.
 */

const CITY_HINTS = [
  "milano", "roma", "napoli", "torino", "bologna", "firenze", "genova", "palermo", "bari", "catania",
  "venezia", "verona", "messina", "padova", "trieste", "brescia", "parma", "prato", "modena", "reggio calabria",
  "reggio emilia", "perugia", "livorno", "ravenna", "cagliari", "foggia", "rimini", "salerno", "ferrara", "sassari",
  "latina", "giugliano", "monza", "siracusa", "pescara", "bergamo", "forlì", "trento", "vicenza", "terni",
  "bolzano", "novara", "piacenza", "ancona", "andria", "arezzo", "udine", "cesena", "lecce", "pesaro",
  "barletta", "alessandria", "la spezia", "pistoia", "pisa", "catanzaro", "guidonia", "lucca", "brindisi", "torre del greco",
];

const PRESET_PAIRINGS: Record<StylePreset, string[]> = {
  editorial: ["playfair-source", "fraunces-lato", "archivo-ibm"],
  luxury: ["libre-frank", "playfair-source"],
  brutalist: ["archivo-ibm", "jetbrains-work"],
  glass: ["bricolage-manrope", "grotesk-inter"],
  minimal: ["grotesk-inter", "dm-serif-dm-sans"],
  tech: ["jetbrains-work", "grotesk-inter"],
  organic: ["fraunces-lato", "dm-serif-dm-sans"],
  retro: ["jetbrains-work", "archivo-ibm"],
};

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => (word.length > 2 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** Prova a ricavare il nome dell'attività dal prompt, senza inventare troppo. */
function inferBusinessName(prompt: string, sectorLabel: string): string {
  const cleaned = prompt.replace(/["']/g, " ").replace(/\s+/g, " ").trim();
  const patterns = [
    /(?:si chiama|chiamato|chiamata|nome(?: è|:)?)\s+([^,.;]{2,40})/i,
    /(?:per|di)\s+([A-ZÀ-Ù][\w'’&.\- ]{2,40})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(cleaned);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value.split(" ").length <= 5) return titleCase(value);
    }
  }
  return titleCase(sectorLabel);
}

function inferCity(prompt: string, fallback: string): string {
  if (fallback) return fallback;
  const text = prompt.toLowerCase();
  const found = CITY_HINTS.find((city) => text.includes(city));
  return found ? titleCase(found) : "";
}

function pickPairing(preset: StylePreset, seed: number): string {
  const options = PRESET_PAIRINGS[preset] ?? ["grotesk-inter"];
  const random = mulberry32(seed);
  return options[Math.floor(random() * options.length)] ?? FONT_PAIRINGS[0].id;
}

export type ComposeOptions = {
  /** Data di creazione/modifica: esplicita nei test, reale in produzione. */
  now?: string;
  /** Cambia la variante creativa mantenendo lo stesso brief. */
  variation?: number;
};

export function composeSite(input: Brief, options: ComposeOptions = {}): Site {
  // Entrambe le sequenze ripartono da zero: stesso brief ⇒ stessi ID.
  resetBlockCounter();
  resetBlockIds();
  const now = options.now ?? new Date().toISOString();
  const variation = options.variation ?? 0;

  const detection = detectSector(input.prompt);
  const sector = input.sector !== "generic" ? input.sector : detection.sector;
  const profile: SectorProfile = SECTOR_PROFILES[sector] ?? SECTOR_PROFILES.generic;

  const businessName =
    input.businessName.trim() ||
    inferBusinessName(input.prompt, profile.label) ||
    titleCase(profile.label);
  const city = inferCity(input.prompt, input.contacts.city);
  const seed = hashString(`${input.prompt}|${businessName}|${variation}`);

  const palette = buildPalette({
    seed,
    harmony: profile.paletteHarmony,
    primaryL: profile.primaryL,
  });
  const preset: StylePreset = input.stylePreset ?? profile.preset;
  // Lo stile non è solo un vestito: decide anche quali varianti di sezione gli
  // sono coerenti. Il brief restringe il campo, il seme sceglie dentro il campo
  // (deterministico come prima, ma senza accostamenti fuori carattere).
  const brief = styleBrief(preset);
  const fontPairing = pickPairing(preset, seed);
  const random = mulberry32(seed ^ 0x9e3779b9);
  const heroVariant = pickStyleVariant(brief.heroVariants, random);
  const featuresVariant = pickStyleVariant(brief.featuresVariants, random);

  const slug = slugify(businessName);
  const contact = {
    email: input.contacts.email.trim(),
    phone: input.contacts.phone || "",
    address: input.contacts.address || "",
    city,
    vat: "",
  };

  const navLinks = [
    link(profile.navLabels.services, profile.pages[0]?.path ?? "/servizi"),
    link(profile.navLabels.about, profile.pages[1]?.path ?? "/chi-siamo"),
    ...(profile.navLabels.blog ? [link(profile.navLabels.blog, "/blog")] : []),
    link("Contatti", "/contatti"),
  ];

  const ctaContact = link(profile.voice.ctaLabel, "/contatti", "primary");
  const sectorWord = profile.label;

  // La frase sulla zona ha senso solo se il brief indica una città e solo per i
  // settori con un bacino locale: per un software "serviamo Milano e provincia"
  // non vuol dire niente.
  const areaClause = city && profile.voice.areaClause ? profile.voice.areaClause.replace("{city}", city) : "";
  const withArea = (text: string) =>
    text
      .replace(/\{area\}/g, areaClause ? ` ${areaClause}` : "")
      .replace(/\s+([.,;:])/g, "$1")
      .trimEnd();

  // ---------- Blocchi per pagina ----------
  const navbar = mk("navbar", preset === "glass" ? "classic" : preset === "luxury" ? "centered" : "classic", {
    links: navLinks,
    cta: ctaContact,
    sticky: preset !== "luxury",
  });

  const footer = mk("footer", "columns", {
    note: `${businessName}${city ? ` — ${city}` : ""}. ${profile.tagline}`,
    columns: [
      {
        title: "Navigazione",
        links: navLinks.slice(0, 4),
      },
      {
        title: profile.navLabels.services,
        links: profile.services.slice(0, 4).map((service, index) => link(service.title, `/servizi#servizio-${index + 1}`)),
      },
    ],
    legalLinks: [link("Privacy", "/privacy"), link("Cookie", "/cookie"), link("Preferenze cookie", "#preferenze-cookie")],
    contacts: true,
  });

  const cookieBanner = mk("notice", "cookie", {
    privacyLink: link("Privacy", "/privacy"),
    cookieLink: link("Cookie policy", "/cookie"),
  });

  function heroBlocks(title: string, subtitle: string, eyebrowText: string): Block[] {
    return [
      mk(
        "hero",
        heroVariant,
        {
          eyebrow: eyebrowText,
          title,
          subtitle,
          primaryCta: ctaContact,
          secondaryCta: link(`Scopri ${profile.navLabels.services.toLowerCase()}`, profile.pages[0]?.path ?? "/servizi", "secondary"),
          image: {
            alt: `${businessName}: immagine di apertura`,
            art: art(seed % 97, palette.primary.h, heroVariant === "editorial" ? "stripes" : "mesh", 0.62),
          },
          badges: profile.features.map((feature) => feature.title).slice(0, 3),
          stats: profile.stats.slice(0, 3).map((stat) => ({ value: stat.value, label: stat.label })),
        },
        { width: "default", background: heroVariant === "editorial" ? "muted" : "none" },
        "fade-up",
      ),
    ];
  }

  function serviceBlocks(): Block[] {
    return [
      mk(
        "features",
        featuresVariant,
        {
          eyebrow: "Cosa offriamo",
          // Diverso dal titolo dell'hero: due sezioni della stessa pagina non
          // possono dire la stessa frase.
          title: profile.voice.servicesTitle,
          intro: profile.voice.servicesIntro,
          items: profile.services,
          image: { alt: `Dettaglio del lavoro di ${businessName}`, art: art(11, palette.accent.h, "dots", 0.5) },
        },
        { anchor: "servizi" },
      ),
    ];
  }

  const homeBlocks: Block[] = [
    navbar,
    ...heroBlocks(profile.heading, profile.intro, `${city ? `${city} · ` : ""}${profile.label}`),
    mk("logos", "strip", { title: "Ci scelgono per", items: profile.features.map((feature) => feature.title) }, { space: "compact" }, "fade"),
    ...serviceBlocks(),
    mk(
      "stats",
      "cards",
      { eyebrow: "Risultati", title: profile.voice.statsTitle, items: profile.stats },
      { background: "muted" },
      "fade-up",
    ),
    mk("steps", "timeline", { eyebrow: "Come lavoriamo", title: "Il percorso, passo per passo", items: profile.process }),
    mk(
      "testimonials",
      random() > 0.5 ? "cards" : "feature",
      { eyebrow: "Chi ci ha scelto", title: "Recensioni dei clienti", items: profile.testimonials },
      { background: "elevated" },
      "fade-up",
    ),
    mk(
      "gallery",
      "grid",
      {
        eyebrow: "Galleria",
        title: "Alcuni lavori",
        columns: 3,
        images: profile.galleryCaptions.slice(0, 6).map((caption, index) => ({
          alt: `${caption} — ${businessName}`,
          art: art(seed + index * 13, palette.primary.h + index * 21, (["mesh", "stripes", "dots", "waves", "grid"] as const)[index % 5], 0.5),
        })),
      },
      { width: "wide" },
    ),
    mk(
      "pricing",
      sector === "restaurant" || sector === "medical" ? "list" : "tiers",
      { eyebrow: "Tariffe", title: "Prezzi trasparenti", intro: "Senza costi nascosti: quello che leggi è quello che paghi.", plans: profile.plans, note: profile.voice.pricingNote },
      { background: "muted" },
      "fade-up",
    ),
    mk("faq", "accordion", {
      eyebrow: "Domande frequenti",
      title: "Le risposte alle domande che ci fanno più spesso",
      items: profile.faq,
    }),
    mk(
      "cta",
      "banner",
      {
        eyebrow: "Il prossimo passo",
        title: profile.voice.ctaTitle,
        text: withArea(profile.voice.ctaText),
        primaryCta: ctaContact,
        secondaryCta: contact.phone ? link(contact.phone, `tel:${contact.phone.replace(/[^+\d]/g, "")}`, "secondary") : undefined,
      },
      { background: "primary" },
      "zoom",
    ),
    footer,
    cookieBanner,
  ];

  const servicesPage: Block[] = [
    navbar,
    ...heroBlocks(
      profile.navLabels.services,
      `Tutto quello che facciamo per ${sectorWord === profile.label ? "i nostri clienti" : sectorWord}, spiegato senza giri di parole.`,
      "Servizi",
    ),
    mk("features", "alternating", {
      eyebrow: "Nel dettaglio",
      title: `I nostri ${profile.navLabels.services.toLowerCase()}`,
      intro: profile.intro,
      items: profile.services,
    }),
    mk("pricing", "tiers", {
      eyebrow: "Tariffe",
      title: "Quanto costa",
      plans: profile.plans,
      note: profile.voice.pricingNote,
    }, { background: "muted" }),
    mk("faq", "two-column", { eyebrow: "Dubbi comuni", title: "Domande frequenti", items: profile.faq.slice(0, 4) }),
    mk("cta", "banner", {
      title: profile.voice.servicesCtaTitle,
      text: withArea(profile.voice.servicesCtaText),
      primaryCta: ctaContact,
    }, { background: "accent" }),
    footer,
    cookieBanner,
  ];

  const aboutPage: Block[] = [
    navbar,
    ...heroBlocks(
      city ? `A ${city} dal primo giorno, con le persone giuste` : `Chi siamo, senza la solita retorica`,
      profile.tagline,
      "Chi siamo",
    ),
    mk("richtext", "prose", {
      eyebrow: "La nostra storia",
      title: "Come lavoriamo davvero",
      paragraphs: [
        `${businessName} nasce con un'idea semplice: ${profile.intro.toLowerCase()}`,
        profile.voice.aboutMethod,
        profile.voice.aboutTeam,
      ],
      bullets: profile.features.map((feature) => `${feature.title}: ${feature.text}`),
      columns: 1,
    }),
    mk("team", "grid", {
      eyebrow: "Le persone",
      title: "Chi troverai al lavoro",
      people: profile.teamRoles.map((role, index) => ({
        name: ["Andrea", "Chiara", "Marco", "Giulia", "Luca", "Sara"][index % 6] + " " + ["Rossi", "Bianchi", "Conti", "Ferrari", "Greco", "Romano"][(index + seed) % 6],
        role,
        bio: profile.voice.bioTemplate.replace("{role}", role),
        image: { alt: `Ritratto del componente del team: ${role}`, art: art(seed + index * 5, palette.accent.h + index * 30, "mesh", 0.4) },
        email: "",
      })),
    }, { background: "muted" }, "fade-up"),
    mk("testimonials", "feature", { title: "Cosa dicono di noi", items: profile.testimonials }, { align: "center" }),
    mk("stats", "cards", { title: "In numeri", items: profile.stats }, { background: "elevated" }),
    mk("cta", "banner", { title: profile.voice.ctaTitle, text: withArea(profile.voice.ctaText), primaryCta: ctaContact }, { background: "primary" }),
    footer,
    cookieBanner,
  ];

  const contactPage: Block[] = [
    navbar,
    ...heroBlocks("Come contattarci", "Rispondiamo entro un giorno lavorativo, con le domande utili a capire se possiamo esserti utile.", "Contatti"),
    mk("contact", "split", {
      eyebrow: "Scrivici",
      title: profile.voice.contactTitle,
      intro: "Più dettagli ci dai, più precisa sarà la nostra risposta. Nessun dato viene usato per altro.",
      formMode: "mailto",
      fields: ["name", "email", "phone", "city", "message"],
      privacyNote: "Inviando il modulo dichiari di aver letto l'informativa privacy. Nessun dato viene ceduto a terzi.",
      showChannels: true,
    }, { background: "muted" }),
    mk("richtext", "prose", {
      eyebrow: "Dove siamo",
      title: contact.address || city ? `Ci trovi a ${[contact.address, city].filter(Boolean).join(", ")}` : "Come raggiungerci",
      paragraphs: [
        contact.phone ? `Telefono: ${contact.phone}` : "Il modo più rapido è il modulo qui sopra.",
        contact.email ? `Email: ${contact.email}` : "Ti risponderemo via email.",
        profile.voice.contactNote,
      ],
      bullets: [],
      columns: 2,
    }),
    footer,
    cookieBanner,
  ];

  const blogPage: Block[] = [
    navbar,
    ...heroBlocks("Blog e aggiornamenti", "Approfondimenti utili, senza articoli riempiti tanto per pubblicare.", "Blog"),
    mk("posts", "list", { title: "Ultimi articoli", collectionId: "articles", limit: 6, basePath: "/blog" }),
    footer,
    cookieBanner,
  ];

  const articles = profile.hasBlog
    ? [
        {
          id: "come-scegliere",
          title: `Come scegliere un partner di cui fidarsi: cinque domande`,
          excerpt: "Le domande che distinguono chi lavora con metodo da chi promette troppo, con le risposte da aspettarsi.",
          date: now.slice(0, 10),
          author: businessName,
          tag: "Guida",
          body: `Chiedere un piano scritto non è diffidenza, è metodo. Un piano dettagliato protegge entrambe le parti e chiarisce subito se le aspettative sono compatibili.\n\nLa seconda domanda riguarda i tempi: non "quanto ci vuole?" ma "cosa succede se ci vuole di più?". Chi ha una risposta pronta ha già affrontato il problema.\n\nTerza: chi lavora davvero al progetto? Se la persona che firma non sarà quella che lo esegue, è meglio saperlo prima.\n\nQuarta: cosa è incluso e cosa no. Le voci escluse sono la causa più comune di discussioni a lavoro iniziato.\n\nQuinta: che garanzie ci sono e per quanto. Se non sono scritte, non esistono.`,
        },
        {
          id: "preventivo-giusto",
          title: "Quanto deve costare? Come leggere una proposta",
          excerpt: "Tre voci che non dovrebbero mai mancare e il segnale che distingue una proposta fatta bene da una scritta in fretta.",
          date: now.slice(0, 10),
          author: businessName,
          tag: "Prezzi",
          body: `Una proposta utile si legge in due minuti. Se serve mezz'ora per capire cosa comprende, il problema non è chi la legge.\n\nLa prima voce da cercare è la descrizione del lavoro: cosa viene fatto, con quali strumenti o materiali e con quale livello di dettaglio.\n\nLa seconda è la tempistica: data di inizio, durata prevista e condizioni che potrebbero spostarla.\n\nLa terza sono le esclusioni: quello che non è compreso è spesso la voce che fa crescere il conto finale.\n\nSe la proposta è vaga su questi tre punti, chiedete un'integrazione scritta prima di iniziare.`,
        },
        {
          id: "errori-comuni",
          title: "Tre errori che fanno perdere tempo e denaro",
          excerpt: "Cosa abbiamo imparato gestendo centinaia di richieste: gli errori si ripetono sempre uguali.",
          date: now.slice(0, 10),
          author: businessName,
          tag: "Consigli",
          body: `Il primo errore è decidere il budget dopo aver chiesto le proposte. Senza un tetto di spesa non si confrontano offerte, si confrontano desideri.\n\nIl secondo è rimandare le decisioni che bloccano il lavoro: ogni giorno di attesa su una scelta si scarica sulla consegna.\n\nIl terzo è non documentare lo stato di partenza. Una foto, una misura o uno screenshot presi all'inizio evitano quasi tutte le discussioni successive.`,
        },
      ]
    : [];

  const pages: Site["pages"] = [
    {
      id: "home",
      path: "/",
      title: "Home",
      kind: "home",
      seo: {
        title: `${businessName}${city ? ` a ${city}` : ""} — ${profile.label}`,
        description: `${profile.tagline} ${profile.intro.slice(0, 110)}`.slice(0, 158),
        keywords: [sectorWord, city].filter(Boolean),
        noindex: false,
      },
      blocks: homeBlocks,
    },
    {
      id: "services",
      path: profile.pages[0]?.path ?? "/servizi",
      title: profile.pages[0]?.title ?? profile.navLabels.services,
      kind: "page",
      seo: {
        title: `${profile.pages[0]?.title ?? profile.navLabels.services} — ${businessName}`,
        description: `${profile.services.map((service) => service.title).slice(0, 5).join(", ")}. ${city ? `Servizio a ${city} e provincia.` : ""}`.slice(0, 158),
        keywords: profile.services.map((service) => service.title.toLowerCase()),
        noindex: false,
      },
      blocks: servicesPage,
    },
    {
      id: "about",
      path: profile.pages[1]?.path ?? "/chi-siamo",
      title: profile.pages[1]?.title ?? profile.navLabels.about,
      kind: "page",
      seo: {
        title: `${profile.pages[1]?.title ?? profile.navLabels.about} — ${businessName}`,
        description: `${profile.tagline} Scopri come lavoriamo, chi siamo e con quali garanzie.`.slice(0, 158),
        keywords: ["chi siamo", sectorWord],
        noindex: false,
      },
      blocks: aboutPage,
    },
    ...(profile.hasBlog
      ? [
          {
            id: "blog",
            path: "/blog",
            title: "Blog",
            kind: "page" as const,
            seo: {
              title: `Blog — ${businessName}`,
              description: "Approfondimenti, guide e consigli pratici dal nostro lavoro quotidiano.",
              keywords: ["blog", sectorWord],
              noindex: false,
            },
            blocks: blogPage,
          },
        ]
      : []),
    {
      id: "contact",
      path: "/contatti",
      title: "Contatti",
      kind: "page",
      seo: {
        title: `Contatti — ${businessName}${city ? ` ${city}` : ""}`,
        description: `${profile.voice.contactTitle}${city ? ` — ${city}` : ""}. ${contact.phone ? `Telefono ${contact.phone}. ` : ""}Risposta entro un giorno lavorativo.`,
        keywords: ["contatti", city].filter(Boolean),
        noindex: false,
      },
      blocks: contactPage,
    },
    {
      id: "privacy",
      path: "/privacy",
      title: "Privacy",
      kind: "legal",
      seo: {
        title: `Informativa privacy — ${businessName}`,
        description: "Come trattiamo i dati inviati tramite i moduli di contatto, quali sono le finalità e i diritti dell'interessato.",
        keywords: [],
        noindex: false,
      },
      blocks: [navbar, mk("legal", "document", { kind: "privacy", title: "Informativa privacy" }), footer],
    },
    {
      id: "cookie",
      path: "/cookie",
      title: "Cookie",
      kind: "legal",
      seo: {
        title: `Cookie policy — ${businessName}`,
        description: "Quali cookie usiamo, perché e come modificare le preferenze di consenso.",
        keywords: [],
        noindex: false,
      },
      blocks: [navbar, mk("legal", "document", { kind: "cookie", title: "Cookie policy" }), footer],
    },
  ];

  const site: Site = {
    schemaVersion: 1,
    id: `site-${slug}`,
    name: businessName,
    slug,
    businessName,
    sector,
    locale: "it-IT",
    brand: {
      name: businessName,
      initials: businessName
        .split(/\s+/)
        .map((word) => word[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      tagline: profile.tagline,
      logo: { kind: "monogram" },
      tone: { personality: input.tone, avoid: ["superlativo", "promesse assolute"] },
      contact,
      social: [],
    },
    theme: {
      preset,
      mode: preset === "brutalist" || preset === "retro" ? "dark" : "light",
      fontPairing,
      palette,
    },
    nav: { links: navLinks, cta: ctaContact },
    pages,
    collections: profile.hasBlog
      ? [{ id: "articles", name: "Articoli", kind: "articles", items: articles }]
      : [],
    meta: {
      generatedBy: "offline-composer",
      brief: input.prompt,
      domain: "",
      structuralHash: "",
      warnings: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  site.meta.structuralHash = structuralSignature(site);
  return site;
}
