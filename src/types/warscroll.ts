/**
 * AoS 4th Edition Warscroll data schema
 */

/** Phase when the ability applies (dropdown "Phase"). Shown after timing on card, e.g. "Your Combat Phase". */
export type AbilityPhase =
  | "Hero Phase"
  | "Shooting Phase"
  | "Combat Phase"
  | "Charge Phase"
  | "Movement Phase"
  | "End of Turn"
  | "Deployment"
  | "Start of Battle Round"
  | "Start of Turn";

/** Ability bar color (dropdown "Color"). Text is always white on top. */
export type AbilityColor =
  | "grey"
  | "blue"
  | "green"
  | "orange"
  | "yellow"
  | "red"
  | "purple"
  | "black";

/** Tailwind background classes for each ability color (use with text-white). */
export const ABILITY_COLOR_CLASSES: Record<AbilityColor, string> = {
  grey: "bg-slate-500",
  blue: "bg-blue-600",
  green: "bg-green-600",
  orange: "bg-orange-500",
  yellow: "bg-yellow-600",
  red: "bg-red-600",
  purple: "bg-purple-600",
  black: "bg-black",
};

/** Timing: Passive, Your, Any, Enemy, or Reaction (dropdown "Timing"). Optional. Reaction uses custom text for type/phase. */
export type AbilityTimingQualifier = "Passive" | "Your" | "Any" | "Enemy" | "Reaction";

/** Ability type: once-per limits (dropdown "Ability Type"). Optional. Ability must have at least one of timing or abilityType. */
export type AbilityType =
  | "Once Per Turn"
  | "Once Per Turn (Army)"
  | "Once Per Battle";

export interface WeaponProfile {
  id: string;
  name: string;
  /** Only ranged weapons have a range characteristic; melee do not. */
  range: string; // e.g. "12\"" for ranged; unused for melee
  attacks: string;
  hit: string; // e.g. "3+"
  wound: string;
  rend: string; // e.g. "-1", "-"
  damage: string;
  abilities?: string[]; // e.g. ["Crit (Auto-wound)", "Anti-Infantry (+1 Rend)"]
  isRanged: boolean;
  /** Weapon suffers from battle damage (e.g. on monsters); shown with skull on card. */
  suffersBattleDamage?: boolean;
}

export interface Ability {
  id: string;
  name: string;
  /** Bar color for the ability (grey, blue, green, etc.). Ability type, timing, and phase shown in white on top. */
  color: AbilityColor;
  /** Phase (e.g. Combat Phase). Displayed after timing on card: "Your Combat Phase". */
  phase?: AbilityPhase;
  /** Timing: Passive / Your / Any / Enemy. Combined with phase on card when both set. */
  timing?: AbilityTimingQualifier;
  /** Ability type (e.g. Once Per Turn (Army)). Displayed first on card. */
  abilityType?: AbilityType;
  /** When timing is Reaction: free-text replacement for ability type and phase on the card. */
  reactionAbilityType?: string;
  reactionPhase?: string;
  text: string;
  /** Battle damage ability (e.g. affects weapon profiles); shown with skull on card. */
  battleDamage?: boolean;
  /** Spell: show casting value in circle on card. */
  isSpell?: boolean;
  castingValue?: string;
  /** Prayer: show chanting value in diamond on card. */
  isPrayer?: boolean;
  chantingValue?: string;
  /** Optional keywords for this ability (e.g. Arcane, Divine). Shown at bottom of ability as KEYWORD: word. */
  keywords?: string[];
}

/** Unit type for grouping warscrolls. */
export type UnitType =
  | "hero"
  | "infantry"
  | "cavalry"
  | "beast"
  | "monster"
  | "war machine"
  | "manifestation";

export const UNIT_TYPE_ORDER: UnitType[] = [
  "hero",
  "infantry",
  "cavalry",
  "beast",
  "monster",
  "war machine",
  "manifestation",
];

export interface Warscroll {
  id: string;
  unitName: string;
  faction: string;
  subfaction?: string;
  /** Derived from categoryLinks for grouping (e.g. HERO, INFANTRY). */
  unitType?: UnitType;
  /** When set, this unit belongs to a Regiment of Renown (e.g. "Fjori's Flamebearers"). */
  regimentOfRenown?: string;
  move: string;
  health: string;
  save: string;
  control: string;
  ward?: string; // e.g. "4+", "5+", "6+"
  weapons: WeaponProfile[];
  abilities: Ability[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export const ABILITY_PHASE_COLORS: Record<AbilityPhase, string> = {
  "Hero Phase": "bg-aos-yellow text-aos-black",
  "Shooting Phase": "bg-aos-blue text-white",
  "Combat Phase": "bg-aos-red text-white",
  "Charge Phase": "bg-aos-orange text-white",
  "Movement Phase": "bg-aos-grey text-white",
  "End of Turn": "bg-aos-purple text-white",
  Deployment: "bg-aos-black text-white",
  "Start of Battle Round": "bg-aos-black text-white",
  "Start of Turn": "bg-aos-black text-white",
};

export function createEmptyWeapon(isRanged: boolean): WeaponProfile {
  return {
    id: crypto.randomUUID(),
    name: "",
    range: isRanged ? "12\"" : "1\"",
    attacks: "",
    hit: "",
    wound: "",
    rend: "-",
    damage: "",
    abilities: [],
    isRanged,
  };
}

export const ABILITY_COLOR_OPTIONS: AbilityColor[] = [
  "grey",
  "blue",
  "green",
  "orange",
  "yellow",
  "red",
  "purple",
  "black",
];

export const ABILITY_PHASE_OPTIONS: AbilityPhase[] = [
  "Hero Phase",
  "Shooting Phase",
  "Combat Phase",
  "Charge Phase",
  "Movement Phase",
  "End of Turn",
  "Deployment",
  "Start of Battle Round",
  "Start of Turn",
];

export function createEmptyAbility(): Ability {
  return {
    id: crypto.randomUUID(),
    name: "",
    color: "grey",
    timing: undefined,
    abilityType: undefined,
    phase: undefined,
    text: "",
  };
}

export function createEmptyWarscroll(): Warscroll {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    unitName: "",
    faction: "",
    subfaction: "",
    move: "",
    health: "",
    save: "",
    control: "",
    ward: undefined,
    weapons: [createEmptyWeapon(false)],
    abilities: [],
    keywords: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Battle trait section types for grouping on the traits page. */
export type BattleTraitType =
  | "Prayer lores"
  | "Artefacts"
  | "Heroic traits"
  | "Spell lores"
  | "Manifestation Lores"
  | "Battle formations"
  | "Regiments of Renown"
  | "Battle traits";

export const TRAIT_TYPE_ORDER: BattleTraitType[] = [
  "Battle traits",
  "Regiments of Renown",
  "Battle formations",
  "Heroic traits",
  "Artefacts",
  "Spell lores",
  "Prayer lores",
  "Manifestation Lores",
];

/** Battle Traits card: same structure as unit warscroll except no weapons. */
export interface BattleTrait {
  id: string;
  name: string;
  /** Section type for grouping (Prayer lores, Artefacts, etc.). */
  traitType?: BattleTraitType;
  /** When set, this trait belongs to a Regiment of Renown (e.g. "Fjori's Flamebearers"). */
  regimentOfRenown?: string;
  faction?: string;
  subfaction?: string;
  move: string;
  health: string;
  save: string;
  control: string;
  ward?: string;
  keywords: string[];
  abilities: Ability[];
  createdAt: string;
  updatedAt: string;
}

export function createEmptyBattleTrait(): BattleTrait {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "",
    traitType: "Battle traits",
    move: "-",
    health: "-",
    save: "-",
    control: "-",
    keywords: [],
    abilities: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Army Collection: a saved set of warscrolls and battle traits. */
export interface ArmyCollection {
  id: string;
  name: string;
  /** Faction label (e.g. Fyreslayers); populated from loaded warscrolls/traits. */
  faction?: string;
  warscrollIds: string[];
  battleTraitIds: string[];
  createdAt: string;
  updatedAt: string;
}

export function createEmptyArmyCollection(): ArmyCollection {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "",
    warscrollIds: [],
    battleTraitIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
