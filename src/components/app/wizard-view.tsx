"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "./app-header";
import { KeysPanel } from "./keys-panel";
import { streamCompile } from "@/lib/ai/client";
import type { CompileEvent, CompileStageId } from "@/lib/ai/compile";
import { SECTORS, STYLE_PRESET_NAMES, type Sector } from "@/lib/schema/site";
import { PRESET_LABELS, type StylePreset } from "@/lib/design/tokens";
import { STYLE_BRIEFS, styleBrief } from "@/lib/design/style-briefs";
import { SECTOR_LABELS } from "@/lib/compiler/sector-profiles";
import { listSignatures, saveSite } from "@/lib/storage/site-repo";
import { ownerOf, useSession } from "@/lib/auth/session-client";
import { readableBytes } from "@/lib/util/bytes";

const STAGE_LABELS: Record<CompileStageId, string> = {
  brief: "Analisi del brief",
  blueprint: "Direzione creativa",
  copy: "Scrittura dei contenuti",
  hardening: "Controlli di qualità",
};

const STAGE_HINTS: Record<CompileStageId, string> = {
  brief: "settore, palette, tipografia, pagine, contenuti",
  blueprint: "stile, font, tinta, SEO",
  copy: "riscrittura delle pagine scelte",
  hardening: "unicità, gate, accessibilità",
};

const EXAMPLE_PROMPTS = [
  "Studio di architettura a Bologna specializzato in ristrutturazioni di appartamenti storici",
  "Pizzeria napoletana a Milano con forno a legna e menu senza glutine",
  "Software gestionale per studi medici che gestisce appuntamenti e referti",
  "Personal trainer a Roma specializzato in ricomposizione corporea dopo i 40 anni",
];

export function WizardView({ initialPrompt = "", initialStyle = "" }: { initialPrompt?: string; initialStyle?: string }) {
  const router = useRouter();
  const { user, loading } = useSession();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tone, setTone] = useState("professionale e diretto");
  const [sector, setSector] = useState<Sector>("generic");
  const [preset, setPreset] = useState<StylePreset | "">(
    initialStyle && STYLE_PRESET_NAMES.includes(initialStyle as StylePreset) ? (initialStyle as StylePreset) : "",
  );

  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<{ id: CompileStageId; status: string; detail?: string; ms?: number }[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chosen = styleBrief(preset || undefined);

  async function generate() {
    if (prompt.trim().length < 8) {
      setError("Descrivi l'attività con qualche parola in più: serve al compilatore per scegliere settore, tono e contenuti.");
      return;
    }

    setError(null);
    setRunning(true);
    setStages([]);
    setLog([]);

    const owner = ownerOf(user);
    const signatureRows = await listSignatures(owner).catch(() => []);

    const onEvent = (event: CompileEvent) => {
      if (event.type === "stage") {
        setStages((current) => [...current.filter((stage) => stage.id !== event.id), { id: event.id, status: event.status, detail: event.detail, ms: event.ms }]);
      }
      if (event.type === "provider") setLog((current) => [...current, `${event.label} (${event.model}) ha risposto per: ${event.task}.`]);
      if (event.type === "page") setLog((current) => [...current, `Contenuti riscritti: ${event.title}.`]);
      if (event.type === "warning") setLog((current) => [...current, event.message]);
    };

    try {
      const generated = await streamCompile(
        {
          prompt,
          businessName,
          tone,
          sector,
          stylePreset: preset || undefined,
          contacts: { city, email, phone, address: "" },
          knownSignatures: signatureRows.map((row) => row.signature),
        },
        onEvent,
      );

      if (!generated) throw new Error("La compilazione non ha prodotto un sito");
      await saveSite(generated, { snapshot: "Generazione iniziale", owner });
      router.push(`/studio/${generated.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Errore inatteso");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader active="/nuovo" />

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="grid content-start gap-5">
          <header className="grid gap-2">
            <span className="mono-label">stadio 01 · il brief</span>
            <h1 className="text-3xl font-semibold tracking-tight">Descrivi l&apos;attività. Il sito c&apos;è.</h1>
            <p className="max-w-2xl text-sm text-ink-500">
              Il compilatore genera subito un sito completo e valido; se hai aggiunto una chiave, l&apos;AI riscrive i contenuti dentro
              lo stesso schema. Nessun passaggio può rompere il risultato.
            </p>
          </header>

          <div className="card grid gap-4 p-5">
            <label className="grid gap-2">
              <span className="label">Cosa deve raccontare il sito</span>
              <textarea
                className="field min-h-28 resize-y"
                placeholder="Es: studio di architettura a Bologna specializzato in ristrutturazioni di appartamenti storici"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button key={example} type="button" className="btn btn-ghost text-[11px]" onClick={() => setPrompt(example)}>
                  {example.slice(0, 42)}…
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="label">Nome attività</span>
                <input className="field" value={businessName} placeholder="Lo ricavo dal testo se lo lascio vuoto" onChange={(event) => setBusinessName(event.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="label">Città</span>
                <input className="field" value={city} onChange={(event) => setCity(event.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="label">Email</span>
                <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="label">Telefono</span>
                <input className="field" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="label">Tono di voce</span>
                <input className="field" value={tone} onChange={(event) => setTone(event.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="label">Settore</span>
                <select className="field" value={sector} onChange={(event) => setSector(event.target.value as Sector)}>
                  <option value="generic">Rileva automaticamente</option>
                  {SECTORS.filter((item) => item !== "generic").map((item) => (
                    <option key={item} value={item}>
                      {SECTOR_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="label">Direzione visiva</span>
                <select className="field" value={preset} onChange={(event) => setPreset(event.target.value as StylePreset | "")}>
                  <option value="">Automatica (la sceglie il compilatore)</option>
                  {STYLE_PRESET_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {PRESET_LABELS[name]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-[11px] text-ink-600">
                {chosen.mood} <span className="text-ink-500">Elementi firma:</span> {chosen.signatureElements[0]?.toLowerCase()}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => void generate()} disabled={running || loading}>
                {running ? "Compilazione in corso…" : "Genera il sito"}
              </button>
              <span className="text-xs text-ink-600">
                Workspace <code className="text-ink-500">{ownerOf(user)}</code>
              </span>
            </div>

            {error ? <p className="text-xs text-danger-500">{error}</p> : null}

            {stages.length > 0 ? (
              <ol className="grid gap-2 border-t border-surface-800 pt-4">
                {stages.map((stage) => (
                  <li key={stage.id} className="grid grid-cols-[1rem_1fr_auto] items-baseline gap-3">
                    <span
                      className={
                        stage.status === "done"
                          ? "text-ok-500"
                          : stage.status === "failed"
                            ? "text-danger-500"
                            : stage.status === "skipped"
                              ? "text-warn-500"
                              : "pulse text-accent-400"
                      }
                    >
                      ●
                    </span>
                    <span className="grid">
                      <span className="text-sm text-ink-300">{STAGE_LABELS[stage.id]}</span>
                      <span className="text-[11px] text-ink-600">{stage.detail || STAGE_HINTS[stage.id]}</span>
                    </span>
                    {stage.ms !== undefined ? <span className="chip">{stage.ms} ms</span> : null}
                  </li>
                ))}
              </ol>
            ) : null}

            {log.length > 0 ? (
              <ul className="scroll-thin grid max-h-40 gap-1 overflow-auto border-t border-surface-800 pt-3 text-[11px] text-ink-500">
                {log.map((line, index) => (
                  <li key={index}>· {line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <details className="card p-5" open={false}>
            <summary className="cursor-pointer text-sm font-semibold">Chiavi AI (opzionali)</summary>
            <div className="mt-3">
              <KeysPanel compact />
            </div>
          </details>

          <div className="card grid gap-2 p-5">
            <h2 className="text-sm font-semibold">Cosa ottieni subito</h2>
            <ul className="grid gap-1.5 text-xs text-ink-500">
              <li>· 6-7 pagine reali, con SEO e dati strutturati</li>
              <li>· Privacy e Cookie policy scritte, non segnaposto</li>
              <li>· Modulo di contatto funzionante senza servizi esterni</li>
              <li>· Banner cookie con consenso granulare</li>
              <li>· Archivio pronto per Vercel, Netlify o Cloudflare Pages</li>
              <li>· File di progetto reimportabile per riprendere a modificare</li>
            </ul>
            <p className="text-[11px] text-ink-600">
              Peso tipico dell&apos;archivio: {readableBytes(280 * 1024)} circa, senza immagini raster.
            </p>
          </div>

          <div className="card grid gap-2 p-5">
            <h2 className="text-sm font-semibold">Otto direzioni visive</h2>
            <p className="text-xs text-ink-500">Ognuna porta struttura, tipografia e voce proprie: cambiano le varianti di sezione, non solo i colori.</p>
            <div className="flex flex-wrap gap-1">
              {Object.values(STYLE_BRIEFS).map((brief) => (
                <button
                  key={brief.preset}
                  type="button"
                  className={`chip ${preset === brief.preset ? "border-accent-500/60 text-ink-100" : ""}`}
                  onClick={() => setPreset(preset === brief.preset ? "" : brief.preset)}
                >
                  {brief.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold">Motore AI</h2>
            <p className="mt-1 text-xs text-ink-500">
              Le chiavi sono configurate sul server, mai nel browser. Senza chiavi il composer genera comunque il sito.
            </p>
            <Link className="mt-3 text-[11px] text-accent-400 underline" href="/impostazioni">
              Stato delle chiavi
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
