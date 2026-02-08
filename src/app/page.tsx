"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ImagePlus, Printer, Trash2, Edit2 } from "lucide-react";
import type { Warscroll } from "@/types/warscroll";
import { createEmptyWarscroll } from "@/types/warscroll";
import { getAllWarscrolls, saveWarscroll, deleteWarscroll } from "@/lib/storage";
import WarscrollCard from "@/components/WarscrollCard";
import WarscrollForm from "@/components/WarscrollForm";
import ScanAndReview from "@/components/ScanAndReview";
import PrintSheet from "@/components/PrintSheet";

type View = "list" | "editor" | "scan" | "print";

export default function Home() {
  const [warscrolls, setWarscrolls] = useState<Warscroll[]>([]);
  const [current, setCurrent] = useState<Warscroll | null>(null);
  const [view, setView] = useState<View>("list");
  const [showPrint, setShowPrint] = useState(false);

  const loadStored = useCallback(() => {
    setWarscrolls(getAllWarscrolls());
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

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
              onClick={() => setView("list")}
              className="rounded px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
            >
              My Warscrolls
            </button>
            <button
              type="button"
              onClick={() => setShowPrint(true)}
              disabled={warscrolls.length === 0}
              className="flex items-center gap-2 rounded bg-slate-600 px-3 py-1.5 text-sm font-medium hover:bg-slate-500 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === "list" && (
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

        {view === "editor" && current && (
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

        {view === "scan" && (
          <ScanAndReview
            onAccept={handleScanAccept}
            onCancel={() => setView("list")}
          />
        )}
      </main>

      {showPrint && (
        <PrintSheet
          warscrolls={warscrolls}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
