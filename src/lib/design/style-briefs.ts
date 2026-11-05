import { PRESET_LABELS, type StylePreset } from "./tokens";

/**
 * Brief di stile.
 *
 * `STYLE_PRESETS` dice *come appare* una direzione visiva (raggi, ombre, pesi,
 * tempi di animazione). Questo modulo dice *cosa significa*: che atmosfera
 * comunica, quali mosse la rendono riconoscibile, cosa la fa sembrare un
 * template e come deve suonare il testo che la abita.
 *
 * Da qui non esce nessun colore e nessun numero casuale: palette e tinta
 * restano deterministiche (`oklch.ts`), qui ci sono solo decisioni di progetto.
 * Serve a due cose:
 *   1. al composer, per scegliere varianti di blocco coerenti con lo stile;
 *   2. ai prompt dell'AI, per far nascere i testi già dentro lo stile scelto.
 */

export type HeroVariant = "split" | "centered" | "editorial";
export type FeaturesVariant = "grid" | "bento" | "alternating";

export type StyleBrief = {
  preset: StylePreset;
  label: string;
  /** L'atmosfera in una riga: come deve sembrare il sito al primo sguardo. */
  mood: string;
  /** Mosse concrete che rendono lo stile riconoscibile (layout, gerarchia, ritmo). */
  signatureElements: string[];
  /** Cosa lo stile non fa mai: il confine oltre il quale diventa un altro stile. */
  avoid: string[];
  /** Come deve essere scritto il testo in questa direzione visiva. */
  voice: string;
  /** Varianti di sezione di apertura, in ordine di preferenza (mai lessico libero). */
  heroVariants: HeroVariant[];
  /** Varianti dell'elenco servizi, in ordine di preferenza. */
  featuresVariants: FeaturesVariant[];
};

export const STYLE_BRIEFS: Record<StylePreset, StyleBrief> = {
  editorial: {
    preset: "editorial",
    label: PRESET_LABELS.editorial,
    mood: "Rivista di settore: rigore tipografico, gerarchie nette, testo che si legge di gusto.",
    signatureElements: [
      "Titoli grandi con interlinea stretta e occhielli in maiuscoletto spaziato",
      "Impaginazione a colonne: una colonna di testo e una di appoggio, mai blocchi centrati",
      "Elementi separati da filetti sottili invece che da schede con ombra",
      "Immagini larghe a piena pagina come apertura di capitolo, non come decorazione",
    ],
    avoid: [
      "Angoli arrotondati e ombre morbide",
      "Testo centrato su paragrafi lunghi",
      "Emoji o punti esclamativi nel titolo",
    ],
    voice:
      "Frasi piene ma concrete, voce da giornalista specializzato: prima il fatto, poi il commento. Massimo un inciso per periodo.",
    heroVariants: ["editorial", "split"],
    featuresVariants: ["alternating", "grid"],
  },
  luxury: {
    preset: "luxury",
    label: PRESET_LABELS.luxury,
    mood: "Atelier silenzioso: molto spazio, pochi elementi, ogni dettaglio sembra costato tempo.",
    signatureElements: [
      "Titoli leggeri e larghi, con maiuscoletto molto spaziato per le etichette",
      "Ampie sezioni vuote: la distanza fra i blocchi è parte del messaggio",
      "Nessuna ombra: solo filetti sottili e superfici pulite",
      "Transizioni lente e continue, mai scatti",
    ],
    avoid: [
      "Badge, bollini e icone colorate",
      "Testi in maiuscolo su paragrafi interi",
      "Liste fitte o confronti di prezzo in griglia",
    ],
    voice:
      "Frasi brevi, sobrie, mai entusiaste. Si descrive ciò che si fa e per chi, senza aggettivi di valore (\"unico\", \"esclusivo\", \"eccellenza\").",
    heroVariants: ["split", "editorial"],
    featuresVariants: ["alternating", "grid"],
  },
  brutalist: {
    preset: "brutalist",
    label: PRESET_LABELS.brutalist,
    mood: "Manifesto: bordi pieni, contrasto altissimo, zero decorazione. Dice una cosa e la dice forte.",
    signatureElements: [
      "Bordi spessi e ombre nette spostate, senza sfocatura",
      "Titoli in maiuscolo molto pesanti e lunghi",
      "Etichette corte, tutte maiuscole, come timbri",
      "Animazioni quasi istantanee: il movimento non deve intrattenere",
    ],
    avoid: [
      "Sfumature, trasparenze e vetro",
      "Raggi e ombre morbide",
      "Testi vaghi o metafore: qui si elencano fatti",
    ],
    voice:
      "Frase secca, verbo forte, niente subordinate. Dati e nomi al posto degli aggettivi.",
    heroVariants: ["split", "centered"],
    featuresVariants: ["bento", "grid"],
  },
  glass: {
    preset: "glass",
    label: PRESET_LABELS.glass,
    mood: "Luminoso e stratificato: superfici traslucide, profondità data dalla luce.",
    signatureElements: [
      "Schede con fondo traslucido e bordo luminoso sottile",
      "Grandi raggi e ombre diffuse per staccare i piani",
      "Accenti usati come luce di bordo, non come riempimento",
      "Movimenti morbidi con curve in uscita lenta",
    ],
    avoid: [
      "Fondi completamente piatti e opachi",
      "Testo su superfici traslucide senza contrasto garantito",
      "Bordi spessi e ombre nette",
    ],
    voice:
      "Tono calmo e chiaro, frasi di media lunghezza. Si spiega il vantaggio concreto prima del dettaglio tecnico.",
    heroVariants: ["centered", "split"],
    featuresVariants: ["bento", "grid"],
  },
  minimal: {
    preset: "minimal",
    label: PRESET_LABELS.minimal,
    mood: "Essenziale: il contenuto è l'interfaccia, tutto il resto sparisce.",
    signatureElements: [
      "Una sola idea per sezione, con molto respiro intorno",
      "Gerarchia affidata a dimensione e spazio, non a colori o riquadri",
      "Raggi piccoli, nessuna ombra, filetti appena visibili",
      "Etichette in tondo, senza maiuscoletto spaziato",
    ],
    avoid: [
      "Più di due livelli di enfasi nella stessa sezione",
      "Fondi alternati e decorazioni di riempimento",
      "Testi lunghi dove basta una frase",
    ],
    voice:
      "Frasi corte e dirette, una informazione per frase. Niente ripetizioni, niente preamboli.",
    heroVariants: ["centered", "split"],
    featuresVariants: ["grid", "alternating"],
  },
  tech: {
    preset: "tech",
    label: PRESET_LABELS.tech,
    mood: "Strumento di precisione: struttura leggibile, dati in evidenza, niente fronzoli.",
    signatureElements: [
      "Griglie regolari e allineamenti verificabili occhio per occhio",
      "Etichette tecniche in maiuscoletto, numeri e unità di misura sempre visibili",
      "Schede con bordo netto e ombra profonda e stretta",
      "Monospaziato per i dati, sans per il racconto",
    ],
    avoid: [
      "Illustrazioni decorative e metafore visive",
      "\"Soluzioni innovative\", \"rivoluzionario\", \"a 360 gradi\"",
      "Promesse senza numero, senza tempo o senza condizione",
    ],
    voice:
      "Registro tecnico ma leggibile: cosa fa, per chi, in quanto tempo, con quale vincolo. Un numero vale più di tre aggettivi.",
    heroVariants: ["split", "centered"],
    featuresVariants: ["bento", "grid"],
  },
  organic: {
    preset: "organic",
    label: PRESET_LABELS.organic,
    mood: "Materico e caldo: forme curve, ritmo lento, sensazione di cosa fatta a mano.",
    signatureElements: [
      "Raggi molto ampi e ombre lunghe e morbide",
      "Titoli dolci, serif o humanist, con tracking quasi neutro",
      "Movimenti elastici, leggermente oltre il punto di arrivo",
      "Immagini e testi che si alternano senza griglia rigida",
    ],
    avoid: [
      "Spigoli vivi e ombre nette",
      "Griglie perfettamente simmetriche",
      "Tono asettico o da manuale tecnico",
    ],
    voice:
      "Tono umano e concreto, prima persona plurale. Si racconta il processo e le mani che lo fanno, senza sentimentalismi.",
    heroVariants: ["centered", "editorial"],
    featuresVariants: ["grid", "alternating"],
  },
  retro: {
    preset: "retro",
    label: PRESET_LABELS.retro,
    mood: "Terminale: testo monospaziato, cornici sottili, tempi meccanici.",
    signatureElements: [
      "Contenuto dentro cornici a filetto, spesso tratteggiate",
      "Etichette in maiuscoletto molto spaziato, stile prompt",
      "Movimento a scatti, senza sfumature di transizione",
      "Numerazione e stato delle sezioni sempre dichiarati",
    ],
    avoid: [
      "Curve morbide e ombre diffuse",
      "Immagini patinate a tutta pagina",
      "Testi promozionali con superlativi",
    ],
    voice:
      "Frasi brevi e dichiarative, quasi da documentazione: cosa c'è, come funziona, come si accede.",
    heroVariants: ["split", "centered"],
    featuresVariants: ["grid", "bento"],
  },
};

/** Brief di uno stile, con fallback sicuro: non esiste preset senza brief. */
export function styleBrief(preset: StylePreset | undefined, fallback: StylePreset = "minimal"): StyleBrief {
  return STYLE_BRIEFS[preset ?? fallback] ?? STYLE_BRIEFS[fallback];
}

/**
 * Blocco di prompt che descrive lo stile attivo. Serve a far scrivere i testi
 * dentro la direzione visiva invece che a fianco: stessi contenuti, altra voce.
 */
export function styleBriefForPrompt(preset: StylePreset | undefined): string {
  const brief = styleBrief(preset);
  return [
    `Direzione visiva attiva: ${brief.label} — ${brief.mood}`,
    `Elementi firma: ${brief.signatureElements.join("; ")}.`,
    `Da evitare: ${brief.avoid.join("; ")}.`,
    `Voce del testo: ${brief.voice}`,
  ].join("\n");
}

/** Menù compatto di tutte le direzioni, per far scegliere il modello con cognizione. */
export function styleMenuForPrompt(): string {
  return (Object.values(STYLE_BRIEFS) as StyleBrief[])
    .map((brief) => `- ${brief.preset} (${brief.label}): ${brief.mood}`)
    .join("\n");
}

/** Sceglie una variante fra quelle ammesse dallo stile, con un numero già deciso. */
export function pickStyleVariant<T extends string>(options: readonly T[], random: () => number): T {
  const chosen = options[Math.floor(random() * options.length)] ?? options[0];
  if (!chosen) throw new Error("Nessuna variante di stile disponibile");
  return chosen;
}
