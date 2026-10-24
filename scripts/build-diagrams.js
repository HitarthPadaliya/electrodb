/**
 * ElectroDB — diagram builder
 *
 * Generates every drawing the catalogue serves, in one visual language
 * (see scripts/lib/svg-kit.js), from the per-component specs in
 * scripts/lib/component-specs.js.
 *
 *   npm run build:diagrams            write everything
 *   npm run build:diagrams -- --check report drift without writing
 *
 * Artwork written:
 *   public/assets/svg/<original symbol path>   pin-level box / gate / device symbol
 *   public/assets/svg/circuits/<slug>.svg      all-NAND implementation or device circuit
 *   public/assets/svg/pinouts/<slug>.svg       DIP IC pinout, where the part is an IC
 *   public/assets/svg/**\/*-state.svg          Moore + Mealy machines, side by side
 *   public/assets/svg/**\/*-timing.svg         compact timing traces
 */

const fs = require('fs');
const path = require('path');

const kit = require('./lib/svg-kit');
const { SPECS } = require('./lib/component-specs');
const { loadSeed } = require('./lib/seed-data');
const circuits = require('./lib/circuit-templates');
const machines = require('./lib/machines');

const REPO = path.resolve(__dirname, '..');
const PUBLIC = path.join(REPO, 'public');
const CHECK = process.argv.includes('--check');

const { components } = loadSeed();

// The two drawings supplied in electrodb-frontend/img/ are the visual reference
// for everything else, so they are shipped verbatim and never regenerated.
const PROTECTED = new Set([
  'assets/svg/flipflops/jk.svg',
  'assets/svg/circuits/jk-flip-flop-circuit.svg'
]);

// ---------------------------------------------------------------- helpers
function parsePin(raw) {
  let label = String(raw);
  let bubble = false;
  let clock = false;
  let dashed = false;
  if (label.endsWith('~')) { dashed = true; label = label.slice(0, -1); }
  if (label.endsWith('*')) { bubble = true; label = label.slice(0, -1); }
  if (label.endsWith('^')) { clock = true; label = label.slice(0, -1); }
  // "2K=" style oddities are treated as plain labels.
  return { label, bubble, clock, dashed };
}

const toPins = list => (list || []).map(parsePin);

const written = [];
const skipped = [];

function write(relPath, content) {
  if (PROTECTED.has(relPath)) return;
  const full = path.join(PUBLIC, relPath);
  const normalised = content.endsWith('\n') ? content : `${content}\n`;
  if (CHECK) {
    const existing = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
    if (existing !== normalised) skipped.push(relPath);
    return;
  }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, normalised, 'utf8');
  written.push(relPath);
}

function resolveSpec(component) {
  return SPECS[component.slug] || {
    name: component.name.toUpperCase().split(' '),
    in: ['IN'],
    out: ['OUT']
  };
}

// ---------------------------------------------------------------- gate symbols
const GATE_BODIES = {
  and: (x, y, s) => `M${x},${y} H${x + s * 0.45} A${s * 0.55},${s * 0.5} 0 0 1 ${x + s * 0.45},${y + s} H${x} Z`,
  nand: (x, y, s) => `M${x},${y} H${x + s * 0.45} A${s * 0.55},${s * 0.5} 0 0 1 ${x + s * 0.45},${y + s} H${x} Z`,
  or: (x, y, s) =>
    `M${x},${y} Q${x + s * 0.22},${y + s * 0.5} ${x},${y + s} Q${x + s * 0.5},${y + s} ${x + s * 0.8},${y + s * 0.5} Q${x + s * 0.5},${y} ${x},${y} Z`,
  nor: (x, y, s) =>
    `M${x},${y} Q${x + s * 0.22},${y + s * 0.5} ${x},${y + s} Q${x + s * 0.5},${y + s} ${x + s * 0.8},${y + s * 0.5} Q${x + s * 0.5},${y} ${x},${y} Z`,
  xor: (x, y, s) =>
    `M${x + 10},${y} Q${x + 10 + s * 0.22},${y + s * 0.5} ${x + 10},${y + s} Q${x + 10 + s * 0.5},${y + s} ${x + 10 + s * 0.8},${y + s * 0.5} Q${x + 10 + s * 0.5},${y} ${x + 10},${y} Z`,
  xnor: (x, y, s) =>
    `M${x + 10},${y} Q${x + 10 + s * 0.22},${y + s * 0.5} ${x + 10},${y + s} Q${x + 10 + s * 0.5},${y + s} ${x + 10 + s * 0.8},${y + s * 0.5} Q${x + 10 + s * 0.5},${y} ${x + 10},${y} Z`,
  not: (x, y, s) => `M${x},${y} L${x + s},${y + s * 0.5} L${x},${y + s} Z`,
  buffer: (x, y, s) => `M${x},${y} L${x + s},${y + s * 0.5} L${x},${y + s} Z`
};

/** Gate symbol: accent outline, hollow output bubble where inverting, pin labels outside. */
function gateSymbol(slug, spec) {
  const kind = spec.gate;
  const inputs = toPins(spec.in);
  const outputs = toPins(spec.out);

  const S = 72; // gate height
  const BODY_W = spec.name && spec.name[0].startsWith('4-IN') ? 96 : 78;
  const X0 = 96;
  const Y0 = 60;
  const bubbles = ['nand', 'nor', 'xnor', 'nand4', 'nor4', 'not'].includes(kind);

  const bodyKind = kind.replace('4', '');
  const body = GATE_BODIES[bodyKind] || GATE_BODIES.and;
  const parts = [];

  const pitch = S / Math.max(inputs.length + 1, 2);
  const inputYs = inputs.map((_, i) => Y0 + pitch * (i + 1));
  inputYs.forEach((y, i) => {
    parts.push(kit.line(X0 - 46, y, X0, y, kit.PALETTE.accent, 2));
    parts.push(
      kit.text(X0 - 56, y + 5.5, inputs[i].label, {
        size: 16,
        fill: kit.PALETTE.inputText,
        anchor: 'end'
      })
    );
  });

  const bodyRight = X0 + BODY_W;
  parts.push(
    `<path d="${body(X0, Y0, BODY_W)}" fill="${kit.PALETTE.accentDim}" stroke="${kit.PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>`
  );

  const outY = Y0 + S / 2;
  let outStart = bodyRight;
  if (bubbles) {
    parts.push(kit.hollowCircle(bodyRight + 5, outY, 5, kit.PALETTE.accent, 2));
    outStart = bodyRight + 10;
  }
  const outEnd = outStart + 40;
  outputs.forEach((pin, i) => {
    const y = outY + i * 24;
    parts.push(kit.line(outStart, y, outEnd, y, kit.PALETTE.output, 2.5));
    parts.push(
      kit.text(outEnd + 10, y + 5.5, pin.label, { size: 16, fill: kit.PALETTE.outputText, anchor: 'start' })
    );
  });

  const width = outEnd + 40;
  const height = Y0 + S + 40;
  return `${kit.svgOpen([width, height], { title: `${spec.name.join(' ')} symbol` })}\n  ${parts.join(
    '\n  '
  )}${kit.svgClose()}`;
}

// ---------------------------------------------------------------- device symbols
const DEVICES = {
  diode: `<path d="M0,-14 v28 l24,-14 z" fill="#101f38" stroke="#00a7da" stroke-width="2" stroke-linejoin="round"/><path d="M24,-14 v28" stroke="#00a7da" stroke-width="2.4"/>`,
  zener: `<path d="M0,-14 v28 l24,-14 z" fill="#101f38" stroke="#00a7da" stroke-width="2" stroke-linejoin="round"/><path d="M24,-14 v28 M24,-14 l-6,-6 M24,14 l6,6" stroke="#00a7da" stroke-width="2.2"/>`,
  schottky: `<path d="M0,-14 v28 l24,-14 z" fill="#101f38" stroke="#00a7da" stroke-width="2" stroke-linejoin="round"/><path d="M24,-14 v28 M24,-14 h-6 v6 M24,14 h6 v-6" stroke="#00a7da" stroke-width="2.2"/>`,
  varactor: `<path d="M0,-14 v28 l24,-14 z" fill="#101f38" stroke="#00a7da" stroke-width="2" stroke-linejoin="round"/><path d="M24,-14 v28 M31,-14 v28" stroke="#00a7da" stroke-width="2.2"/>`,
  photodiode: `<path d="M0,-14 v28 l24,-14 z" fill="#101f38" stroke="#00a7da" stroke-width="2" stroke-linejoin="round"/><path d="M24,-14 v28" stroke="#00a7da" stroke-width="2.4"/><path d="M-14,-22 l10,-10 M-6,-20 l10,-10" stroke="#00a7da" stroke-width="1.6" stroke-linecap="round"/>`,
  led: `<path d="M0,-14 v28 l24,-14 z" fill="#101f38" stroke="#00a7da" stroke-width="2" stroke-linejoin="round"/><path d="M24,-14 v28" stroke="#00a7da" stroke-width="2.4"/><path d="M8,-24 l8,-8 M8,-16 l8,-8" stroke="#00dfc1" stroke-width="1.8" stroke-linecap="round"/>`,
  npn: `<path d="M0,-22 v44" stroke="#00a7da" stroke-width="2.4" stroke-linecap="round"/><path d="M0,-8 L22,-26 M0,8 L22,26" stroke="#00a7da" stroke-width="2.2" stroke-linecap="round"/><path d="M22,-30 v-14 M22,30 v14 M0,0 h-6" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/><path d="M22,26 l-10,-4 l4,-8 z" fill="#00a7da" stroke="none"/>`,
  pnp: `<path d="M0,-22 v44" stroke="#00a7da" stroke-width="2.4" stroke-linecap="round"/><path d="M0,-8 L22,-26 M0,8 L22,26" stroke="#00a7da" stroke-width="2.2" stroke-linecap="round"/><path d="M22,-30 v-14 M22,30 v14 M0,0 h-6" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/><path d="M0,0 l10,4 l-4,8 z" fill="#00a7da" stroke="none"/>`,
  darlington: `<path d="M0,-22 v44" stroke="#00a7da" stroke-width="2.4" stroke-linecap="round"/><path d="M0,-8 L22,-26 M0,8 L22,26 M22,-26 L42,-13 M42,-13 L42,13" stroke="#00a7da" stroke-width="2" stroke-linecap="round"/><path d="M42,-21 L60,-34 M42,21 L60,34" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/>`,
  phototransistor: `<path d="M0,-22 v44" stroke="#00a7da" stroke-width="2.4" stroke-linecap="round"/><path d="M0,-8 L22,-26 M0,8 L22,26" stroke="#00a7da" stroke-width="2.2" stroke-linecap="round"/><path d="M22,-30 v-14 M22,30 v14" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/><path d="M-18,-26 l8,-8 M-12,-14 l8,-8" stroke="#00a7da" stroke-width="1.6" stroke-linecap="round"/>`,
  nmos: `<path d="M0,-24 v48" stroke="#00a7da" stroke-width="2.4" stroke-linecap="round"/><path d="M12,-22 v44" stroke="#c5c7c9" stroke-width="2"/><path d="M12,-14 h16 v-14 M12,14 h16 v14 M12,0 h16" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/><path d="M0,0 h12" stroke="#00a7da" stroke-width="2.2"/>`,
  pmos: `<path d="M0,-24 v48" stroke="#00a7da" stroke-width="2.4" stroke-linecap="round"/><path d="M12,-22 v44" stroke="#c5c7c9" stroke-width="2"/><path d="M12,-14 h16 v-14 M12,14 h16 v14 M12,0 h16" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/><path d="M0,0 h12" stroke="#00a7da" stroke-width="2.2"/><path d="M6,-16 l8,8" stroke="#00a7da" stroke-width="1.6"/>`,
  thermistor: `<rect x="-8" y="-26" width="16" height="52" rx="3" fill="#0d1117" stroke="#00a7da" stroke-width="2"/><path d="M-8,18 L20,-18" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/>`,
  thermocouple: `<path d="M-14,-20 h28 M-14,20 h28" stroke="#c5c7c9" stroke-width="2" stroke-linecap="round"/><path d="M-14,-20 L6,0 L-14,20" stroke="#00a7da" stroke-width="2" stroke-linejoin="round"/>`,
  motor: `<circle cx="0" cy="0" r="26" fill="#0d1117" stroke="#00a7da" stroke-width="2"/><path d="M-10,-10 v20 M0,-10 v20 M10,-10 v20" stroke="#00dfc1" stroke-width="2"/>`
};

/** Two-terminal / three-terminal device symbol with pin labels outside. */
function deviceSymbol(spec) {
  const inputs = toPins(spec.in);
  const outputs = toPins(spec.out);
  const parts = [];
  const cx = 120;
  const cy = 90;

  parts.push(`<g transform="translate(${cx},${cy})">${DEVICES[spec.device] || DEVICES.diode}</g>`);

  // left inputs
  inputs.forEach((pin, i) => {
    const y = cy + (i - (inputs.length - 1) / 2) * 44;
    parts.push(kit.line(cx - 60, y, cx - 16, y, kit.PALETTE.accent, 2));
    parts.push(kit.text(cx - 70, y + 5.5, pin.label, { size: 16, fill: kit.PALETTE.inputText, anchor: 'end' }));
  });

  // right outputs
  outputs.forEach((pin, i) => {
    const y = cy + (i - (outputs.length - 1) / 2) * 44;
    parts.push(kit.line(cx + 16, y, cx + 60, y, kit.PALETTE.output, 2.5));
    parts.push(kit.text(cx + 70, y + 5.5, pin.label, { size: 16, fill: kit.PALETTE.outputText, anchor: 'start' }));
  });

  return `${kit.svgOpen([280, 180], { title: `${spec.name.join(' ')} symbol` })}\n  ${parts.join(
    '\n  '
  )}${kit.svgClose()}`;
}

// ---------------------------------------------------------------- build symbols
let symbolCount = 0;
let pinoutCount = 0;

components.forEach(component => {
  const spec = resolveSpec(component);
  const rel = component.circuit_symbol_path.replace(/^\//, '');

  let svg;
  if (spec.gate) svg = gateSymbol(component.slug, spec);
  else if (spec.device) svg = deviceSymbol(spec);
  else
    svg = kit.boxDiagram({
      name: spec.name,
      title: `${component.name} symbol`,
      inputs: toPins(spec.in),
      outputs: toPins(spec.out),
      top: toPins(spec.top),
      bottom: toPins(spec.bottom)
    }).svg;

  write(rel, svg);
  symbolCount += 1;

  if (spec.pinout) {
    write(`assets/svg/pinouts/${component.slug}.svg`, kit.pinoutDiagram(spec.pinout).svg);
    pinoutCount += 1;
  }
});

// remove stale pinouts that no longer have a spec
const pinoutDir = path.join(PUBLIC, 'assets/svg/pinouts');
if (!CHECK && fs.existsSync(pinoutDir)) {
  components.forEach(component => {
    const spec = resolveSpec(component);
    const file = path.join(pinoutDir, `${component.slug}.svg`);
    if (!spec.pinout && fs.existsSync(file)) fs.unlinkSync(file);
  });
}

// ---------------------------------------------------------------- circuits
let circuitCount = 0;
// Logic gates deliberately have no circuit diagram: their implementation is the
// IC pinout shown with the technical specifications.
const GATE_CATEGORY = 8;

components.forEach(component => {
  const spec = resolveSpec(component);
  const isGate = component.category_id === GATE_CATEGORY;
  const file = path.join(PUBLIC, `assets/svg/circuits/${component.slug}.svg`);

  if (isGate || !spec.circuit) {
    if (!CHECK && fs.existsSync(file)) fs.unlinkSync(file);
    return;
  }
  const svg = spec.circuit ? circuits.build(spec.circuit, `${component.name} circuit diagram`) : null;
  if (!svg) {
    if (!CHECK && fs.existsSync(file)) fs.unlinkSync(file);
    return;
  }
  write(`assets/svg/circuits/${component.slug}.svg`, svg);
  circuitCount += 1;
});

// ---------------------------------------------------------------- state + timing
// Each component keeps its state and timing artwork in the directory that
// matches its category (counters/ or flipflops/), so a drawing exists once.
function supportingDir(categoryId) {
  return categoryId === 6 ? 'counters' : 'flipflops';
}

let stateCount = 0;
let timingCount = 0;

components.forEach(component => {
  const spec = resolveSpec(component);
  const dir = supportingDir(component.category_id);
  const stateRel = `assets/svg/${dir}/${component.slug}-state.svg`;
  const timingRel = `assets/svg/${dir}/${component.slug}-timing.svg`;

  // Drop the other directory's copy if an earlier build left one behind.
  const otherDir = dir === 'counters' ? 'flipflops' : 'counters';
  [stateRel, timingRel].forEach(rel => {
    const stray = path.join(PUBLIC, `assets/svg/${otherDir}/${path.basename(rel)}`);
    if (!CHECK && fs.existsSync(stray)) fs.unlinkSync(stray);
  });

  if (spec.state) {
    write(stateRel, machines.buildState(spec.state, `${component.name} state machine`));
    stateCount += 1;
  } else if (!CHECK && fs.existsSync(path.join(PUBLIC, stateRel))) {
    fs.unlinkSync(path.join(PUBLIC, stateRel));
  }

  if (spec.state) {
    const kind = spec.state.startsWith('counter') ? 'counter' : ['jk', 'd'].includes(spec.state) ? spec.state : 'jk';
    write(timingRel, machines.timingFor(kind, `${component.name} timing diagram`));
    timingCount += 1;
  } else if (!CHECK && fs.existsSync(path.join(PUBLIC, timingRel))) {
    fs.unlinkSync(path.join(PUBLIC, timingRel));
  }
});

console.log(
  `symbols: ${symbolCount}, pinouts: ${pinoutCount}, circuits: ${circuitCount}, state: ${stateCount}, timing: ${timingCount}`
);
module.exports = { gateSymbol, deviceSymbol, toPins, resolveSpec, write, written, skipped };
