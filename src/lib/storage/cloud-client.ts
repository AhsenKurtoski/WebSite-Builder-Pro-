import { SiteSchema, type Site } from "@/lib/schema/site";
import { loadSite, saveSite, deleteSite, listDeletions, clearDeletions } from "./site-repo";
import { GUEST_OWNER, listSites } from "./site-repo";
import type { SiteRecord } from "./db";
import type { SyncPlan } from "./sync-plan";

/**
 * Lato browser della sincronizzazione.
 *
 * Il flusso è volutamente esplicito e senza magie:
 *   1. il client legge l'indice locale (identificativi e istanti) e le tombe;
 *   2. `/api/cloud/sync` restituisce il piano, i documenti da scaricare e ha
 *      già propagato le eliminazioni più recenti;
 *   3. il client scarica i progetti richiesti, applica il pull con
 *      `keepTimestamp` (il cloud decide chi vince, non la copia locale) e
 *      cancella ciò che il piano ha dichiarato morto;
 *   4. i progetti da spingere partono verso `/api/cloud/push` a lotti;
 *   5. le tombe di progetti allineati si possono dimenticare.
 *
 * La sincronizzazione non è mai automatica: parte da un pulsante, così la
 * persona sa sempre quando i suoi dati attraversano la rete.
 */

export type SyncOutcome = {
  ok: boolean;
  note: string;
  pushed: number;
  pulled: number;
  deletedHere: number;
  propagated: number;
  message?: string;
};

type SyncResponse = {
  ok: boolean;
  message?: string;
  plan: SyncPlan;
  pulled: { site: unknown; updated_at: string }[];
  note: string;
};

async function postJson<T>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T | null; message?: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
    if (!response.ok) {
      return { ok: false, status: response.status, data: null, message: data?.message ?? `Errore ${response.status}` };
    }
    return { ok: true, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      message: error instanceof Error ? error.message : "Rete non raggiungibile",
    };
  }
}

export async function syncWithCloud(owner: string): Promise<SyncOutcome> {
  // 1) Indice locale: solo metadati, i documenti restano qui finché servono.
  const primary = await listSites(owner);
  const legacy = owner === GUEST_OWNER ? [] : await listSites(GUEST_OWNER);
  const seen = new Set(primary.map((row) => row.id));
  for (const row of legacy) {
    if (seen.has(row.id)) continue;
    await saveSite(row.site, { owner, keepTimestamp: true, adoptOwner: true });
    primary.push({ ...row, owner });
    seen.add(row.id);
  }
  const local: SiteRecord[] = primary;
  const index = local.map((row) => ({ id: row.id, updatedAt: row.updatedAt }));
  const deletions = await listDeletions();

  // 2) Il server costruisce il piano e propaga le eliminazioni recenti.
  const sync = await postJson<SyncResponse>("/api/cloud/sync", { local: index, deletions });
  if (!sync.ok || !sync.data?.ok) {
    return { ok: false, note: "Sincronizzazione non riuscita", pushed: 0, pulled: 0, deletedHere: 0, propagated: 0, message: sync.message ?? "Il cloud non ha risposto" };
  }

  const { plan, pulled } = sync.data;
  let pulledCount = 0;
  let deletedHere = 0;

  // 3) Il pull: applicare le copie più recenti, cancellare ciò che è morto.
  for (const item of pulled) {
    const parsed = SiteSchema.safeParse(item.site);
    if (!parsed.success) continue;
    await saveSite(parsed.data, { owner, keepTimestamp: true, adoptOwner: true });
    pulledCount += 1;
  }
  for (const id of plan.deleteLocal) {
    await deleteSite(id);
    deletedHere += 1;
  }

  // 4) Il push: solo i progetti che il piano ha scelto, a lotti.
  let pushed = 0;
  const pushIds = plan.push;
  const BATCH = 8;
  for (let start = 0; start < pushIds.length; start += BATCH) {
    const batchIds = pushIds.slice(start, start + BATCH);
    const sites: Site[] = [];
    for (const id of batchIds) {
      const site = await loadSite(id);
      if (site) sites.push(site);
    }
    if (!sites.length) continue;
    const push = await postJson<{ pushed: number }>("/api/cloud/push", { sites });
    if (!push.ok) {
      return {
        ok: false,
        note: "Sincronizzazione parziale: alcuni progetti non sono partiti",
        pushed,
        pulled: pulledCount,
        deletedHere,
        propagated: plan.pushDeletes.length,
        message: push.message ?? "Il push è stato rifiutato",
      };
    }
    pushed += push.data?.pushed ?? sites.length;
  }

  // 5) Le tombe di progetti presenti in archivio non servono più: se il
  // progetto è tornato (modificato dopo la cancellazione) o è stato accettato,
  // la memoria della sua morte non è più utile qui.
  const stillAlive = new Set((await listSites(owner)).map((row) => row.id));
  await clearDeletions(deletions.filter((tomb) => stillAlive.has(tomb.id)).map((tomb) => tomb.id));

  return {
    ok: true,
    note: sync.data.note,
    pushed,
    pulled: pulledCount,
    deletedHere,
    propagated: plan.pushDeletes.length,
  };
}

// Reexport per il pannello: il piano è l'unico contratto condiviso.
export type { SyncPlan } from "./sync-plan";
