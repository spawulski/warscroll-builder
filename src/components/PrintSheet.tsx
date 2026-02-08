"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import type { Warscroll } from "@/types/warscroll";
import WarscrollCard from "./WarscrollCard";

interface PrintSheetProps {
  warscrolls: Warscroll[];
  onClose: () => void;
}

/**
 * Print view: 4 Warscrolls per page (2x2 grid), A4/Letter friendly.
 * Compact mode for print.
 */
export default function PrintSheet({ warscrolls, onClose }: PrintSheetProps) {
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

  // Chunk into pages of 4 (2x2)
  const pages: Warscroll[][] = [];
  for (let i = 0; i < warscrolls.length; i += 4) {
    pages.push(warscrolls.slice(i, i + 4));
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
        <div ref={printRef} className="mx-auto max-w-[210mm]">
          {pages.map((pageWarscrolls, pageIndex) => (
            <div
              key={pageIndex}
              className="print-sheet grid grid-cols-2 gap-4 bg-white p-4 min-h-[277mm]"
              style={{ breakInside: "avoid" }}
            >
              {[0, 1, 2, 3].map((slot) => {
                const w = pageWarscrolls[slot];
                return (
                  <div
                    key={slot}
                    className="flex items-stretch justify-center"
                  >
                    {w ? (
                      <div className="w-full max-w-[95mm]">
                        <WarscrollCard
                          warscroll={w}
                          compact
                          showExpand={false}
                        />
                      </div>
                    ) : (
                      <div className="w-full max-w-[95mm] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50" />
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
