"use client";

import { useCallback, useEffect, useState } from "react";
import type { BattleTrait, BattleTraitType } from "@/types/warscroll";

const TRAIT_TYPES: BattleTraitType[] = [
  "Battle traits",
  "Battle formations",
  "Heroic traits",
  "Artefacts",
  "Spell lores",
  "Prayer lores",
  "Manifestation Lores",
];
import AbilityFormSection from "./AbilityFormSection";

interface BattleTraitFormProps {
  trait: BattleTrait;
  onChange: (t: BattleTrait) => void;
}

export default function BattleTraitForm({ trait, onChange }: BattleTraitFormProps) {
  const update = useCallback(
    (patch: Partial<BattleTrait>) => {
      onChange({
        ...trait,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    },
    [trait, onChange]
  );

  const setKeywords = useCallback(
    (raw: string) => {
      const keywords = raw
        .split(/[,;]/)
        .map((k) => k.trim())
        .filter(Boolean);
      update({ keywords });
    },
    [update]
  );

  const [keywordsRaw, setKeywordsRaw] = useState(trait.keywords.join(", "));
  useEffect(() => {
    setKeywordsRaw(trait.keywords.join(", "));
  }, [trait.id]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Battle Trait & Faction
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Name</span>
            <input
              type="text"
              value={trait.name}
              onChange={(e) => update({ name: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Heroic Will"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Faction</span>
            <input
              type="text"
              value={trait.faction ?? ""}
              onChange={(e) => update({ faction: e.target.value || undefined })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Fyreslayers"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-slate-600">
              Subfaction (optional)
            </span>
            <input
              type="text"
              value={trait.subfaction ?? ""}
              onChange={(e) => update({ subfaction: e.target.value || undefined })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Vostarg"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-slate-600">Section type</span>
            <select
              value={trait.traitType ?? "Battle traits"}
              onChange={(e) => update({ traitType: e.target.value as BattleTraitType })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TRAIT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Characteristics
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { key: "move", label: "Move (Inches)", value: trait.move },
            { key: "health", label: "Health", value: trait.health },
            { key: "save", label: "Save", value: trait.save },
            { key: "control", label: "Control", value: trait.control },
            { key: "ward", label: "Ward (e.g. 4+)", value: trait.ward ?? "" },
          ].map(({ key, label, value }) => (
            <label key={key} className="block">
              <span className="text-xs font-medium text-slate-600">{label}</span>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  update({
                    [key]: e.target.value || (key === "ward" ? undefined : "-"),
                  } as Partial<BattleTrait>)
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={key === "ward" ? "4+" : "–"}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Keywords
        </h3>
        <input
          type="text"
          value={keywordsRaw}
          onChange={(e) => setKeywordsRaw(e.target.value)}
          onBlur={() => setKeywords(keywordsRaw)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Comma separated, e.g. Hero, Monster"
        />
      </section>

      <AbilityFormSection
        abilities={trait.abilities}
        onChange={(abilities) => update({ abilities })}
      />
    </div>
  );
}
