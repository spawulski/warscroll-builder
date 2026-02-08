"use client";

import { useCallback } from "react";
import { Plus, X } from "lucide-react";
import type { ArmyCollection, Warscroll, BattleTrait } from "@/types/warscroll";

interface ArmyCollectionFormProps {
  collection: ArmyCollection;
  warscrolls: Warscroll[];
  battleTraits: BattleTrait[];
  onChange: (c: ArmyCollection) => void;
}

export default function ArmyCollectionForm({
  collection,
  warscrolls,
  battleTraits,
  onChange,
}: ArmyCollectionFormProps) {
  const update = useCallback(
    (patch: Partial<ArmyCollection>) => {
      onChange({
        ...collection,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    },
    [collection, onChange]
  );

  const availableWarscrolls = warscrolls.filter(
    (w) => !collection.warscrollIds.includes(w.id)
  );
  const availableTraits = battleTraits.filter(
    (t) => !collection.battleTraitIds.includes(t.id)
  );
  const selectedWarscrolls = collection.warscrollIds
    .map((id) => warscrolls.find((w) => w.id === id))
    .filter(Boolean) as Warscroll[];
  const selectedTraits = collection.battleTraitIds
    .map((id) => battleTraits.find((t) => t.id === id))
    .filter(Boolean) as BattleTrait[];

  const addWarscroll = useCallback(
    (id: string) => {
      if (collection.warscrollIds.includes(id)) return;
      update({ warscrollIds: [...collection.warscrollIds, id] });
    },
    [collection.warscrollIds, update]
  );

  const removeWarscroll = useCallback(
    (id: string) => {
      update({
        warscrollIds: collection.warscrollIds.filter((x) => x !== id),
      });
    },
    [collection.warscrollIds, update]
  );

  const addTrait = useCallback(
    (id: string) => {
      if (collection.battleTraitIds.includes(id)) return;
      update({ battleTraitIds: [...collection.battleTraitIds, id] });
    },
    [collection.battleTraitIds, update]
  );

  const removeTrait = useCallback(
    (id: string) => {
      update({
        battleTraitIds: collection.battleTraitIds.filter((x) => x !== id),
      });
    },
    [collection.battleTraitIds, update]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Army Collection
        </h3>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Name</span>
          <input
            type="text"
            value={collection.name}
            onChange={(e) => update({ name: e.target.value })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. My Stormcast List"
          />
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Unit Warscrolls
        </h3>
        {availableWarscrolls.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) addWarscroll(id);
                e.target.value = "";
              }}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Add a warscroll…</option>
              {availableWarscrolls.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.unitName || "Untitled"}
                </option>
              ))}
            </select>
            <Plus className="h-4 w-4 text-slate-400" />
          </div>
        )}
        {selectedWarscrolls.length === 0 ? (
          <p className="text-sm text-slate-500">
            No warscrolls in this collection. Add from the dropdown above.
          </p>
        ) : (
          <ul className="space-y-1">
            {selectedWarscrolls.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm"
              >
                <span className="font-medium text-slate-800">
                  {w.unitName || "Untitled"}
                </span>
                <button
                  type="button"
                  onClick={() => removeWarscroll(w.id)}
                  className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-700"
                  title="Remove from collection"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Battle Traits
        </h3>
        {availableTraits.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) addTrait(id);
                e.target.value = "";
              }}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Add a battle trait…</option>
              {availableTraits.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || "Untitled"}
                </option>
              ))}
            </select>
            <Plus className="h-4 w-4 text-slate-400" />
          </div>
        )}
        {selectedTraits.length === 0 ? (
          <p className="text-sm text-slate-500">
            No battle traits in this collection. Add from the dropdown above.
          </p>
        ) : (
          <ul className="space-y-1">
            {selectedTraits.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm"
              >
                <span className="font-medium text-slate-800">
                  {t.name || "Untitled"}
                </span>
                <button
                  type="button"
                  onClick={() => removeTrait(t.id)}
                  className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-700"
                  title="Remove from collection"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
