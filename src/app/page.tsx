"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ImagePlus, Printer, Trash2, Edit2 } from "lucide-react";
import type { Warscroll, BattleTrait, ArmyCollection } from "@/types/warscroll";
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
import ScanAndReview from "@/components/ScanAndReview";
import PrintSheet from "@/components/PrintSheet";

type View = "list" | "editor" | "scan" | "print";
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

  const handleScanAccept = useCallback(
    (w: Warscroll) => {
      setCurrent(w);
      setView("editor");
    },
    []
  );

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-300 bg-slate-800 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">
            Warscroll Architect
          </h1>
          <nav className="flex items-center gap-2">
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
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleNew}
                className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-600"
              >
                <Plus className="h-4 w-4" /> New Warscroll
              </button>
              <button
                type="button"
                onClick={() => setView("scan")}
                className="flex items-center gap-2 rounded-lg border-2 border-slate-400 bg-transparent px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                <ImagePlus className="h-4 w-4" /> Upload Image (OCR)
              </button>
            </div>
            {warscrolls.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-600">
                <p className="font-medium">No warscrolls yet.</p>
                <p className="mt-1 text-sm">
                  Create one from scratch or upload an image to scan.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {warscrolls.map((w) => (
                  <li
                    key={w.id}
                    className="group relative rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="p-2">
                      <WarscrollCard warscroll={w} showExpand maxAbilityLength={80} />
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
            {battleTraits.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-600">
                <p className="font-medium">No battle traits yet.</p>
                <p className="mt-1 text-sm">
                  Create a battle trait card with a collection of abilities.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {battleTraits.map((t) => (
                  <li
                    key={t.id}
                    className="group relative rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="p-2">
                      <BattleTraitCard trait={t} />
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
                <div className="max-w-sm">
                  <WarscrollCard warscroll={current} />
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
                <div className="max-w-sm">
                  <BattleTraitCard trait={currentTrait} />
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

        {view === "scan" && (
          <ScanAndReview
            onAccept={handleScanAccept}
            onCancel={() => setView("list")}
          />
        )}
      </main>

      {showPrint && (
        <PrintSheet
          warscrolls={printWarscrolls}
          battleTraits={printBattleTraits}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
