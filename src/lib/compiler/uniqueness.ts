import { hashString, paletteSignature } from "@/lib/design/oklch";
import type { Site } from "@/lib/schema/site";

/**
 * Unicità strutturale.
 *
 * La firma combina tre cose che i template non possono variare: la sequenza
 * reale di tipi e varianti di blocco, il tema (preset + tipografia + palette) e
 * le scelte di stile per sezione. Due siti con la stessa firma sono, di fatto,
 * lo stesso sito: il composer lo rileva e cambia varianti.
 */
export function structuralSignature(site: Site): string {
  const structure = site.pages
    .map((page) =>
      page.blocks
        .map((block) => `${block.type}/${block.variant}:${block.style.width}:${block.style.background}:${block.style.align}:${block.style.space}:${block.style.hideOnMobile ? 1 : 0}:${block.style.anchor ?? ""}:${block.motion}`)
        .join("|"),
    )
    .join("||");

  const theme = [site.theme.preset, site.theme.fontPairing, site.theme.mode, paletteSignature(site.theme.palette)].join("~");
  const content = site.pages.map((page) => page.blocks.length).join(",");

  return hashString(`${structure}::${theme}::${content}`).toString(36);
}

export type CollisionReport = {
  unique: boolean;
  signature: string;
  collidesWith: string | null;
};

/** Confronta la firma con l'elenco dei siti già generati nel workspace. */
export function checkUniqueness(site: Site, known: { id: string; signature: string }[]): CollisionReport {
  const signature = structuralSignature(site);
  const collision = known.find((entry) => entry.signature === signature && entry.id !== site.id);
  return { unique: !collision, signature, collidesWith: collision?.id ?? null };
}

/**
 * Sceglie la prima variazione che produce una firma diversa da quelle note.
 * Se nessuna variazione basta (casi estremi), restituisce l'ultima: meglio
 * consegnare un sito che bloccare la generazione.
 */
export function findUniqueVariation<T>(
  attempts: number,
  build: (variation: number) => T,
  signatureOf: (candidate: T) => string,
  known: string[],
): { candidate: T; signature: string; variation: number; collided: boolean } {
  const taken = new Set(known);
  let last: { candidate: T; signature: string; variation: number; collided: boolean } | null = null;

  for (let variation = 0; variation < attempts; variation += 1) {
    const candidate = build(variation);
    const signature = signatureOf(candidate);
    const collided = taken.has(signature);
    last = { candidate, signature, variation, collided };
    if (!collided) return last;
  }

  if (last) return last;
  const candidate = build(0);
  return { candidate, signature: signatureOf(candidate), variation: 0, collided: false };
}
