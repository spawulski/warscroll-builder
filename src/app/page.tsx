"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Printer, Trash2, Edit2, Download, Loader2, FileText } from "lucide-react";
import type { Warscroll, BattleTrait, ArmyCollection, BattleTraitType, UnitType } from "@/types/warscroll";
import { UNIT_TYPE_ORDER, TRAIT_TYPE_ORDER } from "@/types/warscroll";
import {
  createEmptyWarscroll,
  createEmptyBattleTrait,
  createEmptyArmyCollection,
} from "@/types/warscroll";
import {
  getAllWarscrolls,
  saveWarscroll,
  deleteWarscroll,
  getAllBattleTraits,
  saveBattleTrait,
  deleteBattleTrait,
  getAllArmyCollections,
  saveArmyCollection,
  deleteArmyCollection,
} from "@/lib/storage";
import WarscrollCard from "@/components/WarscrollCard";
import WarscrollForm from "@/components/WarscrollForm";
import BattleTraitCard from "@/components/BattleTraitCard";
import BattleTraitForm from "@/components/BattleTraitForm";
import ArmyCollectionForm from "@/components/ArmyCollectionForm";
import PrintSheet from "@/components/PrintSheet";
import CheatSheet from "@/components/CheatSheet";
import {
  listCatalogues,
  fetchCatalogueXml,
  getBattleTraitCataloguePath,
  LORES_CATALOGUE_PATH,
  type CatalogueItem,
} from "@/lib/github-catalogues";
import { parseCatXml, parseBattleTraitCatXml } from "@/lib/battlescribe";

type View = "list" | "editor" | "print";
type Section = "warscrolls" | "traits" | "collections";

export default function Home() {
  const [warscrolls, setWarscrolls] = useState<Warscroll[]>([]);
  const [battleTraits, setBattleTraits] = useState<BattleTrait[]>([]);
  const [current, setCurrent] = useState<Warscroll | null>(null);
  const [currentTrait, setCurrentTrait] = useState<BattleTrait | null>(null);
  const [armyCollections, setArmyCollections] = useState<ArmyCollection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<ArmyCollection | null>(null);
  const [view, setView] = useState<View>("list");
  const [section, setSection] = useState<Section>("warscrolls");
  const [showPrint, setShowPrint] = useState(false);
  const [printWarscrolls, setPrintWarscrolls] = useState<Warscroll[]>([]);
  const [printBattleTraits, setPrintBattleTraits] = useState<BattleTrait[]>([]);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [cheatSheetCollection, setCheatSheetCollection] = useState<ArmyCollection | null>(null);
  const [cardLayout, setCardLayout] = useState<"portrait" | "landscape">("portrait");
  const [catalogues, setCatalogues] = useState<CatalogueItem[]>([]);
  const [selectedCataloguePath, setSelectedCataloguePath] = useState<string>("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importTraitCount, setImportTraitCount] = useState<number | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [selectedWarscrollFactions, setSelectedWarscrollFactions] = useState<Set<string>>(new Set());
  const [selectedWarscrollUnitTypes, setSelectedWarscrollUnitTypes] = useState<Set<UnitType>>(new Set());
  const [selectedTraitFactions, setSelectedTraitFactions] = useState<Set<string>>(new Set());

  const loadStored = useCallback(() => {
    setWarscrolls(getAllWarscrolls());
  }, []);

  const loadTraits = useCallback(() => {
    setBattleTraits(getAllBattleTraits());
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  useEffect(() => {
    loadTraits();
  }, [loadTraits]);

  const loadCollections = useCallback(() => {
    setArmyCollections(getAllArmyCollections());
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const loadCatalogues = useCallback(async () => {
    const list = await listCatalogues();
    setCatalogues(list);
    setSelectedCataloguePath((prev) => (prev ? prev : list[0]?.path ?? ""));
  }, []);

  useEffect(() => {
    if (section === "warscrolls" && catalogues.length === 0) loadCatalogues();
  }, [section, catalogues.length, loadCatalogues]);

  const handleImport = useCallback(async () => {
    const pathOrUrl = importUrl.trim() || selectedCataloguePath;
    if (!pathOrUrl) return;
    setImportLoading(true);
    setImportError(null);
    setImportSuccessCount(null);
    setImportTraitCount(null);
    try {
      const xml = await fetchCatalogueXml(pathOrUrl);
      const { warscrolls: parsed, faction } = parseCatXml(xml);
      for (const w of parsed) {
        saveWarscroll({ ...w, faction: faction || w.faction });
      }
      let traitCount = 0;
      const isLibraryPath =
        !pathOrUrl.startsWith("http") && / - Library\.cat$/i.test(pathOrUrl);
      if (isLibraryPath) {
        try {
          const traitPath = getBattleTraitCataloguePath(pathOrUrl);
          const [traitXml, loresXml] = await Promise.all([
            fetchCatalogueXml(traitPath),
            fetchCatalogueXml(LORES_CATALOGUE_PATH).catch(() => ""),
          ]);
          const { battleTraits: traits } = parseBattleTraitCatXml(traitXml, loresXml || undefined);
          for (const t of traits) {
            saveBattleTrait(t);
            traitCount += 1;
          }
        } catch {
          // Battle trait file may not exist for this army; ignore
        }
      }
      loadStored();
      loadTraits();
      setImportSuccessCount(parsed.length);
      setImportTraitCount(traitCount);
      setImportUrl("");
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImportLoading(false);
    }
  }, [selectedCataloguePath, importUrl, loadStored, loadTraits]);

  const handleSave = useCallback(
    (w: Warscroll) => {
      saveWarscroll(w);
      loadStored();
      setCurrent(w);
    },
    [loadStored]
  );

  const handleNew = useCallback(() => {
    setCurrent(createEmptyWarscroll());
    setView("editor");
  }, []);

  const handleEdit = useCallback((w: Warscroll) => {
    setCurrent(w);
    setView("editor");
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this warscroll?")) {
        deleteWarscroll(id);
        loadStored();
        if (current?.id === id) {
          setCurrent(null);
          setView("list");
        }
      }
    },
    [current, loadStored]
  );

  const handleNewTrait = useCallback(() => {
    setCurrentTrait(createEmptyBattleTrait());
    setView("editor");
    setSection("traits");
  }, []);

  const handleEditTrait = useCallback((t: BattleTrait) => {
    setCurrentTrait(t);
    setView("editor");
    setSection("traits");
  }, []);

  const handleSaveTrait = useCallback(
    (t: BattleTrait) => {
      saveBattleTrait(t);
      loadTraits();
      setCurrentTrait(t);
    },
    [loadTraits]
  );

  const handleDeleteTrait = useCallback(
    (id: string) => {
      if (confirm("Delete this battle trait?")) {
        deleteBattleTrait(id);
        loadTraits();
        if (currentTrait?.id === id) {
          setCurrentTrait(null);
          setView("list");
        }
      }
    },
    [currentTrait, loadTraits]
  );

  const hasAnythingToPrint = warscrolls.length > 0 || battleTraits.length > 0;

  const handleNewCollection = useCallback(() => {
    setCurrentCollection(createEmptyArmyCollection());
    setView("editor");
    setSection("collections");
  }, []);

  const handleEditCollection = useCallback((c: ArmyCollection) => {
    setCurrentCollection(c);
    setView("editor");
    setSection("collections");
  }, []);

  const handleSaveCollection = useCallback(
    (c: ArmyCollection) => {
      saveArmyCollection(c);
      loadCollections();
      setCurrentCollection(c);
    },
    [loadCollections]
  );

  const handleDeleteCollection = useCallback(
    (id: string) => {
      if (confirm("Delete this army collection?")) {
        deleteArmyCollection(id);
        loadCollections();
        if (currentCollection?.id === id) {
          setCurrentCollection(null);
          setView("list");
        }
      }
    },
    [currentCollection, loadCollections]
  );

  const openPrintAll = useCallback(() => {
    setPrintWarscrolls(warscrolls);
    setPrintBattleTraits(battleTraits);
    setShowPrint(true);
  }, [warscrolls, battleTraits]);

  const uniqueWarscrollFactions = [...new Set(warscrolls.map((w) => w.faction).filter((f): f is string => Boolean(f)))].sort();
  const uniqueWarscrollUnitTypes = [...new Set(warscrolls.map((w) => w.unitType).filter((t): t is UnitType => t != null && UNIT_TYPE_ORDER.includes(t)))].sort(
    (a, b) => UNIT_TYPE_ORDER.indexOf(a) - UNIT_TYPE_ORDER.indexOf(b)
  );
  const uniqueTraitFactions = [...new Set(battleTraits.map((t) => t.faction).filter((f): f is string => Boolean(f)))].sort();

  const filteredWarscrolls = warscrolls.filter(
    (w) =>
      (selectedWarscrollFactions.size === 0 || selectedWarscrollFactions.has(w.faction)) &&
      (selectedWarscrollUnitTypes.size === 0 || (w.unitType && selectedWarscrollUnitTypes.has(w.unitType)))
  );
  const filteredBattleTraits = battleTraits.filter(
    (t) => selectedTraitFactions.size === 0 || (t.faction != null && selectedTraitFactions.has(t.faction))
  );

  const toggleWarscrollFaction = useCallback((faction: string) => {
    setSelectedWarscrollFactions((prev) => {
      const next = new Set(prev);
      if (next.has(faction)) next.delete(faction);
      else next.add(faction);
      return next;
    });
  }, []);
  const toggleWarscrollUnitType = useCallback((unitType: UnitType) => {
    setSelectedWarscrollUnitTypes((prev) => {
      const next = new Set(prev);
      if (next.has(unitType)) next.delete(unitType);
      else next.add(unitType);
      return next;
    });
  }, []);
  const toggleTraitFaction = useCallback((faction: string) => {
    setSelectedTraitFactions((prev) => {
      const next = new Set(prev);
      if (next.has(faction)) next.delete(faction);
      else next.add(faction);
      return next;
    });
  }, []);

  const openPrintCollection = useCallback(
    (c: ArmyCollection) => {
      const ws = c.warscrollIds
        .map((id) => warscrolls.find((w) => w.id === id))
        .filter(Boolean) as Warscroll[];
      const bt = c.battleTraitIds
        .map((id) => battleTraits.find((t) => t.id === id))
        .filter(Boolean) as BattleTrait[];
      setPrintWarscrolls(ws);
      setPrintBattleTraits(bt);
      setShowPrint(true);
    },
    [warscrolls, battleTraits]
  );

  const openCheatSheet = useCallback((c: ArmyCollection) => {
    setCheatSheetCollection(c);
    setShowCheatSheet(true);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-300 bg-slate-800 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">
            Warscroll Architect
          </h1>
          <nav className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSection("warscrolls");
                setView("list");
              }}
              className={`rounded px-3 py-1.5 text-sm font-medium ${section === "warscrolls" ? "bg-slate-600" : "hover:bg-slate-700"}`}
            >
              Unit Warscrolls
            </button>
            <button
              type="button"
              onClick={() => {
                setSection("traits");
                setView("list");
              }}
              className={`rounded px-3 py-1.5 text-sm font-medium ${section === "traits" ? "bg-slate-600" : "hover:bg-slate-700"}`}
            >
              Battle Traits
            </button>
            <button
              type="button"
              onClick={() => {
                setSection("collections");
                setView("list");
              }}
              className={`rounded px-3 py-1.5 text-sm font-medium ${section === "collections" ? "bg-slate-600" : "hover:bg-slate-700"}`}
            >
              Army Collections
            </button>
            <div className="ml-2 flex rounded border border-slate-500 overflow-hidden">
              <button
                type="button"
                onClick={() => setCardLayout("portrait")}
                className={`px-2.5 py-1 text-xs font-medium ${cardLayout === "portrait" ? "bg-slate-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"}`}
                title="Card layout"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setCardLayout("landscape")}
                className={`px-2.5 py-1 text-xs font-medium ${cardLayout === "landscape" ? "bg-slate-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"}`}
                title="Card layout"
              >
                Landscape
              </button>
            </div>
            <button
              type="button"
              onClick={openPrintAll}
              disabled={!hasAnythingToPrint}
              className="flex items-center gap-2 rounded bg-slate-600 px-3 py-1.5 text-sm font-medium hover:bg-slate-500 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === "list" && section === "warscrolls" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <button
                type="button"
                onClick={handleNew}
                className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-600"
              >
                <Plus className="h-4 w-4" /> New Warscroll
              </button>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-700">Import from BSData</span>
                <button
                  type="button"
                  onClick={() => loadCatalogues()}
                  disabled={importLoading}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  title="Refresh list from GitHub"
                >
                  Refresh
                </button>
                <select
                  value={selectedCataloguePath}
                  onChange={(e) => setSelectedCataloguePath(e.target.value)}
                  className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
                  disabled={importLoading}
                >
                  {catalogues.length === 0 && (
                    <option value="">Loading…</option>
                  )}
                  {catalogues.map((c) => (
                    <option key={c.path} value={c.path}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importLoading || (!importUrl.trim() && !selectedCataloguePath)}
                  className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
                >
                  {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {importLoading ? "Importing…" : "Import"}
                </button>
                {importError && (
                  <span className="text-sm text-red-600">{importError}</span>
                )}
                {importSuccessCount !== null && (importSuccessCount > 0 || (importTraitCount != null && importTraitCount > 0)) && (
                  <span className="text-sm text-green-700">
                    Imported
                    {importSuccessCount > 0 && (
                      <> {importSuccessCount} unit{importSuccessCount !== 1 ? "s" : ""}</>
                    )}
                    {importSuccessCount > 0 && importTraitCount != null && importTraitCount > 0 && ", "}
                    {importTraitCount != null && importTraitCount > 0 && (
                      <> {importTraitCount} battle trait{importTraitCount !== 1 ? "s" : ""}</>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Or paste a raw .cat URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/BSData/age-of-sigmar-4th/main/..."
                  className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400"
                  disabled={importLoading}
                />
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importLoading || !importUrl.trim()}
                  className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-500 disabled:opacity-50"
                >
                  Fetch &amp; Import
                </button>
              </div>
            </div>
            {warscrolls.length > 0 && (uniqueWarscrollFactions.length > 0 || uniqueWarscrollUnitTypes.length > 0) && (
              <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {uniqueWarscrollFactions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase text-slate-500">Faction</span>
                    {uniqueWarscrollFactions.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleWarscrollFaction(f)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                          selectedWarscrollFactions.has(f)
                            ? "bg-slate-700 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
                {uniqueWarscrollUnitTypes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase text-slate-500">Unit type</span>
                    {uniqueWarscrollUnitTypes.map((ut) => (
                      <button
                        key={ut}
                        type="button"
                        onClick={() => toggleWarscrollUnitType(ut)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                          selectedWarscrollUnitTypes.has(ut)
                            ? "bg-slate-700 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {ut.charAt(0).toUpperCase() + ut.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {warscrolls.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-600">
                <p className="font-medium">No warscrolls yet.</p>
                <p className="mt-1 text-sm">
                  Create one from scratch.
                </p>
              </div>
            ) : filteredWarscrolls.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-600">
                <p className="font-medium">No units match the selected filters.</p>
                <p className="mt-1 text-sm">Clear faction and unit type filters to see all units.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {UNIT_TYPE_ORDER.map((unitType) => {
                  const inType = filteredWarscrolls.filter((w) => w.unitType === unitType);
                  if (inType.length === 0) return null;
                  return (
                    <section key={unitType}>
                      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
                        {unitType.charAt(0).toUpperCase() + unitType.slice(1)}
                      </h2>
                      <ul
                        className={`grid gap-4 ${cardLayout === "landscape" ? "sm:grid-cols-1 lg:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
                      >
                        {inType.map((w) => (
                          <li
                            key={w.id}
                            className="group relative rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <div className="p-2">
                              <WarscrollCard
                                warscroll={w}
                                showExpand
                                maxAbilityLength={80}
                                landscape={cardLayout === "landscape"}
                              />
                            </div>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleEdit(w)}
                                className="rounded bg-slate-600 p-1.5 text-white hover:bg-slate-500"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(w.id)}
                                className="rounded bg-red-600 p-1.5 text-white hover:bg-red-500"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
                {(() => {
                  const others = filteredWarscrolls.filter(
                    (w) => !w.unitType || !UNIT_TYPE_ORDER.includes(w.unitType as UnitType)
                  );
                  if (others.length === 0) return null;
                  return (
                    <section key="other">
                      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
                        Other
                      </h2>
                      <ul
                        className={`grid gap-4 ${cardLayout === "landscape" ? "sm:grid-cols-1 lg:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
                      >
                        {others.map((w) => (
                          <li
                            key={w.id}
                            className="group relative rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <div className="p-2">
                              <WarscrollCard
                                warscroll={w}
                                showExpand
                                maxAbilityLength={80}
                                landscape={cardLayout === "landscape"}
                              />
                            </div>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleEdit(w)}
                                className="rounded bg-slate-600 p-1.5 text-white hover:bg-slate-500"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(w.id)}
                                className="rounded bg-red-600 p-1.5 text-white hover:bg-red-500"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {view === "list" && section === "collections" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleNewCollection}
                className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-600"
              >
                <Plus className="h-4 w-4" /> New Army Collection
              </button>
            </div>
            {armyCollections.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-600">
                <p className="font-medium">No army collections yet.</p>
                <p className="mt-1 text-sm">
                  Save a set of warscrolls and battle traits together for quick access and printing.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {armyCollections.map((c) => (
                  <li
                    key={c.id}
                    className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <h3 className="font-semibold text-slate-800">{c.name || "Untitled collection"}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {c.warscrollIds.length} unit{c.warscrollIds.length !== 1 ? "s" : ""}
                      {" · "}
                      {c.battleTraitIds.length} battle trait{c.battleTraitIds.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCollection(c)}
                        className="flex items-center gap-1 rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-500"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openPrintCollection(c)}
                        disabled={c.warscrollIds.length === 0 && c.battleTraitIds.length === 0}
                        className="flex items-center gap-1 rounded border border-slate-400 px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                      <button
                        type="button"
                        onClick={() => openCheatSheet(c)}
                        disabled={c.warscrollIds.length === 0 && c.battleTraitIds.length === 0}
                        className="flex items-center gap-1 rounded border border-slate-400 px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                      >
                        <FileText className="h-3.5 w-3.5" /> Cheat Sheet
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(c.id)}
                        className="flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {view === "list" && section === "traits" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleNewTrait}
                className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-600"
              >
                <Plus className="h-4 w-4" /> New Battle Trait
              </button>
            </div>
            {battleTraits.length > 0 && uniqueTraitFactions.length > 0 && (
              <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase text-slate-500">Faction</span>
                  {uniqueTraitFactions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleTraitFaction(f)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        selectedTraitFactions.has(f)
                          ? "bg-slate-700 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {battleTraits.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-600">
                <p className="font-medium">No battle traits yet.</p>
                <p className="mt-1 text-sm">
                  Create a battle trait card with a collection of abilities.
                </p>
              </div>
            ) : filteredBattleTraits.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-600">
                <p className="font-medium">No battle traits match the selected filters.</p>
                <p className="mt-1 text-sm">Clear faction filters to see all traits.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {TRAIT_TYPE_ORDER.map((traitType) => {
                  const traits = filteredBattleTraits.filter(
                    (t) => (t.traitType ?? "Battle traits") === traitType
                  );
                  if (traits.length === 0) return null;
                  return (
                    <section key={traitType}>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
                        {traitType}
                      </h3>
                      <ul className={`grid gap-4 ${cardLayout === "landscape" ? "sm:grid-cols-1 lg:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                        {traits.map((t) => (
                          <li
                            key={t.id}
                            className="group relative rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <div className="p-2">
                              <BattleTraitCard trait={t} landscape={cardLayout === "landscape"} />
                            </div>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleEditTrait(t)}
                                className="rounded bg-slate-600 p-1.5 text-white hover:bg-slate-500"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTrait(t.id)}
                                className="rounded bg-red-600 p-1.5 text-white hover:bg-red-500"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === "editor" && section === "warscrolls" && current && (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="sticky top-20">
                <h2 className="mb-3 text-lg font-bold text-slate-800">
                  Preview
                </h2>
                <div className={cardLayout === "landscape" ? "max-w-2xl w-full" : "max-w-sm"}>
                  <WarscrollCard
                    warscroll={current}
                    landscape={cardLayout === "landscape"}
                  />
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="mb-3 text-lg font-bold text-slate-800">Edit</h2>
              <WarscrollForm warscroll={current} onChange={setCurrent} />
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(current)}
                  className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                >
                  Save Warscroll
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Back to list
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "editor" && section === "collections" && currentCollection && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800">Edit Army Collection</h2>
            <ArmyCollectionForm
              collection={currentCollection}
              warscrolls={warscrolls}
              battleTraits={battleTraits}
              onChange={setCurrentCollection}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSaveCollection(currentCollection)}
                className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
              >
                Save Collection
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Back to list
              </button>
            </div>
          </div>
        )}

        {view === "editor" && section === "traits" && currentTrait && (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="sticky top-20">
                <h2 className="mb-3 text-lg font-bold text-slate-800">
                  Preview
                </h2>
                <div className={cardLayout === "landscape" ? "max-w-2xl w-full" : "max-w-sm"}>
                  <BattleTraitCard
                    trait={currentTrait}
                    landscape={cardLayout === "landscape"}
                  />
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="mb-3 text-lg font-bold text-slate-800">Edit</h2>
              <BattleTraitForm trait={currentTrait} onChange={setCurrentTrait} />
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveTrait(currentTrait)}
                  className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                >
                  Save Battle Trait
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Back to list
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {showPrint && (
        <PrintSheet
          warscrolls={printWarscrolls}
          battleTraits={printBattleTraits}
          onClose={() => setShowPrint(false)}
        />
      )}

      {showCheatSheet && cheatSheetCollection && (
        <CheatSheet
          collection={cheatSheetCollection}
          warscrolls={warscrolls}
          battleTraits={battleTraits}
          onClose={() => {
            setShowCheatSheet(false);
            setCheatSheetCollection(null);
          }}
        />
      )}
    </div>
  );
}
