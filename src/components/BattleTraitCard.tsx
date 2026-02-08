"use client";

import React from "react";
import type { BattleTrait } from "@/types/warscroll";
import AbilityBlock from "./AbilityBlock";

interface BattleTraitCardProps {
  trait: BattleTrait;
  compact?: boolean;
}

export default function BattleTraitCard({ trait, compact = false }: BattleTraitCardProps) {
  const className =
    "warscroll-card-compact overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-md " +
    (compact ? "text-sm" : "");

  return (
    <div role="article" className={className}>
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0 bg-slate-800 px-3 py-1.5 text-white">
        <h2 className="text-base font-bold leading-tight">
          {trait.name || "Untitled Battle Trait"}
        </h2>
      </header>
      <section className="px-3 py-1.5">
        <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          Abilities
        </h3>
        <div className="space-y-0">
          {trait.abilities.length === 0 ? (
            <p className="py-1 text-[11px] text-slate-500">No abilities.</p>
          ) : (
            trait.abilities.map((a) => (
              <AbilityBlock key={a.id} a={a} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
