import { parseCsvToFeatures, featuresToCsv, parseJsonToFeatures } from './csv';

describe('csv parsing', () => {
  test('parses minimal valid CSV and reports missing headers', () => {
    const csv = 'name,reach,impact,confidence,effort\nFeature A,100,High,80%,M\n';
    const { features, errors } = parseCsvToFeatures(csv);
    expect(features.length).toBe(1);
    expect(errors.length).toBe(0);
    expect(features[0].name).toBe('Feature A');
  });

  test('reports unrecognized labels', () => {
    const csv = 'name,reach,impact,confidence,effort\nX,10,Unknown,10%,ZZ\n';
    const { features, errors } = parseCsvToFeatures(csv);
    expect(features.length).toBe(1);
    expect(errors.some((e) => e.message.includes('Unrecognized impact'))).toBe(true);
    expect(errors.some((e) => e.message.includes('Unrecognized confidence'))).toBe(true);
    expect(errors.some((e) => e.message.includes('Unrecognized effort'))).toBe(true);
  });
});

describe('csv stringify', () => {
  test('stringifies features with headers', () => {
    const csv = featuresToCsv([
      {
        id: '1',
        name: 'A',
        description: 'desc',
        reach: 10,
        impact: 'High',
        confidence: '80%',
        effort: 'M',
        createdAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString()
      }
    ]);
    expect(csv.split('\n')[0]).toBe('name,reach,impact,confidence,effort,description');
  });
});

describe('json parsing', () => {
  test('parses array of features', () => {
    const json = JSON.stringify([{ name: 'A', reach: 10, impact: 'High', confidence: '80%', effort: 'M' }]);
    const { features, errors } = parseJsonToFeatures(json);
    expect(errors.length).toBe(0);
    expect(features.length).toBe(1);
  });
});


