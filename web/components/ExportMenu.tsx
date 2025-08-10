"use client";

import { featuresToCsv, featuresToJson } from "@/lib/csv";
import type { Feature } from "@/lib/rice";

export default function ExportMenu({ features }: { features: Feature[] }) {
  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => download("features.csv", featuresToCsv(features), "text/csv")}>Export CSV</button>
      <button onClick={() => download("features.json", featuresToJson(features), "application/json")}>
        Export JSON
      </button>
    </div>
  );
}


