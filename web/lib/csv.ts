import type { ConfidenceLabel, EffortSize, Feature, ImpactLabel } from "@/lib/rice";
import { DEFAULT_RICE_SCALES } from "@/lib/rice";

export type CsvParseResult = {
  features: Feature[];
  errors: Array<{ row: number; message: string }>;
};

const HEADER_ORDER = ["name", "reach", "impact", "confidence", "effort", "description"] as const;
type Header = (typeof HEADER_ORDER)[number];

// Very small CSV parser that supports quoted fields and commas
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const n = text.length;

  const readCell = (): string => {
    if (text[i] === '"') {
      i++; // skip opening quote
      let value = "";
      while (i < n) {
        const ch = text[i];
        if (ch === '"') {
          if (i + 1 < n && text[i + 1] === '"') {
            value += '"';
            i += 2; // escaped quote
            continue;
          }
          i++; // closing quote
          break;
        }
        value += ch;
        i++;
      }
      return value;
    }
    // unquoted
    let start = i;
    while (i < n && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") i++;
    return text.slice(start, i).trim();
  };

  while (i < n) {
    const row: string[] = [];
    // skip CR/LF at row start
    while (i < n && (text[i] === "\n" || text[i] === "\r")) i++;
    if (i >= n) break;
    while (i < n) {
      row.push(readCell());
      if (i < n && text[i] === ",") {
        i++; // consume comma
        continue;
      }
      // End of row
      while (i < n && text[i] !== "\n") i++;
      if (i < n && text[i] === "\n") i++;
      break;
    }
    if (row.length === 1 && row[0] === "") continue; // skip empty
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(h: string): Header | null {
  const key = h.trim().toLowerCase();
  switch (key) {
    case "name":
    case "reach":
    case "impact":
    case "confidence":
    case "effort":
    case "description":
      return key as Header;
    default:
      return null;
  }
}

function toNumberOrUndefined(v: string): number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeImpact(v: string): ImpactLabel | number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const trimmed = v.trim();
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  const lower = trimmed.toLowerCase();
  const map: Record<string, ImpactLabel> = {
    massive: "Massive",
    high: "High",
    medium: "Medium",
    low: "Low",
    minimal: "Minimal"
  };
  return map[lower] ?? undefined;
}

function normalizeConfidence(v: string): ConfidenceLabel | number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const trimmed = v.trim();
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  const lower = trimmed.toLowerCase();
  const map: Record<string, ConfidenceLabel> = {
    "100%": "100%",
    "80%": "80%",
    "50%": "50%",
    "100": "100%",
    "80": "80%",
    "50": "50%"
  };
  return map[lower] ?? undefined;
}

function normalizeEffort(v: string): EffortSize | number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const trimmed = v.trim();
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  const lower = trimmed.toLowerCase();
  const map: Record<string, EffortSize> = {
    xs: "XS",
    s: "S",
    m: "M",
    l: "L",
    xl: "XL"
  };
  return map[lower] ?? undefined;
}

export function parseCsvToFeatures(csvText: string): CsvParseResult {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return { features: [], errors: [] };
  const headerRow = rows[0];
  const headerIdx: Partial<Record<Header, number>> = {};
  headerRow.forEach((h, idx) => {
    const key = normalizeHeader(h);
    if (key) headerIdx[key] = idx;
  });

  // Validate required headers
  const required: Header[] = ["name", "reach", "impact", "confidence", "effort"];
  const missingHeaders = required.filter((h) => headerIdx[h] == null);
  const errors: Array<{ row: number; message: string }> = [];
  if (missingHeaders.length > 0) {
    errors.push({ row: 1, message: `Missing headers: ${missingHeaders.join(", ")}` });
    return { features: [], errors };
  }

  const features: Feature[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (h: Header): string => {
      const idx = headerIdx[h] as number;
      return row[idx] ?? "";
    };

    const name = get("name").trim();
    const reachRaw = get("reach");
    const impactRaw = get("impact");
    const confidenceRaw = get("confidence");
    const effortRaw = get("effort");

    const reach = toNumberOrUndefined(reachRaw);
    const impact = normalizeImpact(impactRaw);
    const confidence = normalizeConfidence(confidenceRaw);
    const effort = normalizeEffort(effortRaw);
    const description = (headerIdx["description"] != null ? get("description").trim() : undefined) ||
      undefined;

    // Basic validation aligned with PRD (allow incomplete but warn)
    if (!name) {
      errors.push({ row: r + 1, message: "Missing required field: name" });
      continue;
    }

    // Warn on invalid non-empty mappings
    if (impactRaw.trim() !== "" && impact === undefined) {
      errors.push({ row: r + 1, message: `Unrecognized impact: ${impactRaw}` });
    }
    if (confidenceRaw.trim() !== "" && confidence === undefined) {
      errors.push({ row: r + 1, message: `Unrecognized confidence: ${confidenceRaw}` });
    }
    if (effortRaw.trim() !== "" && effort === undefined) {
      errors.push({ row: r + 1, message: `Unrecognized effort: ${effortRaw}` });
    }

    const now = new Date().toISOString();
    const feature: Feature = {
      id: `${Date.now().toString(36)}_${r}`,
      name,
      description,
      reach,
      impact: impact as any,
      confidence: confidence as any,
      effort: effort as any,
      createdAtIso: now,
      updatedAtIso: now
    };
    features.push(feature);
  }
  return { features, errors };
}

export function featuresToCsv(features: Feature[]): string {
  const header = HEADER_ORDER.join(",");
  const rows = features.map((f) => {
    const reach = f.reach ?? "";
    const impact = typeof f.impact === "number" ? f.impact : f.impact ?? "";
    const confidence = typeof f.confidence === "number" ? f.confidence : f.confidence ?? "";
    const effort = typeof f.effort === "number" ? f.effort : f.effort ?? "";
    const description = f.description ?? "";
    const vals = [f.name ?? "", String(reach), String(impact), String(confidence), String(effort), description];
    // Escape commas/quotes
    const esc = (s: string) => (s.includes(",") || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s);
    return vals.map(esc).join(",");
  });
  return [header, ...rows].join("\n");
}

export function parseJsonToFeatures(jsonText: string): CsvParseResult {
  const errors: Array<{ row: number; message: string }> = [];
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return { features: [], errors: [{ row: 1, message: "JSON must be an array of objects" }] };
    }
    const features: Feature[] = [];
    const now = new Date().toISOString();
    parsed.forEach((obj: any, idx: number) => {
      const name = (obj?.name ?? "").toString().trim();
      if (!name) {
        errors.push({ row: idx + 1, message: "Missing required field: name" });
        return;
      }
      const feature: Feature = {
        id: `${Date.now().toString(36)}_${idx}`,
        name,
        description: obj?.description ?? undefined,
        reach: obj?.reach != null ? Number(obj.reach) : undefined,
        impact: obj?.impact ?? undefined,
        confidence: obj?.confidence ?? undefined,
        effort: obj?.effort ?? undefined,
        createdAtIso: now,
        updatedAtIso: now
      };
      features.push(feature);
    });
    return { features, errors };
  } catch (e: any) {
    return { features: [], errors: [{ row: 1, message: `Invalid JSON: ${e?.message ?? e}` }] };
  }
}

export function featuresToJson(features: Feature[]): string {
  // Include computed score for exports
  return JSON.stringify(
    features.map((f) => ({
      name: f.name,
      description: f.description ?? undefined,
      reach: f.reach ?? undefined,
      impact: f.impact ?? undefined,
      confidence: f.confidence ?? undefined,
      effort: f.effort ?? undefined
    })),
  null,
  2
  );
}

// Utility to map labels to numeric using defaults
export function labelToNumeric(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  // Try impact
  const imp = (DEFAULT_RICE_SCALES.impact as any)[value as any];
  if (typeof imp === "number") return imp;
  const conf = (DEFAULT_RICE_SCALES.confidence as any)[value as any];
  if (typeof conf === "number") return conf;
  const eff = (DEFAULT_RICE_SCALES.effort as any)[value as any];
  if (typeof eff === "number") return eff;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}


