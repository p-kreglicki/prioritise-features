// Type definitions for the RICE domain model

// Impact scale labels used by the app (mapped to numeric values elsewhere)
export type ImpactLabel = "Massive" | "High" | "Medium" | "Low" | "Minimal";

// Confidence scale labels used by the app (mapped to numeric values elsewhere)
export type ConfidenceLabel = "100%" | "80%" | "50%";

// Effort T-shirt sizes (mapped to numeric values elsewhere)
export type EffortSize = "XS" | "S" | "M" | "L" | "XL";

// Helper union for fields that can be a human label or a numeric value
export type NumericOrLabel<TLabel extends string> = number | TLabel;

// RICE scale mappings and metadata
export interface RiceScales {
  // Human-readable unit for Reach values (e.g., "customers per quarter")
  reachUnitLabel: string;
  impact: Record<ImpactLabel, number>;
  confidence: Record<ConfidenceLabel, number>;
  effort: Record<EffortSize, number>;
}

// Single feature item to be scored and prioritized
export interface Feature {
  id: string;
  name: string;
  description?: string;

  // Inputs for the RICE formula. They may be incomplete in UI flows and validated later.
  reach?: number; // Count within the chosen timebox
  impact?: NumericOrLabel<ImpactLabel>;
  confidence?: NumericOrLabel<ConfidenceLabel>;
  effort?: NumericOrLabel<EffortSize>;

  // Derived value; compute on the fly and optionally store for convenience
  score?: number;

  // Timestamps stored as ISO strings for simple localStorage persistence
  createdAtIso: string;
  updatedAtIso: string;
}

// Persisted application state for local storage
export interface PersistedState {
  version: number; // Increment when schema changes
  features: Feature[];
  lastSavedAtIso: string;
}

// Default scales per PRD
export const DEFAULT_RICE_SCALES: RiceScales = {
  reachUnitLabel: "customers per quarter",
  impact: {
    Massive: 3,
    High: 2,
    Medium: 1,
    Low: 0.5,
    Minimal: 0.25
  },
  confidence: {
    "100%": 1.0,
    "80%": 0.8,
    "50%": 0.5
  },
  effort: {
    XS: 0.5,
    S: 1,
    M: 2,
    L: 4,
    XL: 8
  }
};

// Internal helpers to normalize label-or-number inputs to numeric values
function toNumericImpact(value: NumericOrLabel<ImpactLabel> | undefined, scales: RiceScales): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  return scales.impact[value] ?? null;
}

function toNumericConfidence(
  value: NumericOrLabel<ConfidenceLabel> | undefined,
  scales: RiceScales
): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  return scales.confidence[value] ?? null;
}

function toNumericEffort(value: NumericOrLabel<EffortSize> | undefined, scales: RiceScales): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  return scales.effort[value] ?? null;
}

// Compute the RICE score. Returns null if inputs are incomplete or invalid.
export function computeRiceScore(feature: Feature, scales: RiceScales = DEFAULT_RICE_SCALES): number | null {
  const { reach } = feature;
  const impact = toNumericImpact(feature.impact, scales);
  const confidence = toNumericConfidence(feature.confidence, scales);
  const effort = toNumericEffort(feature.effort, scales);

  if (
    reach == null ||
    impact == null ||
    confidence == null ||
    effort == null
  ) {
    return null;
  }

  if (reach < 0) return null; // Bound per PRD
  if (effort <= 0) return null; // Prevent division by zero

  const score = (reach * impact * confidence) / effort;
  return Number.isFinite(score) ? score : null;
}

// Validation helpers for UI and import flows
export function isValidReach(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isAllowedImpact(value: unknown): value is NumericOrLabel<ImpactLabel> {
  return (
    typeof value === "number" ||
    value === "Massive" ||
    value === "High" ||
    value === "Medium" ||
    value === "Low" ||
    value === "Minimal"
  );
}

export function isAllowedConfidence(value: unknown): value is NumericOrLabel<ConfidenceLabel> {
  return typeof value === "number" || value === "100%" || value === "80%" || value === "50%";
}

export function isAllowedEffort(value: unknown): value is NumericOrLabel<EffortSize> {
  if (typeof value === "number") return value > 0; // prevent zero or negative
  return value === "XS" || value === "S" || value === "M" || value === "L" || value === "XL";
}

// Comparator for sorting features by RICE score desc, then lowest Effort, then highest Impact
export function compareByRice(
  a: Feature,
  b: Feature,
  scales: RiceScales = DEFAULT_RICE_SCALES
): number {
  const scoreA = computeRiceScore(a, scales);
  const scoreB = computeRiceScore(b, scales);

  const normScoreA = scoreA ?? Number.NEGATIVE_INFINITY;
  const normScoreB = scoreB ?? Number.NEGATIVE_INFINITY;

  if (normScoreA !== normScoreB) {
    // Descending by score
    return normScoreB - normScoreA;
  }

  // Tie-breaker 1: lowest Effort
  const effortA = toNumericEffort(a.effort, scales) ?? Number.POSITIVE_INFINITY;
  const effortB = toNumericEffort(b.effort, scales) ?? Number.POSITIVE_INFINITY;
  if (effortA !== effortB) {
    return effortA - effortB; // Ascending effort
  }

  // Tie-breaker 2: highest Impact
  const impactA = toNumericImpact(a.impact, scales) ?? Number.NEGATIVE_INFINITY;
  const impactB = toNumericImpact(b.impact, scales) ?? Number.NEGATIVE_INFINITY;
  if (impactA !== impactB) {
    return impactB - impactA; // Descending impact
  }

  // Final tie-breaker: lexical name to ensure stable ordering
  return (a.name || "").localeCompare(b.name || "");
}


