import { getDb, type DeletionRecord, type SiteRecord, type VersionRecord } from "./db";
import type { Site } from "@/lib/schema/site";

/** Repository dei progetti: identico in locale e (in futuro) sul cloud. */

/** Workspace di ripiego: chi non ha ancora scelto un accesso. */
export const GUEST_OWNER = "local:ospite";

function toRecord(site: Site, owner: string): SiteRecord {
  return {
    id: site.id,
    name: site.name,
    slug: site.slug,
    sector: site.sector,
    preset: site.theme.preset,
    provider: site.meta.provider,
    structuralHash: site.meta.structuralHash,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
    owner,
    site,
  };
}

/** Elenca i progetti del workspace; senza `owner` elenca tutto il browser. */
export async function listSites(owner?: string): Promise<SiteRecord[]> {
  const db = getDb();
  if (!owner) return db.sites.orderBy("updatedAt").reverse().toArray();
  const rows = await db.sites.where("owner").equals(owner).toArray();
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listSignatures(owner?: string): Promise<{ id: string; signature: string }[]> {
  const db = getDb();
  const rows = owner ? await db.sites.where("owner").equals(owner).toArray() : await db.sites.toArray();
  return rows.map((row) => ({ id: row.id, signature: row.structuralHash }));
}

export async function loadSite(id: string): Promise<Site | null> {
  const db = getDb();
  const record = await db.sites.get(id);
  return record?.site ?? null;
}

export async function saveSite(
  site: Site,
  options: { snapshot?: string; owner?: string; keepTimestamp?: boolean; adoptOwner?: boolean } = {},
): Promise<void> {
  const db = getDb();
  // Nel pull dal cloud il timestamp arriva dal documento: va preservato, o la
  // copia scaricata sembrerebbe più recente e la vincerebbe al giro dopo.
  const stored: Site = options.keepTimestamp ? site : { ...site, updatedAt: new Date().toISOString() };
  const existing = await db.sites.get(stored.id);
  // Il proprietario non cambia mai da solo: chi ha creato il progetto resta.
  await db.transaction("rw", db.sites, db.deletions, async () => {
    const owner = options.adoptOwner ? options.owner ?? existing?.owner ?? GUEST_OWNER : existing?.owner ?? options.owner ?? GUEST_OWNER;
    await db.sites.put(toRecord(stored, owner));
    // Un salvataggio è anche una resurrezione: la tomba cessa di valere.
    await db.deletions.delete(stored.id);
  });

  // Le versioni si creano solo su richiesta esplicita: lo storico non deve
  // crescere a ogni battitura.
  if (options.snapshot) {
    await db.versions.add({
      siteId: stored.id,
      label: options.snapshot,
      createdAt: new Date().toISOString(),
      site: stored,
    });
  }
}

export async function deleteSite(id: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.sites, db.versions, db.deletions, async () => {
    await db.sites.delete(id);
    await db.versions.where("siteId").equals(id).delete();
    // Tomba locale: la sincronizzazione deve saperlo anche se il progetto
    // non esiste più (altrimenti verrebbe riportato dal cloud).
    await db.deletions.put({ id, deletedAt: new Date().toISOString() });
  });
}

/** Tutte le tombe conosciute da questo browser. */
export async function listDeletions(): Promise<DeletionRecord[]> {
  const db = getDb();
  return db.deletions.toArray();
}

/** Le tombe di progetti che non esistono più da nessuna parte si possono dimenticare. */
export async function clearDeletions(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = getDb();
  await db.deletions.bulkDelete(ids);
}

export async function listVersions(siteId: string): Promise<VersionRecord[]> {
  const db = getDb();
  return db.versions.where("siteId").equals(siteId).reverse().sortBy("createdAt");
}

export async function restoreVersion(versionId: number): Promise<Site | null> {
  const db = getDb();
  const version = await db.versions.get(versionId);
  if (!version) return null;
  const owner = (await db.sites.get(version.siteId))?.owner;
  await saveSite(version.site, { snapshot: "Ripristino di una versione precedente", owner });
  return version.site;
}

export async function logRun(entry: { siteId: string; provider?: string; elapsedMs: number; warnings: string[] }): Promise<void> {
  const db = getDb();
  await db.runs.add({ ...entry, createdAt: new Date().toISOString() });
}

export async function listRuns(siteId: string) {
  const db = getDb();
  return db.runs.where("siteId").equals(siteId).reverse().sortBy("createdAt");
}
