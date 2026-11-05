/**
 * `styles.css` del sito esportato — costante e statica.
 *
 * Non viene generata per sito: è sempre la stessa. Tutta la variabilità passa
 * dalle variabili definite in `tokens.css`. Conseguenze pratiche:
 *   - il CSS esportato è piccolo e cacheabile;
 *   - il restyle cambia solo variabili, quindi non può rompere il layout;
 *   - la parità anteprima/export è verificabile su una stringa sola.
 */
export const EXPORT_SHEET = `/* Atelier — foglio di stile del sito. Generato una volta, pilotato dai token. */
*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-weight: var(--body-weight);
  font-size: var(--text-base);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

img, svg, video { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
p { margin: 0; }
ul, ol { margin: 0; padding: 0; list-style: none; }
figure, blockquote, dl, dd, details, summary { margin: 0; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; border-radius: 2px; }
::selection { background: var(--primary); color: var(--primary-text); }
.atl-hidden, [hidden] { display: none !important; }

/* ---------- Layout ---------- */
.atl-container { width: 100%; max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }
.atl-container--flush { max-width: var(--container-wide); padding-inline: 0; }
.atl-container--wide { max-width: var(--container-wide); }
.atl-section { padding-block: var(--section-padding); position: relative; }
.atl-section--space-compact { padding-block: calc(var(--section-padding) * 0.6); }
.atl-section--space-loose { padding-block: calc(var(--section-padding) * 1.35); }
.atl-section--w-narrow > .atl-container { max-width: var(--container-narrow); }
.atl-section--w-wide > .atl-container { max-width: var(--container-wide); }
.atl-section--w-full > .atl-container { max-width: none; }
.atl-section--bg-muted { background: var(--bg-muted); }
.atl-section--bg-elevated { background: var(--bg-elevated); }
.atl-section--bg-art {
  background-image: radial-gradient(at 12% 8%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 58%),
                    radial-gradient(at 88% 92%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 55%);
}
.atl-section--bg-primary { background: var(--primary); color: var(--primary-text); }
.atl-section--bg-primary .atl-heading, .atl-section--bg-primary .atl-text, .atl-section--bg-primary .atl-eyebrow { color: inherit; }
.atl-section--bg-accent { background: var(--accent); color: var(--accent-text); }
.atl-section--bg-accent .atl-heading, .atl-section--bg-accent .atl-text, .atl-section--bg-accent .atl-eyebrow { color: inherit; }
.atl-center { text-align: center; }
.atl-center .atl-cta-row, .atl-center .atl-badges { justify-content: center; }
.atl-section--prose { padding-block: calc(var(--section-padding) * 0.75); }

/* ---------- Tipografia ---------- */
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  letter-spacing: var(--heading-tracking);
  text-transform: var(--heading-transform);
  line-height: 1.08;
  margin: 0;
  text-wrap: balance;
}
.atl-heading--h1 { font-size: var(--text-4xl); }
.atl-heading--h2 { font-size: var(--text-3xl); }
.atl-heading--h3 { font-size: var(--text-xl); }
.atl-heading--display { font-size: var(--text-5xl); }
.atl-heading--page { font-size: var(--text-3xl); margin-bottom: var(--text-lg); }
.atl-lead { font-size: var(--text-lg); color: var(--text-muted); max-width: 46ch; text-wrap: pretty; }
.atl-center .atl-lead { margin-inline: auto; }
.atl-text { color: var(--text); text-wrap: pretty; }
.atl-text--muted { color: var(--text-muted); }
.atl-eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--label-tracking);
  text-transform: var(--label-transform);
  color: var(--text-muted);
  margin: 0 0 1rem;
}
.atl-eyebrow__icon { flex: none; }
.atl-icon { color: currentColor; }
.atl-link { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--primary); font-weight: 500; border-bottom: 1px solid color-mix(in oklab, var(--primary) 40%, transparent); }
.atl-link:hover { border-bottom-color: var(--primary); }
.atl-head { max-width: 52rem; margin-bottom: clamp(2rem, 4vw, 3.25rem); }
.atl-head .atl-heading { margin-bottom: 0.75rem; }

/* ---------- Azioni ---------- */
.atl-cta-row { display: flex; flex-wrap: wrap; gap: 0.875rem; margin-top: 2rem; }
.atl-cta {
  display: inline-flex; align-items: center; gap: 0.55rem;
  padding: 0.85rem 1.5rem;
  border-radius: var(--radius);
  border: var(--border-width) solid transparent;
  font-weight: 500;
  font-size: var(--text-sm);
  letter-spacing: 0.01em;
  transition: background var(--motion), color var(--motion), border-color var(--motion), transform var(--motion), box-shadow var(--motion);
}
.atl-cta--primary { background: var(--primary); color: var(--primary-text); border-color: var(--primary); }
.atl-cta--primary:hover { background: var(--primary-hover); border-color: var(--primary-hover); transform: translateY(-1px); }
.atl-cta--secondary { background: transparent; color: var(--text); border-color: var(--border); }
.atl-cta--secondary:hover { border-color: var(--text); }
.atl-cta--ghost { color: var(--text); }
.atl-cta--ghost:hover { color: var(--primary); }
.atl-cta--link { padding: 0; color: var(--primary); border: 0; }
.atl-cta__icon { transition: transform var(--motion); }
.atl-cta:hover .atl-cta__icon { transform: translateX(3px); }

/* ---------- Navigazione ---------- */
.atl-nav { background: color-mix(in oklab, var(--bg) 88%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); z-index: 40; }
.atl-nav { position: relative; }
.atl-nav--sticky { position: sticky; top: 0; }
.atl-nav > .atl-container { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding-block: 0.85rem; }
.atl-nav__brand { display: inline-flex; align-items: center; gap: 0.65rem; font-family: var(--font-heading); font-weight: 600; font-size: var(--text-lg); letter-spacing: -0.01em; }
.atl-mark {
  display: grid; place-items: center;
  inline-size: 2.15rem; block-size: 2.15rem;
  border-radius: calc(var(--radius) * 0.9);
  background: var(--primary); color: var(--primary-text);
  font-family: var(--font-heading); font-weight: 700; font-size: 0.95rem;
  flex: none;
}
.atl-mark--svg { background: transparent; }
.atl-mark--svg svg { inline-size: 100%; block-size: 100%; }
.atl-nav__links { display: flex; align-items: center; gap: 1.5rem; }
.atl-nav__links--centered { justify-content: center; flex-wrap: wrap; }
.atl-nav__link { font-size: var(--text-sm); color: var(--text-muted); transition: color var(--motion); }
.atl-nav__link:hover { color: var(--text); }
.atl-skip { position: absolute; inset-inline-start: -9999px; top: 0; z-index: 1000; padding: 0.75rem 1rem; background: var(--bg); color: var(--text); border: var(--border-width) solid var(--border); border-radius: var(--radius); }
.atl-skip:focus { inset-inline-start: 1rem; top: 1rem; }
.atl-nav__actions { display: flex; align-items: center; gap: 0.75rem; }
.atl-nav__toggle { display: none; padding: 0.4rem; border: 1px solid var(--border); border-radius: var(--radius); }
.atl-nav--centered > .atl-container { flex-direction: column; gap: 0.85rem; }
.atl-nav__row { display: flex; justify-content: center; }

/* ---------- Footer ---------- */
.atl-footer { border-top: 1px solid var(--border); background: var(--bg-elevated); }
.atl-footer__top { display: grid; grid-template-columns: minmax(16rem, 1fr) 2fr; gap: clamp(2rem, 5vw, 4rem); }
.atl-footer__columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 2rem; }
.atl-footer__title { font-size: var(--text-xs); letter-spacing: var(--label-tracking); text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.85rem; }
.atl-footer__list { display: grid; gap: 0.5rem; font-size: var(--text-sm); color: var(--text-muted); }
.atl-footer__list a:hover, .atl-footer__legal a:hover { color: var(--text); }
.atl-footer__contacts { display: grid; gap: 0.6rem; margin-top: 1.25rem; font-size: var(--text-sm); }
.atl-footer__contact { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); }
.atl-footer__bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; margin-top: 3rem; padding-top: 1.5rem; border-top: var(--divider); font-size: var(--text-xs); }
.atl-footer__legal { display: flex; flex-wrap: wrap; gap: 1.25rem; color: var(--text-muted); }
.atl-footer__inline { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
.atl-footer--minimal { padding-block: calc(var(--section-padding) * 0.5); }

/* ---------- Hero ---------- */
.atl-hero-section { padding-block: calc(var(--section-padding) * 0.85); }
.atl-hero { display: grid; gap: clamp(2rem, 5vw, 4rem); align-items: center; }
.atl-hero--split { grid-template-columns: 1.05fr 1fr; }
.atl-hero--centered { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 1.5rem; }
.atl-hero--centered .atl-lead { margin-inline: auto; }
.atl-hero--centered .atl-cta-row { justify-content: center; }
.atl-hero__content { display: grid; gap: 1.25rem; align-content: start; }
.atl-hero__content .atl-heading { margin: 0; }
.atl-hero__visual { display: grid; gap: 1.5rem; }
.atl-hero__wide { width: 100%; }
.atl-hero__wide .atl-media__img, .atl-hero__wide .atl-art { aspect-ratio: 16 / 9; }
.atl-hero__editorial { display: grid; gap: 1.5rem; }
.atl-editorial__grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(1.5rem, 4vw, 3rem); }
.atl-hero-section--editorial { display: grid; gap: 3rem; }
.atl-badges { display: flex; flex-wrap: wrap; gap: 0.65rem 1.25rem; margin-top: 1.5rem; font-size: var(--text-sm); color: var(--text-muted); }
.atl-badge { display: inline-flex; align-items: center; gap: 0.4rem; }

/* ---------- Media e arte procedurale ---------- */
.atl-media { overflow: hidden; border-radius: var(--radius-large); border: var(--border-width) solid var(--border); background: var(--bg-muted); }
.atl-media__img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.atl-art { width: 100%; aspect-ratio: 4 / 3; background-color: var(--bg-muted); background-size: cover; }
.atl-media__caption { padding: 0.75rem 1rem; font-size: var(--text-xs); color: var(--text-muted); border-top: var(--divider); }
.atl-media--tile .atl-media__img, .atl-media--tile .atl-art { aspect-ratio: 1 / 1; }
.atl-media--portrait .atl-media__img, .atl-media--portrait .atl-art { aspect-ratio: 3 / 4; }

/* ---------- Griglie e schede ---------- */
.atl-grid { display: grid; gap: clamp(1.25rem, 2.5vw, 2rem); }
.atl-grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.atl-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.atl-grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.atl-card {
  background: var(--card-background);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-large);
  padding: clamp(1.35rem, 2.2vw, 2rem);
  display: grid;
  gap: 0.85rem;
  align-content: start;
  box-shadow: var(--shadow);
  transition: transform var(--motion), border-color var(--motion);
}
.atl-card:hover { border-color: color-mix(in oklab, var(--primary) 45%, var(--border)); }
.atl-card__title { font-size: var(--text-xl); }
.atl-card--feature { background: transparent; box-shadow: none; border-color: transparent; padding-inline: 0; }
.atl-card--quote { background: var(--card-background); }
.atl-card--plan { align-content: stretch; grid-template-rows: auto auto auto 1fr auto; }
.atl-card--featured { border-color: var(--primary); border-width: calc(var(--border-width) * 1.6); }
.atl-icon-badge {
  display: grid; place-items: center;
  inline-size: 2.75rem; block-size: 2.75rem;
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--primary) 14%, transparent);
  color: var(--primary);
}
.atl-bento { display: grid; grid-template-columns: 1.15fr 1fr; gap: clamp(1.25rem, 2.5vw, 2rem); }
.atl-bento__lead .atl-card { height: 100%; }
.atl-bento__rest { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(1rem, 2vw, 1.5rem); }
.atl-alternating { display: grid; gap: clamp(2.5rem, 5vw, 4rem); }
.atl-alternating__row { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(1.5rem, 4vw, 3rem); align-items: center; }
.atl-alternating__row--flip .atl-alternating__text { order: 2; }
.atl-alternating__text { display: grid; gap: 0.85rem; align-content: start; }

/* ---------- Processo ---------- */
.atl-timeline { display: grid; gap: 1.5rem; counter-reset: step; }
.atl-timeline__item { display: grid; grid-template-columns: 3.5rem 1fr; gap: 1.25rem; padding-top: 1.5rem; border-top: var(--divider); }
.atl-timeline__index { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--primary); }

/* ---------- Numeri e loghi ---------- */
.atl-stats { display: grid; gap: 1.25rem; }
.atl-stats--inline { grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); margin-top: 1.75rem; }
.atl-stats--cards { grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); }
.atl-stat { display: grid; gap: 0.25rem; }
.atl-stat__value { font-family: var(--font-heading); font-size: var(--text-2xl); font-weight: var(--heading-weight); letter-spacing: -0.02em; }
.atl-stat__label { font-size: var(--text-sm); color: var(--text-muted); }
.atl-logos { display: flex; flex-wrap: wrap; gap: 1rem 2rem; align-items: center; justify-content: center; margin-top: 1.5rem; }
.atl-logos__item { display: inline-flex; align-items: center; gap: 0.5rem; font-size: var(--text-sm); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }

/* ---------- Citazioni ---------- */
.atl-stars { display: flex; gap: 0.15rem; color: var(--border); }
.atl-star.is-on { color: var(--accent); }
.atl-quote { border-left: 2px solid var(--primary); padding-left: 1rem; }
.atl-quote__footer { display: grid; gap: 0.15rem; font-size: var(--text-sm); }
.atl-quote__author { font-weight: 600; }
.atl-quote__role { color: var(--text-muted); }
.atl-feature-quote { display: grid; gap: 1.5rem; max-width: 46rem; margin-inline: auto; text-align: center; justify-items: center; }
.atl-feature-quote__mark { color: var(--primary); }
.atl-feature-quote__text { font-family: var(--font-heading); font-size: var(--text-2xl); line-height: 1.3; }
.atl-feature-quote__caption { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: center; }

/* ---------- FAQ ---------- */
.atl-faq { display: grid; gap: 0.75rem; max-width: 52rem; }
.atl-faq__item { border: var(--border-width) solid var(--border); border-radius: var(--radius); background: var(--card-background); }
.atl-faq__question { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.35rem; cursor: pointer; font-family: var(--font-heading); font-size: var(--text-lg); list-style: none; }
.atl-faq__question::-webkit-details-marker { display: none; }
.atl-faq__chevron { transition: transform var(--motion); color: var(--text-muted); flex: none; }
.atl-faq__item[open] .atl-faq__chevron { transform: rotate(180deg); }
.atl-faq__answer { padding: 0 1.35rem 1.25rem; color: var(--text-muted); }
.atl-faq-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem 3rem; }
.atl-faq-grid__q { font-family: var(--font-heading); font-size: var(--text-lg); margin-bottom: 0.5rem; }
.atl-faq-grid__a { color: var(--text-muted); }

/* ---------- Prezzi ---------- */
.atl-price { display: flex; align-items: baseline; gap: 0.4rem; font-family: var(--font-heading); }
.atl-price__value { font-size: var(--text-2xl); font-weight: var(--heading-weight); }
.atl-price__period { font-size: var(--text-sm); color: var(--text-muted); }
.atl-list { display: grid; gap: 0.6rem; }
.atl-list--tight { gap: 0.45rem; }
.atl-list li { display: flex; align-items: flex-start; gap: 0.6rem; color: var(--text-muted); }
.atl-list svg { flex: none; margin-top: 0.2rem; color: var(--primary); }
.atl-pricelist { display: grid; gap: 0; border-top: var(--divider); }
.atl-pricelist__row { display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 1.15rem 0; border-bottom: var(--divider); position: relative; }
.atl-pricelist__row--featured { background: color-mix(in oklab, var(--primary) 6%, transparent); }
.atl-pricelist__main { display: grid; gap: 0.2rem; }
.atl-pricelist__name { font-family: var(--font-heading); font-size: var(--text-lg); }
.atl-pricelist__detail { font-size: var(--text-sm); color: var(--text-muted); }
.atl-pricelist__price { font-family: var(--font-mono); font-size: var(--text-base); }
.atl-pricelist__index { position: absolute; right: 0; top: 0.35rem; font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); }

/* ---------- Bande e contatti ---------- */
/* Chi cambia superficie dichiara anche il colore del testo: senza questa riga la
   card dentro una fascia colorata ereditava il testo chiaro della fascia e
   diventava illeggibile su fondo chiaro. */
.atl-banner { display: grid; gap: 1rem; justify-items: start; padding: clamp(2rem, 4vw, 3.25rem); border: var(--border-width) solid var(--border); border-radius: var(--radius-large); background: var(--bg-elevated); color: var(--text); }
.atl-cta-split { display: grid; grid-template-columns: 1.3fr 1fr; gap: clamp(2rem, 5vw, 4rem); align-items: start; }
.atl-channels { display: grid; gap: 0.85rem; font-size: var(--text-sm); }
.atl-channels li { display: flex; align-items: center; gap: 0.6rem; color: var(--text-muted); }
.atl-channels svg { color: var(--primary); flex: none; }
.atl-contact { display: grid; grid-template-columns: 1fr 1.1fr; gap: clamp(2rem, 5vw, 4rem); align-items: start; }
.atl-contact__intro { display: grid; gap: 1rem; align-content: start; }
.atl-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: clamp(1.5rem, 3vw, 2.25rem); border: var(--border-width) solid var(--border); border-radius: var(--radius-large); background: var(--card-background); }
.atl-field { display: grid; gap: 0.4rem; }
.atl-field--wide { grid-column: 1 / -1; }
.atl-field--honeypot { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.atl-field__label { font-size: var(--text-sm); color: var(--text-muted); }
.atl-field__req { color: var(--primary); }
.atl-field__input {
  width: 100%; padding: 0.7rem 0.85rem;
  background: var(--bg); color: var(--text);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  font: inherit; font-size: var(--text-sm);
  transition: border-color var(--motion);
}
.atl-field__input:focus { border-color: var(--primary); outline: none; }
.atl-field__input::placeholder { color: color-mix(in oklab, var(--text-muted) 70%, transparent); }
.atl-form__actions { grid-column: 1 / -1; display: flex; justify-content: flex-start; }
.atl-form__note { grid-column: 1 / -1; font-size: var(--text-xs); color: var(--text-muted); }
.atl-form__status { grid-column: 1 / -1; font-size: var(--text-sm); color: var(--primary); min-height: 1.2em; }

/* ---------- Cookie ---------- */
.atl-notice { position: fixed; inset-inline: 0; bottom: 0; z-index: 60; padding: 0 0 1rem; }
.atl-notice .atl-container { max-width: var(--container-wide); }
.atl-cookie { display: grid; gap: 1rem; grid-template-columns: 1fr auto; align-items: center; padding: 1.15rem 1.35rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-large); background: var(--bg-elevated); box-shadow: var(--shadow); }
.atl-cookie__text { font-size: var(--text-sm); color: var(--text-muted); }
.atl-cookie__actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.atl-cookie__links { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 1rem; font-size: var(--text-xs); color: var(--text-muted); }
.atl-cookie__links a { border-bottom: 1px solid var(--border); }
.atl-notice[data-consent="given"] { display: none; }

/* ---------- Articoli ---------- */
.atl-posts { display: grid; gap: 0; border-top: var(--divider); }
.atl-posts__item { border-bottom: var(--divider); }
.atl-posts__link { display: grid; gap: 0.6rem; padding: 1.75rem 0; transition: padding var(--motion); }
.atl-posts__link:hover { padding-inline-start: 0.5rem; }
.atl-posts__link .atl-link { justify-self: start; }

/* ---------- Testo lungo ---------- */
.atl-prose { max-width: 68ch; display: grid; gap: 1rem; }
.atl-prose--two { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: none; }
.atl-prose--legal { max-width: 72ch; }
.atl-prose--legal h2 { margin-top: 1.5rem; }
.atl-prose--legal h3 { margin-top: 1.25rem; }

/* ---------- Movimento ---------- */
@media (scripting: enabled) {
  .atl-motion { opacity: 0; transform: translateY(14px); transition: opacity 600ms ease-out, transform 600ms cubic-bezier(0.22, 1, 0.36, 1); }
  .atl-motion[data-motion="fade"] { transform: none; }
  .atl-motion[data-motion="slide-left"] { transform: translateX(-18px); }
  .atl-motion[data-motion="zoom"] { transform: scale(0.98); }
  .atl-motion.is-visible { opacity: 1; transform: none; }
}

/* ---------- Adattamento ---------- */
@media (max-width: 60rem) {
  .atl-hero--split, .atl-contact, .atl-cta-split, .atl-bento, .atl-faq-grid, .atl-alternating__row, .atl-editorial__grid, .atl-footer__top { grid-template-columns: 1fr; }
  .atl-alternating__row--flip .atl-alternating__text { order: 0; }
  .atl-grid--3, .atl-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .atl-prose--two { grid-template-columns: 1fr; }
  .atl-bento__rest { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 46rem) {
  .atl-section { padding-block: calc(var(--section-padding) * 0.7); }
  .atl-grid--2, .atl-grid--3, .atl-grid--4, .atl-bento__rest, .atl-form { grid-template-columns: 1fr; }
  .atl-nav__links { display: none; }
  .atl-nav__toggle { display: inline-flex; }
  .atl-nav[data-nav-open="true"] .atl-nav__links {
    display: flex; flex-direction: column; align-items: flex-start; gap: 0.85rem;
    position: absolute; inset-inline: var(--gutter); top: 100%; padding: 1.25rem;
    background: var(--bg-elevated); border: var(--border-width) solid var(--border); border-radius: var(--radius-large);
  }
  .atl-hide-mobile { display: none !important; }
  .atl-cookie { grid-template-columns: 1fr; }
  .atl-pricelist__row { grid-template-columns: 1fr auto; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  .atl-motion { opacity: 1; transform: none; }
}
@media print {
  .atl-nav, .atl-notice, .atl-footer, .atl-cta-row, .atl-nav__toggle { display: none !important; }
  body { background: #fff; color: #000; }
  .atl-section { padding-block: 1.25rem; }
  .atl-motion { opacity: 1; transform: none; }
  .atl-card { break-inside: avoid; box-shadow: none; }
}
`;
