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
import type { Warscroll, WeaponProfile, Ability } from "@/types/warscroll";

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
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-100 text-slate-800 shadow-sm ${isSave ? "border-slate-600" : ""}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
      {isSave && ward && (
        <div
          className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-ward-red text-xs font-bold text-white shadow"
          title="Ward"
        >
          {ward}
        </div>
      )}
      <span className="mt-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-600">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800">{value || "–"}</span>
    </div>
  );
}

function WeaponRow({ w }: { w: WeaponProfile }) {
  const showRange = w.isRanged;
  return (
    <div className="weapon-row border-b border-slate-200 py-1.5 last:border-0">
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
      <div className={`mt-0.5 grid gap-1 text-xs font-medium text-slate-600 ${showRange ? "grid-cols-6" : "grid-cols-5"}`}>
        {showRange && <span>Range</span>}
        <span>Attacks</span>
        <span>Hit</span>
        <span>Wound</span>
        <span>Rend</span>
        <span>Damage</span>
      </div>
      <div className={`grid gap-1 text-xs text-slate-800 ${showRange ? "grid-cols-6" : "grid-cols-5"}`}>
        {showRange && <span>{w.range || "–"}</span>}
        <span>{w.attacks || "–"}</span>
        <span>{w.hit || "–"}</span>
        <span>{w.wound || "–"}</span>
        <span>{w.rend ?? "–"}</span>
        <span>{w.damage || "–"}</span>
      </div>
      {w.abilities && w.abilities.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
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

const ABILITY_BG_CLASSES: Record<Ability["color"], string> = {
  grey: "bg-slate-500",
  blue: "bg-blue-600",
  green: "bg-green-600",
  orange: "bg-orange-500",
  yellow: "bg-yellow-600",
  red: "bg-red-600",
  purple: "bg-purple-600",
  black: "bg-black",
};

function AbilityBlock({ a }: { a: Ability }) {
  const bgClass = ABILITY_BG_CLASSES[a.color] ?? "bg-slate-500";
  const parts: string[] = [];
  if (a.abilityType) parts.push(a.abilityType);
  const timingAndPhase =
    a.timing && a.phase
      ? `${a.timing} ${a.phase}`
      : a.timing || a.phase || "";
  if (timingAndPhase) parts.push(timingAndPhase);
  const label = parts.length > 0 ? parts.join(", ") : "";
  return (
    <div className="ability-text border-b border-slate-200 py-2 last:border-0">
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
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-50 text-[10px] font-bold text-slate-800"
            title="Casting value"
          >
            {a.castingValue}
          </span>
        )}
        {a.isPrayer && a.chantingValue != null && a.chantingValue !== "" && (
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center border-2 border-slate-700 bg-slate-50 text-[10px] font-bold text-slate-800"
            style={{ transform: "rotate(45deg)" }}
            title="Chanting value"
          >
            <span className="inline-flex h-full w-full items-center justify-center" style={{ transform: "rotate(-45deg)" }}>
              {a.chantingValue}
            </span>
          </span>
        )}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-800">{a.name}</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-700">{a.text}</p>
      {a.keywords && a.keywords.length > 0 && (
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">
          Keyword: {a.keywords.map((kw) => kw.toUpperCase()).join(", ")}
        </p>
      )}
    </div>
  );
}

interface WarscrollCardProps {
  warscroll: Warscroll;
  compact?: boolean;
  showExpand?: boolean;
  maxAbilityLength?: number;
}

export default function WarscrollCard({
  warscroll,
  compact = false,
  showExpand = false,
  maxAbilityLength = 120,
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

  const className =
    "warscroll-card-compact overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-md " +
    (compact ? "text-sm" : "");

  return React.createElement(
    "div",
    { role: "article", className },
    React.createElement(
      "header",
      { className: "flex flex-col gap-0.5 bg-slate-800 px-3 py-2.5 text-white" },
      React.createElement("h2", { className: "text-lg font-bold leading-tight" }, warscroll.unitName || "Untitled Unit"),
      React.createElement("p", { className: "text-xs text-slate-300" }, [warscroll.faction, warscroll.subfaction].filter(Boolean).join(" • ") || "—")
    ),
    React.createElement(
      "div",
      { className: "flex justify-around border-b-2 border-slate-300 bg-slate-50 px-2 py-3" },
      ...stats.map(({ key, label, value, icon, ward }) =>
        React.createElement(StatCircle, { key, icon, value, label, ward })
      )
    ),
    React.createElement(
      "section",
      { className: "border-b border-slate-200 px-3 py-2" },
      React.createElement("h3", { className: "mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600" },
        React.createElement(Swords, { className: "h-3.5 w-3.5" }),
        " Weapon Profiles"
      ),
      React.createElement("div", { className: "space-y-0" },
        ...warscroll.weapons.map((w) => React.createElement(WeaponRow, { key: w.id, w }))
      )
    ),
    React.createElement(
      "section",
      { className: "px-3 py-2" },
      React.createElement("h3", { className: "mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-600" }, "Abilities"),
      React.createElement("div", { className: "space-y-0" },
        warscroll.abilities.length === 0
          ? React.createElement("p", { className: "py-2 text-xs text-slate-500" }, "No abilities.")
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
      { className: "flex flex-wrap gap-1.5 border-t border-slate-200 bg-slate-50 px-3 py-2" },
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
