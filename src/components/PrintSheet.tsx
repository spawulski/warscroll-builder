"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import type { Warscroll, BattleTrait } from "@/types/warscroll";
import WarscrollCard from "./WarscrollCard";
import BattleTraitCard from "./BattleTraitCard";

interface PrintSheetProps {
  warscrolls: Warscroll[];
  battleTraits?: BattleTrait[];
  onClose: () => void;
}

/**
 * Print view: 2 cards per page (1 row, 2 columns) so each card gets full page height and is not truncated.
 */
type PrintCard = { type: "warscroll"; data: Warscroll } | { type: "battleTrait"; data: BattleTrait };

export default function PrintSheet({ warscrolls, battleTraits = [], onClose }: PrintSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "AoS Cards",
    pageStyle:
      orientation === "landscape"
        ? `
      @page { size: A4 landscape; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
        : `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const cards: PrintCard[] = [
    ...warscrolls.map((w) => ({ type: "warscroll" as const, data: w })),
    ...battleTraits.map((t) => ({ type: "battleTrait" as const, data: t })),
  ];
  const pages: PrintCard[][] = [];
  for (let i = 0; i < cards.length; i += 2) {
    pages.push(cards.slice(i, i + 2));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-700 px-4 py-3 text-white">
        <h2 className="text-lg font-bold">Print Sheet</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-200">Page:</span>
          <div className="flex rounded border border-slate-500 overflow-hidden">
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`px-3 py-1.5 text-sm font-medium ${orientation === "portrait" ? "bg-slate-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"}`}
            >
              Portrait
            </button>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`px-3 py-1.5 text-sm font-medium ${orientation === "landscape" ? "bg-slate-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"}`}
            >
              Landscape
            </button>
          </div>
          <button
            type="button"
            onClick={() => handlePrint()}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-400 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={printRef}
          className={`mx-auto w-full ${orientation === "landscape" ? "max-w-[297mm]" : "max-w-[210mm]"}`}
        >
          {pages.map((pageCards, pageIndex) => (
            <div
              key={pageIndex}
              className={`print-sheet grid grid-cols-2 gap-3 bg-white p-3 ${orientation === "landscape" ? "print-sheet-landscape" : "print-sheet-portrait"}`}
            >
              {[0, 1].map((slot) => {
                const card = pageCards[slot];
                return (
                  <div
                    key={slot}
                    className="print-card-slot flex min-w-0 items-stretch overflow-hidden"
                  >
                    {card ? (
                      <div className="w-full min-w-0">
                        {card.type === "warscroll" ? (
                          <WarscrollCard
                            warscroll={card.data}
                            compact
                            showExpand={false}
                            landscape={orientation === "landscape"}
                          />
                        ) : (
                          <BattleTraitCard
                            trait={card.data}
                            compact
                            landscape={orientation === "landscape"}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full min-w-0 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
