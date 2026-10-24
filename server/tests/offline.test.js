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
const kit = require('../../scripts/lib/svg-kit');
const circuits = require('../../scripts/lib/circuit-templates');
const machines = require('../../scripts/lib/machines');
const { SPECS } = require('../../scripts/lib/component-specs');

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

  it('keeps the pinout kind so it can sit with the specifications', async () => {
    installStubs([
      { diagram_id: 1, title: 'Symbol Diagram', diagram_kind: 'SYMBOL', image_path: '/a.svg', alt_text: null, caption: null, display_order: 10 },
      { diagram_id: 2, title: 'Pinout Diagram', diagram_kind: 'PINOUT', image_path: '/assets/svg/pinouts/jk-flip-flop.svg', alt_text: null, caption: null, display_order: 25 }
    ]);

    const detail = await service.getComponentDetail('jk-flip-flop');
    const pinout = detail.diagrams.find(d => d.kind === 'PINOUT');

    assert.ok(pinout, 'PINOUT survives the mapping');
    assert.match(pinout.imagePath, /^\/assets\/svg\/pinouts\//);
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

describe('Diagram generator contract', () => {
  it('draws every NAND as accent outline with a hollow output bubble and no text', () => {
    const svg = circuits.build('nand-jk', 'JK circuit');

    assert.ok(svg.includes('#00a7da'), 'gates use the accent outline');
    assert.ok(svg.includes('#101f38'), 'gates are filled with the accent tint');
    assert.ok(svg.includes('#c5c7c9'), 'wires use the light grey');
    assert.ok(svg.includes('fill="none"'), 'the output bubble is hollow');
    assert.ok(!/>NAND</.test(svg), 'the gate name is never written inside the symbol');
    assert.ok(svg.includes('1080') && svg.includes('480'), 'canvas matches the reference drawing');
  });

  it('labels circuit inputs light blue and outputs cyan', () => {
    const svg = circuits.build('nand-d', 'D circuit');
    assert.ok(svg.includes(kit.PALETTE.inputText), 'input labels use the accent blue');
    assert.ok(svg.includes(kit.PALETTE.outputText), 'output labels use the secondary cyan');
  });

  it('never draws a diagonal wire', () => {
    Object.keys(circuits.TEMPLATES).forEach(key => {
      const warnings = [];
      const original = console.warn;
      console.warn = msg => warnings.push(msg);
      circuits.build(key, 'check');
      console.warn = original;
      assert.ok(
        !warnings.some(w => /diagonal|dangling|unconnected/.test(w)),
        `${key} produced ${warnings.join(' | ')}`
      );
    });
  });

  it('draws the box diagram at the reference geometry with an unclipped name', () => {
    const { svg, width, height } = kit.boxDiagram({
      name: ['JK', 'FLIP-FLOP'],
      inputs: [{ label: 'J' }, { label: 'K' }, { label: 'CLK', clock: true }],
      outputs: [{ label: 'Q' }, { label: "Q'", bubble: true }],
      top: [{ label: 'PRE', bubble: true, dashed: true }],
      bottom: [{ label: 'CLR', bubble: true, dashed: true }]
    });

    assert.strictEqual(width, 360, 'matches the reference width');
    assert.strictEqual(height, 320, 'matches the reference height');
    assert.ok(svg.includes('stroke="#21262d"'), 'body border is the dark grey from the reference');
    assert.ok(svg.includes('#00a7da'), 'inputs are light blue');
    assert.ok(svg.includes('#00dfc1'), 'outputs are cyan');
    assert.ok(svg.includes('stroke-dasharray="8 4"'), 'preset/clear use the dashed grey stub');
    assert.ok(!svg.includes('Symbol'), 'no caption text is written into the drawing');
  });

  it('wraps a long box name and shrinks an unbreakable one', () => {
    const wrapped = kit.fitLabel('ASYNCHRONOUS BINARY COUNTER', 130, { maxSize: 18 });
    assert.ok(wrapped.lines.length > 1, 'the name wraps onto several lines');
    wrapped.lines.forEach(line => {
      assert.ok(kit.textWidth(line, wrapped.size) <= 130, `"${line}" still overflows`);
    });

    const unbreakable = kit.fitLabel('SUPERCALIFRAGILISTIC', 130, { maxSize: 18 });
    assert.ok(unbreakable.size < 18, 'a single long token is reduced in size');
    unbreakable.lines.forEach(line => {
      assert.ok(kit.textWidth(line, unbreakable.size) <= 130, `"${line}" still overflows`);
    });
  });

  it('draws the IC pinout with numbers outside and names inside', () => {
    const { svg } = kit.pinoutDiagram(SPECS['nand-gate'].pinout);
    assert.ok(svg.includes('74LS00'), 'part number is in the body');
    assert.ok(svg.includes('#8a8d93'), 'pin numbers use the muted grey');
    assert.ok(svg.includes('#21262d'), 'the body border matches the reference');
  });

  it('puts the Moore and Mealy machines in one side-by-side svg', () => {
    const svg = machines.buildState('jk', 'JK state');
    assert.ok(svg.includes('MOORE'), 'Moore panel present');
    assert.ok(svg.includes('MEALY'), 'Mealy panel present');
    const width = Number(svg.match(/viewBox="0 0 ([\d.]+)/)[1]);
    const height = Number(svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)/)[1]);
    assert.ok(width > height * 2, 'the two panels sit side by side');
    assert.ok(!/stroke-width="(?!1[".])/.test(svg.replace(/stroke-width="1"/g, '')), 'borders are hairlines');
  });

  it('covers every component that declares a circuit with a template', () => {
    Object.entries(SPECS).forEach(([slug, spec]) => {
      if (!spec.circuit) return;
      assert.ok(circuits.TEMPLATES[spec.circuit], `${slug} references a missing template: ${spec.circuit}`);
    });
  });
});
