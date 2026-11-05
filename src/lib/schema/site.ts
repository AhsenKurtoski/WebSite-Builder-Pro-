import { z } from "zod";

/**
 * Modello dati di Atelier.
 *
 * Principio: il tema NON memorizza i token finali, memorizza palette + preset +
 * accoppiamento tipografico. I token si derivano (design/tokens.ts), quindi un
 * restyle è un cambio di tre campi, non una riscrittura del documento.
 */

export const SECTORS = [
  "restaurant",
  "legal",
  "medical",
  "fitness",
  "saas",
  "ecommerce",
  "agency",
  "artisan",
  "architecture",
  "realestate",
  "education",
  "generic",
] as const;
export type Sector = (typeof SECTORS)[number];

export const STYLE_PRESET_NAMES = [
  "editorial",
  "luxury",
  "brutalist",
  "glass",
  "minimal",
  "tech",
  "organic",
  "retro",
] as const;

export const MOTIONS = ["none", "fade-up", "fade", "slide-left", "zoom"] as const;
export const WIDTHS = ["narrow", "default", "wide", "full"] as const;
export const BACKGROUNDS = ["none", "muted", "elevated", "primary", "accent", "art"] as const;
export const ART_STYLES = ["mesh", "stripes", "dots", "waves", "grid"] as const;

export const OklchSchema = z.object({
  l: z.number().min(0).max(1),
  c: z.number().min(0).max(0.4),
  h: z.number().min(0).max(360),
});

export const PaletteSchema = z.object({
  harmony: z.enum(["analogous", "complementary", "triadic", "split"]),
  primary: OklchSchema,
  accent: OklchSchema,
  neutral: OklchSchema,
});

/** Arte procedurale: riempie gli spazi immagine senza consumare quota API. */
export const ProceduralArtSchema = z.object({
  seed: z.number(),
  hue: z.number(),
  style: z.enum(ART_STYLES),
  intensity: z.number().min(0).max(1).default(0.5),
});

export const MediaSchema = z.object({
  alt: z.string(),
  src: z.string().optional(),
  art: ProceduralArtSchema.optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  caption: z.string().optional(),
});

export function isSafeHref(value: string): boolean {
  const href = value.trim();
  if (!href) return true;
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) return true;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(href);
}

export const LinkSchema = z.object({
  label: z.string(),
  href: z
    .string()
    .max(2048)
    .refine(isSafeHref, "Link non sicuro: sono ammessi solo percorsi, http(s), mailto e tel."),
  emphasis: z.enum(["primary", "secondary", "ghost", "link"]).default("link"),
  external: z.boolean().default(false),
});

export const BlockStyleSchema = z.object({
  width: z.enum(WIDTHS).default("default"),
  background: z.enum(BACKGROUNDS).default("none"),
  align: z.enum(["left", "center"]).default("left"),
  space: z.enum(["compact", "normal", "loose"]).default("normal"),
  hideOnMobile: z.boolean().default(false),
  anchor: z.string().optional(),
});

export const BlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  variant: z.string(),
  props: z.record(z.string(), z.unknown()),
  style: BlockStyleSchema.default({
    width: "default",
    background: "none",
    align: "left",
    space: "normal",
    hideOnMobile: false,
  }),
  motion: z.enum(MOTIONS).default("none"),
});

export const SeoSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonical: z.string().optional(),
  noindex: z.boolean().default(false),
  keywords: z.array(z.string()).default([]),
});

export const PageSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  kind: z.enum(["home", "page", "legal", "utility"]).default("page"),
  seo: SeoSchema,
  blocks: z.array(BlockSchema).default([]),
});

export const BrandSchema = z.object({
  name: z.string(),
  initials: z.string().max(3),
  tagline: z.string().default(""),
  logo: z
    .object({
      kind: z.enum(["monogram", "svg"]).default("monogram"),
      svg: z.string().optional(),
    })
    .default({ kind: "monogram" }),
  tone: z
    .object({
      personality: z.string().default("chiaro e professionale"),
      avoid: z.array(z.string()).default([]),
    })
    .default({ personality: "chiaro e professionale", avoid: [] }),
  contact: z
    .object({
      email: z.string().default(""),
      phone: z.string().default(""),
      address: z.string().default(""),
      city: z.string().default(""),
      vat: z.string().default(""),
    })
    .default({ email: "", phone: "", address: "", city: "", vat: "" }),
  social: z.array(LinkSchema).default([]),
});

export const ThemeSchema = z.object({
  preset: z.enum(STYLE_PRESET_NAMES).default("editorial"),
  mode: z.enum(["light", "dark"]).default("light"),
  fontPairing: z.string().default("grotesk-inter"),
  palette: PaletteSchema,
});

export const NavSchema = z.object({
  links: z.array(LinkSchema).default([]),
  cta: LinkSchema.optional(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  body: z.string().default(""),
  date: z.string(),
  author: z.string().default(""),
  tag: z.string().default(""),
});

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["articles", "products", "services", "projects"]),
  items: z.array(ArticleSchema).default([]),
});

export const SiteMetaSchema = z.object({
  generatedBy: z.enum(["offline-composer", "ai-compiler", "manual"]).default("manual"),
  provider: z.string().optional(),
  model: z.string().optional(),
  brief: z.string().default(""),
  /** Dominio pubblico: usato per canonical, sitemap e og:url. */
  domain: z.string().default(""),
  structuralHash: z.string().default(""),
  warnings: z.array(z.string()).default([]),
});

export const SiteSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  businessName: z.string(),
  sector: z.enum(SECTORS).default("generic"),
  locale: z.string().default("it-IT"),
  brand: BrandSchema,
  theme: ThemeSchema,
  nav: NavSchema,
  pages: z.array(PageSchema).min(1),
  collections: z.array(CollectionSchema).default([]),
  meta: SiteMetaSchema.default({
    generatedBy: "manual",
    brief: "",
    domain: "",
    structuralHash: "",
    warnings: [],
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Site = z.infer<typeof SiteSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type BlockStyle = z.infer<typeof BlockStyleSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Palette = z.infer<typeof PaletteSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type ProceduralArt = z.infer<typeof ProceduralArtSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type Collection = z.infer<typeof CollectionSchema>;

/** Brief normalizzato: l'ingresso di tutto il compilatore. */
export const BriefSchema = z.object({
  prompt: z.string().min(3),
  businessName: z.string().default(""),
  sector: z.enum(SECTORS).default("generic"),
  language: z.string().default("it"),
  tone: z.string().default("professionale"),
  stylePreset: z.enum(STYLE_PRESET_NAMES).optional(),
  pages: z.array(z.string()).default([]),
  contacts: z
    .object({
      email: z.string().default(""),
      phone: z.string().default(""),
      city: z.string().default(""),
      address: z.string().default(""),
    })
    .default({ email: "", phone: "", city: "", address: "" }),
});
export type Brief = z.infer<typeof BriefSchema>;

let idCounter = 0;

/**
 * Azzera la sequenza degli ID. Il composer la azzera a ogni esecuzione: senza
 * questo, due siti compilati nello stesso processo avrebbero ID diversi a
 * parità di brief (e i test giustamente falliscono).
 */
export function resetBlockIds(): void {
  idCounter = 0;
}

/** ID stabili e leggibili: nessuna dipendenza da crypto, deterministici nei test. */
export function blockId(type: string, index: number): string {
  idCounter += 1;
  return `${type}-${index}-${(idCounter % 100000).toString(36)}`;
}

/** Genera uno slug URL-safe. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "sito";
}
