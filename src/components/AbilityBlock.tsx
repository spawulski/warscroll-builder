"use client";

import React from "react";
import { Skull } from "lucide-react";
import type { Ability } from "@/types/warscroll";

/** Parse **bold** and *italic* in text; newlines are preserved via <br />. */
export function formatAbilityText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {parseFormattings(line)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));
}

function parseFormattings(s: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = s;
  let key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);
    let match: RegExpMatchArray | null = null;
    let type: "bold" | "italic" | null = null;
    if (boldMatch && (!italicMatch || (boldMatch.index ?? 0) <= (italicMatch.index ?? 0))) {
      match = boldMatch;
      type = "bold";
    } else if (italicMatch) {
      match = italicMatch;
      type = "italic";
    }
    if (match && type) {
      const before = remaining.slice(0, match.index);
      if (before) nodes.push(<React.Fragment key={key++}>{before}</React.Fragment>);
      nodes.push(
        type === "bold" ? (
          <strong key={key++}>{match[1]}</strong>
        ) : (
          <em key={key++}>{match[1]}</em>
        )
      );
      remaining = remaining.slice((match.index ?? 0) + match[0].length);
    } else {
      if (remaining) nodes.push(<React.Fragment key={key++}>{remaining}</React.Fragment>);
      break;
    }
  }
  return nodes;
}

export const ABILITY_BG_CLASSES: Record<Ability["color"], string> = {
  grey: "bg-slate-500",
  blue: "bg-blue-600",
  green: "bg-green-600",
  orange: "bg-orange-500",
  yellow: "bg-yellow-600",
  red: "bg-red-600",
  purple: "bg-purple-600",
  black: "bg-black",
};

interface AbilityBlockProps {
  a: Ability;
}

export default function AbilityBlock({ a }: AbilityBlockProps) {
  const bgClass = ABILITY_BG_CLASSES[a.color] ?? "bg-slate-500";
  const parts: string[] = [];
  if (a.timing === "Reaction") {
    parts.push("Reaction");
    if (a.reactionAbilityType?.trim()) parts.push(a.reactionAbilityType.trim());
    if (a.reactionPhase?.trim()) parts.push(a.reactionPhase.trim());
  } else {
    if (a.abilityType) parts.push(a.abilityType);
    const timingAndPhase =
      a.timing && a.phase
        ? `${a.timing} ${a.phase}`
        : a.timing || a.phase || "";
    if (timingAndPhase) parts.push(timingAndPhase);
  }
  const label = parts.length > 0 ? parts.join(", ") : "";
  return (
    <div className="ability-text border-b border-slate-200 py-1.5 last:border-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {label ? (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white ${bgClass}`}
          >
            {label}
          </span>
        ) : null}
        {a.battleDamage && (
          <span title="Battle damage">
            <Skull className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
          </span>
        )}
        {a.isSpell && a.castingValue != null && a.castingValue !== "" && (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-50 text-[9px] font-bold text-slate-800"
            title="Casting value"
          >
            {a.castingValue}
          </span>
        )}
        {a.isPrayer && a.chantingValue != null && a.chantingValue !== "" && (
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center border-2 border-slate-700 bg-slate-50 text-[9px] font-bold text-slate-800"
            style={{ transform: "rotate(45deg)" }}
            title="Chanting value"
          >
            <span className="inline-flex h-full w-full items-center justify-center" style={{ transform: "rotate(-45deg)" }}>
              {a.chantingValue}
            </span>
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-800">{a.name}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-slate-700">
        {formatAbilityText(a.text)}
      </p>
      {a.keywords && a.keywords.length > 0 && (
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
          Keyword: {a.keywords.map((kw) => kw.toUpperCase()).join(", ")}
        </p>
      )}
    </div>
  );
}
