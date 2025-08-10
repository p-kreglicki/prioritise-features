import RiceTable from "@/components/RiceTable";
import ImportDialog from "@/components/ImportDialog";
import ExportMenu from "@/components/ExportMenu";
import { useState } from "react";
import type { Feature } from "@/lib/rice";
export default function Page() {
  const [features, setFeatures] = useState<Feature[]>([]);
  return (
    <main style={{ padding: "16px", fontFamily: "ui-sans-serif, system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>RICE Prioritization App</h1>
      <p style={{ marginTop: "8px", marginBottom: "16px", color: "#666", fontSize: "14px" }}>
        Prioritize features using the RICE framework: (Reach × Impact × Confidence) ÷ Effort
      </p>
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
        <ImportDialog
          onApply={(imported, mode) => {
            setFeatures((prev) => (mode === "replace" ? imported : prev.concat(imported)));
          }}
        />
        <ExportMenu features={features} />
        <button 
          onClick={() => setFeatures([])}
          style={{ 
            backgroundColor: "#dc3545", 
            color: "white", 
            border: "none", 
            padding: "8px 16px", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Clear data
        </button>
      </div>
      <RiceTable features={features} onChangeFeatures={setFeatures} />
    </main>
  );
}


