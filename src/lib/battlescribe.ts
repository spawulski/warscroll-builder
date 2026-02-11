/**
 * Parse BattleScribe catalogue XML (.cat) into Warscroll[] and optional faction name.
 * Supports BSData age-of-sigmar-4th Library.cat structure (with default namespace).
 */

import type { Warscroll, Ability, WeaponProfile, AbilityColor, AbilityPhase, AbilityTimingQualifier, AbilityType, BattleTrait, BattleTraitType, UnitType } from "@/types/warscroll";

const RAW_BASE = "https://raw.githubusercontent.com/BSData/age-of-sigmar-4th/main";

/** Set to true to log ability parsing (rawTypeName, timingChar, isPassive, phase) to console for debugging. */
const BATTLESCRIBE_ABILITY_DEBUG = false;

/** Publication ID for Scourge of Ghyran content (units, traits, formations, etc.). */
const SCOURGE_OF_GHYRAN_PUBLICATION_ID = "f894-7929-f79a-a269";

/** Check if element or any ancestor has Scourge of Ghyran publicationId. */
function hasScourgeOfGhyranInAncestry(el: Element | null): boolean {
  let cur: Element | null = el;
  while (cur) {
    if (getAttr(cur, "publicationId") === SCOURGE_OF_GHYRAN_PUBLICATION_ID) return true;
    cur = cur.parentElement;
  }
  return false;
}

/**
 * Parse name that may end with " (Subfaction)" e.g. "Auric Runeson on Magmadroth (Scourge of Ghyran)".
 * Returns base name and optional subfaction.
 */
function parseNameAndSubfaction(fullName: string): { name: string; subfaction?: string } {
  const m = fullName.match(/^(.+?)\s+\(([^)]+)\)\s*$/);
  if (m) {
    return { name: m[1].trim(), subfaction: m[2].trim() };
  }
  return { name: fullName.trim() };
}

function text(el: Element | null): string {
  return el?.textContent?.trim() ?? "";
}

function q(parent: Document | Element, localName: string): Element | null {
  const doc = parent instanceof Document ? parent : parent.ownerDocument;
  const nsUri = doc.documentElement?.namespaceURI ?? "";
  const list =
    parent instanceof Document
      ? doc.getElementsByTagNameNS(nsUri, localName)
      : (parent as Element).getElementsByTagNameNS(nsUri, localName);
  return list[0] ?? null;
}

function qAll(parent: Document | Element, localName: string): Element[] {
  const doc = parent instanceof Document ? parent : parent.ownerDocument;
  const nsUri = doc.documentElement?.namespaceURI ?? "";
  const list =
    parent instanceof Document
      ? doc.getElementsByTagNameNS(nsUri, localName)
      : (parent as Element).getElementsByTagNameNS(nsUri, localName);
  return Array.from(list);
}

/** Direct children only (avoids collecting same profiles multiple times when recursing). */
function childrenByLocalName(parent: Element, localName: string): Element[] {
  const nsUri = parent.ownerDocument?.documentElement?.namespaceURI ?? "";
  return Array.from(parent.children).filter(
    (el) => el.namespaceURI === nsUri && el.localName === localName
  );
}

/** Get element attribute; works with namespaced XML (tries no-namespace for attributes). */
function getAttr(el: Element, name: string): string {
  return el.getAttribute(name) ?? el.getAttributeNS(null, name) ?? "";
}

function getCharacteristic(profile: Element, ...names: string[]): string {
  for (const name of names) {
    const c = qAll(profile, "characteristic").find((n) => getAttr(n, "name") === name);
    if (c) return text(c);
  }
  return "";
}

/** Get characteristic value only from this profile's direct <characteristics> children (avoids reading sibling profiles' data in DOM). */
function getCharacteristicDirect(profile: Element, ...names: string[]): string {
  const characteristicsEl = q(profile, "characteristics");
  if (!characteristicsEl) return "";
  const list = qAll(characteristicsEl, "characteristic");
  for (const name of names) {
    const c = list.find((n) => getAttr(n, "name") === name);
    if (c) return text(c);
  }
  return "";
}

function getAttribute(profile: Element, name: string): string {
  const a = qAll(profile, "attribute").find((n) => getAttr(n, "name") === name);
  if (!a) return "";
  return getAttr(a, "value") || text(a) || "";
}

function normalizePhase(s: string): AbilityPhase | undefined {
  const phases: AbilityPhase[] = [
    "Hero Phase", "Shooting Phase", "Combat Phase", "Charge Phase",
    "Movement Phase", "End of Turn", "Deployment", "Start of Battle Round", "Start of Turn",
  ];
  const lower = s.toLowerCase();
  for (const p of phases) {
    if (p.toLowerCase() === lower || p.toLowerCase().replace(/\s/g, "").includes(lower)) return p;
  }
  if (/\bhero\b/i.test(s)) return "Hero Phase";
  if (/\bshoot/i.test(s)) return "Shooting Phase";
  if (/\bcombat\b/i.test(s)) return "Combat Phase";
  if (/\bcharge\b/i.test(s)) return "Charge Phase";
  if (/\bmov(e|ement)\b/i.test(s)) return "Movement Phase";
  if (/\bend\s+of\s+(?:any\s+)?turn\b/i.test(s)) return "End of Turn";
  if (/\bdeploy/i.test(s)) return "Deployment";
  if (/\bstart\s+of\s+(?:any\s+)?(?:battle\s+)?round\b/i.test(s)) return "Start of Battle Round";
  if (/\bstart\s+of\s+(?:any\s+)?turn\b/i.test(s)) return "Start of Turn";
  return undefined;
}

function normalizeColor(s: string): AbilityColor {
  const map: Record<string, AbilityColor> = {
    grey: "grey", gray: "grey",
    blue: "blue", green: "green", orange: "orange", yellow: "yellow",
    red: "red", purple: "purple", black: "black",
  };
  return map[s.toLowerCase().trim()] ?? "grey";
}

/** Phase → ability bar colour for activated abilities (infer from Timing characteristic). */
const PHASE_TO_COLOR: Record<AbilityPhase, AbilityColor> = {
  "Hero Phase": "yellow",
  "Shooting Phase": "blue",
  "Combat Phase": "red",
  "Charge Phase": "orange",
  "Movement Phase": "grey",
  "End of Turn": "purple",
  Deployment: "black",
  "Start of Battle Round": "black",
  "Start of Turn": "black",
};

function parseAbilityType(s: string): AbilityType | undefined {
  if (/once per turn \(army\)/i.test(s)) return "Once Per Turn (Army)";
  if (/once per turn/i.test(s)) return "Once Per Turn";
  if (/once per battle/i.test(s)) return "Once Per Battle";
  return undefined;
}

function parseTiming(s: string): AbilityTimingQualifier | undefined {
  if (/passive/i.test(s)) return "Passive";
  if (/\byour\b/i.test(s)) return "Your";
  if (/\bany\b/i.test(s)) return "Any";
  if (/\benemy\b/i.test(s)) return "Enemy";
  if (/reaction/i.test(s)) return "Reaction";
  return undefined;
}

/** Decode XML entities (shared by cleanEffect and stripWeaponAbility). */
function decodeEntities(s: string): string {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Clean AoS flavour text: bold **^^words^^** and ^^words^^ (strip carets and extra stars, output **words** for bold); decode entities. */
function cleanEffect(raw: string): string {
  return decodeEntities(raw)
    .replace(/\*\*\^\^([^^]+)\^\^\*\*/g, "**$1**")
    .replace(/\^\^([^^]+)\^\^/g, "**$1**");
}

/** Build ability body text from Declare and Effect characteristics; formats as **Declare**: ... and **Effect**: ... when both present. */
function buildAbilityText(declare: string, effect: string, profileName: string): string {
  const d = declare?.trim();
  const e = effect?.trim();
  if (d && e) return `**Declare**: ${cleanEffect(d)}\n**Effect**: ${cleanEffect(e)}`;
  if (e) return cleanEffect(e);
  if (d) return cleanEffect(d);
  return cleanEffect(profileName || "");
}

/** Parse a single ability profile element into an Ability, or null if not an ability/effect profile or skipped. */
function parseAbilityFromProfile(profile: Element): Ability | null {
  const profileType = (getAttr(profile, "typeName") || getAttr(profile, "type") || "").toLowerCase();
  const profileName = getAttr(profile, "name") || "";
  if (!profileType.includes("ability") && !profileType.includes("effect")) return null;
  const declare = getCharacteristic(profile, "Declare");
  const effect = getCharacteristic(profile, "Effect", "Description", "Rules");
  if (!declare && !effect && !profileName) return null;
  const typeStr = getAttribute(profile, "Type") || getCharacteristic(profile, "Type", "Ability Type");
  const timingChar = getCharacteristicDirect(profile, "Timing", "Phase", "When");
  const timingStr = getAttribute(profile, "Timing") || getAttribute(profile, "Phase") || timingChar;
  const combined = `${timingStr} ${typeStr}`.trim();
  const rawTypeName = (getAttr(profile, "typeName") || getAttr(profile, "type") || "").trim();
  const isExplicitlyPassive = /ability\s*\(\s*passive\s*\)/i.test(rawTypeName);
  const hasTimingChar = Boolean(timingChar?.trim());
  const isPassive = Boolean(
    (!hasTimingChar && (declare || effect || profileName)) ||
      isExplicitlyPassive ||
      profileType.includes("passive") ||
      /passive/i.test(typeStr) ||
      /passive/i.test(combined)
  );
  let phase: AbilityPhase | undefined;
  let timing: AbilityTimingQualifier | undefined;
  let abilityType: AbilityType | undefined;
  if (isPassive) {
    timing = "Passive";
    phase = undefined;
    abilityType = undefined;
  } else {
    phase = normalizePhase(timingStr) ?? normalizePhase(combined);
    timing = parseTiming(combined) ?? parseTiming(timingStr);
    abilityType = parseAbilityType(combined) ?? parseAbilityType(typeStr);
  }
  let color = normalizeColor(getAttribute(profile, "Color") || getCharacteristic(profile, "Color", "Colour"));
  if (!isPassive && phase) color = PHASE_TO_COLOR[phase];
  const isReaction = !isPassive && (/reaction\s*:/i.test(combined) || /reaction\s*:/i.test(effect));
  let reactionAbilityType: string | undefined;
  if (isReaction) {
    timing = "Reaction";
    const match = effect?.match(/Reaction:\s*([^\n.]+)/i) ?? combined.match(/Reaction:\s*(.+)/i);
    if (match) reactionAbilityType = stripWeaponAbility(match[1].trim());
  }
  const abilityText = buildAbilityText(declare, effect, profileName);
  const isSpell = /ability\s*\(\s*spell\s*\)/i.test(rawTypeName);
  const isPrayer = /ability\s*\(\s*prayer\s*\)/i.test(rawTypeName);
  const castingValue = isSpell ? (getCharacteristicDirect(profile, "Casting Value") || undefined) : undefined;
  const chantingValue = isPrayer ? (getCharacteristicDirect(profile, "Chanting Value") || undefined) : undefined;
  const isBattleDamage =
    /battle\s*damaged?/i.test(profileName) || /battle\s*damage/i.test(effect || declare || "");
  return {
    id: crypto.randomUUID(),
    name: profileName || "Ability",
    color,
    phase,
    timing,
    abilityType,
    reactionAbilityType,
    reactionPhase: undefined,
    text: abilityText,
    ...(isBattleDamage ? { battleDamage: true } : {}),
    ...(isSpell ? { isSpell: true, castingValue } : {}),
    ...(isPrayer ? { isPrayer: true, chantingValue } : {}),
  };
}

/** Collect profiles from this entry and nested selectionEntries (e.g. model/upgrades). */
function collectProfilesFromEntry(entry: Element): Element[] {
  const out: Element[] = [];
  const profilesEl = q(entry, "profiles");
  if (profilesEl) out.push(...qAll(profilesEl, "profile"));
  const selectionEntriesEl = q(entry, "selectionEntries");
  if (selectionEntriesEl) {
    for (const child of childrenByLocalName(selectionEntriesEl, "selectionEntry")) {
      out.push(...collectProfilesFromEntry(child));
    }
  }
  return out;
}

/** Map group name to canonical BattleTraitType. */
function mapGroupNameToTraitType(groupName: string): BattleTraitType {
  const lower = groupName.toLowerCase();
  if (/prayer\s*lore/i.test(lower)) return "Prayer lores";
  if (/artefact|artifact|heirloom|marks\s+of/i.test(lower)) return "Artefacts";
  if (/heroic\s*trait/i.test(lower)) return "Heroic traits";
  if (/manifestation\s*lore/i.test(lower)) return "Manifestation Lores";
  if (/spell\s*lore|^lores?$/i.test(lower)) return "Spell lores";
  if (/battle\s*formation/i.test(lower)) return "Battle formations";
  if (/battle\s*trait/i.test(lower)) return "Battle traits";
  return "Battle traits";
}

/** Recursively collect (entry, topLevelGroupName) from sharedSelectionEntryGroups. */
function collectSelectionEntriesFromGroups(root: Element): Array<{ entry: Element; groupName: string }> {
  const out: Array<{ entry: Element; groupName: string }> = [];
  const groupsEl = q(root, "sharedSelectionEntryGroups");
  if (!groupsEl) return out;
  function walk(group: Element, topLevelName: string) {
    const groupName = getAttr(group, "name") || topLevelName;
    const currentTop = topLevelName || groupName;
    const entriesEl = q(group, "selectionEntries");
    if (entriesEl) {
      for (const entry of childrenByLocalName(entriesEl, "selectionEntry")) {
        out.push({ entry, groupName: currentTop });
      }
    }
    const nested = q(group, "selectionEntryGroups");
    if (nested) {
      for (const child of childrenByLocalName(nested, "selectionEntryGroup")) walk(child, currentTop);
    }
  }
  for (const group of childrenByLocalName(groupsEl, "selectionEntryGroup")) {
    walk(group, getAttr(group, "name") || "");
  }
  return out;
}

/** Collect (entry, groupName) from sharedSelectionEntries (e.g. "Battle Traits: Fyreslayers"). */
function collectSelectionEntriesFromShared(root: Element): Array<{ entry: Element; groupName: string }> {
  const out: Array<{ entry: Element; groupName: string }> = [];
  const shared = q(root, "sharedSelectionEntries") ?? q(root, "selectionEntries");
  if (!shared) return out;
  for (const entry of childrenByLocalName(shared as Element, "selectionEntry")) {
    out.push({ entry, groupName: "Battle traits" });
  }
  return out;
}

/** Find element by id in document (recursive). */
function findById(doc: Document | Element, id: string): Element | null {
  const root = doc instanceof Document ? doc.documentElement : doc;
  if (getAttr(root, "id") === id) return root;
  for (const child of Array.from(root.children)) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}

/** Collect ability profiles from a selectionEntryGroup (Lores catalogue). Handles selectionEntries and entryLinks to selectionEntry. */
function collectLoreAbilitiesFromGroup(group: Element): Ability[] {
  const abilities: Ability[] = [];
  const entriesEl = q(group, "selectionEntries");
  if (entriesEl) {
    for (const entry of childrenByLocalName(entriesEl, "selectionEntry")) {
      const profileEls = collectProfilesFromEntry(entry);
      for (const profile of profileEls) {
        const ability = parseAbilityFromProfile(profile);
        if (ability) abilities.push(ability);
      }
    }
  }
  const entryLinksEl = q(group, "entryLinks");
  if (entryLinksEl) {
    for (const link of childrenByLocalName(entryLinksEl, "entryLink")) {
      const linkType = getAttr(link, "type");
      const targetId = getAttr(link, "targetId");
      if (!targetId) continue;
      if (linkType === "selectionEntry") {
        const doc = group.ownerDocument;
        const target = findById(doc, targetId);
        if (target) {
          const profileEls = collectProfilesFromEntry(target);
          for (const profile of profileEls) {
            const ability = parseAbilityFromProfile(profile);
            if (ability) abilities.push(ability);
          }
        }
      }
    }
  }
  return abilities;
}

/** Extract weapon names referenced in battle damage ability text (bold **Name**). Skips "Declare" and "Effect". */
function extractWeaponRefsFromBattleDamageText(text: string): string[] {
  const names: string[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (name && !/^(Declare|Effect)$/i.test(name)) names.push(name);
  }
  return names;
}

/** Normalize string for weapon name matching (apostrophes, case). */
function normalizeWeaponName(s: string): string {
  return s
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Mark weapons and abilities with battle damage; weapon refs in ability text get suffersBattleDamage on the weapon. */
function applyBattleDamageMarkers(
  abilities: Ability[],
  weapons: WeaponProfile[]
): void {
  for (const a of abilities) {
    if (!a.battleDamage) continue;
    const refs = extractWeaponRefsFromBattleDamageText(a.text);
    if (refs.length === 0) continue;
    const refSet = new Set(refs.map(normalizeWeaponName));
    for (const w of weapons) {
      const wn = normalizeWeaponName(w.name);
      if (refSet.has(wn)) w.suffersBattleDamage = true;
    }
  }
}

/** Strip BattleScribe markdown (^^ and ** wrappers) for plain display; used for weapon abilities and timing/reaction label text. Decodes entities. */
function stripWeaponAbility(raw: string): string {
  return decodeEntities(raw)
    .replace(/\^\^([^^]+)\^\^/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

export interface ParseResult {
  warscrolls: Warscroll[];
  faction: string;
}

export function parseCatXml(xml: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const catalogue = q(doc, "catalogue");
  const faction = (catalogue ? getAttr(catalogue, "name") : "")?.replace(/\s*-\s*Library\s*$/i, "").trim() || "Imported";

  const warscrolls: Warscroll[] = [];
  const now = new Date().toISOString();

  const root = catalogue ?? doc.documentElement;
  const shared = q(root, "sharedSelectionEntries") ?? q(root, "selectionEntries");
  /** Only top-level units (direct children of shared); nested type="model" would otherwise create duplicate cards. */
  const entries = shared ? childrenByLocalName(shared as Element, "selectionEntry") : [];

  for (const entry of Array.from(entries)) {
    const type = (getAttr(entry, "type") || "").toLowerCase();
    if (type !== "unit" && type !== "model") continue;

    const rawName = getAttr(entry, "name") || text(q(entry, "name")) || "Unknown";
    const { name: unitName, subfaction } = parseNameAndSubfaction(rawName);
    const id = crypto.randomUUID();

    const profileEls = collectProfilesFromEntry(entry);
    let move = "";
    let health = "";
    let save = "";
    let control = "";
    let ward: string | undefined;
    const weapons: WeaponProfile[] = [];
    const abilities: Ability[] = [];

    for (const profile of profileEls) {
      const profileType = (getAttr(profile, "typeName") || getAttr(profile, "type") || "").toLowerCase();
      const profileName = getAttr(profile, "name") || "";

      if (profileType.includes("unit") && !profileType.includes("weapon") && !profileType.includes("ability")) {
        move = getCharacteristic(profile, "Move", "Movement") || move;
        health = getCharacteristic(profile, "Wounds", "Health", "Damage") || health;
        save = getCharacteristic(profile, "Save") || save;
        control = getCharacteristic(profile, "Bravery", "Control") || control;
        const w = getCharacteristic(profile, "Ward");
        if (w) ward = w;
      }

      if (profileType.includes("ranged weapon") || profileType.includes("melee weapon") || profileType.includes("weapon")) {
        const range = getCharacteristic(profile, "Range", "Rng");
        const attacks = getCharacteristic(profile, "Attacks", "Atk");
        const hit = getCharacteristic(profile, "To Hit", "Hit");
        const wound = getCharacteristic(profile, "To Wound", "Wnd", "Wound");
        const rend = getCharacteristic(profile, "Rend", "Rnd") || "-";
        const damage = getCharacteristic(profile, "Damage", "Dmg");
        const abils = getCharacteristic(profile, "Abilities", "Ability", "Special");
        const isRanged = Boolean(profileType.includes("ranged") || (range && parseFloat(range) > 0));
        weapons.push({
          id: crypto.randomUUID(),
          name: profileName || "Weapon",
          range: range ? (range.includes('"') ? range : `${range}"`) : (isRanged ? "12\"" : "1\""),
          attacks: attacks || "-",
          hit: hit || "-",
          wound: wound || "-",
          rend: rend || "-",
          damage: damage || "-",
          abilities: abils ? abils.split(",").map((a) => stripWeaponAbility(a)).filter((a) => a && a !== "-" && a !== "–") : [],
          isRanged,
        });
      }

      const ability = parseAbilityFromProfile(profile);
      if (ability) abilities.push(ability);
    }

    const keywords: string[] = [];
    const catLinks = q(entry, "categoryLinks");
    const categoryNames: string[] = [];
    for (const link of catLinks ? qAll(catLinks, "categoryLink") : []) {
      const name = getAttr(link, "name") || text(link);
      if (!name) continue;
      const wardMatch = /^WARD\s*\((\d+\+)\)$/i.exec(name);
      if (wardMatch) ward = wardMatch[1];
      else if (!keywords.includes(name)) keywords.push(name);
      categoryNames.push(name);
    }
    const UNIT_TYPE_MAP: Array<{ pattern: RegExp; type: UnitType }> = [
      { pattern: /^HERO$/i, type: "hero" },
      { pattern: /^INFANTRY$/i, type: "infantry" },
      { pattern: /^CAVALRY$/i, type: "cavalry" },
      { pattern: /^BEAST$/i, type: "beast" },
      { pattern: /^MONSTER$/i, type: "monster" },
      { pattern: /^WAR\s*MACHINE$/i, type: "war machine" },
      { pattern: /^MANIFESTATION$/i, type: "manifestation" },
    ];
    let unitType: UnitType | undefined;
    for (const { pattern, type } of UNIT_TYPE_MAP) {
      if (categoryNames.some((n) => pattern.test(n))) {
        unitType = type;
        break;
      }
    }

    /** Dedupe weapons by name + ranged (same weapon can appear under multiple model branches). */
    const seenWeaponKey = new Set<string>();
    const dedupedWeapons = weapons.filter((w) => {
      const key = `${w.name}|${w.isRanged}`;
      if (seenWeaponKey.has(key)) return false;
      seenWeaponKey.add(key);
      return true;
    });

    if (dedupedWeapons.length === 0) {
      dedupedWeapons.push({
        id: crypto.randomUUID(),
        name: "Melee",
        range: "1\"",
        attacks: "-",
        hit: "-",
        wound: "-",
        rend: "-",
        damage: "-",
        abilities: [],
        isRanged: false,
      });
    }

    applyBattleDamageMarkers(abilities, dedupedWeapons);

    warscrolls.push({
      id,
      unitName,
      faction,
      subfaction,
      unitType,
      move: move || "-",
      health: health || "-",
      save: save || "-",
      control: control || "-",
      ward,
      weapons: dedupedWeapons,
      abilities,
      keywords,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { warscrolls, faction };
}

export interface ParseBattleTraitResult {
  battleTraits: BattleTrait[];
  faction: string;
}

/**
 * Parse a battle trait catalogue XML (e.g. Fyreslayers.cat — army name only, no " - Library").
 * Walks sharedSelectionEntryGroups; each selectionEntry with ability profiles becomes one BattleTrait.
 * When loresXml is provided, lore entries (Prayer/Spell/Manifestation) with entryLinks are resolved
 * to fetch spells/prayers from the Lores catalogue.
 */
export function parseBattleTraitCatXml(xml: string, loresXml?: string): ParseBattleTraitResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const catalogue = q(doc, "catalogue");
  const faction = (catalogue ? getAttr(catalogue, "name") : "")?.trim() || "Imported";
  const root = catalogue ?? doc.documentElement;

  let loresDoc: Document | null = null;
  if (loresXml) {
    loresDoc = parser.parseFromString(loresXml, "text/xml");
  }

  const entriesWithGroups = [
    ...collectSelectionEntriesFromGroups(root),
    ...collectSelectionEntriesFromShared(root),
  ];
  const battleTraits: BattleTrait[] = [];
  const now = new Date().toISOString();
  const seenIds = new Set<string>();
  const seenNameKey = new Set<string>();

  const LORE_TRAIT_TYPES: BattleTraitType[] = ["Prayer lores", "Spell lores", "Manifestation Lores"];

  const SKIP_ENTRY_NAMES = ["Battle Wounds", "Drained"];
  for (const { entry, groupName } of entriesWithGroups) {
    const entryId = getAttr(entry, "id");
    const rawName = getAttr(entry, "name") || text(q(entry, "name")) || "Unknown";
    if (SKIP_ENTRY_NAMES.includes(rawName)) continue;
    const { name, subfaction: nameSubfaction } = parseNameAndSubfaction(rawName);
    let subfaction =
      nameSubfaction ?? (hasScourgeOfGhyranInAncestry(entry) ? "Scourge of Ghyran" : undefined);
    const traitType = mapGroupNameToTraitType(groupName);
    const key = `${name}|${faction}|${subfaction ?? ""}`;
    if (entryId && seenIds.has(entryId)) continue;
    if (seenNameKey.has(key)) continue;
    const profileEls = collectProfilesFromEntry(entry);
    let abilities: Ability[] = [];
    for (const profile of profileEls) {
      const ability = parseAbilityFromProfile(profile);
      if (ability) abilities.push(ability);
    }
    if (abilities.length === 0 && loresDoc && LORE_TRAIT_TYPES.includes(traitType)) {
      const entryLinksEl = q(entry, "entryLinks");
      if (entryLinksEl) {
        for (const link of childrenByLocalName(entryLinksEl, "entryLink")) {
          const targetId = getAttr(link, "targetId");
          const linkType = getAttr(link, "type");
          if (!targetId) continue;
          const target = findById(loresDoc, targetId);
          if (target) {
            if (linkType === "selectionEntryGroup") {
              abilities.push(...collectLoreAbilitiesFromGroup(target));
              if (hasScourgeOfGhyranInAncestry(target)) subfaction = "Scourge of Ghyran";
            } else if (linkType === "selectionEntry") {
              const profileElsFromTarget = collectProfilesFromEntry(target);
              for (const profile of profileElsFromTarget) {
                const ability = parseAbilityFromProfile(profile);
                if (ability) abilities.push(ability);
              }
              if (hasScourgeOfGhyranInAncestry(target)) subfaction = "Scourge of Ghyran";
            }
          }
        }
      }
    }
    if (entryId) seenIds.add(entryId);
    seenNameKey.add(key);
    battleTraits.push({
      id: crypto.randomUUID(),
      name,
      traitType,
      faction,
      subfaction,
      move: "-",
      health: "-",
      save: "-",
      control: "-",
      keywords: [],
      abilities,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { battleTraits, faction };
}

/** Publication ID for Regiments of Renown content. */
const REGIMENTS_OF_RENOWN_PUBLICATION_ID = "27d9-b0c5-1ecc-ba2f";

/**
 * Parse Regiments of Renown catalogue XML to extract only the list of regiment names.
 * Lightweight - used to populate the dropdown without full parsing.
 */
export function listRegimentNamesFromXml(xml: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const catalogue = q(doc, "catalogue");
  const root = catalogue ?? doc.documentElement;
  const shared = q(root, "sharedSelectionEntries");
  if (!shared) return [];
  const names: string[] = [];
  for (const entry of childrenByLocalName(shared, "selectionEntry")) {
    const rawName = getAttr(entry, "name") || "";
    if (!rawName.startsWith("Regiment of Renown:")) continue;
    const pubId = getAttr(entry, "publicationId");
    if (pubId !== REGIMENTS_OF_RENOWN_PUBLICATION_ID) continue;
    const regimentName = decodeEntities(rawName.replace(/^Regiment of Renown:\s*/i, "").trim());
    if (regimentName && !names.includes(regimentName)) names.push(regimentName);
  }
  return names.sort();
}

/** Extract childId from modifier condition (scope="force"). */
function getChildIdFromModifier(entry: Element): string | null {
  const modifiersEl = q(entry, "modifiers");
  if (!modifiersEl) return null;
  for (const mod of childrenByLocalName(modifiersEl, "modifier")) {
    const conditionsEl = q(mod, "conditions");
    if (!conditionsEl) continue;
    for (const cond of childrenByLocalName(conditionsEl, "condition")) {
      if (getAttr(cond, "scope") === "force" && getAttr(cond, "type") === "instanceOf") {
        const childId = getAttr(cond, "childId");
        if (childId) return childId;
      }
    }
  }
  return null;
}

/** Extract childId from modifierGroup (used in entryLinks). */
function getChildIdFromEntryLink(link: Element): string | null {
  const modGroupsEl = q(link, "modifierGroups");
  if (!modGroupsEl) return null;
  for (const mg of childrenByLocalName(modGroupsEl, "modifierGroup")) {
    const conditionsEl = q(mg, "conditions");
    if (!conditionsEl) continue;
    for (const cond of childrenByLocalName(conditionsEl, "condition")) {
      if (getAttr(cond, "scope") === "force" && getAttr(cond, "type") === "instanceOf") {
        const childId = getAttr(cond, "childId");
        if (childId) return childId;
      }
    }
  }
  return null;
}

export interface ParseRegimentsResult {
  battleTraits: BattleTrait[];
  regimentMapping: Record<string, string[]>;
}

/**
 * Parse Regiments of Renown catalogue XML.
 * - Extracts regiment battle traits (abilities from each "Regiment of Renown: X" upgrade).
 * - Builds mapping: regiment name -> list of unit names (from entryLinks with childId conditions).
 * @param xml - Raw catalogue XML content
 * @param onlyRegiment - When set, only parse and return this regiment's traits and unit mapping
 */
export function parseRegimentsOfRenownCatXml(xml: string, onlyRegiment?: string): ParseRegimentsResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const catalogue = q(doc, "catalogue");
  const root = catalogue ?? doc.documentElement;

  const regimentMapping: Record<string, string[]> = {};
  const childIdToRegiment: Record<string, string> = {};

  const filterByRegiment = onlyRegiment?.trim();

  // 1. From sharedSelectionEntries: regiment upgrades with name "Regiment of Renown: X"
  const shared = q(root, "sharedSelectionEntries");
  if (shared) {
    for (const entry of childrenByLocalName(shared, "selectionEntry")) {
      const rawName = getAttr(entry, "name") || "";
      if (!rawName.startsWith("Regiment of Renown:")) continue;
      const pubId = getAttr(entry, "publicationId");
      if (pubId !== REGIMENTS_OF_RENOWN_PUBLICATION_ID) continue;
      const regimentName = decodeEntities(rawName.replace(/^Regiment of Renown:\s*/i, "").trim());
      if (filterByRegiment && regimentName !== filterByRegiment) continue;
      const childId = getChildIdFromModifier(entry);
      if (childId && regimentName) {
        childIdToRegiment[childId] = regimentName;
        regimentMapping[regimentName] = regimentMapping[regimentName] ?? [];
      }
    }
  }

  // 2. From root entryLinks: unit entryLinks with modifierGroup condition childId
  const entryLinksEl = q(root, "entryLinks");
  if (entryLinksEl) {
    for (const link of childrenByLocalName(entryLinksEl, "entryLink")) {
      const linkType = getAttr(link, "type");
      if (linkType !== "selectionEntry") continue;
      const childId = getChildIdFromEntryLink(link);
      if (!childId) continue;
      const regimentName = childIdToRegiment[childId];
      if (!regimentName) continue;
      const unitName = decodeEntities(getAttr(link, "name") || "");
      if (!unitName || unitName.startsWith("Regiment of Renown:")) continue;
      const list = regimentMapping[regimentName] ?? [];
      if (!list.includes(unitName)) list.push(unitName);
      regimentMapping[regimentName] = list;
    }
  }

  // 3. Parse battle traits from each regiment upgrade
  const battleTraits: BattleTrait[] = [];
  const now = new Date().toISOString();

  if (shared) {
    for (const entry of childrenByLocalName(shared, "selectionEntry")) {
      const rawName = getAttr(entry, "name") || "";
      if (!rawName.startsWith("Regiment of Renown:")) continue;
      const pubId = getAttr(entry, "publicationId");
      if (pubId !== REGIMENTS_OF_RENOWN_PUBLICATION_ID) continue;
      const regimentName = decodeEntities(rawName.replace(/^Regiment of Renown:\s*/i, "").trim());
      if (filterByRegiment && regimentName !== filterByRegiment) continue;
      const profileEls = collectProfilesFromEntry(entry);
      const abilities: Ability[] = [];
      for (const profile of profileEls) {
        const ability = parseAbilityFromProfile(profile);
        if (ability) abilities.push(ability);
      }
      if (abilities.length > 0) {
        battleTraits.push({
          id: crypto.randomUUID(),
          name: regimentName,
          traitType: "Regiments of Renown",
          regimentOfRenown: regimentName,
          faction: "Regiments of Renown",
          move: "-",
          health: "-",
          save: "-",
          control: "-",
          keywords: [],
          abilities,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return { battleTraits, regimentMapping };
}

/**
 * Extract Library catalogue paths from Regiments of Renown catalogue XML.
 * Returns paths like "Cities of Sigmar - Library.cat" for fetching unit data.
 */
export function getLibraryPathsFromRegimentsXml(xml: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const catalogue = q(doc, "catalogue");
  const root = catalogue ?? doc.documentElement;
  const linksEl = q(root, "catalogueLinks");
  if (!linksEl) return [];
  const paths: string[] = [];
  for (const link of childrenByLocalName(linksEl, "catalogueLink")) {
    const name = getAttr(link, "name") || "";
    if (name.endsWith(" - Library")) {
      paths.push(`${name}.cat`);
    }
  }
  return [...new Set(paths)];
}

export function getRawCatalogueUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const encoded = path.split("/").map((p) => encodeURIComponent(p)).join("/");
  return `${RAW_BASE}/${encoded}`;
}
