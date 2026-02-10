/**
 * Cheat sheet: aggregate abilities from an army collection, sorted by round stage and card name.
 */

import type { Ability, AbilityColor, AbilityPhase, Warscroll, BattleTrait } from "@/types/warscroll";

/** Cheat sheet stage order (round flow). */
export const CHEAT_SHEET_STAGE_ORDER: string[] = [
  "Deployment Phase",
  "Start of Battle Round",
  "Start of Turn",
  "Hero Phase",
  "Movement Phase",
  "Shooting Phase",
  "Charge Phase",
  "Combat Phase",
  "End of Turn",
  "Passive",
];

type CheatSheetStage = AbilityPhase | "Passive";

/** Color → phase for inferring phase when not explicit. */
const COLOR_TO_PHASE: Record<AbilityColor, CheatSheetStage> = {
  yellow: "Hero Phase",
  blue: "Shooting Phase",
  red: "Combat Phase",
  orange: "Charge Phase",
  grey: "Movement Phase",
  purple: "End of Turn",
  black: "Start of Turn", // Deployment and Start of Turn both use black; resolved below
  green: "Passive",
};

/** Resolve ability to a cheat sheet stage. */
function resolveStage(a: Ability): string {
  if (a.phase) {
    if (a.phase === "Deployment") return "Deployment Phase";
    return a.phase;
  }
  if (a.timing === "Passive") return "Passive";

  const combined = [a.reactionPhase, a.name, a.text].filter(Boolean).join(" ").toLowerCase();
  if (/\bdeploy/i.test(combined)) return "Deployment Phase";
  if (/\bstart\s+of\s+(?:any\s+)?(?:battle\s+)?round\b/i.test(combined)) return "Start of Battle Round";
  if (/\bstart\s+of\s+(?:any\s+)?turn\b/i.test(combined)) return "Start of Turn";

  const phase = COLOR_TO_PHASE[a.color];
  if (phase === "Passive") return "Passive";
  if (a.color === "black") {
    if (/\bdeploy/i.test(combined)) return "Deployment Phase";
    if (/\bbattle\s+round\b/i.test(combined)) return "Start of Battle Round";
  }
  return phase;
}

export interface CheatSheetEntry {
  ability: Ability;
  cardName: string;
  stage: string;
}

/** Build sorted cheat sheet entries from warscrolls and battle traits. */
export function buildCheatSheet(
  warscrolls: Warscroll[],
  battleTraits: BattleTrait[]
): CheatSheetEntry[] {
  const entries: CheatSheetEntry[] = [];

  for (const w of warscrolls) {
    for (const a of w.abilities) {
      entries.push({
        ability: a,
        cardName: w.unitName || "Untitled",
        stage: resolveStage(a),
      });
    }
  }
  for (const t of battleTraits) {
    for (const a of t.abilities) {
      entries.push({
        ability: a,
        cardName: t.name || "Untitled",
        stage: resolveStage(a),
      });
    }
  }

  const stageOrder = [...CHEAT_SHEET_STAGE_ORDER];
  const stageIndex = (s: string) => {
    const i = stageOrder.indexOf(s);
    return i >= 0 ? i : stageOrder.length;
  };

  entries.sort((a, b) => {
    const diff = stageIndex(a.stage) - stageIndex(b.stage);
    if (diff !== 0) return diff;
    return (a.cardName || "").localeCompare(b.cardName || "");
  });

  return entries;
}
