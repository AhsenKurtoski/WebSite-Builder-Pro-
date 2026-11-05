# Atelier — specifica operativa

Website builder AI professionale. Local-first, con compilatore a stadi ed export statico autosufficiente.
Integrazioni e stato dell'infrastruttura: vedi [`INTEGRAZIONI.md`](./INTEGRAZIONI.md).

---

## 1. Le tre garanzie non negoziabili

1. **Funziona sempre.** Il `Composer deterministico` locale produce un sito completo senza rete e senza chiavi. L'AI migliora il risultato, non è un requisito.
2. **Preview = export.** Un solo registry di blocchi alimenta anteprima React ed export HTML. Il test di parità è bloccante in CI.
3. **Zero template.** Nessun `templateId` nel codice: blueprint derivato dal brief + grammatica di primitive, con check di unicità strutturale.

---

## 2. Stack bloccato (versioni verificate su npm)

```
next@16.3.6           react@19.3.0          typescript (strict)
tailwindcss@4.3.3     @radix-ui/* (primitives, stile shadcn generato nel repo)
zustand@5.0.15        @dnd-kit/core@6.3.1   dexie@4.4.6
ai@7.0.116            @ai-sdk/google@4.0.82  @ai-sdk/groq@4.0.50
@ai-sdk/cerebras@3.0.57  @ai-sdk/openai-compatible@3.0.57
@google/genai@2.24.0  zod@4.6.5             jszip@3.10.2
lucide-react@1.48.0   axe-core (solo editor, mai nell'export)
```

Note d'uso obbligatorie:

- **Strutturato**: `generateText`/`streamText` con `output: Output.object({ schema })` e `partialOutputStream`. `generateObject`/`streamObject` sono **deprecati**: non usarli.
- **Agenti**: `ToolLoopAgent` con `instructions` (non `system`).
- **Export CSS**: `@source inline()` in `styles/export-source.css` per safelistare le classi statiche di tutte le varianti; i token del progetto vivono in `tokens.css` come custom properties mappate in `@theme`, così `bg-brand-primary` resta una classe statica valida.

---

## 3. Modello dati (contratti zod)

```ts
Site      { id, name, slug, theme, brand, pages[], nav, seo, locales[], assets[], collections[], snapshots[] }
BrandKit  { name, logo, palette(OKLCH + coppie a contrasto), fonts, radius, spacingScale, tone, motion }
Theme     { mode, tokens{color,surface,radius,shadow,font,space}, stylePreset }
Page      { id, path, title, seo, blocks[], i18n }
Block     { id, type, variant, props, style(per breakpoint), motion, children[] }
Collection{ id, fields[], items[] }
```

### Contratto del registry (il cuore del progetto)

```ts
type BlockDefinition<P> = {
  type: string
  variants: readonly string[]
  propsSchema: z.ZodType<P>            // → JSON Schema per l'AI, validazione a runtime
  render: React.FC<{ props: P }>       // → anteprima editor
  toHtml: (props: P) => string         // → export statico
  aiHints: { purpose: string; bestFor: string[]; seed: string }
  a11y: { role?: string; landmarks?: string[] }
}
```

Un blocco è "fatto" solo quando `render` e `toHtml` producono lo stesso DOM normalizzato. Il registry è anche la fonte della palette dei blocchi e dello schema passato al modello: una definizione, tre consumatori.

---

## 4. Compilatore a 7 stadi

L'AI propone, il codice deterministico dispone. Ogni stadio: contratto zod + post-processing non-AI + fallback deterministico.

| # | Stadio | Post-processing deterministico |
|---|---|---|
| 1 | Brief | settore, obiettivi, lingua, nazione (implica GDPR/pagamenti) |
| 2 | Blueprint | completezza per settore: le sezioni obbligatorie le aggiunge il codice |
| 3 | Design DNA | palette OKLCH da seed, contrasto WCAG corretto aritmeticamente, type scale modulare |
| 4 | Copy deck | dedup, lunghezze entro i limiti di blocco, gate anti-placeholder |
| 5 | Composizione | vincoli di vicinato, alternanza di densità, diversificazione varianti |
| 6 | Media | catena immagini a cascata, WebP, alt text via vision |
| 7 | Hardening | SEO/JSON-LD, a11y, overflow su 5 viewport, budget peso, gate pre-export |

Loop di riparazione: output non conforme → 1 retry con l'errore di validazione nel prompt → fallback deterministico dello stadio + warning in UI. Nessuno stadio blocca il flusso.

Streaming SSE con eventi tipizzati: `stage`, `partial`, `patch`, `quota`, `repair`, `done`. Il canvas applica i parziali in slot stabili.

---

## 5. Router AI a cascata (per task)

| Task | Catena |
|---|---|
| brief / blueprint | Gemini Flash → Groq → Cerebras → OpenRouter `/free` |
| copy di massa, traduzioni | Cerebras (1M tok/g) → Groq → Gemini |
| sezioni, restyle, audit | Groq → Gemini → Cerebras |
| riparazione schema | Gemini → Groq |
| immagini | Canva (via agente) → Gemini Image → CF FLUX → SVG LLM → fondini locali |
| vision / alt text / screenshot→sito | Gemini Flash (vision) |
| **offline** | **Composer deterministico locale** |

- Cooldown per provider su 429/5xx/timeout con rispetto di `Retry-After`.
- Ledger quote in Dexie (finestre RPM/RPD/TPM/TPD) + HUD con stato e prossimo reset.
- Prompt compatti: mai l'intero sito nel contesto (cap 8k su Cerebras).
- Chiavi AI: solo variabili d'ambiente del server (`GEMINI_API_KEY` predefinita, `GEMINI_API_KEY_FALLBACK` di riserva, più gli altri provider opzionali). Usate solo dentro `app/api/ai/*` e `app/api/providers/*`, mai nel bundle né nel browser; nessuna chiave viene mai salvata nel browser.

---

## 6. Export statico

```
index.html · <pagina>/index.html · 404.html · robots.txt · sitemap.xml · llms.txt
styles.css      build Tailwind safelistata
tokens.css      custom properties dal BrandKit
site.js         solo se serve (~4KB, ES2020)
fonts/          woff2 self-hosted, nessuna dipendenza da CDN
assets/         WebP + SVG, favicon set, og-image
_headers + netlify.toml + vercel.json · redirects.json
progetto.atelier.json   round-trip reimportabile
```

Gate pre-export (bloccanti, con fix proposto): contrasto AA, alt mancanti, link rotti, overflow su mobile/tablet/desktop, gerarchia heading, budget peso pagina, meta/OG per pagina.
Test di parità: DOM dell'export normalizzato vs DOM dell'anteprima React, stessa viewport. Divergenza = rosso.

---

## 7. Qualità e verifica

- `tsc --noEmit` + unit: schema blocchi, compiler, `toHtml` deterministico (snapshot), sanitizzatore SVG, ledger quote, contrasto OKLCH, guardia overflow.
- Matrice di parità: tutti i blocchi × 4 viewport.
- Unicità: 10 brief dello stesso settore → 10 hash strutturali distinti.
- Degradazione: 429/500/timeout simulati su ogni provider → compilazione completata con warning.
- E2E Playwright: genera → modifica → valida → esporta → apri l'export in un browser reale → axe.
- AI mockata nei test (mock provider AI SDK): CI a quota zero.
- Adottato dal tentativo precedente: validazione env in prebuild, endpoint `/api/health`, errori opachi in produzione.

---

## 8. Struttura file

```
src/
  app/
    (marketing)/{page,onboarding,settings}/
    (studio)/studio/[siteId]/
    api/ai/compile/route.ts              SSE, 7 stadi
    api/ai/{surgeon,restyle,copy,seo,image,translate}/route.ts
    api/providers/{test,health}/route.ts
    api/publish/{zip,deploy}/route.ts
  lib/
    schema/{site,page,block,collection,brand}.ts
    schema/blocks/*.ts        ~60 blocchi: zod + React + toHtml + aiHints
    schema/primitives/*.ts    grammatica del Primitive Composer
    compiler/{brief,blueprint,brand,copy,compose,media,harden}.ts
    compiler/composer-offline.ts · compiler/uniqueness.ts
    ai/{router,providers,quota-ledger,repair,prompts,tools}.ts
    export/{render-html,build-zip,tokens-css,fonts,og-image,parity}.ts
    quality/{a11y,seo,perf,overflow,gates}.ts
    storage/{db,repo,sync-supabase}.ts
    design/{tokens,oklch,contrast,type-scale,motion,fondini}.ts
  components/{shell,canvas,inspector,palette,copilot,hud,settings,onboarding}/
  styles/{app.css,export-source.css}
supabase/migrations/   tests/{unit,e2e,parity,fixtures}/
```

---

## 9. Fasi e criteri di accettazione

| Fase | Fatto quando |
|---|---|
| **0 · Fondamenta** | `tsc --noEmit` pulito; un sito scritto a mano si esporta e si apre da file system con 0 errori console; test di parità verde |
| **1 · Compilatore** | un prompt genera in <30 s un sito di 5+ pagine che passa i gate; **senza nessuna chiave** l'app produce comunque un sito completo |
| **2 · Editor visuale** | editing completo senza toccare codice; drag fluido su un sito da 10 pagine; undo/redo e snapshot funzionanti |
| **3 · Libreria completa** | ~60 blocchi / 250+ configurazioni; una sezione composta dalle primitive esporta e supera i gate come un blocco nativo |
| **4 · Qualità e AI avanzata** | restyle non altera un carattere (test); a11y senza violazioni critiche; pagina <500 KB senza immagini |
| **5 · Cloud e pubblicazione** | due browser modificano lo stesso progetto senza conflitti; sito pubblicato raggiungibile su HTTPS |
| **6 · Rifinitura** | flusso completo coperto da E2E; documentazione utente |

---

## 10. Stato attuale

- [x] Piano approvato, decisioni di infrastruttura prese, integrazioni verificate
- [x] `docs/INTEGRAZIONI.md` + `docs/PIANO.md`
- [ ] Scaffold progetto (Fase 0)
- [ ] Registry blocchi core + motore di export
- [ ] Compilatore e router AI

Da fare prima del deploy: ri-autorizzare la connessione Vercel per il team `axsenxzcs-projects` (vedi `INTEGRAZIONI.md` §5).
