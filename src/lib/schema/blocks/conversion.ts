import { z } from "zod";
import { cls, el, type Child } from "@/lib/render/node";
import { icon } from "@/lib/render/icons";
import { LinkSchema } from "@/lib/schema/site";
import { defineBlock } from "./types";
import { card, container, cta, ctaRow, eyebrow, grid, heading, lead, mailHref, paragraph, section, telHref } from "./parts";

const PlanSchema = z.object({
  name: z.string(),
  price: z.string().default(""),
  period: z.string().default(""),
  description: z.string().default(""),
  features: z.array(z.string()).default([]),
  cta: LinkSchema.optional(),
  featured: z.boolean().default(false),
});

const PricingProps = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  intro: z.string().default(""),
  plans: z.array(PlanSchema).default([]),
  note: z.string().default(""),
});

export const pricingTiers = defineBlock({
  type: "pricing",
  variant: "tiers",
  label: "Piani e prezzi",
  category: "conversion",
  description: "Tre livelli con il consigliato in evidenza, elenco incluso e nota sui termini.",
  schema: PricingProps,
  defaults: PricingProps.parse({ plans: [] }),
  tags: ["prezzi", "piani", "tariffe"],
  sectors: ["saas", "legal", "fitness", "agency", "medical"],
  build: (props, _ctx, block) =>
    section(block, [
      container([
        el("div", { class: "atl-head" }, eyebrow(props.eyebrow), heading(2, props.title), props.intro ? lead(props.intro) : null),
        grid(3, props.plans.map((plan) =>
          card(
            [
              el("h3", { class: "atl-card__title" }, plan.name),
              plan.description ? paragraph(plan.description, "atl-text--muted") : null,
              el(
                "p",
                { class: "atl-price" },
                el("span", { class: "atl-price__value" }, plan.price),
                plan.period ? el("span", { class: "atl-price__period" }, plan.period) : null,
              ),
              el(
                "ul",
                { class: "atl-list atl-list--tight" },
                ...plan.features.map((feature) => el("li", null, icon("check", 16), el("span", null, feature))),
              ),
              plan.cta ? cta({ ...plan.cta, emphasis: plan.featured ? "primary" : "secondary" }) : null,
            ],
            cls("atl-card--plan", plan.featured && "atl-card--featured"),
          ),
        )),
        props.note ? el("p", { class: "atl-text atl-text--muted atl-center" }, props.note) : null,
      ]),
    ]),
});

export const pricingList = defineBlock({
  type: "pricing",
  variant: "list",
  label: "Listino servizi",
  category: "conversion",
  description: "Elenco prezzi con descrizione: perfetto per menu, trattamenti e tariffe orarie.",
  schema: PricingProps,
  defaults: PricingProps.parse({ plans: [] }),
  tags: ["listino", "prezzi", "menù", "tariffe"],
  sectors: ["restaurant", "medical", "artisan", "fitness"],
  build: (props, _ctx, block) =>
    section(block, [
      container([
        el("div", { class: "atl-head" }, eyebrow(props.eyebrow), heading(2, props.title), props.intro ? lead(props.intro) : null),
        el(
          "ul",
          { class: "atl-pricelist" },
          ...props.plans.map((plan, index) =>
            el(
              "li",
              { class: cls("atl-pricelist__row", plan.featured && "atl-pricelist__row--featured") },
              el(
                "div",
                { class: "atl-pricelist__main" },
                el("span", { class: "atl-pricelist__name" }, plan.name),
                plan.features.length > 0 ? el("span", { class: "atl-pricelist__detail" }, plan.features.join(" · ")) : null,
                plan.description ? el("span", { class: "atl-pricelist__detail" }, plan.description) : null,
              ),
              el("span", { class: "atl-pricelist__price" }, plan.price || "—"),
              plan.cta ? cta({ ...plan.cta, emphasis: "link" }) : null,
              el("span", { class: "atl-pricelist__index", "aria-hidden": "true" }, String(index + 1).padStart(2, "0")),
            ),
          ),
        ),
        props.note ? el("p", { class: "atl-text atl-text--muted" }, props.note) : null,
      ]),
    ]),
});

const CtaProps = z.object({
  eyebrow: z.string().default(""),
  title: z.string(),
  text: z.string().default(""),
  primaryCta: LinkSchema.optional(),
  secondaryCta: LinkSchema.optional(),
});

export const ctaBanner = defineBlock({
  type: "cta",
  variant: "banner",
  label: "Invito a tutta larghezza",
  category: "conversion",
  description: "Banda con colore del marchio e due azioni: chiude le pagine di servizio.",
  schema: CtaProps,
  defaults: CtaProps.parse({ title: "Parliamo del tuo progetto" }),
  tags: ["cta", "contatto", "chiusura"],
  sectors: ["legal", "agency", "artisan", "medical", "generic", "restaurant", "fitness", "saas", "realestate", "education", "ecommerce"],
  build: (props, _ctx, block) => {
    const links = [props.primaryCta, props.secondaryCta].filter(Boolean) as z.output<typeof LinkSchema>[];
    return section(block, [
      container([
        el(
          "div",
          { class: "atl-banner" },
          eyebrow(props.eyebrow),
          heading(2, props.title),
          props.text ? lead(props.text) : null,
          links.length > 0 ? ctaRow(links) : null,
        ),
      ]),
    ]);
  },
});

export const ctaSplit = defineBlock({
  type: "cta",
  variant: "split",
  label: "Invito con recapiti",
  category: "conversion",
  description: "Richiesta a sinistra, recapiti diretti a destra: riduce l'attrito di chi preferisce chiamare.",
  schema: CtaProps,
  defaults: CtaProps.parse({ title: "Parliamo del tuo progetto" }),
  tags: ["cta", "telefono", "email"],
  sectors: ["medical", "restaurant", "artisan", "realestate"],
  build: (props, ctx, block) => {
    const { contact } = ctx.site.brand;
    const links = [props.primaryCta, props.secondaryCta].filter(Boolean) as z.output<typeof LinkSchema>[];
    return section(block, [
      container([
        el(
          "div",
          { class: "atl-cta-split" },
          el("div", null, eyebrow(props.eyebrow), heading(2, props.title), props.text ? lead(props.text) : null, links.length > 0 ? ctaRow(links) : null),
          el(
            "ul",
            { class: "atl-channels" },
            contact.phone
              ? el("li", null, icon("phone", 18), el("a", { href: telHref(contact.phone) }, contact.phone))
              : null,
            contact.email ? el("li", null, icon("mail", 18), el("a", { href: mailHref(contact.email) }, contact.email)) : null,
            contact.address || contact.city
              ? el("li", null, icon("mapPin", 18), el("span", null, [contact.address, contact.city].filter(Boolean).join(", ")))
              : null,
          ),
        ),
      ]),
    ]);
  },
});

const ContactProps = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default("Richiedi un preventivo"),
  intro: z.string().default(""),
  /** `mailto` funziona ovunque senza backend; `endpoint`/`netlify` per l'invio automatico. */
  formMode: z.enum(["mailto", "endpoint", "netlify"]).default("mailto"),
  formEndpoint: z.string().default(""),
  fields: z.array(z.string()).default(["name", "email", "phone", "message"]),
  privacyNote: z.string().default("Inviando il modulo accetti l'informativa privacy."),
  showChannels: z.boolean().default(true),
});

function formField(name: string, index: number, blockId: string): Child {
  const config: Record<string, { label: string; type: string; required: boolean; autocomplete?: string }> = {
    name: { label: "Nome e cognome", type: "text", required: true, autocomplete: "name" },
    email: { label: "Email", type: "email", required: true, autocomplete: "email" },
    phone: { label: "Telefono", type: "tel", required: false, autocomplete: "tel" },
    message: { label: "Messaggio", type: "textarea", required: true },
    subject: { label: "Oggetto", type: "text", required: false },
    city: { label: "Città", type: "text", required: false, autocomplete: "address-level2" },
    date: { label: "Data preferita", type: "date", required: false },
  };
  const field = config[name] ?? { label: name, type: "text", required: false };
  const id = `campo-${blockId}-${name}-${index}`;

  return el(
    "div",
    { class: cls("atl-field", field.type === "textarea" && "atl-field--wide") },
    el("label", { class: "atl-field__label", for: id }, field.label, field.required ? el("span", { class: "atl-field__req", "aria-hidden": "true" }, "*") : null),
    field.type === "textarea"
      ? el("textarea", { class: "atl-field__input", id, name, rows: 5, required: field.required, placeholder: "" })
      : el("input", {
          class: "atl-field__input",
          id,
          name,
          type: field.type,
          required: field.required,
          autocomplete: field.autocomplete,
        }),
  );
}

export const contactSplit = defineBlock({
  type: "contact",
  variant: "split",
  label: "Contatti con modulo",
  category: "conversion",
  description:
    "Modulo con campi etichettati, antispam, consenso privacy e recapiti. Di base invia via email senza alcun backend.",
  schema: ContactProps,
  defaults: ContactProps.parse({}),
  tags: ["contatti", "form", "preventivo", "lead"],
  sectors: ["legal", "medical", "agency", "artisan", "realestate", "fitness", "education", "generic", "restaurant", "saas", "ecommerce"],
  build: (props, ctx, block) => {
    const { contact } = ctx.site.brand;
    const email = contact.email.trim();
    const endpoint = props.formEndpoint.trim();
    const hasEmail = props.formMode !== "mailto" || Boolean(email);
    const hasEndpoint = props.formMode === "netlify" || props.formMode === "mailto" || Boolean(endpoint);
    const canSubmit = props.formMode === "netlify" ? true : hasEmail && hasEndpoint;
    const action =
      props.formMode === "endpoint" ? endpoint || "#" : props.formMode === "netlify" ? "/" : email ? mailHref(email) : "#";
    const formName = `contatto-${block.id}`;

    const formAttrs: Record<string, string | number | boolean> = {
      class: "atl-form",
      action,
      method: "post",
      "data-atl-form": canSubmit ? (props.formMode === "mailto" ? "mailto" : "endpoint") : "disabled",
      "data-atl-mail": email,
    };
    if (props.formMode === "netlify") {
      formAttrs.name = formName;
      formAttrs["data-netlify"] = "true";
      formAttrs["netlify-honeypot"] = "website";
    }
    const honeypotId = `atl-website-${block.id}`;

    return section(block, [
      container([
        el(
          "div",
          { class: "atl-contact" },
          el(
            "div",
            { class: "atl-contact__intro" },
            eyebrow(props.eyebrow),
            heading(2, props.title),
            props.intro ? lead(props.intro) : null,
            props.showChannels
              ? el(
                  "ul",
                  { class: "atl-channels" },
                  contact.phone ? el("li", null, icon("phone", 18), el("a", { href: telHref(contact.phone) }, contact.phone)) : null,
                  contact.email ? el("li", null, icon("mail", 18), el("a", { href: mailHref(contact.email) }, contact.email)) : null,
                  contact.address || contact.city
                    ? el("li", null, icon("mapPin", 18), el("span", null, [contact.address, contact.city].filter(Boolean).join(", ")))
                    : null,
                  el("li", null, icon("clock", 18), el("span", null, "Risposta entro un giorno lavorativo")),
                )
              : null,
          ),
          canSubmit
            ? el(
                "form",
                formAttrs,
                ...(props.formMode === "netlify"
                  ? [el("input", { type: "hidden", name: "form-name", value: formName })]
                  : []),
                ...props.fields.map((field, index) => formField(field, index, block.id)),
                // Antispam senza servizi esterni: se compilato, il messaggio viene scartato.
                el(
                  "div",
                  { class: "atl-field atl-field--honeypot", "aria-hidden": "true" },
                  el("label", { for: honeypotId }, "Non compilare"),
                  el("input", { id: honeypotId, name: "website", type: "text", tabindex: -1, autocomplete: "off" }),
                ),
                el("div", { class: "atl-form__actions" }, el("button", { class: "atl-cta atl-cta--primary", type: "submit" }, el("span", null, "Invia richiesta"), icon("arrowRight", 16, "atl-cta__icon"))),
                el("p", { class: "atl-form__note" }, props.privacyNote),
                el("p", { class: "atl-form__status", "data-atl-form-status": "true", role: "status", "aria-live": "polite" }, ""),
              )
            : el(
                "div",
                { class: "atl-form atl-form--disabled" },
                el("p", { class: "atl-text atl-text--muted" }, "Il modulo non \u00e8 ancora collegato. Aggiungi un'email di contatto o un endpoint nelle impostazioni del progetto."),
              ),
        ),
      ]),
    ]);
  },
});
