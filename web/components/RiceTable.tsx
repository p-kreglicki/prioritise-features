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
        <td className="p-2">
          <input
            aria-label="Feature name"
            value={f.name}
            onChange={(e) => updateFeature(f.id, "name", e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Feature name"
          />
        </td>
        <td className="p-2 text-right" title="Reach: customers per quarter">
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
            className={`w-30 px-2 py-1 border rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              invalidReach ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {(invalidReach || missingReach) && (
            <div id={reachHelpId} className="text-red-500 text-xs mt-1">
              {invalidReach ? "Reach must be a non-negative number" : "Reach is required"}
            </div>
          )}
        </td>
        <td className="p-2 text-right" title="Impact scale mapping">
          <select
            aria-label="Impact"
            value={(f.impact as string) ?? ""}
            onChange={(e) => updateFeature(f.id, "impact", e.target.value as ImpactLabel)}
            className={`w-36 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              missingImpact ? 'border-red-500' : 'border-gray-300'
            }`}
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
            <div id={impactHelpId} className="text-red-500 text-xs mt-1">
              Impact is required
            </div>
          )}
        </td>
        <td className="p-2 text-right" title="Confidence mapping">
          <select
            aria-label="Confidence"
            value={(f.confidence as string) ?? ""}
            onChange={(e) => updateFeature(f.id, "confidence", e.target.value as ConfidenceLabel)}
            className={`w-32 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              missingConfidence ? 'border-red-500' : 'border-gray-300'
            }`}
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
            <div id={confHelpId} className="text-red-500 text-xs mt-1">
              Confidence is required
            </div>
          )}
        </td>
        <td className="p-2 text-right" title="Effort T-shirt sizes mapping">
          <select
            aria-label="Effort"
            value={(f.effort as string) ?? ""}
            onChange={(e) => updateFeature(f.id, "effort", e.target.value as EffortSize)}
            className={`w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              missingEffort ? 'border-red-500' : 'border-gray-300'
            }`}
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
            <div id={effortHelpId} className="text-red-500 text-xs mt-1">
              Effort is required
            </div>
          )}
        </td>
        <td className="p-2 text-right tabular-nums">{scoreDisplay}</td>
        <td className="p-2 text-center">
          <button 
            onClick={() => deleteFeature(f.id)} 
            onKeyDown={(e) => handleKeyDown(e, () => deleteFeature(f.id))}
            aria-label={`Delete feature: ${f.name || "unnamed"}`}
            title={`Delete ${f.name || "feature"}`}
            tabIndex={0}
            className="bg-red-500 hover:bg-red-600 text-white border-none px-3 py-1 rounded cursor-pointer text-sm transition-colors"
          >
            Delete
          </button>
        </td>
      </tr>
    );
  }, [updateFeature, deleteFeature, handleKeyDown]);

  return (
    <section aria-label="RICE table" className="mt-4">
      <div className="mb-2 flex gap-2 flex-wrap items-center">
        <div className="text-gray-600 text-sm">Auto-sorted by RICE score</div>
      </div>
      <div className="mb-2 text-gray-700 leading-relaxed text-sm">
        <div>
          <strong>Formula:</strong> (Reach × Impact × Confidence) ÷ Effort
        </div>
        <div className="break-words">
          <strong>Reach</strong>: customers per quarter. <strong>Impact</strong>: Massive=3, High=2,
          Medium=1, Low=0.5, Minimal=0.25. <strong>Confidence</strong>: 100%=1.0, 80%=0.8, 50%=0.5.
          <strong> Effort</strong>: XS=0.5, S=1, M=2, L=4, XL=8.
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table 
          className="w-full border-collapse min-w-[800px]"
          role="table"
          aria-label="RICE prioritization features table"
        >
          <thead>
            <tr role="row">
              <th className="text-left p-2 bg-gray-100 border-b border-gray-300">Feature</th>
              <th className="text-right p-2 bg-gray-100 border-b border-gray-300" title="Reach: customers per quarter">
                Reach / quarter
              </th>
              <th className="text-right p-2 bg-gray-100 border-b border-gray-300" title="Impact: Massive=3, High=2, Medium=1, Low=0.5, Minimal=0.25">
                Impact
              </th>
              <th className="text-right p-2 bg-gray-100 border-b border-gray-300" title="Confidence: 100%=1.0, 80%=0.8, 50%=0.5">
                Confidence
              </th>
              <th className="text-right p-2 bg-gray-100 border-b border-gray-300" title="Effort: XS=0.5, S=1, M=2, L=4, XL=8">
                Effort
              </th>
              <th className="text-right p-2 bg-gray-100 border-b border-gray-300">Score</th>
              <th className="text-center p-2 bg-gray-100 border-b border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFeatures.length === 0 ? (
              <tr role="row">
                <td colSpan={7} className="p-3 text-gray-600 text-center">
                  No features yet. Click "Add feature" to get started.
                </td>
              </tr>
            ) : (
              sortedFeatures.map((f) => renderRow(f))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-center">
        <button 
          onClick={addFeature}
          onKeyDown={(e) => handleKeyDown(e, addFeature)}
          aria-label="Add new feature to the table"
          tabIndex={0}
          className="bg-green-500 hover:bg-green-600 text-white border-none px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-colors"
        >
          + Add Feature
        </button>
      </div>
    </section>
  );
});

export default RiceTable;


