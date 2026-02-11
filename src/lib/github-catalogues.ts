/**
 * List and fetch BattleScribe catalogues from GitHub BSData/age-of-sigmar-4th.
 * Uses GitHub API to list repo contents (dynamic) with a static fallback.
 */

const REPO = "BSData/age-of-sigmar-4th";
const API_LIST = `https://api.github.com/repos/${REPO}/contents`;
const RAW_BASE = "https://raw.githubusercontent.com/BSData/age-of-sigmar-4th/main";

export interface CatalogueItem {
  name: string;
  path: string;
  /** Display label, e.g. "Blades of Khorne" (no " - Library" suffix). */
  label: string;
}

function libraryCatalogueLabel(filename: string): string {
  return filename.replace(/\.cat$/i, "").replace(/\s*-\s*Library\s*$/i, "").trim() || filename;
}

/** Static fallback list of Library catalogues (from repo structure). */
const FALLBACK_LIBRARY: CatalogueItem[] = [
  "Beasts of Chaos - Library.cat",
  "Blades of Khorne - Library.cat",
  "Bonesplitterz - Library.cat",
  "Cities of Sigmar - Library.cat",
  "Daughters of Khaine - Library.cat",
  "Disciples of Tzeentch - Library.cat",
  "Flesh-eater Courts - Library.cat",
  "Fyreslayers - Library.cat",
  "Gloomspite Gitz - Library.cat",
  "Hedonites of Slaanesh - Library.cat",
  "Helsmiths of Hashut - Library.cat",
  "Idoneth Deepkin - Library.cat",
  "Ironjawz - Library.cat",
  "Kharadron Overlords - Library.cat",
  "Kruleboyz - Library.cat",
  "Lumineth Realm-lords - Library.cat",
  "Maggotkin of Nurgle - Library.cat",
  "Nighthaunt - Library.cat",
  "Ogor Mawtribes - Library.cat",
  "Ossiarch Bonereapers - Library.cat",
  "Seraphon - Library.cat",
  "Skaven - Library.cat",
  "Slaves to Darkness - Library.cat",
  "Sons of Behemat - Library.cat",
  "Soulblight Gravelords - Library.cat",
].map((path) => ({
  name: path,
  path,
  label: libraryCatalogueLabel(path),
}));

/**
 * Fetch list of .cat files from GitHub. Prefer Library.cat for unit data.
 * Falls back to static list on API error or rate limit.
 */
export async function listCatalogues(): Promise<CatalogueItem[]> {
  try {
    const res = await fetch(API_LIST, {
      headers: { Accept: "application/vnd.github.v3+json" },
      cache: "no-store",
    });
    if (!res.ok) return FALLBACK_LIBRARY;
    const data = (await res.json()) as Array<{ name: string; path?: string }>;
    const catFiles = data.filter((f) => / - Library\.cat$/i.test(f.name));
    const libraryFirst = catFiles.sort((a, b) => {
      const aLib = a.name.includes("Library") ? 0 : 1;
      const bLib = b.name.includes("Library") ? 0 : 1;
      if (aLib !== bLib) return aLib - bLib;
      return a.name.localeCompare(b.name);
    });
    return libraryFirst.map((f) => ({
      name: f.name,
      path: f.path ?? f.name,
      label: libraryCatalogueLabel(f.name),
    }));
  } catch {
    return FALLBACK_LIBRARY;
  }
}

/**
 * Derive the battle trait catalogue path from a Library catalogue path.
 * e.g. "Fyreslayers - Library.cat" → "Fyreslayers.cat"
 */
export function getBattleTraitCataloguePath(libraryPath: string): string {
  return libraryPath.replace(/\s*-\s*Library\.cat$/i, ".cat");
}

/** Path to the Lores catalogue (spells, prayers, manifestation lores). */
export const LORES_CATALOGUE_PATH = "Lores.cat";

/** Path to Regiments of Renown catalogue. */
export const REGIMENTS_OF_RENOWN_PATH = "Regiments of Renown.cat";

/**
 * Fetch raw XML content of a catalogue file.
 * @param path - File name (e.g. "Blades of Khorne - Library.cat") or full raw URL
 */
export async function fetchCatalogueXml(path: string): Promise<string> {
  const url = path.startsWith("http") ? path : `${RAW_BASE}/${encodeURIComponent(path)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load catalogue: ${res.status} ${res.statusText}`);
  return res.text();
}
