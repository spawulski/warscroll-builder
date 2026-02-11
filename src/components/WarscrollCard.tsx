"use client";

import React from "react";
import {
  Footprints,
  Heart,
  Shield,
  Crosshair,
  Swords,
  Skull,
  type LucideIcon,
} from "lucide-react";
import type { Warscroll, WeaponProfile } from "@/types/warscroll";
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

function WeaponRow({ w }: { w: WeaponProfile }) {
  const showRange = w.isRanged;
  return (
    <div className="weapon-row border-b border-slate-200 py-1 last:border-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
          {w.name || "—"}
          {w.suffersBattleDamage && (
            <span title="Suffers from battle damage">
              <Skull className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
            </span>
          )}
        </span>
        <span className="text-xs text-slate-500">
          {w.isRanged ? "Ranged" : "Melee"}
        </span>
      </div>
      <div className={`mt-0.5 grid gap-0.5 text-[11px] font-medium text-slate-600 ${showRange ? "grid-cols-6" : "grid-cols-5"}`}>
        {showRange && <span>Range</span>}
        <span>Attacks</span>
        <span>Hit</span>
        <span>Wound</span>
        <span>Rend</span>
        <span>Damage</span>
      </div>
      <div className={`grid gap-0.5 text-[11px] text-slate-800 ${showRange ? "grid-cols-6" : "grid-cols-5"}`}>
        {showRange && <span>{w.range || "–"}</span>}
        <span>{w.attacks || "–"}</span>
        <span>{w.hit || "–"}</span>
        <span>{w.wound || "–"}</span>
        <span>{w.rend ?? "–"}</span>
        <span>{w.damage || "–"}</span>
      </div>
      {w.abilities && w.abilities.length > 0 && (
        <div className="mt-0.5 flex flex-wrap gap-1">
          {w.abilities.map((a, i) => (
            <span
              key={i}
              className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface WarscrollCardProps {
  warscroll: Warscroll;
  compact?: boolean;
  showExpand?: boolean;
  maxAbilityLength?: number;
  /** Horizontal layout: stats, then weapons+abilities flow in 2 balanced columns, then footer. */
  landscape?: boolean;
}

export default function WarscrollCard({
  warscroll,
  compact = false,
  showExpand = false,
  maxAbilityLength = 120,
  landscape = false,
}: WarscrollCardProps) {
  const stats = [
    { key: "move", label: "Move", value: warscroll.move, icon: STAT_ICONS.move },
    {
      key: "health",
      label: "Health",
      value: warscroll.health,
      icon: STAT_ICONS.health,
    },
    {
      key: "save",
      label: "Save",
      value: warscroll.save,
      icon: STAT_ICONS.save,
      ward: warscroll.ward,
    },
    {
      key: "control",
      label: "Control",
      value: warscroll.control,
      icon: STAT_ICONS.control,
    },
  ];

  const truncate = (s: string, len: number) =>
    s.length <= len ? s : s.slice(0, len) + "...";

  const baseClass = "warscroll-card-compact overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-md ";
  const className =
    baseClass +
    (compact ? "text-sm " : "") +
    (landscape ? "flex flex-col max-w-none " : "");

  const factionLine = [warscroll.faction, warscroll.subfaction].filter(Boolean).join(" • ") || "—";
  const isScourgeOfGhyran = warscroll.subfaction === "Scourge of Ghyran";
  const headerBgClass = isScourgeOfGhyran ? "bg-green-800" : "bg-slate-800";

  const headerEl = React.createElement(
    "header",
    { key: "h", className: `flex flex-wrap items-baseline gap-x-2 gap-y-0 ${headerBgClass} px-3 py-1.5 text-white flex-shrink-0` },
    React.createElement("h2", { className: "text-base font-bold leading-tight" }, warscroll.unitName || "Untitled Unit"),
    React.createElement("span", { className: "text-[11px] text-slate-300" }, factionLine)
  );

  const statsEl = React.createElement(
    "div",
    { key: "s", className: "flex justify-around border-b-2 border-slate-300 bg-slate-50 px-2 py-1.5 flex-shrink-0" },
    ...stats.map(({ key, label, value, icon, ward }) =>
      React.createElement(StatCircle, { key, icon, value, label, ward })
    )
  );

  const weaponsSectionEl = React.createElement(
    "section",
    { key: "w", className: "break-inside-avoid border-b border-slate-200 px-2 py-1" },
    React.createElement("h3", { className: "mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-600" },
      React.createElement(Swords, { className: "h-3 w-3" }),
      " Weapons"
    ),
    React.createElement("div", { className: "space-y-0" },
      ...warscroll.weapons.map((w) => React.createElement(WeaponRow, { key: w.id, w }))
    )
  );

  const abilityBlockElements =
    warscroll.abilities.length === 0
      ? [React.createElement("p", { key: "no-a", className: "py-0.5 text-[10px] text-slate-500" }, "No abilities.")]
      : warscroll.abilities.map((a) =>
          React.createElement("div", { key: a.id, className: "break-inside-avoid" },
            React.createElement(AbilityBlock, {
              a: showExpand && maxAbilityLength > 0 && a.text.length > maxAbilityLength
                ? { ...a, text: truncate(a.text, maxAbilityLength) }
                : a,
            })
          )
        );

  const abilitiesSectionEl = React.createElement(
    "section",
    { key: "a", className: "px-2 py-1" },
    React.createElement("h3", { className: "mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 break-inside-avoid" }, "Abilities"),
    React.createElement("div", { className: "space-y-0" }, ...abilityBlockElements)
  );

  const footerEl = React.createElement(
    "footer",
    { key: "f", className: "flex flex-wrap gap-1 border-t border-slate-200 bg-slate-50 px-3 py-1 text-[10px] flex-shrink-0" },
    warscroll.keywords.length === 0
      ? React.createElement("span", { className: "text-slate-500" }, "No keywords")
      : warscroll.keywords.map((k, i) =>
          React.createElement("span", {
            key: i,
            className: "rounded-full bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700",
          }, k)
        )
  );

  if (landscape) {
    return React.createElement(
      "div",
      { role: "article", className },
      headerEl,
      statsEl,
      React.createElement(
        "div",
        {
          className: "flex-1 min-h-0 columns-2 gap-x-3 px-2 py-1",
          style: { columnFill: "balance" },
        },
        weaponsSectionEl,
        abilitiesSectionEl
      ),
      footerEl
    );
  }

  return React.createElement(
    "div",
    { role: "article", className },
    headerEl,
    React.createElement("div", { key: "s", className: "flex justify-around border-b-2 border-slate-300 bg-slate-50 px-2 py-2" },
      ...stats.map(({ key, label, value, icon, ward }) =>
        React.createElement(StatCircle, { key, icon, value, label, ward })
      )
    ),
    React.createElement(
      "section",
      { className: "border-b border-slate-200 px-3 py-1.5" },
      React.createElement("h3", { className: "mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-600" },
        React.createElement(Swords, { className: "h-3 w-3" }),
        " Weapon Profiles"
      ),
      React.createElement("div", { className: "space-y-0" },
        ...warscroll.weapons.map((w) => React.createElement(WeaponRow, { key: w.id, w }))
      )
    ),
    React.createElement(
      "section",
      { className: "px-3 py-1.5" },
      React.createElement("h3", { className: "mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-600" }, "Abilities"),
      React.createElement("div", { className: "space-y-0" },
        warscroll.abilities.length === 0
          ? React.createElement("p", { className: "py-1 text-[11px] text-slate-500" }, "No abilities.")
          : warscroll.abilities.map((a) =>
              React.createElement(AbilityBlock, {
                key: a.id,
                a: showExpand && maxAbilityLength > 0 && a.text.length > maxAbilityLength
                  ? { ...a, text: truncate(a.text, maxAbilityLength) }
                  : a,
              })
            )
      )
    ),
    React.createElement(
      "footer",
      { className: "flex flex-wrap gap-1 border-t border-slate-200 bg-slate-50 px-3 py-1.5" },
      warscroll.keywords.length === 0
        ? React.createElement("span", { className: "text-xs text-slate-500" }, "No keywords")
        : warscroll.keywords.map((k, i) =>
            React.createElement("span", {
              key: i,
              className: "rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700",
            }, k)
          )
    )
  );
}
