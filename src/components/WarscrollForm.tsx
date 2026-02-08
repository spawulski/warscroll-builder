"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Warscroll, WeaponProfile } from "@/types/warscroll";
import { createEmptyWeapon } from "@/types/warscroll";
import AbilityFormSection from "./AbilityFormSection";

interface WarscrollFormProps {
  warscroll: Warscroll;
  onChange: (w: Warscroll) => void;
}

export default function WarscrollForm({ warscroll, onChange }: WarscrollFormProps) {
  const update = useCallback(
    (patch: Partial<Warscroll>) => {
      onChange({
        ...warscroll,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    },
    [warscroll, onChange]
  );

  const updateWeapon = useCallback(
    (id: string, patch: Partial<WeaponProfile>) => {
      const weapons = warscroll.weapons.map((w) =>
        w.id === id ? { ...w, ...patch } : w
      );
      update({ weapons });
    },
    [warscroll.weapons, update]
  );

  const addWeapon = useCallback(
    (isRanged: boolean) => {
      update({ weapons: [...warscroll.weapons, createEmptyWeapon(isRanged)] });
    },
    [warscroll.weapons, update]
  );

  const removeWeapon = useCallback(
    (id: string) => {
      if (warscroll.weapons.length <= 1) return;
      update({ weapons: warscroll.weapons.filter((w) => w.id !== id) });
    },
    [warscroll.weapons, update]
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

  const [keywordsRaw, setKeywordsRaw] = useState(warscroll.keywords.join(", "));
  useEffect(() => {
    setKeywordsRaw(warscroll.keywords.join(", "));
  }, [warscroll.id]);

  const [weaponAbilityDrafts, setWeaponAbilityDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Unit & Faction
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Unit Name</span>
            <input
              type="text"
              value={warscroll.unitName}
              onChange={(e) => update({ unitName: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Liberator-Prime"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Faction</span>
            <input
              type="text"
              value={warscroll.faction}
              onChange={(e) => update({ faction: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Stormcast Eternals"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-slate-600">
              Subfaction (optional)
            </span>
            <input
              type="text"
              value={warscroll.subfaction ?? ""}
              onChange={(e) => update({ subfaction: e.target.value || undefined })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Hammers of Sigmar"
            />
          </label>
        </div>
      </section>

      {/* Characteristics */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Characteristics
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { key: "move", label: "Move (Inches)", value: warscroll.move },
            { key: "health", label: "Health", value: warscroll.health },
            { key: "save", label: "Save", value: warscroll.save },
            { key: "control", label: "Control", value: warscroll.control },
            { key: "ward", label: "Ward (e.g. 4+)", value: warscroll.ward ?? "" },
          ].map(({ key, label, value }) => (
            <label key={key} className="block">
              <span className="text-xs font-medium text-slate-600">{label}</span>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  update({
                    [key]: e.target.value || (key === "ward" ? undefined : ""),
                  } as Partial<Warscroll>)
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={key === "ward" ? "4+" : "–"}
              />
            </label>
          ))}
        </div>
      </section>

      {/* Weapons */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-slate-600">
            Weapon Profiles
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addWeapon(false)}
              className="flex items-center gap-1 rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" /> Melee
            </button>
            <button
              type="button"
              onClick={() => addWeapon(true)}
              className="flex items-center gap-1 rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" /> Ranged
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {warscroll.weapons.map((w) => (
            <div
              key={w.id}
              className="rounded border border-slate-200 bg-slate-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {w.isRanged ? "Ranged" : "Melee"} weapon
                </span>
                <button
                  type="button"
                  onClick={() => removeWeapon(w.id)}
                  disabled={warscroll.weapons.length <= 1}
                  className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                  title="Remove weapon"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="text-xs text-slate-600">Name</span>
                  <input
                    type="text"
                    value={w.name}
                    onChange={(e) => updateWeapon(w.id, { name: e.target.value })}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="Weapon name"
                  />
                </label>
                {w.isRanged && (
                  <label className="block">
                    <span className="text-xs text-slate-600">Range</span>
                    <input
                      type="text"
                      value={w.range}
                      onChange={(e) => updateWeapon(w.id, { range: e.target.value })}
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      placeholder='12"'
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-xs text-slate-600">Attacks</span>
                  <input
                    type="text"
                    value={w.attacks}
                    onChange={(e) => updateWeapon(w.id, { attacks: e.target.value })}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-600">Hit</span>
                  <input
                    type="text"
                    value={w.hit}
                    onChange={(e) => updateWeapon(w.id, { hit: e.target.value })}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="3+"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-600">Wound</span>
                  <input
                    type="text"
                    value={w.wound}
                    onChange={(e) => updateWeapon(w.id, { wound: e.target.value })}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-600">Rend</span>
                  <input
                    type="text"
                    value={w.rend}
                    onChange={(e) => updateWeapon(w.id, { rend: e.target.value })}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="-1 or -"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-600">Damage</span>
                  <input
                    type="text"
                    value={w.damage}
                    onChange={(e) => updateWeapon(w.id, { damage: e.target.value })}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={w.suffersBattleDamage ?? false}
                    onChange={(e) =>
                      updateWeapon(w.id, { suffersBattleDamage: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-600">
                    Suffers from battle damage (skull on card)
                  </span>
                </label>
                <label className="mt-2 block">
                  <span className="text-xs text-slate-600">
                    Abilities (comma- or semicolon-separated, e.g. Crit (Auto-wound), Anti-Infantry
                    +1 Rend)
                  </span>
                  <input
                    type="text"
                    value={weaponAbilityDrafts[w.id] ?? (w.abilities ?? []).join(", ")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setWeaponAbilityDrafts((prev) => ({ ...prev, [w.id]: raw }));
                      updateWeapon(w.id, {
                        abilities: raw
                          .split(/[,;]/)
                          .map((x) => x.trim())
                          .filter(Boolean),
                      });
                    }}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="Crit (2 Hits), Shoot in Combat"
                  />
                </label>
            </div>
          ))}
        </div>
      </section>

      <AbilityFormSection
        abilities={warscroll.abilities}
        onChange={(abilities) => update({ abilities })}
      />

      {/* Keywords */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">
          Keywords
        </h3>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">
            Comma- or semicolon-separated
          </span>
          <input
            type="text"
            value={keywordsRaw}
            onChange={(e) => {
              const raw = e.target.value;
              setKeywordsRaw(raw);
              setKeywords(raw);
            }}
            onBlur={() => {
              const parsed = keywordsRaw
                .split(/[,;]/)
                .map((k) => k.trim())
                .filter(Boolean);
              setKeywordsRaw(parsed.join(", "));
            }}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Order, Stormcast Eternals, Liberators, Human"
          />
        </label>
      </section>
    </div>
  );
}
