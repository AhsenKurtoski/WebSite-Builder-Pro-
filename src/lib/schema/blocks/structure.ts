import { z } from "zod";
import { cls, el, raw, type Child, type El } from "@/lib/render/node";
import { icon } from "@/lib/render/icons";
import { LinkSchema } from "@/lib/schema/site";
import { sanitizeSvg } from "@/lib/quality/sanitize";
import { defineBlock } from "./types";
import { container, cta, section, telHref, mailHref, type BlockContext } from "./parts";

/** Marchio del sito: SVG sanitizzato oppure monogramma generato, mai un'immagine mancante. */
export function brandMark(ctx: BlockContext, size = 30): El {
  const { brand } = ctx.site;
  if (brand.logo.kind === "svg" && brand.logo.svg) {
    const clean = sanitizeSvg(brand.logo.svg);
    if (clean.ok && clean.svg) {
      return el("span", { class: "atl-mark atl-mark--svg" }, raw(clean.svg));
    }
  }
  return el(
    "span",
    { class: "atl-mark", "aria-hidden": "true" },
    el("span", { class: "atl-mark__initials" }, brand.initials || brand.name.slice(0, 2).toUpperCase()),
  );
}

const NavProps = z.object({
  links: z.array(LinkSchema).default([]),
  cta: LinkSchema.optional(),
  sticky: z.boolean().default(true),
});

export const navbarClassic = defineBlock({
  type: "navbar",
  variant: "classic",
  label: "Navigazione classica",
  category: "structure",
  description: "Logo a sinistra, voci di menu e pulsante d'azione a destra. Sticky su scroll.",
  schema: NavProps,
  defaults: NavProps.parse({ links: [] }),
  tags: ["nav", "menu", "header"],
  build: (props, ctx, block) =>
    el(
      "header",
      {
        class: cls(
          "atl-nav atl-nav--classic",
          props.sticky && "atl-nav--sticky",
          block.style.hideOnMobile && "atl-hide-mobile",
          block.motion !== "none" && "atl-motion",
        ),
        id: block.style.anchor,
        "data-nav": "true",
        "data-motion": block.motion !== "none" ? block.motion : undefined,
        "data-block": block.id,
      },
      container([
        el(
          "a",
          { class: "atl-nav__brand", href: "/" },
          brandMark(ctx),
          el("span", { class: "atl-nav__name" }, ctx.site.businessName),
        ),
        el(
          "button",
          { class: "atl-nav__toggle", type: "button", "data-nav-toggle": "true", "aria-expanded": "false", "aria-label": "Apri il menu" },
          icon("plus", 20),
        ),
        el(
          "nav",
          { class: "atl-nav__links", "aria-label": "Navigazione principale" },
          ...props.links.map((link) =>
            el("a", { class: "atl-nav__link", href: link.href, ...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {}) }, link.label),
          ),
          props.cta ? cta(props.cta) : null,
        ),
      ]),
    ),
});

export const navbarCentered = defineBlock({
  type: "navbar",
  variant: "centered",
  label: "Navigazione centrata",
  category: "structure",
  description: "Marchio su una riga, voci di menu centrate sotto: adatto a studi e attività di prestigio.",
  schema: NavProps,
  defaults: NavProps.parse({ links: [], sticky: false }),
  tags: ["nav", "menu", "centered"],
  build: (props, ctx, block) =>
    el(
      "header",
      {
        class: cls(
          "atl-nav atl-nav--centered",
          props.sticky && "atl-nav--sticky",
          block.style.hideOnMobile && "atl-hide-mobile",
          block.motion !== "none" && "atl-motion",
        ),
        id: block.style.anchor,
        "data-nav": "true",
        "data-motion": block.motion !== "none" ? block.motion : undefined,
        "data-block": block.id,
      },
      container([
        el(
          "div",
          { class: "atl-nav__row" },
          el("a", { class: "atl-nav__brand", href: "/" }, brandMark(ctx), el("span", { class: "atl-nav__name" }, ctx.site.businessName)),
          el(
            "button",
            { class: "atl-nav__toggle", type: "button", "data-nav-toggle": "true", "aria-expanded": "false", "aria-label": "Apri il menu" },
            icon("plus", 20),
          ),
        ),
        el(
          "nav",
          { class: "atl-nav__links atl-nav__links--centered", "aria-label": "Navigazione principale" },
          ...props.links.map((link) =>
            el("a", { class: "atl-nav__link", href: link.href, ...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {}) }, link.label),
          ),
          props.cta ? cta(props.cta) : null,
        ),
      ]),
    ),
});

export const navbarMinimal = defineBlock({
  type: "navbar",
  variant: "minimal",
  label: "Navigazione minimale",
  category: "structure",
  description: "Solo marchio e azione principale: una pagina sola o funnel di conversione.",
  schema: NavProps,
  defaults: NavProps.parse({ links: [], sticky: true }),
  tags: ["nav", "minimal", "landing"],
  build: (props, ctx, block) =>
    el(
      "header",
      {
        class: cls(
          "atl-nav atl-nav--minimal",
          props.sticky && "atl-nav--sticky",
          block.style.hideOnMobile && "atl-hide-mobile",
          block.motion !== "none" && "atl-motion",
        ),
        id: block.style.anchor,
        "data-nav": "true",
        "data-motion": block.motion !== "none" ? block.motion : undefined,
        "data-block": block.id,
      },
      container([
        el("a", { class: "atl-nav__brand", href: "/" }, brandMark(ctx), el("span", { class: "atl-nav__name" }, ctx.site.businessName)),
        (props.links.length > 0 || props.cta) ? el(
          "button",
          { class: "atl-nav__toggle", type: "button", "data-nav-toggle": "true", "aria-expanded": "false", "aria-label": "Apri il menu" },
          icon("plus", 20),
        ) : null,
        el(
          "nav",
          { class: "atl-nav__links", "aria-label": "Navigazione principale" },
          ...props.links.map((link) =>
            el("a", { class: "atl-nav__link", href: link.href, ...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {}) }, link.label),
          ),
          props.cta ? cta(props.cta) : null,
        ),
      ]),
    ),
});

const FooterColumnSchema = z.object({
  title: z.string(),
  links: z.array(LinkSchema).default([]),
});

const FooterProps = z.object({
  columns: z.array(FooterColumnSchema).default([]),
  note: z.string().default(""),
  legalLinks: z.array(LinkSchema).default([]),
  contacts: z.boolean().default(true),
});

export const footerColumns = defineBlock({
  type: "footer",
  variant: "columns",
  label: "Footer a colonne",
  category: "structure",
  description: "Marchio, descrizione, colonne di link, contatti e riga legale.",
  schema: FooterProps,
  defaults: FooterProps.parse({ columns: [], note: "", legalLinks: [] }),
  tags: ["footer", "contatti", "legale"],
  build: (props, ctx, block) => {
    const { contact } = ctx.site.brand;
    const contactItems: Child[] = [];
    if (props.contacts && contact.email) {
      contactItems.push(el("li", { class: "atl-footer__contact" }, icon("mail", 16), el("a", { href: mailHref(contact.email) }, contact.email)));
    }
    if (props.contacts && contact.phone) {
      contactItems.push(el("li", { class: "atl-footer__contact" }, icon("phone", 16), el("a", { href: telHref(contact.phone) }, contact.phone)));
    }
    if (props.contacts && (contact.address || contact.city)) {
      contactItems.push(
        el("li", { class: "atl-footer__contact" }, icon("mapPin", 16), el("span", null, [contact.address, contact.city].filter(Boolean).join(", "))),
      );
    }

    return section(block, [
      container([
        el(
          "div",
          { class: "atl-footer__top" },
          el(
            "div",
            { class: "atl-footer__brand" },
            el("a", { class: "atl-nav__brand", href: "/" }, brandMark(ctx), el("span", { class: "atl-nav__name" }, ctx.site.businessName)),
            props.note ? el("p", { class: "atl-text atl-text--muted" }, props.note) : null,
            contactItems.length > 0 ? el("ul", { class: "atl-footer__contacts" }, ...contactItems) : null,
          ),
          el(
            "div",
            { class: "atl-footer__columns" },
            ...props.columns.map((column) =>
              el(
                "div",
                { class: "atl-footer__column" },
                el("h3", { class: "atl-footer__title" }, column.title),
                el("ul", { class: "atl-footer__list" }, ...column.links.map((link) => el("li", null, el("a", { href: link.href }, link.label)))),
              ),
            ),
          ),
        ),
        el(
          "div",
          { class: "atl-footer__bottom" },
          el("p", { class: "atl-text atl-text--muted" }, `© ${new Date(ctx.site.updatedAt).getFullYear()} ${ctx.site.businessName}${contact.vat ? ` · P.IVA ${contact.vat}` : ""}`),
          el("div", { class: "atl-footer__legal" }, ...props.legalLinks.map((link) => el("a", { href: link.href }, link.label))),
        ),
      ]),
    ], "atl-footer", undefined, "footer");
  },
});

export const footerMinimal = defineBlock({
  type: "footer",
  variant: "minimal",
  label: "Footer minimale",
  category: "structure",
  description: "Una sola riga con marchio, link legali e contatto diretto.",
  schema: FooterProps,
  defaults: FooterProps.parse({ columns: [], note: "", legalLinks: [] }),
  tags: ["footer", "minimal"],
  build: (props, ctx, block) => {
    const { contact } = ctx.site.brand;
    return section(block, [
      container([
        el(
          "div",
          { class: "atl-footer__inline" },
          el("a", { class: "atl-nav__brand", href: "/" }, brandMark(ctx, 24), el("span", { class: "atl-nav__name" }, ctx.site.businessName)),
          el(
            "div",
            { class: "atl-footer__legal" },
            ...props.legalLinks.map((link) => el("a", { href: link.href }, link.label)),
            contact.email ? el("a", { href: mailHref(contact.email) }, contact.email) : null,
          ),
        ),
      ]),
    ], "atl-footer atl-footer--minimal", undefined, "footer");
  },
});
