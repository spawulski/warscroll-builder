"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import type { Warscroll, BattleTrait, ArmyCollection } from "@/types/warscroll";
import { buildCheatSheet, type CheatSheetEntry } from "@/lib/cheatsheet";
import { ABILITY_BG_CLASSES } from "./AbilityBlock";

interface CheatSheetProps {
  collection: ArmyCollection;
  warscrolls: Warscroll[];
  battleTraits: BattleTrait[];
  onClose: () => void;
}

function formatLabel(entry: CheatSheetEntry): string {
  const a = entry.ability;
  const parts: string[] = [];
  if (a.timing === "Reaction") {
    parts.push("Reaction");
    if (a.reactionAbilityType?.trim()) parts.push(a.reactionAbilityType.trim());
    if (a.reactionPhase?.trim()) parts.push(a.reactionPhase.trim());
  } else if (a.timing === "Passive") {
    parts.push("Passive");
  } else {
    if (a.abilityType) parts.push(a.abilityType);
    const timingAndPhase =
      a.timing && a.phase
        ? `${a.timing} ${a.phase}`
        : a.timing || a.phase || "";
    if (timingAndPhase) parts.push(timingAndPhase);
  }
  return parts.join(", ");
}

/** Strip **bold** and *italic* for compact plain text. */
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\^\^([^^]+)\^\^/g, "$1")
    .replace(/\n/g, " ")
    .trim();
}

export default function CheatSheet({ collection, warscrolls, battleTraits, onClose }: CheatSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const ws = collection.warscrollIds
    .map((id) => warscrolls.find((w) => w.id === id))
    .filter(Boolean) as Warscroll[];
  const bt = collection.battleTraitIds
    .map((id) => battleTraits.find((t) => t.id === id))
    .filter(Boolean) as BattleTrait[];
  const entries = buildCheatSheet(ws, bt);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${collection.name || "Army"} - Cheat Sheet`,
    pageStyle: `
      @page { size: A4; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-700 px-4 py-3 text-white">
        <h2 className="text-lg font-bold">Cheat Sheet – {collection.name || "Army"}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-200">{entries.length} abilities</span>
          <button
            type="button"
            onClick={() => handlePrint()}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-400 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div ref={printRef} className="mx-auto max-w-[210mm] bg-white p-4">
          <h1 className="mb-2 text-lg font-bold text-slate-800">
            {collection.name || "Army"} – Ability Cheat Sheet
          </h1>
          <p className="mb-4 text-xs text-slate-600">
            Abilities sorted by phase, then by card. Compact reference for gameplay.
          </p>
          <div className="cheat-sheet-grid grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 print:grid-cols-2">
            {entries.map((entry, i) => {
              const bgClass = ABILITY_BG_CLASSES[entry.ability.color] ?? "bg-slate-500";
              const label = formatLabel(entry);
              return (
                <div
                  key={`${entry.cardName}-${entry.ability.id}-${i}`}
                  className="cheat-sheet-entry flex gap-2 border-b border-slate-100 pb-2 last:border-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold uppercase text-white ${bgClass}`}
                      >
                        {entry.stage}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-700">
                        {entry.cardName}
                      </span>
                      {label && (
                        <span className="text-[8px] text-slate-500">{label}</span>
                      )}
                    </div>
                    <p className="text-[9px] font-medium text-slate-800">
                      {entry.ability.name}
                    </p>
                    <p className="text-[8px] leading-tight text-slate-600">
                      {stripMarkdown(entry.ability.text)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
