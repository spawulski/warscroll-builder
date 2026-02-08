"use client";

import React from "react";
import type { BattleTrait } from "@/types/warscroll";
import AbilityBlock from "./AbilityBlock";

interface BattleTraitCardProps {
  trait: BattleTrait;
  compact?: boolean;
  /** Horizontal layout: abilities in 2 columns for space efficiency. */
  landscape?: boolean;
}

export default function BattleTraitCard({ trait, compact = false, landscape = false }: BattleTraitCardProps) {
  const className =
    "warscroll-card-compact overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-md " +
    (compact ? "text-sm " : "") +
    (landscape ? "flex flex-col " : "");

  return (
    <div role="article" className={className}>
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0 bg-slate-800 px-3 py-1.5 text-white flex-shrink-0">
        <h2 className="text-base font-bold leading-tight">
          {trait.name || "Untitled Battle Trait"}
        </h2>
      </header>
      <section className={`px-3 py-1.5 min-w-0 flex-1 ${landscape ? "overflow-auto" : ""}`}>
        <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          Abilities
        </h3>
        {landscape && trait.abilities.length > 1 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0">
            <div className="space-y-0">
              {trait.abilities.slice(0, Math.ceil(trait.abilities.length / 2)).map((a) => (
                <AbilityBlock key={a.id} a={a} />
              ))}
            </div>
            <div className="space-y-0">
              {trait.abilities.slice(Math.ceil(trait.abilities.length / 2)).map((a) => (
                <AbilityBlock key={a.id} a={a} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {trait.abilities.length === 0 ? (
              <p className="py-1 text-[11px] text-slate-500">No abilities.</p>
            ) : (
              trait.abilities.map((a) => <AbilityBlock key={a.id} a={a} />)
            )}
          </div>
        )}
      </section>
    </div>
  );
}
