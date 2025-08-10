import type { PersistedState } from "@/lib/rice";

export const STORAGE_KEY = "rice-prioritization-state";
export const STORAGE_SCHEMA_VERSION = 1;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveState(state: PersistedState): void {
  if (!isBrowser()) return;
  try {
    const payload = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // ignore
  }
}

export function loadState(): PersistedState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed &&
      typeof parsed.version === "number" &&
      Array.isArray(parsed.features) &&
      typeof parsed.lastSavedAtIso === "string"
    ) {
      return parsed as PersistedState;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearState(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function createDebounced<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}


