"use client";

import RiceTable from "@/components/RiceTable";
import ImportDialog from "@/components/ImportDialog";
import ExportMenu from "@/components/ExportMenu";
import { useState, useEffect } from "react";
import type { Feature } from "@/lib/rice";

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Page() {
  const [features, setFeatures] = useState<Feature[]>([]);

  // Add a default feature row on startup if no features exist
  useEffect(() => {
    if (features.length === 0) {
      const nowIso = new Date().toISOString();
      const defaultFeature: Feature = {
        id: generateId(),
        name: "",
        description: "",
        createdAtIso: nowIso,
        updatedAtIso: nowIso
      };
      setFeatures([defaultFeature]);
    }
  }, [features.length]);
  return (
    <main className="p-4 font-sans max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">RICE Prioritization App</h1>
      <p className="mt-2 mb-4 text-gray-600 text-sm">
        Prioritize features using the RICE framework: (Reach × Impact × Confidence) ÷ Effort
      </p>
      <div className="flex gap-3 items-center mt-2 flex-wrap">
        <ImportDialog
          onApply={(imported, mode) => {
            setFeatures((prev) => (mode === "replace" ? imported : prev.concat(imported)));
          }}
        />
        <ExportMenu features={features} />
        <button 
          onClick={() => setFeatures([])}
          className="bg-red-500 hover:bg-red-600 text-white border-none px-4 py-2 rounded cursor-pointer transition-colors"
        >
          Clear data
        </button>
      </div>
      <RiceTable features={features} onChangeFeatures={setFeatures} />
    </main>
  );
}


