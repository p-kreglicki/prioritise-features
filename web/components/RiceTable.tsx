"use client";

import { useMemo, useState, useCallback, memo } from "react";
import {
  DEFAULT_RICE_SCALES,
  computeRiceScore,
  compareByRice,
  type Feature,
  type ImpactLabel,
  type ConfidenceLabel,
  type EffortSize
} from "@/lib/rice";
import { saveState, loadState, createDebounced } from "@/lib/storage";

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const impactOptions: ImpactLabel[] = ["Massive", "High", "Medium", "Low", "Minimal"];
const confidenceOptions: ConfidenceLabel[] = ["100%", "80%", "50%"];
const effortOptions: EffortSize[] = ["XS", "S", "M", "L", "XL"];

const RiceTable = memo(function RiceTable({
  features: featuresProp,
  onChangeFeatures
}: {
  features?: Feature[];
  onChangeFeatures?: (next: Feature[]) => void;
} = {}) {
  const isControlled = Array.isArray(featuresProp);
  const [internalFeatures, setInternalFeatures] = useState<Feature[]>(() => {
    if (isControlled) return [];
    const loaded = loadState();
    return loaded?.features ?? [];
  });
  const features = isControlled ? (featuresProp as Feature[]) : internalFeatures;

  const sortedFeatures = useMemo(() => {
    return features.slice().sort((a, b) => compareByRice(a, b));
  }, [features]);

  const applyUpdate = useCallback(
    (updater: (prev: Feature[]) => Feature[]) => {
      if (isControlled && onChangeFeatures) {
        const next = updater(features);
        onChangeFeatures(next);
      } else {
        setInternalFeatures(updater);
      }
    },
    [features, isControlled, onChangeFeatures]
  );

  const addFeature = useCallback(() => {
    const nowIso = new Date().toISOString();
    const newFeature: Feature = {
      id: generateId(),
      name: "",
      description: "",
      createdAtIso: nowIso,
      updatedAtIso: nowIso
    };
    applyUpdate((prev) => prev.concat(newFeature));
  }, [applyUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const deleteFeature = useCallback(
    (id: string) => {
      applyUpdate((prev) => prev.filter((f) => f.id !== id));
    },
    [applyUpdate]
  );

  const updateFeature = useCallback(<K extends keyof Feature>(id: string, key: K, value: Feature[K]) => {
    applyUpdate((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              [key]: value,
              updatedAtIso: new Date().toISOString()
            }
          : f
      )
    );
  }, [applyUpdate]);

  const debouncedSave = useMemo(() => {
    if (isControlled) return null;
    return createDebounced((next: Feature[]) => {
      const state = { version: 1, features: next, lastSavedAtIso: new Date().toISOString() };
      saveState(state);
    }, 300);
  }, [isControlled]);

  // Persist on changes (uncontrolled only)
  useMemo(() => {
    if (!isControlled && debouncedSave) debouncedSave(features);
    return undefined;
  }, [features, debouncedSave, isControlled]);

  const renderRow = useCallback((f: Feature) => {
    const score = computeRiceScore(f, DEFAULT_RICE_SCALES);
    const scoreDisplay = score == null ? "" : (Math.round(score * 100) / 100).toFixed(2);
    const invalidReach = f.reach !== undefined && (!Number.isFinite(f.reach) || (f.reach as number) < 0);
    const missingReach = f.reach === undefined;
    const missingImpact = !f.impact;
    const missingConfidence = !f.confidence;
    const missingEffort = !f.effort;

    const reachHelpId = `${f.id}-reach-help`;
    const impactHelpId = `${f.id}-impact-help`;
    const confHelpId = `${f.id}-conf-help`;
    const effortHelpId = `${f.id}-effort-help`;
    return (
      <tr key={f.id} role="row">
        <td style={{ padding: 8 }}>
          <input
            aria-label="Feature name"
            value={f.name}
            onChange={(e) => updateFeature(f.id, "name", e.target.value)}
            style={{ width: "100%" }}
            placeholder="Feature name"
          />
        </td>
        <td style={{ padding: 8, textAlign: "right" }} title="Reach: customers per quarter">
          <input
            aria-label="Reach per quarter"
            type="number"
            min={0}
            step={1}
            value={f.reach ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const num = v === "" ? undefined : Number(v);
              updateFeature(f.id, "reach", (Number.isFinite(num as number) ? (num as number) : undefined) as any);
            }}
            aria-invalid={invalidReach ? true : undefined}
            aria-describedby={invalidReach || missingReach ? reachHelpId : undefined}
            style={{
              width: 120,
              textAlign: "right",
              borderColor: invalidReach ? "tomato" : undefined
            }}
            placeholder="0"
          />
          {(invalidReach || missingReach) && (
            <div id={reachHelpId} style={{ color: "tomato", fontSize: 12, marginTop: 4 }}>
              {invalidReach ? "Reach must be a non-negative number" : "Reach is required"}
            </div>
          )}
        </td>
        <td style={{ padding: 8, textAlign: "right" }} title="Impact scale mapping">
          <select
            aria-label="Impact"
            value={(f.impact as string) ?? ""}
            onChange={(e) => updateFeature(f.id, "impact", e.target.value as ImpactLabel)}
            style={{ width: 140 }}
            aria-invalid={missingImpact ? true : undefined}
            aria-describedby={missingImpact ? impactHelpId : undefined}
          >
            <option value="">Select</option>
            {impactOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {missingImpact && (
            <div id={impactHelpId} style={{ color: "tomato", fontSize: 12, marginTop: 4 }}>
              Impact is required
            </div>
          )}
        </td>
        <td style={{ padding: 8, textAlign: "right" }} title="Confidence mapping">
          <select
            aria-label="Confidence"
            value={(f.confidence as string) ?? ""}
            onChange={(e) => updateFeature(f.id, "confidence", e.target.value as ConfidenceLabel)}
            style={{ width: 120 }}
            aria-invalid={missingConfidence ? true : undefined}
            aria-describedby={missingConfidence ? confHelpId : undefined}
          >
            <option value="">Select</option>
            {confidenceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {missingConfidence && (
            <div id={confHelpId} style={{ color: "tomato", fontSize: 12, marginTop: 4 }}>
              Confidence is required
            </div>
          )}
        </td>
        <td style={{ padding: 8, textAlign: "right" }} title="Effort T-shirt sizes mapping">
          <select
            aria-label="Effort"
            value={(f.effort as string) ?? ""}
            onChange={(e) => updateFeature(f.id, "effort", e.target.value as EffortSize)}
            style={{ width: 100 }}
            aria-invalid={missingEffort ? true : undefined}
            aria-describedby={missingEffort ? effortHelpId : undefined}
          >
            <option value="">Select</option>
            {effortOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {missingEffort && (
            <div id={effortHelpId} style={{ color: "tomato", fontSize: 12, marginTop: 4 }}>
              Effort is required
            </div>
          )}
        </td>
        <td style={{ padding: 8, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{scoreDisplay}</td>
        <td style={{ padding: 8, textAlign: "center" }}>
          <button 
            onClick={() => deleteFeature(f.id)} 
            onKeyDown={(e) => handleKeyDown(e, () => deleteFeature(f.id))}
            aria-label={`Delete feature: ${f.name || "unnamed"}`}
            title={`Delete ${f.name || "feature"}`}
            tabIndex={0}
          >
            Delete
          </button>
        </td>
      </tr>
    );
  }, [updateFeature, deleteFeature, handleKeyDown]);

  return (
    <section aria-label="RICE table" style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button 
          onClick={addFeature}
          onKeyDown={(e) => handleKeyDown(e, addFeature)}
          aria-label="Add new feature to the table"
          tabIndex={0}
        >
          Add feature
        </button>
        <div style={{ color: "#666", fontSize: "14px" }}>Auto-sorted by RICE score</div>
      </div>
      <div style={{ marginBottom: 8, color: "#555", lineHeight: 1.4, fontSize: "14px" }}>
        <div>
          <strong>Formula:</strong> (Reach × Impact × Confidence) ÷ Effort
        </div>
        <div style={{ wordBreak: "break-word" }}>
          <strong>Reach</strong>: customers per quarter. <strong>Impact</strong>: Massive=3, High=2,
          Medium=1, Low=0.5, Minimal=0.25. <strong>Confidence</strong>: 100%=1.0, 80%=0.8, 50%=0.5.
          <strong> Effort</strong>: XS=0.5, S=1, M=2, L=4, XL=8.
        </div>
      </div>
      <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: "4px" }}>
        <table 
          style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}
          role="table"
          aria-label="RICE prioritization features table"
        >
          <thead>
            <tr role="row">
              <th style={{ textAlign: "left", padding: 8, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>Feature</th>
              <th style={{ textAlign: "right", padding: 8, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd" }} title="Reach: customers per quarter">
                Reach / quarter
              </th>
              <th style={{ textAlign: "right", padding: 8, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd" }} title="Impact: Massive=3, High=2, Medium=1, Low=0.5, Minimal=0.25">
                Impact
              </th>
              <th style={{ textAlign: "right", padding: 8, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd" }} title="Confidence: 100%=1.0, 80%=0.8, 50%=0.5">
                Confidence
              </th>
              <th style={{ textAlign: "right", padding: 8, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd" }} title="Effort: XS=0.5, S=1, M=2, L=4, XL=8">
                Effort
              </th>
              <th style={{ textAlign: "right", padding: 8, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>Score</th>
              <th style={{ textAlign: "center", padding: 8, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFeatures.length === 0 ? (
              <tr role="row">
                <td colSpan={7} style={{ padding: 12, color: "#555", textAlign: "center" }}>
                  No features yet. Click "Add feature" to get started.
                </td>
              </tr>
            ) : (
              sortedFeatures.map((f) => renderRow(f))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
});

export default RiceTable;


