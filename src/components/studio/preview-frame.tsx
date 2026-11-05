"use client";

import { useEffect, useMemo, useRef } from "react";
import { renderSingleFileHtml } from "@/lib/export/render-site";
import type { Site } from "@/lib/schema/site";

/**
 * Anteprima.
 *
 * Non è una simulazione: dentro l'iframe gira lo STESSO HTML che finirà
 * nell'archivio esportato, con CSS e JavaScript reali. Quello che vedi è quello
 * che scarichi — nessun renderer separato da tenere allineato.
 */

export type PreviewFrameProps = {
  site: Site;
  pagePath: string;
  device: "mobile" | "tablet" | "desktop";
  zoom: number;
  onSelectBlock?: (blockId: string) => void;
  selectedBlockId?: string | null;
};

const WIDTHS: Record<PreviewFrameProps["device"], number> = {
  mobile: 390,
  tablet: 834,
  desktop: 1280,
};

export function PreviewFrame({ site, pagePath, device, zoom, onSelectBlock, selectedBlockId }: PreviewFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  const html = useMemo(
    () => renderSingleFileHtml(site, pagePath, { preview: true }),
    [site, pagePath],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { source?: string; type?: string; blockId?: string };
      if (data?.source !== "atelier-preview") return;
      if (data.type === "select" && typeof data.blockId === "string" && data.blockId.length < 200) onSelectBlock?.(data.blockId);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSelectBlock]);

  useEffect(() => {
    if (!selectedBlockId) return;
    frame.current?.contentWindow?.postMessage(
      { source: "atelier-editor", type: "scrollTo", blockId: selectedBlockId },
      "*",
    );
  }, [selectedBlockId, html]);

  const width = WIDTHS[device];

  return (
    <div className="scroll-thin flex h-full w-full justify-center overflow-auto p-2 sm:p-4 lg:p-6">
      <div
        className="origin-top transition-[width] duration-200"
        // La larghezza del dispositivo non supera mai quella disponibile: su un
        // telefono l'anteprima "mobile" ci sta dentro senza scroll orizzontale.
        style={{ width: `min(${width}px, 100%)`, transform: `scale(${zoom})`, transformOrigin: "top center" }}
      >
        <iframe
          ref={frame}
          title="Anteprima del sito"
          srcDoc={html}
          className="preview-viewport w-full rounded-lg border border-surface-700 bg-white shadow-2xl"
          // Isolamento pieno: lo script del sito non tocca nulla dell'editor.
          // Il consenso ai cookie resta gestito (le letture sono in try/catch).
          sandbox="allow-scripts allow-popups"
        />
      </div>
    </div>
  );
}
