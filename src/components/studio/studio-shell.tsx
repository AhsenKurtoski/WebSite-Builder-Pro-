"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PreviewFrame } from "./preview-frame";
import { PropsEditor } from "./props-editor";
import { useStudio, variantOptions } from "@/lib/store/site-store";
import { blockCatalog, findDefinition } from "@/lib/schema/registry";
import { PRESET_LABELS, FONT_PAIRINGS, type StylePreset } from "@/lib/design/tokens";
import { STYLE_PRESET_NAMES } from "@/lib/schema/site";
import { SECTOR_LABELS } from "@/lib/compiler/sector-profiles";
import { renderSite, renderSingleFileHtml } from "@/lib/export/render-site";
import { archiveSummary, buildSiteZip, downloadBlob, downloadText } from "@/lib/export/build-zip";
import { runGates, type GateReport } from "@/lib/quality/gates";
import { loadSite, saveSite } from "@/lib/storage/site-repo";
import { streamCompile } from "@/lib/ai/client";
import type { CompileStageId } from "@/lib/ai/compile";
import { readableBytes } from "@/lib/util/bytes";
import { UserMenu } from "@/components/auth/user-menu";
import { ownerOf, useSession } from "@/lib/auth/session-client";
import type { Site } from "@/lib/schema/site";

type Tab = "contenuto" | "blocco" | "tema" | "qualita";

const TABS: { id: Tab; label: string }[] = [
  { id: "contenuto", label: "Contenuto" },
  { id: "blocco", label: "Blocco" },
  { id: "tema", label: "Tema" },
  { id: "qualita", label: "Qualità" },
];

export function StudioShell({ siteId }: { siteId: string }) {
  const studio = useStudio();
  const { site, pagePath, selectedBlockId, device, zoom } = studio;
  // Il workspace serve a salvare il progetto nella cartella giusta.
  const { user } = useSession();
  const owner = ownerOf(user);

  const [tab, setTab] = useState<Tab>("contenuto");
  // Su schermo stretto anteprima e pannello non stanno affiancati: si alternano.
  const [mobileView, setMobileView] = useState<"anteprima" | "modifica">("anteprima");
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [gates, setGates] = useState<GateReport | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiRunning, setAiRunning] = useState(false);
  const [aiStages, setAiStages] = useState<{ id: CompileStageId; status: string; detail?: string }[]>([]);
  const [aiLog, setAiLog] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Caricamento del progetto dal database locale.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await loadSite(siteId);
        if (cancelled) return;
        if (!loaded) {
          setMissing(true);
          return;
        }
        studio.load(loaded);
        setAiPrompt(loaded.meta.brief || "");
      } catch {
        setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Salvataggio automatico: 900 ms dopo l'ultima modifica.
  useEffect(() => {
    if (!site || !studio.dirty) return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        await saveSite(site, { owner });
        studio.markSaved();
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [site, studio, owner]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!studio.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [studio.dirty]);

  // Scorciatoie da tastiera: undo/redo e deselezione.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        studio.undo();
      }
      if (meta && (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))) {
        event.preventDefault();
        studio.redo();
      }
      if (event.key === "Escape") studio.select(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [studio]);

  const page = useMemo(() => site?.pages.find((item) => item.path === pagePath) ?? site?.pages[0], [site, pagePath]);
  const selectedBlock = useMemo(() => page?.blocks.find((block) => block.id === selectedBlockId) ?? null, [page, selectedBlockId]);
  const definition = selectedBlock ? findDefinition(selectedBlock.type, selectedBlock.variant) : null;

  const catalog = useMemo(() => blockCatalog(), []);
  const archive = useMemo(() => (site ? archiveSummary(renderSite(site)) : { files: 0, bytes: 0 }), [site]);

  const runQuality = useCallback(() => {
    if (!site) return;
    setGates(runGates(site, renderSite(site).map((file) => ({ path: file.path, contents: file.contents }))));
    setTab("qualita");
  }, [site]);

  async function exportZip() {
    if (!site) return;
    setExportNote("Preparo l'archivio…");
    const blob = await buildSiteZip(site);
    downloadBlob(blob, `${site.slug || "sito"}.zip`);
    setExportNote(`Archivio scaricato: ${archive.files} file, ${readableBytes(blob.size)}.`);
  }

  function exportSingleFile() {
    if (!site) return;
    downloadText(renderSingleFileHtml(site, pagePath), `${site.slug || "sito"}-${pagePath.replace(/\//g, "") || "home"}.html`);
    setExportNote("HTML singolo scaricato: si apre anche senza server.");
  }

  async function runAi(kind: "improve" | "restyle") {
    if (!site) return;
    setAiRunning(true);
    setAiStages([]);
    setAiLog([]);

    const briefText =
      kind === "restyle"
        ? `${site.meta.brief || site.brand.tagline}. Cambia direzione creativa mantenendo gli stessi contenuti e la stessa offerta.`
        : aiPrompt || site.meta.brief;

    if (!briefText) {
      setAiLog(["Scrivi prima cosa deve raccontare il sito."]);
      setAiRunning(false);
      return;
    }

    try {
      await saveSite(site, { snapshot: kind === "restyle" ? "Prima del restyle" : "Prima della rigenerazione" });
      const regenerated = await streamCompile(
        {
          prompt: briefText,
          businessName: site.businessName,
          sector: site.sector,
          contacts: {
            email: site.brand.contact.email,
            phone: site.brand.contact.phone,
            city: site.brand.contact.city,
            address: site.brand.contact.address,
          },
          variation: kind === "restyle" ? 1 : 0,
          knownSignatures: [],
        },
        (event) => {
          if (event.type === "stage") {
            setAiStages((current) => [...current.filter((stage) => stage.id !== event.id), { id: event.id, status: event.status, detail: event.detail }]);
          }
          if (event.type === "warning") setAiLog((current) => [...current, event.message]);
          if (event.type === "provider") setAiLog((current) => [...current, `${event.label} → ${event.task}`]);
        },
      );

      if (regenerated) {
        const next: Site = { ...regenerated, id: site.id, createdAt: site.createdAt };
        studio.load(next);
        await saveSite(next, { snapshot: kind === "restyle" ? "Restyle applicato" : "Rigenerazione applicata" });
        setAiLog((current) => [...current, "Sito aggiornato e salvato."]);
      }
    } catch (error) {
      setAiLog((current) => [...current, error instanceof Error ? error.message : "Errore inatteso"]);
    } finally {
      setAiRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="pulse text-sm text-ink-500">Carico il progetto…</p>
      </div>
    );
  }

  if (missing || !site || !page) {
    return (
      <div className="grid min-h-screen place-items-center gap-3">
        <p className="text-sm text-ink-300">Questo progetto non è presente in questo browser.</p>
        <Link className="btn" href="/dashboard">
          Torna ai progetti
        </Link>
      </div>
    );
  }

  return (
    <div className="h-vh-fallback flex flex-col overflow-hidden">
      {/* Barra superiore */}
      <header className="safe-top flex flex-wrap items-center justify-between gap-2 border-b border-surface-700 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/dashboard" className="btn btn-ghost" title="Torna ai progetti">
            ←
          </Link>
          <div className="grid min-w-0">
            <span className="truncate text-sm font-semibold">{site.businessName}</span>
            <span className="truncate text-[10px] text-ink-600">
              {SECTOR_LABELS[site.sector]} · {PRESET_LABELS[site.theme.preset]}
              <span className="hidden sm:inline"> · {site.pages.length} pagine · hash {site.meta.structuralHash}</span>
              <span className={saveState === "error" ? "text-danger-500" : "text-ink-600"}>{saveState === "saving" ? "Salvataggio..." : saveState === "saved" ? "Salvato" : saveState === "error" ? "Salvataggio non riuscito" : ""}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden overflow-hidden rounded-tool border border-surface-700 sm:flex">
            {(["mobile", "tablet", "desktop"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={device === item ? "bg-surface-800 px-2.5 py-1 text-xs" : "px-2.5 py-1 text-xs text-ink-500 hover:bg-surface-850"}
                onClick={() => studio.setDevice(item)}
              >
                {item === "mobile" ? "Mobile" : item === "tablet" ? "Tablet" : "Desktop"}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            <button type="button" className="btn btn-ghost px-2" onClick={() => studio.setZoom(zoom - 0.1)}>
              −
            </button>
            <span className="chip">{Math.round(zoom * 100)}%</span>
            <button type="button" className="btn btn-ghost px-2" onClick={() => studio.setZoom(zoom + 0.1)}>
              +
            </button>
          </div>

          <button type="button" className="btn hidden sm:inline-flex" onClick={studio.undo} disabled={!studio.canUndo()} title="Annulla (Ctrl+Z)">
            Annulla
          </button>
          <button type="button" className="btn hidden sm:inline-flex" onClick={studio.redo} disabled={!studio.canRedo()} title="Ripeti">
            Ripeti
          </button>
          <button type="button" className="btn" onClick={runQuality}>
            Verifica
          </button>
          <button type="button" className="btn hidden xl:inline-flex" onClick={exportSingleFile}>
            HTML singolo
          </button>
          <button type="button" className="btn btn-primary" onClick={exportZip}>
            Scarica ZIP
          </button>

          <span className="mx-1 hidden h-6 w-px bg-surface-700 sm:block" />
          <UserMenu compact />
        </div>
      </header>

      {/* Su schermo stretto il rail non ci sta: qui restano pagina e pannello. */}
      <div className="flex items-center gap-2 border-b border-surface-700 px-3 py-2 lg:hidden">
        <select
          className="field max-w-[9rem] flex-1"
          value={pagePath}
          onChange={(event) => studio.setPage(event.target.value)}
          aria-label="Pagina in modifica"
        >
          {site.pages.map((item) => (
            <option key={item.id} value={item.path}>
              {item.title}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-tool border border-surface-700">
          {(["anteprima", "modifica"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={mobileView === item ? "bg-surface-800 px-3 py-1.5 text-xs" : "px-3 py-1.5 text-xs text-ink-500"}
              onClick={() => setMobileView(item)}
            >
              {item === "anteprima" ? "Anteprima" : "Modifica"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Rail sinistro */}
        <aside className="hidden w-64 shrink-0 flex-col gap-3 overflow-auto scroll-thin border-r border-surface-700 p-3 lg:flex">
          <div className="grid gap-1">
            <span className="label">Pagine</span>
            {site.pages.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  item.path === pagePath
                    ? "rounded-tool bg-surface-800 px-2 py-1.5 text-left text-xs"
                    : "rounded-tool px-2 py-1.5 text-left text-xs text-ink-500 hover:bg-surface-850"
                }
                onClick={() => studio.setPage(item.path)}
              >
                {item.title}
                <span className="ml-1 text-[10px] text-ink-600">{item.path}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-1">
            <span className="label">Sezioni ({page.blocks.length})</span>
            <ul className="grid gap-1">
              {page.blocks.map((block, index) => {
                const def = findDefinition(block.type, block.variant);
                return (
                  <li key={block.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      className={
                        block.id === selectedBlockId
                          ? "flex-1 rounded-tool bg-surface-800 px-2 py-1 text-left text-[11px]"
                          : "flex-1 rounded-tool px-2 py-1 text-left text-[11px] text-ink-500 hover:bg-surface-850"
                      }
                      onClick={() => studio.select(block.id)}
                    >
                      {def?.label ?? block.type}
                    </button>
                    <button type="button" className="btn btn-ghost px-1 py-0 text-[10px]" title="Sposta su" onClick={() => studio.moveBlock(block.id, -1)} disabled={index === 0}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost px-1 py-0 text-[10px]"
                      title="Sposta giù"
                      onClick={() => studio.moveBlock(block.id, 1)}
                      disabled={index === page.blocks.length - 1}
                    >
                      ↓
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-2 border-t border-surface-700 pt-3">
            <span className="label">Aggiungi sezione</span>
            {catalog.map((group) => (
              <div key={group.category} className="grid gap-1">
                <span className="text-[10px] text-ink-600">{group.label}</span>
                <select
                  className="field text-xs"
                  defaultValue=""
                  onChange={(event) => {
                    const [type, variant] = event.target.value.split(":");
                    if (!type || !variant) return;
                    studio.addBlock(type, variant, selectedBlockId);
                    event.target.value = "";
                  }}
                >
                  <option value="">Scegli…</option>
                  {group.entries.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className={`min-w-0 flex-1 flex-col lg:flex ${mobileView === "anteprima" ? "flex" : "hidden"}`}>
          <PreviewFrame
            site={site}
            pagePath={pagePath}
            device={device}
            zoom={zoom}
            selectedBlockId={selectedBlockId}
            onSelectBlock={(blockId) => {
              studio.select(blockId);
              setTab("contenuto");
              // Su mobile chi tocca una sezione vuole modificarla, non restare a guardarla.
              setMobileView("modifica");
            }}
          />

          {/* Barra AI */}
          <div className="safe-bottom border-t border-surface-700 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="field min-w-0 flex-1"
                placeholder="Chiedi una modifica: «rendi più persuasiva l'apertura», «aggiungi una sezione prezzi», «cambia stile»"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
              />
              <button type="button" className="btn" onClick={() => runAi("restyle")} disabled={aiRunning}>
                Restyle
              </button>
              <button type="button" className="btn btn-primary" onClick={() => runAi("improve")} disabled={aiRunning}>
                {aiRunning ? "Lavoro…" : "Rigenera"}
              </button>
            </div>

            {aiStages.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {aiStages.map((stage) => (
                  <span key={stage.id} className="chip">
                    <span className={stage.status === "done" ? "text-ok-500" : stage.status === "skipped" ? "text-warn-500" : "pulse text-accent-400"}>●</span>
                    {stage.id}
                    {stage.detail ? `: ${stage.detail}` : ""}
                  </span>
                ))}
              </div>
            ) : null}

            {aiLog.length > 0 ? (
              <ul className="mt-2 grid max-h-24 gap-0.5 overflow-auto scroll-thin text-[11px] text-ink-500">
                {aiLog.map((line, index) => (
                  <li key={index}>· {line}</li>
                ))}
              </ul>
            ) : null}

            {exportNote ? <p className="mt-2 text-[11px] text-accent-400">{exportNote}</p> : null}
          </div>
        </div>

        {/* Inspector */}
        <aside
          className={`min-h-0 flex-1 flex-col overflow-hidden border-t border-surface-700 lg:flex lg:max-h-none lg:w-80 lg:flex-none lg:border-l lg:border-t-0 ${
            mobileView === "modifica" ? "flex" : "hidden"
          }`}
        >
          <div className="flex border-b border-surface-700">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={tab === item.id ? "flex-1 border-b-2 border-accent-500 px-2 py-2 text-xs" : "flex-1 px-2 py-2 text-xs text-ink-500 hover:text-ink-300"}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto scroll-thin p-3">
            {tab === "contenuto" ? (
              selectedBlock && definition ? (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="label">{definition.label}</span>
                    <div className="flex gap-1">
                      <button type="button" className="btn btn-ghost px-2 text-[10px]" onClick={() => studio.duplicateBlock(selectedBlock.id)}>
                        Duplica
                      </button>
                      <button type="button" className="btn btn-ghost px-2 text-[10px]" onClick={() => studio.removeBlock(selectedBlock.id)}>
                        Elimina
                      </button>
                    </div>
                  </div>
                  <PropsEditor
                    value={selectedBlock.props}
                    onChange={(patch) => studio.updateBlockProps(selectedBlock.id, patch)}
                  />
                </div>
              ) : (
                <p className="text-xs text-ink-600">Seleziona una sezione dall&apos;elenco a sinistra o clicca direttamente nell&apos;anteprima.</p>
              )
            ) : null}

            {tab === "blocco" && selectedBlock ? (
              <div className="grid gap-4">
                <label className="grid gap-1">
                  <span className="label">Variante</span>
                  <select className="field" value={selectedBlock.variant} onChange={(event) => studio.setBlockVariant(selectedBlock.id, event.target.value)}>
                    {variantOptions(selectedBlock.type).map((option) => (
                      <option key={option.variant} value={option.variant}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-1">
                  <span className="label">Larghezza</span>
                  <select className="field" value={selectedBlock.style.width} onChange={(event) => studio.updateBlockStyle(selectedBlock.id, { width: event.target.value as never })}>
                    {["narrow", "default", "wide", "full"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1">
                  <span className="label">Sfondo</span>
                  <select className="field" value={selectedBlock.style.background} onChange={(event) => studio.updateBlockStyle(selectedBlock.id, { background: event.target.value as never })}>
                    {["none", "muted", "elevated", "primary", "accent", "art"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1">
                  <span className="label">Spaziatura</span>
                  <select className="field" value={selectedBlock.style.space} onChange={(event) => studio.updateBlockStyle(selectedBlock.id, { space: event.target.value as never })}>
                    {["compact", "normal", "loose"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1">
                  <span className="label">Animazione</span>
                  <select className="field" value={selectedBlock.motion} onChange={(event) => studio.setBlockMotion(selectedBlock.id, event.target.value as never)}>
                    {["none", "fade-up", "fade", "slide-left", "zoom"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedBlock.style.hideOnMobile}
                    onChange={(event) => studio.updateBlockStyle(selectedBlock.id, { hideOnMobile: event.target.checked })}
                  />
                  Nascondi su mobile
                </label>

                <label className="grid gap-1">
                  <span className="label">Ancoraggio (id)</span>
                  <input className="field" value={selectedBlock.style.anchor ?? ""} onChange={(event) => studio.updateBlockStyle(selectedBlock.id, { anchor: event.target.value })} />
                </label>
              </div>
            ) : null}

            {tab === "blocco" && !selectedBlock ? <p className="text-xs text-ink-600">Nessuna sezione selezionata.</p> : null}

            {tab === "tema" ? (
              <div className="grid gap-4">
                <label className="grid gap-1">
                  <span className="label">Preset</span>
                  <select className="field" value={site.theme.preset} onChange={(event) => studio.setPreset(event.target.value as StylePreset)}>
                    {STYLE_PRESET_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {PRESET_LABELS[name]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="label">Accoppiamento tipografico</span>
                  <select className="field" value={site.theme.fontPairing} onChange={(event) => studio.setFontPairing(event.target.value)}>
                    {FONT_PAIRINGS.map((pairing) => (
                      <option key={pairing.id} value={pairing.id}>
                        {pairing.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-1">
                  <span className="label">Modalità</span>
                  <div className="flex gap-2">
                    {(["light", "dark"] as const).map((mode) => (
                      <button key={mode} type="button" className={site.theme.mode === mode ? "btn btn-primary" : "btn"} onClick={() => studio.setMode(mode)}>
                        {mode === "light" ? "Chiara" : "Scura"}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="grid gap-1">
                  <span className="label">Tinta principale: {site.theme.palette.primary.h}°</span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={site.theme.palette.primary.h}
                    onChange={(event) => studio.setPaletteHue(Number(event.target.value))}
                  />
                </label>

                <div className="grid gap-2">
                  <span className="label">Palette</span>
                  <div className="flex gap-1">
                    {(["primary", "accent"] as const).map((key) => {
                      const color = site.theme.palette[key];
                      return (
                        <div key={key} className="flex-1 rounded-tool border border-surface-700 p-2">
                          <div
                            className="mb-1 h-10 rounded"
                            style={{ background: `oklch(${color.l.toFixed(3)} ${color.c.toFixed(3)} ${color.h})` }}
                          />
                          <span className="text-[10px] text-ink-500">{key}</span>
                          <div className="mt-1 grid gap-1">
                            {(["l", "c"] as const).map((channel) => (
                              <input
                                key={channel}
                                type="range"
                                min={channel === "l" ? 10 : 0}
                                max={channel === "l" ? 95 : 30}
                                value={Math.round(color[channel] * 100)}
                                onChange={(event) => studio.setPaletteOption(key, { [channel]: Number(event.target.value) / 100 })}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <label className="grid gap-1">
                  <span className="label">Dominio pubblico</span>
                  <input className="field" placeholder="https://www.esempio.it" value={site.meta.domain} onChange={(event) => studio.setDomain(event.target.value)} />
                </label>

                <p className="text-[11px] text-ink-600">
                  Il restyle cambia solo preset, font e palette: i contenuti restano intatti, parola per parola.
                </p>
              </div>
            ) : null}

            {tab === "qualita" ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="label">Gate di qualità</span>
                  <button type="button" className="btn px-2 text-[10px]" onClick={runQuality}>
                    Esegui
                  </button>
                </div>

                {gates ? (
                  <>
                    <div className="grid gap-1 text-[11px] text-ink-500">
                      <span>Errori: {gates.errors} · Avvisi: {gates.warnings}</span>
                      <span>
                        {gates.stats.pages} pagine · {gates.stats.blocks} sezioni · {gates.stats.words} parole · {readableBytes(gates.stats.estimatedKb * 1024)}
                      </span>
                      <span>
                        Contrasto: {gates.stats.contrastPairs - gates.stats.contrastFailures}/{gates.stats.contrastPairs} coppie conformi
                      </span>
                    </div>

                    <ul className="grid gap-2">
                      {gates.issues.map((issue, index) => (
                        <li key={index} className="panel-flat p-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                issue.severity === "error" ? "text-danger-500" : issue.severity === "warning" ? "text-warn-500" : "text-accent-400"
                              }
                            >
                              ●
                            </span>
                            <span className="text-[11px] font-medium">{issue.title}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-ink-500">{issue.detail}</p>
                          <p className="mt-1 text-[11px] text-ink-600">Come si risolve: {issue.fix}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-ink-600">
                    Esegui i controlli per verificare contrasto, SEO, accessibilità, peso delle pagine e sicurezza del markup.
                  </p>
                )}

                <div className="grid gap-1 border-t border-surface-700 pt-3 text-[11px] text-ink-600">
                  <span>Archivio: {archive.files} file, {readableBytes(archive.bytes)}</span>
                  <span>Generato da: {site.meta.generatedBy}{site.meta.provider ? ` (${site.meta.provider})` : ""}</span>
                  <span>Versione schema: {site.schemaVersion}</span>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
