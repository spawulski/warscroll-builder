"use client";

import { useCallback } from "react";
import type { BattleTrait } from "@/types/warscroll";
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

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Battle Trait
        </h3>
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
      </section>
      <AbilityFormSection
        abilities={trait.abilities}
        onChange={(abilities) => update({ abilities })}
      />
    </div>
  );
}
