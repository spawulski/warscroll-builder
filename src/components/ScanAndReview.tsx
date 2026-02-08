"use client";

import { useCallback, useState } from "react";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import type { Warscroll } from "@/types/warscroll";
import { parseOcrTextToWarscroll } from "@/lib/ocr";
import WarscrollForm from "./WarscrollForm";

// Dynamic import for Tesseract to avoid SSR issues
async function runTesseract(imageFile: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        // Could pass progress to UI
      }
    },
  });
  const {
    data: { text },
  } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
}

interface ScanAndReviewProps {
  onAccept: (warscroll: Warscroll) => void;
  onCancel: () => void;
}

type Step = "upload" | "review" | "editing";

export default function ScanAndReview({ onAccept, onCancel }: ScanAndReviewProps) {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState("");
  const [parsed, setParsed] = useState<Warscroll | null>(null);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        setError("Please choose an image file (e.g. PNG, JPEG).");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const text = await runTesseract(file);
        setRawOcrText(text);
        const warscroll = parseOcrTextToWarscroll(text);
        setParsed(warscroll);
        setStep("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "OCR failed.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const confirmReview = useCallback(() => {
    setStep("editing");
  }, []);

  const acceptAndUse = useCallback(() => {
    if (parsed) onAccept(parsed);
  }, [parsed, onAccept]);

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-lg">
      {step === "upload" && (
        <>
          <h3 className="mb-2 text-lg font-bold text-slate-800">
            Upload Warscroll Image
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            We’ll use OCR to detect unit name, stats, and abilities. You’ll review
            and edit the result before saving.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 px-6 transition hover:border-slate-400 hover:bg-slate-100">
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={loading}
              className="hidden"
            />
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
            ) : (
              <Upload className="h-10 w-10 text-slate-500" />
            )}
            <span className="mt-2 text-sm font-medium text-slate-700">
              {loading ? "Scanning…" : "Choose an image"}
            </span>
          </label>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </>
      )}

      {step === "review" && parsed && (
        <>
          <h3 className="mb-2 text-lg font-bold text-slate-800">
            Review parsed data
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            OCR isn’t perfect. Check the extracted text and parsed fields below.
            You can edit everything in the next step.
          </p>
          <div className="mb-4 max-h-40 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">
            {rawOcrText || "No text extracted."}
          </div>
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Parsed:</strong> Unit “{parsed.unitName || "—"}”, Move {parsed.move || "—"}, Save {parsed.save || "—"}, {parsed.weapons.length} weapon(s), {parsed.abilities.length} ability(ies).
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmReview}
              className="flex items-center gap-2 rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <CheckCircle className="h-4 w-4" /> Continue to edit
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {step === "editing" && parsed && (
        <>
          <h3 className="mb-2 text-lg font-bold text-slate-800">
            Edit parsed Warscroll
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Tweak any field, then save to use this Warscroll.
          </p>
          <WarscrollForm warscroll={parsed} onChange={setParsed} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={acceptAndUse}
              className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Use this Warscroll
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
