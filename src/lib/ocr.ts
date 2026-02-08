/**
 * OCR parsing for Warscroll images.
 * Uses Tesseract.js to extract text, then heuristics to map to Warscroll fields.
 * Results should always be reviewed by the user before saving.
 */

import type { Warscroll, Ability, AbilityPhase } from "@/types/warscroll";
import {
  createEmptyWarscroll,
  createEmptyWeapon,
  createEmptyAbility,
} from "@/types/warscroll";

const PHASE_PATTERNS: { pattern: RegExp; phase: AbilityPhase }[] = [
  { pattern: /hero\s*phase/i, phase: "Hero Phase" },
  { pattern: /shooting\s*phase/i, phase: "Shooting Phase" },
  { pattern: /combat\s*phase/i, phase: "Combat Phase" },
  { pattern: /charge\s*phase/i, phase: "Charge Phase" },
  { pattern: /movement\s*phase/i, phase: "Movement Phase" },
  { pattern: /end\s*of\s*(?:the\s*)?turn/i, phase: "End of Turn" },
  { pattern: /deployment/i, phase: "Deployment" },
  { pattern: /start\s*of\s*(?:the\s*)?turn/i, phase: "Start of Turn" },
];

function inferPhase(text: string): AbilityPhase {
  const lower = text.toLowerCase();
  for (const { pattern, phase } of PHASE_PATTERNS) {
    if (pattern.test(lower)) return phase;
  }
  return "Hero Phase";
}

/**
 * Naive parsing: split OCR text into lines and try to identify:
 * - First line / header: unit name
 * - Numbers on one line: Move, Wounds/Health, Save, Control (order may vary)
 * - "Ward" or "4+", "5+", "6+" near save: ward
 * - Table-like blocks: weapon profiles (Range, Attacks, Hit, Wound, Rend, Damage)
 * - Paragraphs with phase names: abilities
 * - Last line(s): keywords
 */
export function parseOcrTextToWarscroll(rawText: string): Warscroll {
  const w = createEmptyWarscroll();
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return w;

  // First non-empty line often is unit name
  w.unitName = lines[0].slice(0, 80);

  // Look for stats: common patterns like "6\" 5 4+ 8 10" or "M 6\" W 5 Sv 4+ C 8"
  const statLine = lines.find(
    (l) => /[\d"+]/.test(l) && (/\d+\s*[\d+]+\s*\d+/.test(l) || /Save|Sv|Ward|W\s*\d/i.test(l))
  );
  if (statLine) {
    const numbers = statLine.match(/\d+"?|\d+\+?/g) || [];
    const inches = statLine.match(/\d+"/);
    if (inches) w.move = inches[0];
    if (numbers.length >= 2) w.health = numbers.find((n) => !n.includes('"') && !n.includes("+")) ?? w.health;
    const saveMatch = statLine.match(/[\d+]+\s*\(?\s*Save|Save\s*[\d+]+|Sv\s*[\d+]+/i);
    if (saveMatch) {
      const sv = statLine.match(/\d+/);
      if (sv) w.save = sv[0] + "+";
    }
    const wardMatch = statLine.match(/Ward\s*(\d+)\+/i) || statLine.match(/(\d+)\+\s*Ward/i);
    if (wardMatch) w.ward = wardMatch[1] + "+";
  }

  // Try to find a line with Move, Health, Save, Control labels and fill from there
  for (const line of lines) {
    const m = line.match(/Move\s*[:\s]*(\d+")?/i);
    if (m && m[1]) w.move = w.move || m[1];
    const h = line.match(/Wounds?|Health\s*[:\s]*(\d+)/i);
    if (h && h[1]) w.health = h[1];
    const s = line.match(/Save\s*[:\s]*(\d+)\+?/i);
    if (s && s[1]) w.save = s[1] + "+";
    const c = line.match(/Control\s*[:\s]*(\d+)/i);
    if (c && c[1]) w.control = c[1];
  }

  // Weapon table: look for header row (Range, Attacks, Hit, Wound, Rend, Damage) and next line as values
  const rangeIdx = lines.findIndex((l) => /Range|Attacks|Hit|Wound|Rend|Damage/i.test(l) && l.split(/\s+/).length >= 4);
  if (rangeIdx >= 0 && rangeIdx + 1 < lines.length) {
    const header = lines[rangeIdx];
    const valueLine = lines[rangeIdx + 1];
    const values = valueLine.split(/\s+/).filter(Boolean);
    if (values.length >= 4) {
      const weapon = createEmptyWeapon(/\d+"/.test(valueLine));
      weapon.name = lines[rangeIdx - 1]?.slice(0, 40) || "Weapon";
      weapon.range = values[0] ?? weapon.range;
      weapon.attacks = values[1] ?? "";
      weapon.hit = values[2] ?? "";
      weapon.wound = values[3] ?? "";
      weapon.rend = values[4] ?? "-";
      weapon.damage = values[5] ?? "";
      w.weapons = [weapon];
    }
  }

  // Abilities: multi-line blocks that might contain a phase name and description
  const abilityBlocks = rawText.split(/(?=(?:Hero|Shooting|Combat|Charge|Movement|End of|Deployment|Start of)\s+Phase)/i);
  const abilities: Ability[] = [];
  for (let i = 1; i < abilityBlocks.length; i++) {
    const block = abilityBlocks[i].trim();
    if (block.length < 10) continue;
    const firstLine = block.split(/\r?\n/)[0]?.trim() ?? "";
    const rest = block.split(/\r?\n/).slice(1).join(" ").trim();
    const name = firstLine.replace(/^(Hero|Shooting|Combat|Charge|Movement|End of|Deployment|Start of)\s+Phase\.?\s*/i, "").slice(0, 60);
    const phase = inferPhase(block);
    const phaseToColor: Record<AbilityPhase, "grey" | "blue" | "green" | "orange" | "yellow" | "red" | "purple" | "black"> = {
      "Hero Phase": "yellow", "Shooting Phase": "blue",
      "Combat Phase": "red", "Charge Phase": "orange", "Movement Phase": "grey",
      "End of Turn": "purple", Deployment: "black", "Start of Turn": "black",
    };
    abilities.push({
      ...createEmptyAbility(),
      name: name || "Ability",
      color: phaseToColor[phase],
      text: (name ? rest : block).slice(0, 500),
    });
  }
  if (abilities.length > 0) w.abilities = abilities;

  // Keywords: last few lines or line containing "Keywords:"
  const kwLine = lines.find((l) => /Keywords?/i.test(l));
  if (kwLine) {
    const after = kwLine.replace(/Keywords?\s*[:\s]*/i, "").trim();
    w.keywords = after.split(/[,;]/).map((k) => k.trim()).filter(Boolean);
  } else if (lines.length >= 2) {
    const last = lines[lines.length - 1];
    if (last.length < 100 && !/\d{2,}/.test(last))
      w.keywords = last.split(/[,;]/).map((k) => k.trim()).filter(Boolean);
  }

  return w;
}
