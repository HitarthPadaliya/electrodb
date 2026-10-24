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
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

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

  it('writes every drawing in Consolas and nothing else', () => {
    const drawings = [
      kit.boxDiagram({ name: 'D FLIP-FLOP', inputs: [{ label: 'D' }], outputs: [{ label: 'Q' }] }).svg,
      kit.pinoutDiagram(SPECS['and-gate'].pinout).svg,
      machines.buildState('jk', 'JK state'),
      circuits.build('nand-d', 'D circuit')
    ];

    drawings.forEach(svg => {
      const families = [...svg.matchAll(/font-family="([^"]*)"/g)].map(m => m[1]);
      assert.ok(families.length > 0, 'the drawing declares a font');
      families.forEach(f => assert.strictEqual(f, 'Consolas'));
      assert.ok(!/Courier|monospace|sans-serif|Arial/i.test(svg), 'no fallback family is declared');
    });
  });

  it('leaves the state machines unboxed and names them underneath', () => {
    const svg = machines.buildState('jk', 'JK state');
    const rects = [...svg.matchAll(/<rect [^>]*>/g)].map(m => m[0]);

    assert.deepStrictEqual(rects, [], 'no panel border is drawn around either machine');

    const height = Number(svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)/)[1]);
    const moore = svg.match(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>Moore</);
    const mealy = svg.match(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>Mealy</);

    assert.ok(moore && mealy, 'both captions are drawn');
    assert.ok(Number(moore[1]) < Number(mealy[1]), 'Moore is the left half, Mealy the right');
    assert.ok(Number(moore[2]) > height - 40, 'the captions sit near the bottom of the drawing');
  });

  it('draws the IC pinout with numbers inside and names outside', () => {
    const spec = SPECS['nand-gate'].pinout;
    const { svg } = kit.pinoutDiagram(spec);

    assert.ok(svg.includes('74LS00'), 'part number is in the body');
    assert.ok(svg.includes('#8a8d93'), 'pin numbers use the muted grey');
    assert.ok(svg.includes('#21262d'), 'the body border matches the reference');

    // Body edges, read from the package rectangle.
    const rect = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
    const bodyX = Number(rect[1]);
    const bodyRight = bodyX + Number(rect[3]);

    const texts = [...svg.matchAll(/<text x="([\d.]+)"[^>]*text-anchor="(\w+)"[^>]*>([^<]*)</g)].map(m => ({
      x: Number(m[1]),
      anchor: m[2],
      text: m[3]
    }));
    const at = (label, anchor) => texts.find(t => t.text === label && t.anchor === anchor);

    const pin1 = at('1', 'start');
    assert.ok(pin1 && pin1.x > bodyX && pin1.x < bodyRight, 'pin number 1 sits inside the body');
    const name1A = at('1A', 'end');
    assert.ok(name1A && name1A.x < bodyX, 'pin name 1A sits outside the body');
  });

  it('places each inversion bubble against the body edge, only for active-low pins', () => {
    const spec = SPECS['d-flip-flop'].pinout; // 74LS74: CLR/PRE are active low
    const { svg } = kit.pinoutDiagram(spec);
    const rect = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
    const bodyX = Number(rect[1]);
    const bodyRight = bodyX + Number(rect[3]);

    const bubbles = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="6"[^>]*stroke="([^"]+)"/g)].map(m => ({
      cx: Number(m[1]),
      cy: Number(m[2]),
      stroke: m[3]
    }));

    // 74LS74 has four active-low control pins: 1CLR, 1PRE, 2PRE, 2CLR.
    assert.strictEqual(bubbles.length, 4, 'one bubble per active-low pin');

    const tolerance = 0.01;
    bubbles.forEach(b => {
      const onLeft = Math.abs(b.cx - (bodyX - 6)) < tolerance;
      const onRight = Math.abs(b.cx - (bodyRight + 6)) < tolerance;
      assert.ok(onLeft || onRight, `bubble at ${b.cx} sits against a body edge`);

      // The bubble must be the same colour as the pin group it belongs to.
      const expected = b.stroke === kit.PALETTE.preset || b.stroke === kit.PALETTE.clear;
      assert.ok(expected, 'bubbles are drawn in the preset/clear colours');

      // No stub may run through the bubble: wires stop at its far edge.
      const wireThrough = new RegExp(`<line[^>]*y1="${b.cy}"[^>]*y2="${b.cy}"`).test(svg)
        ? [...svg.matchAll(new RegExp(`<line x1="([\\d.]+)"[^>]*y1="${b.cy}"[^>]*x2="([\\d.]+)"`, 'g'))].some(m => {
            const [x1, x2] = [Number(m[1]), Number(m[2])];
            return (x1 < b.cx + 6 && x2 > b.cx + 6) || (x1 > b.cx - 6 && x2 < b.cx - 6 + 12 && x1 < b.cx);
          })
        : false;
      assert.ok(!wireThrough, 'the stub stops at the bubble');
    });
  });

  it('gives preset and clear their own distinct colours', () => {
    const { svg } = kit.pinoutDiagram(SPECS['d-flip-flop'].pinout);

    assert.ok(svg.includes(kit.PALETTE.preset), 'preset pins use the amber colour');
    assert.ok(svg.includes(kit.PALETTE.clear), 'clear pins use the violet colour');
    assert.notStrictEqual(kit.PALETTE.preset, kit.PALETTE.clear, 'the two colours differ');
    assert.notStrictEqual(kit.PALETTE.preset, kit.PALETTE.control, 'and differ from ordinary pins');
    assert.notStrictEqual(kit.PALETTE.clear, kit.PALETTE.control, 'and differ from ordinary pins');

    // An active-high reset keeps the colour but loses the bubble.
    const ls90 = kit.pinoutDiagram(SPECS['decade-counter'].pinout).svg;
    assert.ok(ls90.includes(kit.PALETTE.preset), 'R9 keeps the preset colour');
    assert.ok(ls90.includes(kit.PALETTE.clear), 'R0 keeps the clear colour');
    assert.strictEqual((ls90.match(/<circle[^>]*r="6"/g) || []).length, 0, 'active-high resets have no bubble');
  });

  it('puts the Moore and Mealy machines in one side-by-side svg', () => {
    const svg = machines.buildState('jk', 'JK state');
    assert.ok(svg.includes('>Moore<'), 'Moore caption present');
    assert.ok(svg.includes('>Mealy<'), 'Mealy caption present');
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

describe('Educational tables', () => {
  const tables = require('../../scripts/lib/content-tables');

  it('states the operation next to a next state written in terms of Q_n', () => {
    const jk = tables.truthTableFor('jk-flip-flop');

    assert.deepStrictEqual(jk.columns, ['\\(J\\)', '\\(K\\)', '\\(Q_{n+1}\\)', 'Operation']);
    assert.strictEqual(jk.rows.length, 4, 'one row per behaviour, not per state');
    assert.deepStrictEqual(jk.rows[0], [0, 0, '\\(Q_n\\)', 'Hold']);
    assert.deepStrictEqual(jk.rows[1], [0, 1, 0, 'Reset']);
    assert.deepStrictEqual(jk.rows[3], [1, 1, '\\(\\overline{Q_n}\\)', 'Toggle']);
    assert.ok(!jk.columns.some(column => /^Q$|^Q\\(next\\)$/.test(column)), 'no duplicate Q column');
  });

  it('picks the right truth table for each flip-flop family', () => {
    assert.strictEqual(tables.truthTableFor('d-flip-flop').rows.length, 2);
    assert.strictEqual(tables.truthTableFor('toggle-latch').rows[1][1], '\\(\\overline{Q_n}\\)');
    assert.strictEqual(tables.truthTableFor('gated-sr-latch').rows[3][3], 'Invalid');
    assert.strictEqual(tables.truthTableFor('jk-preset-clear-flip-flop').rows.length, 4);
  });

  it('keeps the characteristic table exhaustive', () => {
    const jk = tables.characteristicTableFor('jk-flip-flop');
    assert.strictEqual(jk.rows.length, 8);
    assert.deepStrictEqual(jk.columns, ['\\(J\\)', '\\(K\\)', '\\(Q_n\\)', '\\(Q_{n+1}\\)']);
  });

  it('mirrors the same tables into the SQL seeds', () => {
    const expected = String.raw`JSON_ARRAY('\\(J\\)','\\(K\\)','\\(Q_{n+1}\\)','Operation')`;
    const toggle = String.raw`JSON_ARRAY(1,1,'\\(\\overline{Q_n}\\)','Toggle')`;

    ['electrodb.sql', 'database/07_seed_data.sql'].forEach(rel => {
      const sql = fs.readFileSync(path.join(__dirname, '../..', rel), 'utf8');
      assert.ok(sql.includes(expected), `${rel} has the JK header`);
      assert.ok(sql.includes(toggle), `${rel} has the toggle row`);
    });
  });
});

describe('Lab console content', () => {
  const app = fs.readFileSync(path.join(__dirname, '../../public/assets/js/app.js'), 'utf8');

  it('offers stored programs, index benchmarks and the dashboard only', () => {
    assert.ok(!app.includes('SQL Demos'), 'the SQL demos tab is gone');
    assert.ok(!app.includes('data-arg="tab-views"'), 'the views tab is gone');
    assert.ok(!app.includes('Demo mode'), 'the demo pill is gone');
    assert.ok(!app.includes('class="lab-lead"'), 'the lab description is gone');
    assert.ok(app.includes('data-arg="tab-benchmarks"'), 'the benchmark tab stays');
  });

  it('presents the benchmark report as tables instead of a text dump', () => {
    assert.ok(app.includes('parseBenchmarkReport'), 'the markdown report is parsed');
    assert.ok(app.includes('renderBenchmarkTable'), 'tables are rendered');
    assert.ok(!app.includes('report-viewer'), 'the monospaced dump is gone');
    assert.ok(!app.includes('reportLineLimit'), 'the line-count slider is gone');
  });

  it('keeps only the report header, the summary and the per-query timings', () => {
    ['Candidate indexes and their justification', 'Execution plan and analysis', 'Methodological conclusions']
      .forEach(heading => assert.ok(!app.includes(heading), `"${heading}" is not rendered`));

    assert.ok(app.includes('Execution timing summary'), 'the summary table stays');
    assert.ok(app.includes('Per-query timings'), 'the per-query table stays');
  });
});

describe('Table typography', () => {
  const app = fs.readFileSync(path.join(__dirname, '../../public/assets/js/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../../public/assets/css/styles.css'), 'utf8');

  it('sets header maths in bold and body maths in normal weight', () => {
    assert.ok(app.includes('boldsymbol{'), 'headers use mathbold (\\boldsymbol)');
    assert.ok(!app.includes('mathtt{'), 'the source LaTeX is not printed as a fallback');
    assert.ok(/const body = header \?/.test(app), 'the weight is chosen per header/cell');
  });

  it('frames the table once and keeps the cells free of a grid', () => {
    const table = css.slice(css.indexOf('.edu-table {'), css.indexOf('.spec-table {'));

    assert.ok(
      /\.table-responsive \{[^}]*border-radius: var\(--radius-md\)/.test(css),
      'the table sits in one rounded frame'
    );
    assert.ok(/border-collapse:\s*separate/.test(table), 'cells are not boxed by a collapsed grid');
    assert.ok(/border-top: 1px solid rgba\(255, 255, 255, 0\.045\)/.test(table), 'rows are separated by hairlines');
    assert.ok(/var\(--table-even\)/.test(table), 'zebra rows use the reference token');
    assert.ok(/var\(--table-hover\)/.test(table), 'hover uses the reference token');
    assert.ok(/\.edu-table th \{[^}]*linear-gradient/.test(css), 'the header band is a tint, not a flat block');
  });
});

describe('Detail page layout', () => {
  it('keeps the IC pinout in its own section, apart from the specifications', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../public/assets/js/app.js'), 'utf8');

    const pinoutHeading = source.indexOf('<h2 class="section-title">IC Pinout</h2>');
    const specHeading = source.indexOf('<h2 class="section-title">Technical Specifications</h2>');

    assert.ok(pinoutHeading > -1, 'the pinout gets its own heading');
    assert.ok(specHeading > -1, 'the specifications keep their heading');
    assert.ok(pinoutHeading < specHeading, 'the pinout is read before the specifications table');
    assert.ok(
      !source.includes('spec-layout'),
      'the pinout is no longer nested inside the specifications block'
    );
  });

  it('centres every diagram and lets state and timing drawings fill the column', () => {
    const css = fs.readFileSync(path.join(__dirname, '../../public/assets/css/styles.css'), 'utf8');

    const diagramBody = css.slice(css.indexOf('.diagram-body {'), css.indexOf('.diagram-body img'));
    assert.ok(/align-items:\s*center/.test(diagramBody), 'diagrams are centred in their column');

    assert.ok(
      /\.diagram-body\.diagram-body--compact img,\s*\n\.diagram-body\.diagram-body--timing img/.test(css),
      'state and timing drawings share the wider ceiling'
    );
  });
});

describe('Arrow motion language', () => {
  const css = fs.readFileSync(path.join(__dirname, '../../public/assets/css/styles.css'), 'utf8');

  const shared = css.slice(
    css.indexOf('--- Arrows carry a charge'),
    css.indexOf('.section-sub {')
  );

  const body = selector => {
    const start = css.indexOf(`${selector} {`);
    assert.ok(start > -1, `${selector} is defined`);
    return css.slice(start, css.indexOf('}', start));
  };

  it('charges the glyph itself instead of transforming it', () => {
    assert.ok(/background-clip:\s*text/.test(shared), 'the light is clipped to the glyph itself');
    assert.ok(/background-size:\s*400%/.test(shared), 'the charge has room to travel');
    assert.ok(
      !/transform|translate|rotate/i.test(shared),
      'no arrow is translated or rotated, so none of them can trail'
    );
  });

  it('runs the charge from tail to head, mirrored for left-pointing arrows', () => {
    assert.ok(/background-position:\s*98% 0/.test(shared), 'the band waits at the far end of the track');
    assert.ok(/background-position:\s*36% 0/.test(shared), 'it comes to rest inside the head');

    assert.ok(/--arrow-angle:\s*270deg/.test(body('.back-link-arrow')), 'the back arrow runs right to left');
    assert.ok(/background-position:\s*2% 0/.test(body('.back-link-arrow')), 'its band waits at the other end');

    assert.ok(/--arrow-angle:\s*270deg/.test(body('.page-arrow--left')), 'the previous-page arrow runs right to left');
    assert.ok(/background-position:\s*2% 0/.test(body('.page-arrow--left')), 'its band waits at the other end');
  });

  it('plots and then strikes the tile arrow instead of moving it', () => {
    const app = fs.readFileSync(path.join(__dirname, '../../public/assets/js/app.js'), 'utf8');
    const tile = css.slice(css.indexOf('.subcategory-arrow {'), css.indexOf('.subcategory-card:hover .subcategory-foot'));

    // The glyph was replaced by a drawn arrow: shaft, beak, filament, strike, pen.
    ['arrow-rest', 'arrow-shaft', 'arrow-head', 'arrow-core', 'arrow-strike', 'arrow-nib'].forEach(name => {
      assert.ok(app.includes(`${name}"`), `the tile arrow draws a .${name}`);
      assert.ok(new RegExp(`\\.${name}\\b`).test(tile), `the tile arrow styles .${name}`);
    });

    assert.ok(/pathLength="1"/.test(app), 'the plotted strokes are normalised for the dash reveal');
    assert.ok(/stroke-dasharray:\s*1;/.test(tile), 'both strokes start undrawn');
    assert.ok(/@keyframes arrow-nib-run/.test(tile), 'the pen travels with the ink');
    assert.ok(/@keyframes arrow-strike/.test(tile), 'the tube is struck');
    assert.ok(/stroke-dashoffset:\s*1;/.test(tile), 'the ink waits at full offset');
    assert.ok(/stroke-dashoffset:\s*0;/.test(tile), 'hovering reels it out');
    assert.ok(
      /stroke-dashoffset 210ms linear/.test(tile) && /stroke-dashoffset 140ms linear 110ms/.test(tile),
      'the shaft draws forwards and rewinds backwards from wherever it reached'
    );
    assert.ok(
      /stroke-dashoffset 170ms var\(--ease-out\) 190ms/.test(tile),
      'the beak closes last on the way in'
    );
    assert.ok(/stroke-dashoffset 120ms linear/.test(tile), 'and lifts first on the way out');
    assert.ok(
      /transition: opacity 110ms var\(--ease-out\);/.test(tile) &&
        /transition: opacity 160ms var\(--ease-out\) 240ms;/.test(tile),
      'the flat arrow leaves at once and only returns once the page is clear'
    );
    // Only the pen travels; every rule that paints the arrow is transform-free.
    const rules = tile.slice(0, tile.indexOf('@keyframes'));
    assert.ok(!/transform/.test(rules), 'the arrow itself is never transformed');
  });
});

describe('Asset freshness', () => {
  const read = rel => fs.readFileSync(path.join(__dirname, '../..', rel), 'utf8');

  it('stamps a version onto every asset URL the app emits', () => {
    const app = read('public/assets/js/app.js');

    assert.ok(app.includes('ASSET_VERSION'), 'the app derives a build stamp');
    assert.ok(/asset\(path\)\s*{/.test(app), 'there is a single asset() helper');

    // Every <img> the app renders goes through the helper.
    const imgTags = [...app.matchAll(/<img[^>]*src="\$\{([^}]*)\}/g)].map(m => m[1]);
    assert.ok(imgTags.length >= 6, 'the app renders several images');
    imgTags.forEach(expr => {
      assert.ok(/this\.asset\(/.test(expr), `image src is not versioned: ${expr}`);
    });
  });

  it('loads the shell assets with an explicit version', () => {
    const html = read('public/index.html');

    ['styles.css', 'api.js', 'app.js'].forEach(name => {
      const match = html.match(new RegExp(`${name.replace('.', '\\.')}\\?v=(\\d+)`));
      assert.ok(match, `${name} is requested with a version`);
      assert.ok(Number(match[1]) >= 8, `${name} is on the current version`);
    });
  });

  it('never lets the preview server cache a stale drawing', () => {
    const server = read('scripts/preview-server.js');

    assert.ok(/no-store/.test(server), 'static responses are not stored');
    assert.ok(/ETag/.test(server), 'a validator is provided for revalidation');
    assert.ok(/304/.test(server), 'matching validators short-circuit to 304');
  });
});

describe('Account security primitives', () => {
  const tokens = require('../src/security/tokens');
  const roles = require('../src/security/roles');
  const passwords = require('../src/security/passwords');

  it('sets an HttpOnly, SameSite=Lax session cookie', () => {
    const cookie = tokens.serializeSessionCookie('abc123', 3600);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /Max-Age=3600/);
    assert.ok(!/Secure/i.test(cookie), 'Secure is off outside production by default');
  });

  it('clears the session cookie with an empty value and no max-age', () => {
    const cookie = tokens.clearSessionCookie();
    assert.match(cookie, /electrodb_sid=;/);
    assert.match(cookie, /Max-Age=0/i);
  });

  it('stores only a digest of the session token', () => {
    const { token, hash } = tokens.createToken();
    assert.ok(token.length >= 40, 'token should be long enough to be unguessable');
    assert.match(hash, /^[a-f0-9]{64}$/);
    assert.notStrictEqual(token, hash);
    assert.strictEqual(tokens.hashToken(token), hash);
    assert.strictEqual(new Set([tokens.createToken().token, tokens.createToken().token]).size, 2);
  });

  it('maps the three application roles onto the schema enum', () => {
    assert.strictEqual(roles.toRoleCode('User'), 'NAIVE_USER');
    assert.strictEqual(roles.toRoleCode('Developer'), 'APP_DEVELOPER');
    assert.strictEqual(roles.toRoleCode('DBA'), 'DBA');
    assert.strictEqual(roles.toApiRole('NAIVE_USER'), 'User');
    assert.strictEqual(roles.toApiRole('APP_DEVELOPER'), 'Developer');
    assert.strictEqual(roles.toApiRole('DBA'), 'DBA');
    // An unknown or missing role must never be treated as privileged.
    assert.strictEqual(roles.toApiRole('SOMETHING_ELSE'), 'User');
    assert.strictEqual(roles.toRoleCode('Root'), null);
    assert.strictEqual(roles.hasRole({ role: 'User' }, roles.ADMIN_ROLES), false);
  });

  it('hashes passwords with a per-password salt and verifies them', async () => {
    const a = await passwords.hashPassword('correct horse battery staple');
    const b = await passwords.hashPassword('correct horse battery staple');
    assert.match(a, /^scrypt\$16384\$8\$1\$/);
    assert.notStrictEqual(a, b, 'the same password must not produce the same hash');
    assert.strictEqual(await passwords.verifyPassword('correct horse battery staple', a), true);
    assert.strictEqual(await passwords.verifyPassword('wrong horse battery staple', a), false);
    assert.strictEqual(await passwords.verifyPassword('anything', 'not-a-hash'), false);
  });

  it('rejects weak passwords before they reach the database', () => {
    for (const weak of ['short', 'alllowercaseonly', '1234567890123']) {
      const result = passwords.validatePasswordStrength(weak);
      assert.strictEqual(result.ok, false, `expected ${weak} to be rejected`);
    }
    assert.strictEqual(passwords.validatePasswordStrength('Correct1-Horse').ok, true);
  });

  it('keeps the browser out of the token business', () => {
    const apiSource = fs.readFileSync(path.join(repoRoot, 'public/assets/js/api.js'), 'utf8');
    const accountSource = fs.readFileSync(path.join(repoRoot, 'public/assets/js/account.js'), 'utf8');

    assert.match(apiSource, /credentials: 'same-origin'/);
    for (const source of [apiSource, accountSource]) {
      assert.ok(!/localStorage|sessionStorage/.test(source), 'no token or identity may be stored client-side');
      assert.ok(!/document\.cookie\s*=/.test(source), 'the session cookie is HttpOnly; JS must not write cookies');
    }
  });

  it('loads the account module before the application shell', () => {
    const html = fs.readFileSync(path.join(repoRoot, 'public/index.html'), 'utf8');
    const apiIndex = html.indexOf('/assets/js/api.js');
    const accountIndex = html.indexOf('/assets/js/account.js');
    const appIndex = html.indexOf('/assets/js/app.js');
    assert.ok(apiIndex > -1 && accountIndex > -1 && appIndex > -1);
    assert.ok(apiIndex < accountIndex && accountIndex < appIndex, 'script order matters');
    assert.match(html, /app\.js\?v=\d+/);
  });
});
