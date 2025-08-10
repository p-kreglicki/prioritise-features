import {
  DEFAULT_RICE_SCALES,
  computeRiceScore,
  compareByRice,
  isValidReach,
  isAllowedImpact,
  isAllowedConfidence,
  isAllowedEffort,
  type Feature
} from './rice';

function makeFeature(partial: Partial<Feature>): Feature {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    name: partial.name ?? 'Feature',
    createdAtIso: partial.createdAtIso ?? new Date().toISOString(),
    updatedAtIso: partial.updatedAtIso ?? new Date().toISOString(),
    ...partial
  } as Feature;
}

describe('computeRiceScore', () => {
  test('computes correct score with default scales and labels', () => {
    const f = makeFeature({
      name: 'Labels',
      reach: 100,
      impact: 'High', // 2
      confidence: '80%', // 0.8
      effort: 'M' // 2
    });
    const score = computeRiceScore(f, DEFAULT_RICE_SCALES);
    expect(score).toBeCloseTo(80, 5); // (100*2*0.8)/2
  });

  test('accepts numeric inputs', () => {
    const f = makeFeature({ reach: 100, impact: 3, confidence: 1, effort: 1 });
    const score = computeRiceScore(f);
    expect(score).toBeCloseTo(300, 5);
  });

  test('returns null for incomplete input', () => {
    const f = makeFeature({ impact: 'High', confidence: '80%', effort: 'M' });
    expect(computeRiceScore(f)).toBeNull();
  });

  test('returns null for zero or negative effort', () => {
    const f0 = makeFeature({ reach: 10, impact: 1, confidence: 1, effort: 0 });
    expect(computeRiceScore(f0)).toBeNull();
  });

  test('returns null for negative reach', () => {
    const f = makeFeature({ reach: -1, impact: 1, confidence: 1, effort: 1 });
    expect(computeRiceScore(f)).toBeNull();
  });
});

describe('compareByRice', () => {
  test('sorts by score desc, then lowest effort, then highest impact', () => {
    const f1 = makeFeature({ name: 'f1', reach: 100, impact: 'High', confidence: '80%', effort: 'M' }); // 80
    const f2 = makeFeature({ name: 'f2', reach: 100, impact: 'Medium', confidence: '100%', effort: 'S' }); // 100
    const f3 = makeFeature({ name: 'f3', reach: 100, impact: 'High', confidence: '80%', effort: 'L' }); // 40
    const f4 = makeFeature({ name: 'f4' }); // incomplete

    const arr = [f1, f2, f3, f4];
    const sorted = arr.slice().sort((a, b) => compareByRice(a, b));
    expect(sorted.map((f) => f.name)).toEqual(['f2', 'f1', 'f3', 'f4']);
  });

  test('tie-breaker by lower effort', () => {
    const a = makeFeature({ name: 'a', reach: 10, impact: 1, confidence: 1, effort: 1 }); // 10
    const b = makeFeature({ name: 'b', reach: 20, impact: 1, confidence: 1, effort: 2 }); // 10
    const sorted = [a, b].sort((x, y) => compareByRice(x, y));
    expect(sorted.map((f) => f.name)).toEqual(['a', 'b']);
  });

  test('tie-breaker by higher impact', () => {
    const lowImpact = makeFeature({ name: 'low', reach: 10, impact: 1, confidence: 1, effort: 1 }); // 10
    const highImpact = makeFeature({ name: 'high', reach: 5, impact: 2, confidence: 1, effort: 1 }); // 10
    const sorted = [lowImpact, highImpact].sort((x, y) => compareByRice(x, y));
    expect(sorted.map((f) => f.name)).toEqual(['high', 'low']);
  });
});

describe('validation helpers', () => {
  test('isValidReach', () => {
    expect(isValidReach(0)).toBe(true);
    expect(isValidReach(10)).toBe(true);
    expect(isValidReach(-1)).toBe(false);
    expect(isValidReach(NaN)).toBe(false);
  });

  test('isAllowedImpact', () => {
    expect(isAllowedImpact(2)).toBe(true);
    expect(isAllowedImpact('High')).toBe(true);
    expect(isAllowedImpact('Unknown')).toBe(false as any);
  });

  test('isAllowedConfidence', () => {
    expect(isAllowedConfidence(1)).toBe(true);
    expect(isAllowedConfidence('80%')).toBe(true);
    expect(isAllowedConfidence('10%')).toBe(false as any);
  });

  test('isAllowedEffort', () => {
    expect(isAllowedEffort(1)).toBe(true);
    expect(isAllowedEffort(0)).toBe(false);
    expect(isAllowedEffort('XS')).toBe(true);
    expect(isAllowedEffort('XXL')).toBe(false as any);
  });
});


