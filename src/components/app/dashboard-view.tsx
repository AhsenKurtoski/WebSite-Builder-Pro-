"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "./app-header";
import { CloudPanel } from "./cloud-panel";
import { deleteSite, listSites, saveSite } from "@/lib/storage/site-repo";
import { parseImportedSite, projectFileName } from "@/lib/storage/import-site";
import type { SiteRecord } from "@/lib/storage/db";
import { FONT_PAIRINGS, PRESET_LABELS, type StylePreset } from "@/lib/design/tokens";
import { styleBrief } from "@/lib/design/style-briefs";
import { ownerOf, useSession } from "@/lib/auth/session-client";
import { runGates } from "@/lib/quality/gates";
import { renderSite } from "@/lib/export/render-site";
import { readableBytes } from "@/lib/util/bytes";

/** Copertina del progetto: palette e tipografia vere del sito, non un'immagine. */
function Cover({ record }: { record: SiteRecord }) {
  const { palette, fontPairing } = record.site.theme;
  const pairing = FONT_PAIRINGS.find((item) => item.id === fontPairing);
  const background = `linear-gradient(135deg, oklch(${palette.primary.l} ${palette.primary.c} ${palette.primary.h}) 0%, oklch(${palette.accent.l} ${palette.accent.c} ${palette.accent.h}) 55%, oklch(${palette.neutral.l} ${palette.neutral.c} ${palette.neutral.h}) 100%)`;

  return (
    <div className="relative h-32 overflow-hidden" style={{ background }}>
      <div className="absolute inset-0 bg-gradient-to-t from-surface-950/85 to-transparent" />
      <div className="absolute inset-x-4 bottom-3 grid gap-0.5" style={{ fontFamily: pairing?.heading }}>
        <span className="truncate text-[15px] font-semibold text-white drop-shadow">{record.site.brand.tagline || record.name}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/70">{record.name}</span>
      </div>
    </div>
  );
}

export function DashboardView() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setSites(await listSites(ownerOf(user)));
    } catch {
      setSites([]);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void refresh();
  }, [loading, refresh]);

  const totals = sites.reduce(
    (accumulator, record) => {
      const words = record.site.pages.reduce((sum, page) => sum + page.blocks.length, 0);
      return { blocks: accumulator.blocks + words, pages: accumulator.pages + record.site.pages.length };
    },
    { blocks: 0, pages: 0 },
  );

  /** Riprende un progetto esportato: stesso file che finisce nell'archivio. */
  async function importProject(file: File) {
    const result = parseImportedSite(await file.text());
    if (!result.ok) {
      setNote(`Importazione non riuscita: ${result.error}`);
      return;
    }
    await saveSite(result.site, { owner: ownerOf(user), snapshot: "Progetto importato" });
    await refresh();
    setNote(`Importato «${result.site.name}» (${result.site.pages.length} pagine). Lo trovi qui sotto.`);
  }

  async function exportProjectFile(record: SiteRecord) {
    const { downloadText } = await import("@/lib/export/build-zip");
    downloadText(JSON.stringify(record.site, null, 2), projectFileName(record.site), "application/json;charset=utf-8");
    setNote(`File di progetto scaricato: reimportalo qui per riprendere a modificarlo.`);
  }

  async function exportZip(record: SiteRecord) {
    setNote("Preparo l'archivio…");
    const { buildSiteZip, downloadBlob, archiveSummary } = await import("@/lib/export/build-zip");
    const blob = await buildSiteZip(record.site, renderSite(record.site));
    downloadBlob(blob, `${record.slug || "sito"}.zip`);
    const summary = archiveSummary(renderSite(record.site));
    setNote(`Archivio pronto: ${summary.files} file, ${readableBytes(summary.bytes)}.`);
  }

  function inspect(record: SiteRecord) {
    const report = runGates(record.site, renderSite(record.site).map((file) => ({ path: file.path, contents: file.contents })));
    setNote(
      `${record.name}: ${report.errors} errori, ${report.warnings} avvisi · contrasto ${report.stats.contrastPairs - report.stats.contrastFailures}/${report.stats.contrastPairs} · ${report.stats.estimatedKb} KB`,
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader active="/dashboard" />

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
        <section className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div className="grid content-start gap-2">
            <span className="mono-label">workspace · {user?.name ?? "ospite"}</span>
            <h1 className="text-3xl font-semibold tracking-tight">I tuoi progetti</h1>
            <p className="max-w-xl text-sm text-ink-500">
              Ogni progetto è un documento completo: pagine, contenuti, tema, versioni e controlli di qualità. Vivono in questo
              browser, nel workspace <code className="text-ink-300">{ownerOf(user)}</code>.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Link className="btn btn-primary" href="/nuovo">
                Nuovo sito da un prompt
              </Link>
              <button type="button" className="btn" onClick={() => importInput.current?.click()}>
                Importa progetto
              </button>
              <Link className="btn btn-ghost" href="/impostazioni">
                Chiavi AI
              </Link>
              <input
                ref={importInput}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) await importProject(file);
                  event.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="card grid grid-cols-3 content-start gap-2 p-4">
            {[
              ["progetti", String(sites.length)],
              ["pagine", String(totals.pages)],
              ["sezioni", String(totals.blocks)],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <span className="mono-label">{label}</span>
                <span className="text-2xl font-semibold tabular-nums">{value}</span>
              </div>
            ))}
            <p className="col-span-3 border-t border-surface-800 pt-2 text-[11px] text-ink-600">
              {loading
                ? "Verifico la sessione…"
                : user?.provider === "local"
                  ? "Sessione locale: i progetti vivono in questo browser. Con l'archivio cloud seguono l'account anche da un altro computer."
                  : user
                    ? `Accesso con ${user.provider}: con l'archivio cloud i progetti seguono l'account su ogni dispositivo.`
                    : "Sessione non attiva: i progetti locali restano in questo browser."}
            </p>
          </div>
        </section>

        <CloudPanel />

        {note ? (
          <p className="rounded-tool border border-surface-700 bg-surface-900 px-3 py-2 font-mono text-[11px] text-ink-500">{note}</p>
        ) : null}

        {!ready ? (
          <p className="text-sm text-ink-600">Carico i progetti…</p>
        ) : sites.length === 0 ? (
          <section className="card grid justify-items-center gap-3 p-10 text-center">
            <h2 className="text-xl font-semibold tracking-tight">Ancora nessun progetto</h2>
            <p className="max-w-md text-sm text-ink-500">
              Descrivi l&apos;attività in una frase: il compilatore costruisce sei o sette pagine complete, con testi, SEO e pagine
              legali. Nessuna chiave necessaria.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link className="btn btn-primary" href="/nuovo">
                Crea il primo sito
              </Link>
              <button type="button" className="btn" onClick={() => importInput.current?.click()}>
                Importa un progetto esportato
              </button>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((record) => {
              const preset = record.site.theme.preset as StylePreset;
              const brief = styleBrief(preset);
              return (
                <article key={record.id} className="card card-hover overflow-hidden">
                  <Cover record={record} />
                  <div className="grid gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid gap-0.5">
                        <h3 className="text-sm font-semibold">{record.name}</h3>
                        <span className="text-[11px] text-ink-600">
                          {record.sector} · {PRESET_LABELS[preset] ?? preset} · {record.site.pages.length} pagine
                        </span>
                      </div>
                      <span className="chip">{new Date(record.updatedAt).toLocaleDateString("it-IT")}</span>
                    </div>

                    <p className="line-clamp-2 text-[11px] text-ink-600">{brief.mood}</p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" className="btn btn-primary" onClick={() => router.push(`/studio/${record.id}`)}>
                        Apri nello Studio
                      </button>
                      <button type="button" className="btn" onClick={() => void exportZip(record)}>
                        ZIP
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => void exportProjectFile(record)}>
                        Progetto
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => inspect(record)}>
                        Verifica
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-danger-500"
                        onClick={async () => {
                          if (!window.confirm(`Eliminare "${record.name}"? Il progetto e le sue versioni verranno rimossi da questo browser.`)) return;
                          await deleteSite(record.id);
                          await refresh();
                        }}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
