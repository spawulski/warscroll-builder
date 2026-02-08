"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  Ability,
  AbilityColor,
  AbilityPhase,
  AbilityTimingQualifier,
  AbilityType,
} from "@/types/warscroll";
import {
  createEmptyAbility,
  ABILITY_COLOR_OPTIONS,
  ABILITY_PHASE_OPTIONS,
} from "@/types/warscroll";

const TIMING_OPTIONS: (AbilityTimingQualifier | "")[] = [
  "",
  "Passive",
  "Your",
  "Any",
  "Enemy",
  "Reaction",
];

const ABILITY_TYPE_OPTIONS: (AbilityType | "")[] = [
  "",
  "Once Per Turn",
  "Once Per Turn (Army)",
  "Once Per Battle",
];

interface AbilityFormSectionProps {
  abilities: Ability[];
  onChange: (abilities: Ability[]) => void;
}

export default function AbilityFormSection({ abilities, onChange }: AbilityFormSectionProps) {
  const updateAbility = useCallback(
    (id: string, patch: Partial<Ability>) => {
      onChange(
        abilities.map((a) => (a.id === id ? { ...a, ...patch } : a))
      );
    },
    [abilities, onChange]
  );

  const addAbility = useCallback(() => {
    onChange([...abilities, createEmptyAbility()]);
  }, [abilities, onChange]);

  const removeAbility = useCallback(
    (id: string) => {
      onChange(abilities.filter((a) => a.id !== id));
    },
    [abilities, onChange]
  );

  const [abilityKeywordDrafts, setAbilityKeywordDrafts] = useState<Record<string, string>>({});
  const abilityIdsKey = abilities
    .map((a) => a.id)
    .sort()
    .join(",");
  useEffect(() => {
    setAbilityKeywordDrafts((prev) => {
      const next = { ...prev };
      const ids = new Set(abilities.map((a) => a.id));
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) delete next[id];
      }
      return next;
    });
  }, [abilityIdsKey]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-slate-600">
          Abilities
        </h3>
        <button
          type="button"
          onClick={addAbility}
          className="flex items-center gap-1 rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add ability
        </button>
      </div>
      <div className="space-y-4">
        {abilities.length === 0 ? (
          <p className="text-sm text-slate-500">No abilities yet. Add one above.</p>
        ) : (
          abilities.map((a) => (
            <div
              key={a.id}
              className="rounded border border-slate-200 bg-slate-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Ability</span>
                <button
                  type="button"
                  onClick={() => removeAbility(a.id)}
                  className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-700"
                  title="Remove ability"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <label className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={a.battleDamage ?? false}
                  onChange={(e) =>
                    updateAbility(a.id, { battleDamage: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-xs text-slate-600">
                  Battle damage (skull on card – e.g. passive that affects a weapon)
                </span>
              </label>
              <label className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={a.isSpell ?? false}
                  onChange={(e) =>
                    updateAbility(a.id, {
                      isSpell: e.target.checked,
                      castingValue: e.target.checked ? a.castingValue ?? "" : undefined,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-xs text-slate-600">Spell (casting value in circle on card)</span>
              </label>
              {a.isSpell && (
                <label className="mb-2 ml-6 block">
                  <span className="text-xs text-slate-600">Casting value</span>
                  <input
                    type="text"
                    value={a.castingValue ?? ""}
                    onChange={(e) =>
                      updateAbility(a.id, { castingValue: e.target.value })
                    }
                    className="mt-0.5 w-20 rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="e.g. 5+"
                  />
                </label>
              )}
              <label className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={a.isPrayer ?? false}
                  onChange={(e) =>
                    updateAbility(a.id, {
                      isPrayer: e.target.checked,
                      chantingValue: e.target.checked ? a.chantingValue ?? "" : undefined,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-xs text-slate-600">Prayer (chanting value in diamond on card)</span>
              </label>
              {a.isPrayer && (
                <label className="mb-2 ml-6 block">
                  <span className="text-xs text-slate-600">Chanting value</span>
                  <input
                    type="text"
                    value={a.chantingValue ?? ""}
                    onChange={(e) =>
                      updateAbility(a.id, { chantingValue: e.target.value })
                    }
                    className="mt-0.5 w-20 rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="e.g. 3+"
                  />
                </label>
              )}
              <p className="mb-2 text-[11px] text-slate-500">
                Ability needs at least one of: Timing or Ability Type.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-slate-600">Name</span>
                  <input
                    type="text"
                    value={a.name}
                    onChange={(e) =>
                      updateAbility(a.id, { name: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="Ability name"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-600">Color</span>
                  <select
                    value={a.color}
                    onChange={(e) =>
                      updateAbility(a.id, {
                        color: e.target.value as AbilityColor,
                      })
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    {ABILITY_COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-600">Timing</span>
                  <select
                    value={a.timing ?? ""}
                    onChange={(e) =>
                      updateAbility(a.id, {
                        timing: (e.target.value || undefined) as AbilityTimingQualifier | undefined,
                      })
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    {TIMING_OPTIONS.map((t) => (
                      <option key={t || "none"} value={t}>
                        {t || "—"}
                      </option>
                    ))}
                  </select>
                </label>
                {a.timing === "Reaction" ? (
                  <>
                    <label className="block">
                      <span className="text-xs text-slate-600">Ability type (custom)</span>
                      <input
                        type="text"
                        value={a.reactionAbilityType ?? ""}
                        onChange={(e) =>
                          updateAbility(a.id, { reactionAbilityType: e.target.value })
                        }
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="e.g. When a unit ends a move within 3&quot;"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-600">Phase (custom)</span>
                      <input
                        type="text"
                        value={a.reactionPhase ?? ""}
                        onChange={(e) =>
                          updateAbility(a.id, { reactionPhase: e.target.value })
                        }
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="e.g. Movement Phase"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block">
                      <span className="text-xs text-slate-600">Ability Type</span>
                      <select
                        value={a.abilityType ?? ""}
                        onChange={(e) =>
                          updateAbility(a.id, {
                            abilityType: (e.target.value || undefined) as AbilityType | undefined,
                          })
                        }
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        {ABILITY_TYPE_OPTIONS.map((t) => (
                          <option key={t || "none"} value={t}>
                            {t || "—"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-600">Phase</span>
                      <select
                        value={a.phase ?? ""}
                        onChange={(e) =>
                          updateAbility(a.id, {
                            phase: (e.target.value || undefined) as AbilityPhase | undefined,
                          })
                        }
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">—</option>
                        {ABILITY_PHASE_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <label className="block sm:col-span-2">
                  <span className="text-xs text-slate-600">Text</span>
                  <textarea
                    value={a.text}
                    onChange={(e) =>
                      updateAbility(a.id, { text: e.target.value })
                    }
                    rows={3}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="Full ability description..."
                  />
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    Use <code className="rounded bg-slate-100 px-0.5">**bold**</code> and <code className="rounded bg-slate-100 px-0.5">*italic*</code>; line breaks are kept on the card.
                  </span>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-slate-600">Ability keywords</span>
                  <input
                    type="text"
                    value={abilityKeywordDrafts[a.id] ?? (a.keywords ?? []).join(", ")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setAbilityKeywordDrafts((prev) => ({ ...prev, [a.id]: raw }));
                      updateAbility(a.id, {
                        keywords: raw
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean),
                      });
                    }}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="Comma-separated (e.g. Arcane, Divine)"
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
