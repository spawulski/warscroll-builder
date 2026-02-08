/**
 * LocalStorage persistence for Warscrolls (MVP).
 * Key: aos-warscrolls
 * Value: JSON array of Warscroll
 */

import type { Warscroll, BattleTrait, ArmyCollection, Ability, AbilityColor, AbilityPhase } from "@/types/warscroll";

const STORAGE_KEY = "aos-warscrolls";
const BATTLE_TRAITS_KEY = "aos-battle-traits";
const ARMY_COLLECTIONS_KEY = "aos-army-collections";

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

function getBattleTraitsStored(): BattleTrait[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BATTLE_TRAITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BattleTrait[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setBattleTraitsStored(list: BattleTrait[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BATTLE_TRAITS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save battle traits", e);
  }
}

export function getAllBattleTraits(): BattleTrait[] {
  return getBattleTraitsStored();
}

export function saveBattleTrait(trait: BattleTrait): void {
  const list = getBattleTraitsStored();
  const index = list.findIndex((t) => t.id === trait.id);
  const updated = { ...trait, updatedAt: new Date().toISOString() };
  if (index >= 0) list[index] = updated;
  else list.push(updated);
  setBattleTraitsStored(list);
}

export function deleteBattleTrait(id: string): void {
  setBattleTraitsStored(getBattleTraitsStored().filter((t) => t.id !== id));
}

function getArmyCollectionsStored(): ArmyCollection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ARMY_COLLECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArmyCollection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setArmyCollectionsStored(list: ArmyCollection[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ARMY_COLLECTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save army collections", e);
  }
}

export function getAllArmyCollections(): ArmyCollection[] {
  return getArmyCollectionsStored();
}

export function saveArmyCollection(collection: ArmyCollection): void {
  const list = getArmyCollectionsStored();
  const index = list.findIndex((c) => c.id === collection.id);
  const updated = { ...collection, updatedAt: new Date().toISOString() };
  if (index >= 0) list[index] = updated;
  else list.push(updated);
  setArmyCollectionsStored(list);
}

export function deleteArmyCollection(id: string): void {
  setArmyCollectionsStored(getArmyCollectionsStored().filter((c) => c.id !== id));
}
