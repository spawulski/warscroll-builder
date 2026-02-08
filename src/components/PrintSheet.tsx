"use client";

import { useRef } from "react";
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
 * Print view: 4 Warscrolls per page (2x2 grid), A4/Letter friendly.
 * Compact mode for print.
 */
type PrintCard = { type: "warscroll"; data: Warscroll } | { type: "battleTrait"; data: BattleTrait };

export default function PrintSheet({ warscrolls, battleTraits = [], onClose }: PrintSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "AoS Warscrolls",
    pageStyle: `
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
  for (let i = 0; i < cards.length; i += 4) {
    pages.push(cards.slice(i, i + 4));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-slate-200">
      <div className="flex items-center justify-between border-b border-slate-300 bg-slate-700 px-4 py-3 text-white">
        <h2 className="text-lg font-bold">Print Sheet</h2>
        <div className="flex gap-2">
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
        <div ref={printRef} className="mx-auto w-full max-w-[210mm]">
          {pages.map((pageCards, pageIndex) => (
            <div
              key={pageIndex}
              className="print-sheet grid grid-cols-2 gap-3 bg-white p-3 min-h-[277mm]"
              style={{ breakInside: "avoid" }}
            >
              {[0, 1, 2, 3].map((slot) => {
                const card = pageCards[slot];
                return (
                  <div
                    key={slot}
                    className="flex min-w-0 items-stretch"
                  >
                    {card ? (
                      <div className="w-full min-w-0">
                        {card.type === "warscroll" ? (
                          <WarscrollCard
                            warscroll={card.data}
                            compact
                            showExpand={false}
                          />
                        ) : (
                          <BattleTraitCard trait={card.data} compact />
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
