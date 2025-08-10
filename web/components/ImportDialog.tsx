"use client";

import { useRef, useState } from "react";
import { parseCsvToFeatures, parseJsonToFeatures, type CsvParseResult } from "@/lib/csv";
import type { Feature } from "@/lib/rice";

export default function ImportDialog({
  onApply
}: {
  onApply: (features: Feature[], mode: "replace" | "append") => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<CsvParseResult | null>(null);
  const [mode, setMode] = useState<"replace" | "append">("append");

  const handleFile = async (file: File) => {
    const text = await file.text();
    const lower = file.name.toLowerCase();
    const parsed = lower.endsWith(".json") ? parseJsonToFeatures(text) : parseCsvToFeatures(text);
    setResult(parsed);
  };

  const onChooseFile = () => fileInputRef.current?.click();
  const onApplyClick = () => {
    if (!result) return;
    onApply(result.features, mode);
    setResult(null);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button onClick={onChooseFile}>Import CSV/JSON</button>
      <label>
        Mode:
        <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={{ marginLeft: 6 }}>
          <option value="append">Append</option>
          <option value="replace">Replace</option>
        </select>
      </label>
      {result && (
        <div style={{ marginTop: 8, width: "100%" }}>
          <div style={{ fontWeight: 600 }}>Preview ({result.features.length} features)</div>
          {result.errors.length > 0 && (
            <div style={{ color: "tomato", marginTop: 4 }}>
              {result.errors.map((e, i) => (
                <div key={i}>
                  Row {e.row}: {e.message}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <button onClick={onApplyClick} disabled={result.features.length === 0}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


