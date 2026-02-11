"use client";

import React from "react";
import { Footprints, Heart, Shield, Crosshair, type LucideIcon } from "lucide-react";
import type { BattleTrait } from "@/types/warscroll";
import AbilityBlock from "./AbilityBlock";

const STAT_ICONS: Record<string, LucideIcon> = {
  move: Footprints,
  health: Heart,
  save: Shield,
  control: Crosshair,
};

interface StatCircleProps {
  icon: LucideIcon;
  value: string;
  label: string;
  ward?: string;
}

function StatCircle({ icon: Icon, value, label, ward }: StatCircleProps) {
  const isSave = label === "Save";
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-100 text-slate-800 shadow-sm ${isSave ? "border-slate-600" : ""}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </div>
      {isSave && ward && (
        <div
          className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ward-red text-[10px] font-bold text-white shadow"
          title="Ward"
        >
          {ward}
        </div>
      )}
      <span className="mt-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-slate-600">
        {label}
      </span>
      <span className="text-xs font-bold text-slate-800">{value || "–"}</span>
    </div>
  );
}

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

  const hasValue = (v: string | undefined) => v && v.trim() !== "" && v !== "-";
  const stats = [
    { key: "move", label: "Move", value: trait.move, icon: STAT_ICONS.move },
    { key: "health", label: "Health", value: trait.health, icon: STAT_ICONS.health },
    { key: "save", label: "Save", value: trait.save, icon: STAT_ICONS.save, ward: trait.ward },
    { key: "control", label: "Control", value: trait.control, icon: STAT_ICONS.control },
  ].filter((s) => hasValue(s.value));
  const showStats = stats.length > 0;

  const factionLine = [trait.faction, trait.subfaction].filter(Boolean).join(" • ") || null;
  const isScourgeOfGhyran = trait.subfaction === "Scourge of Ghyran";
  const isRegimentOfRenown = Boolean(trait.regimentOfRenown);

  const headerBg = isRegimentOfRenown ? "bg-amber-700" : isScourgeOfGhyran ? "bg-green-800" : "bg-slate-800";

  return (
    <div role="article" className={className}>
      <header className={`flex flex-wrap items-baseline gap-x-2 gap-y-0 ${headerBg} px-3 py-1.5 text-white flex-shrink-0`}>
        <h2 className="text-base font-bold leading-tight">
          {trait.name || "Untitled Battle Trait"}
        </h2>
        {factionLine && (
          <span className="text-[11px] text-slate-300">{factionLine}</span>
        )}
      </header>
      {showStats && (
        <div className="flex justify-around border-b-2 border-slate-300 bg-slate-50 px-2 py-1.5 flex-shrink-0">
          {stats.map(({ key, label, value, icon, ward }) => (
            <StatCircle key={key} icon={icon} value={value} label={label} ward={ward} />
          ))}
        </div>
      )}
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
      {trait.keywords.length > 0 && (
        <footer className="flex flex-wrap gap-1 border-t border-slate-200 bg-slate-50 px-3 py-1 text-[10px] flex-shrink-0">
          {trait.keywords.map((k, i) => (
            <span
              key={i}
              className="rounded-full bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700"
            >
              {k}
            </span>
          ))}
        </footer>
      )}
    </div>
  );
}
