/**
 * LocalStorage persistence for Warscrolls (MVP).
 * Key: aos-warscrolls
 * Value: JSON array of Warscroll
 */

import type { Warscroll, Ability, AbilityColor, AbilityPhase } from "@/types/warscroll";

const STORAGE_KEY = "aos-warscrolls";

const PHASE_VALUES: AbilityPhase[] = [
  "Hero Phase", "Shooting Phase", "Combat Phase", "Charge Phase",
  "Movement Phase", "End of Turn", "Deployment", "Start of Turn",
];

const PHASE_TO_COLOR: Record<AbilityPhase, AbilityColor> = {
  "Hero Phase": "yellow",
  "Shooting Phase": "blue",
  "Combat Phase": "red",
  "Charge Phase": "orange",
  "Movement Phase": "grey",
  "End of Turn": "purple",
  Deployment: "black",
  "Start of Turn": "black",
};

function migrateAbility(a: Record<string, unknown>): Record<string, unknown> {
  let out: Record<string, unknown> = a;
  if (!("phase" in a) || a.phase == null) {
    const phase = PHASE_VALUES.includes(a.timing as AbilityPhase) ? a.timing : "Hero Phase";
    const abilityType = a.type === "Once Per Turn" ? "Once Per Turn" : undefined;
    const { timing: _t, type: _y, ...rest } = a;
    out = { ...rest, phase, abilityType };
  }
  if (out.phase === "Passive") {
    out = { ...out, phase: undefined };
    if (!("color" in out) || out.color == null) out = { ...out, color: "green" };
  }
  if (!("color" in out) || out.color == null) {
    const phase = PHASE_VALUES.includes(out.phase as AbilityPhase) ? (out.phase as AbilityPhase) : "Hero Phase";
    out = { ...out, color: PHASE_TO_COLOR[phase] };
  }
  if (out.color === "dark yellow") out = { ...out, color: "yellow" };
  return out;
}

function migrateWarscroll(w: Record<string, unknown>): Warscroll {
  const abilities: Ability[] = Array.isArray(w.abilities)
    ? (w.abilities as Record<string, unknown>[]).map((a) => migrateAbility(a) as unknown as Ability)
    : [];
  return { ...w, abilities } as Warscroll;
}

function getStored(): Warscroll[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return Array.isArray(parsed) ? parsed.map(migrateWarscroll) : [];
  } catch {
    return [];
  }
}

function setStored(list: Warscroll[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save warscrolls", e);
  }
}

export function getAllWarscrolls(): Warscroll[] {
  return getStored();
}

export function getWarscrollById(id: string): Warscroll | undefined {
  return getStored().find((w) => w.id === id);
}

export function saveWarscroll(warscroll: Warscroll): void {
  const list = getStored();
  const index = list.findIndex((w) => w.id === warscroll.id);
  const updated = { ...warscroll, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    list[index] = updated;
  } else {
    list.push(updated);
  }
  setStored(list);
}

export function deleteWarscroll(id: string): void {
  setStored(getStored().filter((w) => w.id !== id));
}
