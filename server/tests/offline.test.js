/**
 * DB-free contract tests.
 *
 * The API suite in api.test.js talks to a seeded MySQL instance. These tests
 * cover the pure mapping logic that connects the database rows to the JSON the
 * frontend relies on, so they run anywhere:
 *
 *   npm run test:offline
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');

const repo = require('../src/db/repository');
const service = require('../src/services/catalogueService');
const { restyle } = require('../../scripts/restyle-svgs');

function stubComponent(overrides = {}) {
  return {
    component_id: 42,
    name: 'JK Flip-Flop',
    slug: 'jk-flip-flop',
    category_id: 7,
    category_name: 'Flip-Flops',
    category_slug: 'flip-flops',
    short_description: 'short',
    description: 'long description',
    main_image_path: null,
    circuit_symbol_path: '/assets/svg/flipflops/jk.svg',
    datasheet_url: null,
    is_illustrative: 1,
    is_published: 1,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides
  };
}

function installStubs(diagrams) {
  repo.getComponentByIdOrSlug = async () => stubComponent();
  repo.getCategoryBreadcrumb = async () => [];
  repo.getComponentContent = async () => [];
  repo.getComponentDiagrams = async () => diagrams;
  repo.getComponentSpecifications = async () => [];
  repo.getComponentTags = async () => [];
}

describe('Component detail mapping', () => {
  it('exposes the diagram kind so the UI can place each drawing', async () => {
    installStubs([
      { diagram_id: 1, title: 'Symbol Diagram', diagram_kind: 'SYMBOL', image_path: '/assets/svg/flipflops/jk.svg', alt_text: 'a', caption: 'c', display_order: 10 },
      { diagram_id: 2, title: 'Circuit Diagram', diagram_kind: 'CIRCUIT', image_path: '/assets/svg/circuits/jk-flip-flop-circuit.svg', alt_text: 'b', caption: 'c', display_order: 20 }
    ]);

    const detail = await service.getComponentDetail('jk-flip-flop');

    assert.deepStrictEqual(detail.diagrams.map(d => d.kind), ['SYMBOL', 'CIRCUIT']);
    assert.strictEqual(detail.diagrams[1].imagePath, '/assets/svg/circuits/jk-flip-flop-circuit.svg');
  });

  it('falls back to OTHER when a legacy row has no diagram kind', async () => {
    installStubs([
      { diagram_id: 1, title: 'Legacy', diagram_kind: null, image_path: '/assets/svg/x.svg', alt_text: null, caption: null, display_order: 1 }
    ]);

    const detail = await service.getComponentDetail('jk-flip-flop');
    assert.strictEqual(detail.diagrams[0].kind, 'OTHER');
  });
});

describe('SVG restyle pipeline', () => {
  it('maps light artwork onto the design-reference palette', () => {
    const source =
      '<svg viewBox="0 0 200 100"><style>.body { fill: #f8fafc; stroke: #1e293b; }' +
      '.wire { stroke: #2563eb; }</style><text x="10" y="20" fill="#0f172a">A</text></svg>';

    const out = restyle(source);

    assert.ok(out.includes('fill: #0d1117'), 'device bodies become dark');
    assert.ok(out.includes('stroke: #168fe5'), 'device outlines use the reference accent stroke');
    assert.ok(out.includes('stroke: #00a7da'), 'wires use the reference cyan');
    assert.ok(out.includes('fill="#e8eaed"'), 'labels switch to the reference ink');
  });

  it('widens the canvas rather than clipping a long label', () => {
    const source =
      '<svg viewBox="0 0 200 100"><text x="150" y="20" font-size="14" fill="#1e293b">A very long label</text></svg>';

    const out = restyle(source);
    const width = Number(out.match(/viewBox="0 0 ([\d.]+) /)[1]);

    assert.ok(width > 200, `expected a wider canvas, got ${width}`);
  });
});
