/**
 * Parse BattleScribe catalogue XML (.cat) into Warscroll[] and optional faction name.
 * Supports BSData age-of-sigmar-4th Library.cat structure (with default namespace).
 */

import type { Warscroll, Ability, WeaponProfile, AbilityColor, AbilityPhase, AbilityTimingQualifier, AbilityType } from "@/types/warscroll";

const RAW_BASE = "https://raw.githubusercontent.com/BSData/age-of-sigmar-4th/main";

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

function getCharacteristic(profile: Element, ...names: string[]): string {
  for (const name of names) {
    const c = qAll(profile, "characteristic").find((n) => n.getAttribute("name") === name);
    if (c) return text(c);
  }
  return "";
}

function getAttribute(profile: Element, name: string): string {
  const a = qAll(profile, "attribute").find((n) => n.getAttribute("name") === name);
  return a?.getAttribute("value") ?? a?.textContent?.trim() ?? "";
}

function normalizePhase(s: string): AbilityPhase | undefined {
  const phases: AbilityPhase[] = [
    "Hero Phase", "Shooting Phase", "Combat Phase", "Charge Phase",
    "Movement Phase", "End of Turn", "Deployment", "Start of Turn",
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
  if (/\bend\s+of\s+turn\b/i.test(s)) return "End of Turn";
  if (/\bdeploy/i.test(s)) return "Deployment";
  if (/\bstart\s+of\s+turn\b/i.test(s)) return "Start of Turn";
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

/** Clean AoS flavour text for ability blocks: ^^X^^ -> **X** (markdown bold), decode entities. */
function cleanEffect(raw: string): string {
  return decodeEntities(raw)
    .replace(/\^\^([^^]+)\^\^/g, "**$1**");
}

/** Strip BattleScribe markdown from weapon ability text for plain display: remove ^^ and ** wrappers, decode entities. */
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
  const faction = catalogue?.getAttribute("name")?.replace(/\s*-\s*Library\s*$/i, "").trim() ?? "Imported";

  const warscrolls: Warscroll[] = [];
  const now = new Date().toISOString();

  const root = catalogue ?? doc.documentElement;
  const shared = q(root, "sharedSelectionEntries") ?? q(root, "selectionEntries");
  /** Only top-level units (direct children of shared); nested type="model" would otherwise create duplicate cards. */
  const entries = shared ? childrenByLocalName(shared as Element, "selectionEntry") : [];

  /** Collect profiles from this entry, then from nested entries (model/upgrades). BattleScribe wraps nested entries in selectionEntries, so recurse into that. */
  function collectProfiles(entry: Element): Element[] {
    const out: Element[] = [];
    const profilesEl = q(entry, "profiles");
    if (profilesEl) out.push(...qAll(profilesEl, "profile"));
    const selectionEntriesEl = q(entry, "selectionEntries");
    if (selectionEntriesEl) {
      for (const child of childrenByLocalName(selectionEntriesEl, "selectionEntry")) {
        out.push(...collectProfiles(child));
      }
    }
    return out;
  }

  for (const entry of Array.from(entries)) {
    const type = (entry.getAttribute("type") ?? "").toLowerCase();
    if (type !== "unit" && type !== "model") continue;

    const unitName = entry.getAttribute("name") ?? text(q(entry, "name")) ?? "Unknown";
    const id = crypto.randomUUID();

    const profileEls = collectProfiles(entry);
    let move = "";
    let health = "";
    let save = "";
    let control = "";
    let ward: string | undefined;
    const weapons: WeaponProfile[] = [];
    const abilities: Ability[] = [];

    for (const profile of profileEls) {
      const profileType = (profile.getAttribute("typeName") ?? profile.getAttribute("type") ?? "").toLowerCase();
      const profileName = profile.getAttribute("name") ?? "";

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
        const isRanged = profileType.includes("ranged") || (range && parseFloat(range) > 0);
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

      if (profileType.includes("ability") || profileType.includes("effect")) {
        const effect = getCharacteristic(profile, "Effect", "Description", "Rules");
        if (!effect && !profileName) continue;
        const color = normalizeColor(getAttribute(profile, "Color") || getCharacteristic(profile, "Color", "Colour"));
        const typeStr = getAttribute(profile, "Type") || getCharacteristic(profile, "Type", "Ability Type");
        const timingStr = getAttribute(profile, "Timing") || getAttribute(profile, "Phase") || getCharacteristic(profile, "Timing", "Phase", "When");
        const combined = `${timingStr} ${typeStr}`.trim();

        let phase: AbilityPhase | undefined = normalizePhase(timingStr) ?? normalizePhase(combined);
        let timing: AbilityTimingQualifier | undefined = parseTiming(combined) ?? parseTiming(timingStr);
        const abilityType = parseAbilityType(combined) ?? parseAbilityType(typeStr);

        const isReaction = /reaction\s*:/i.test(combined) || /reaction\s*:/i.test(effect);
        let reactionAbilityType: string | undefined;
        let reactionPhase: string | undefined;
        if (isReaction) {
          timing = "Reaction";
          const match = effect?.match(/Reaction:\s*([^\n.]+)/i) ?? combined.match(/Reaction:\s*(.+)/i);
          if (match) reactionAbilityType = match[1].trim();
        }

        abilities.push({
          id: crypto.randomUUID(),
          name: profileName || "Ability",
          color,
          phase,
          timing,
          abilityType,
          reactionAbilityType,
          reactionPhase,
          text: cleanEffect(effect || profileName),
        });
      }
    }

    const keywords: string[] = [];
    const catLinks = q(entry, "categoryLinks");
    for (const link of catLinks ? qAll(catLinks, "categoryLink") : []) {
      const name = link.getAttribute("name") ?? text(link);
      if (!name) continue;
      const wardMatch = /^WARD\s*\((\d+\+)\)$/i.exec(name);
      if (wardMatch) ward = wardMatch[1];
      else if (!keywords.includes(name)) keywords.push(name);
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

    warscrolls.push({
      id,
      unitName,
      faction,
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

export function getRawCatalogueUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const encoded = path.split("/").map((p) => encodeURIComponent(p)).join("/");
  return `${RAW_BASE}/${encoded}`;
}
