/**
 * Parse army list text (e.g. from Warhammer Age of Sigmar app export)
 * and extract units, battle traits, and metadata for creating an army collection.
 */

export interface ParsedArmyList {
  /** Army list name (from first line, before points). */
  name: string;
  /** Army faction. */
  faction: string;
  /** Battle formation name. */
  battleFormation?: string;
  /** Spell lore name(s). */
  spellLores: string[];
  /** Manifestation lore name(s). */
  manifestationLores: string[];
  /** Unique unit names (deduplicated). */
  unitNames: string[];
  /** Unit names with their regiment of renown (for RoR sections). */
  unitRegiments: Array<{ unitName: string; regimentOfRenown?: string }>;
  /** Enhancement trait names (heroic traits, artefacts, Scourge of Ghyran, etc.). */
  enhancementNames: string[];
}

const SKIP_ENHANCEMENTS = new Set([
  "general",
  "reinforced",
  "reward",
  "rewards",
  "priest",
  "wizard",
  "champion",
]);

/** Match "Name (123)" or "Name (123 Points)" - capture the name without points. */
function stripPoints(text: string): string {
  return text.replace(/\s*\(\d+(\s*Points?)?\)\s*$/i, "").trim();
}

/** Normalize for matching: lowercase, collapse whitespace. */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s'-]/g, "")
    .trim();
}

/** Check if a line is a section header (regiment name). */
function isSectionHeader(line: string): boolean {
  const t = line.trim();
  return (
    t === "General's Regiment" ||
    t === "Regiments of Renown" ||
    /^Regiment \d+$/i.test(t) ||
    /^Regiment of Renown$/i.test(t)
  );
}

/** Check if line starts with bullet (• or -). */
function isBulletLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("•") || t.startsWith("-") || t.startsWith("*");
}

/** Extract bullet content. */
function bulletContent(line: string): string {
  return line
    .replace(/^[•\-*]\s*/, "")
    .replace(/\s*[-\s]*\(\d+\)\s*Points?\s*$/i, "")
    .trim();
}

/**
 * Parse army list text from app export format.
 * First line: "Name X/Y pts" -> use Name
 * Second line: faction
 * Then: battle formation, lores, regiments with units
 */
export function parseArmyListText(text: string): ParsedArmyList {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: ParsedArmyList = {
    name: "",
    faction: "",
    spellLores: [],
    manifestationLores: [],
    unitNames: [],
    unitRegiments: [],
    enhancementNames: [],
  };

  const seenUnits = new Set<string>();
  const seenEnhancements = new Set<string>();
  let currentRegimentOfRenown: string | undefined;
  let inRorSection = false;
  let rorSectionNextLineIsRorName = false;
  let i = 0;

  // Line 1: "2025 league 2000/2000 pts" or "Shadow Aelves 1990/2000 pts"
  if (lines.length > 0) {
    const first = lines[0];
    const ptsMatch = first.match(/^(.+?)\s+\d+\/\d+\s*(pts?)?\s*$/i);
    result.name = ptsMatch ? ptsMatch[1].trim() : first;
  }

  // Line 2: faction
  if (lines.length > 1) {
    result.faction = lines[1];
  }

  i = 2;

  // Battle formation: next line that has "(X Points)" and isn't a bullet
  while (i < lines.length) {
    const line = lines[i];
    if (isSectionHeader(line)) break;
    if (isBulletLine(line)) {
      i++;
      continue;
    }
    if (/\(\d+\s*Points?\)$/i.test(line) && !line.startsWith("Spell Lore") && !line.startsWith("Manifestation Lore")) {
      result.battleFormation = stripPoints(line);
      i++;
      break;
    }
    i++;
  }

  // Lores and metadata
  while (i < lines.length) {
    const line = lines[i];
    if (isSectionHeader(line)) break;
    if (line.startsWith("Spell Lore - ")) {
      const lore = stripPoints(line.replace(/^Spell Lore -\s*/i, "").trim());
      if (lore && !result.spellLores.includes(lore)) result.spellLores.push(lore);
    } else if (line.startsWith("Manifestation Lore - ")) {
      const lore = stripPoints(line.replace(/^Manifestation Lore -\s*/i, "").trim());
      if (lore && !result.manifestationLores.includes(lore)) result.manifestationLores.push(lore);
    }
    i++;
  }

  // Regiments and units
  while (i < lines.length) {
    const line = lines[i];

    if (line === "Regiments of Renown") {
      inRorSection = true;
      rorSectionNextLineIsRorName = true;
      currentRegimentOfRenown = undefined;
      i++;
      continue;
    }

    if (line === "General's Regiment" || /^Regiment \d+$/i.test(line)) {
      inRorSection = false;
      rorSectionNextLineIsRorName = false;
      currentRegimentOfRenown = undefined;
      i++;
      continue;
    }

    // In RoR section: first line with (number) is RoR name, rest are units
    if (inRorSection && rorSectionNextLineIsRorName && !isBulletLine(line) && /\d+/.test(line)) {
      currentRegimentOfRenown = stripPoints(line);
      rorSectionNextLineIsRorName = false;
      i++;
      continue;
    }

    // Skip known non-unit sections
    if (
      line === "Faction Terrain" ||
      line.startsWith("Created with ") ||
      line.startsWith("App:") ||
      line.startsWith("Data:")
    ) {
      i++;
      continue;
    }

    // Skip faction terrain name (line after "Faction Terrain")
    if (i > 0 && lines[i - 1] === "Faction Terrain") {
      i++;
      continue;
    }

    if (isBulletLine(line)) {
      const content = bulletContent(line);
      if (!content) {
        i++;
        continue;
      }
      const lower = content.toLowerCase();
      if (SKIP_ENHANCEMENTS.has(lower) || lower === "general") {
        i++;
        continue;
      }
      // Enhancement: heroic trait, artefact, etc.
      const norm = normalizeForMatch(content);
      if (norm && !seenEnhancements.has(norm)) {
        seenEnhancements.add(norm);
        result.enhancementNames.push(content);
      }
      i++;
      continue;
    }

    // Unit line: "Eidolon of Mathlann, Aspect of the Sea (340)" or "Scourge of Ghyran The Light of Eltharion (280)"
    // Also "Callis and Toll" under RoR (no points)
    const unitName = stripPoints(line);
    if (unitName && unitName.length > 1) {
      const norm = normalizeForMatch(unitName);
      if (norm && !seenUnits.has(norm)) {
        seenUnits.add(norm);
        result.unitNames.push(unitName);
        result.unitRegiments.push({
          unitName,
          regimentOfRenown: currentRegimentOfRenown,
        });
      }
    }

    i++;
  }

  return result;
}

/**
 * Find best-matching warscroll by unit name and faction.
 * Handles "Scourge of Ghyran The Light of Eltharion" -> match "The Light of Eltharion" with subfaction.
 * RoR units: match by regimentOfRenown, faction may differ (e.g. Saviours of Cinderfall = Cities of Sigmar).
 */
export function matchWarscroll(
  unitName: string,
  faction: string,
  regimentOfRenown: string | undefined,
  warscrolls: Array<{ id: string; unitName: string; faction: string; regimentOfRenown?: string; subfaction?: string }>
): string | null {
  const norm = normalizeForMatch(unitName);

  // RoR units: match by regiment first
  if (regimentOfRenown) {
    for (const w of warscrolls) {
      if (w.regimentOfRenown !== regimentOfRenown) continue;
      if (normalizeForMatch(w.unitName) === norm) return w.id;
    }
    for (const w of warscrolls) {
      if (w.regimentOfRenown !== regimentOfRenown) continue;
      const wNorm = normalizeForMatch(w.unitName);
      if (norm.includes(wNorm) || wNorm.includes(norm)) return w.id;
    }
    return null;
  }

  // Main army: exact match
  for (const w of warscrolls) {
    if (w.regimentOfRenown) continue;
    if (normalizeForMatch(w.unitName) === norm) return w.id;
    if (w.subfaction && normalizeForMatch(`${w.subfaction} ${w.unitName}`) === norm) return w.id;
    if (unitName.startsWith("Scourge of Ghyran ") && w.subfaction === "Scourge of Ghyran") {
      const rest = unitName.replace(/^Scourge of Ghyran\s+/i, "").trim();
      if (normalizeForMatch(w.unitName) === normalizeForMatch(rest)) return w.id;
    }
  }

  // Fuzzy: faction must match (or be compatible)
  for (const w of warscrolls) {
    if (w.regimentOfRenown) continue;
    const wNorm = normalizeForMatch(w.unitName);
    if (wNorm === norm) return w.id;
    if (norm.includes(wNorm) || wNorm.includes(norm)) {
      if (w.faction !== faction) continue;
      return w.id;
    }
  }

  return null;
}

/**
 * Find best-matching battle trait by name and faction.
 * Tries exact match, then variations (e.g. "Spell Lore - X" vs "X").
 */
export function matchBattleTrait(
  traitName: string,
  faction: string,
  battleTraits: Array<{ id: string; name: string; faction?: string; traitType?: string }>
): string | null {
  const norm = normalizeForMatch(traitName);
  const variations = [
    norm,
    normalizeForMatch(`Spell Lore - ${traitName}`),
    normalizeForMatch(`Spell Lore: ${traitName}`),
    normalizeForMatch(`Manifestation Lore - ${traitName}`),
    normalizeForMatch(`Manifestation Lore: ${traitName}`),
  ];

  for (const t of battleTraits) {
    const tNorm = normalizeForMatch(t.name);
    if (t.faction && t.faction !== faction && t.faction !== "RoR") continue;
    for (const v of variations) {
      if (tNorm === v) return t.id;
      if (v && (v.includes(tNorm) || tNorm.includes(v))) return t.id;
    }
  }

  return null;
}
