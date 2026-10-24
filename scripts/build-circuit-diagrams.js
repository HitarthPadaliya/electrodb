#!/usr/bin/env node
/**
 * Generate the "Circuit Diagram" artwork for every catalogue component.
 *
 * The design reference ships two drawings:
 *   electrodb-frontend/img/jk-flip-flop.svg          → block/pin-level symbol
 *   electrodb-frontend/img/jk-flip-flop_circuit.svg  → gate/transistor-level circuit
 *
 * Only the reference is hand-drawn per component; everything else is produced
 * here from a small schematic DSL so the whole catalogue shares one visual
 * language (colours and typography taken from the reference):
 *
 *   inputs  #00a7da (cyan)      outputs #00dfc1 (teal)
 *   control #8a8d93 (dashed)    device bodies #0d1117 fill / #168fe5 stroke
 *   labels  Consolas, #e8eaed / #c5c7c9
 *
 * Output: public/assets/svg/circuits/<slug>.svg
 * Usage:  node scripts/build-circuit-diagrams.js [--check]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO, 'public/assets/svg/circuits');
const SQL_FILE = path.join(REPO, 'electrodb.sql');
const W = 640;
const H = 340;

const INK = {
  input: '#00a7da',
  output: '#00dfc1',
  control: '#8a8d93',
  body: '#0d1117',
  bodyStroke: '#168fe5',
  label: '#e8eaed',
  labelMuted: '#c5c7c9',
  pin: '#8a8d93'
};
const FONT = 'Consolas, Consolas, monospace';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class Schematic {
  constructor(title) {
    this.title = title;
    this.parts = [];
  }

  /** Polyline through the given points. */
  wire(points, tone = 'input', dashed = false) {
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
    this.parts.push(
      `<path d="${d}" fill="none" stroke="${INK[tone]}" stroke-width="2" stroke-linecap="round"` +
        `${dashed ? ' stroke-dasharray="7 5"' : ''}/>`
    );
    return this;
  }

  /** Junction dot. */
  node(x, y, tone = 'output', r = 3.2) {
    this.parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${INK[tone]}"/>`);
    return this;
  }

  label(x, y, text, opts = {}) {
    const { anchor = 'start', tone = 'labelMuted', size = 13, weight = 600 } = opts;
    this.parts.push(
      `<text x="${x}" y="${y}" fill="${INK[tone] || tone}" font-family="${FONT}" font-size="${size}" ` +
        `font-weight="${weight}" text-anchor="${anchor}">${esc(text)}</text>`
    );
    return this;
  }

  caption(text) {
    this.label(28, H - 22, text, { size: 11, weight: 400, tone: 'pin' });
    return this;
  }

  /** Logic gate. Inputs are at 30% / 70% of the body height. */
  gate(type, x, y, w = 76, h = 60, name = '') {
    const kind = String(type).toLowerCase();
    const stroke = `fill="${INK.body}" stroke="${INK.bodyStroke}" stroke-width="2" stroke-linejoin="round"`;
    const half = h / 2;

    let body;
    let outOffset = w;
    if (kind.includes('not')) {
      body = `M${x},${y} L${x},${y + h} L${x + w},${y + half} Z`;
      outOffset = w;
    } else if (kind.includes('xor') || kind.includes('or')) {
      body =
        `M${x},${y} Q${x + w * 0.55},${y + h * 0.06} ${x + w},${y + half} ` +
        `Q${x + w * 0.5},${y + h * 0.94} ${x},${y + h} ` +
        `Q${x + w * 0.3},${y + half} ${x},${y} Z`;
    } else {
      body = `M${x},${y} h${w * 0.45} a${half},${half} 0 0 1 0,${h} h${-w * 0.45} Z`;
    }

    this.parts.push(`<path d="${body}" ${stroke}/>`);
    if (kind === 'xor' || kind === 'xnor') {
      this.parts.push(
        `<path d="M${x - 7},${y} Q${x + w * 0.5},${y + half} ${x - 7},${y + h}" fill="none" stroke="${INK.bodyStroke}" stroke-width="2"/>`
      );
    }

    const bubble = /^(nand|nor|xnor|not)$/.test(kind);
    if (bubble) {
      this.parts.push(
        `<circle cx="${x + outOffset + 6}" cy="${y + half}" r="6" fill="${INK.body}" stroke="${INK.bodyStroke}" stroke-width="2"/>`
      );
      outOffset += 12;
    }
    if (name) {
      this.label(x + w * 0.44, y + half + 4, name, { anchor: 'middle', size: 10, weight: 400, tone: 'pin' });
    }

    return {
      in1: { x, y: y + h * 0.3 },
      in2: { x, y: y + h * 0.7 },
      out: { x: x + outOffset, y: y + half }
    };
  }

  /** Rounded device block. */
  block(x, y, w, h, title, sub = '') {
    this.parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${INK.body}" stroke="${INK.bodyStroke}" stroke-width="2"/>`
    );
    this.label(x + w / 2, y + h / 2 + (sub ? -2 : 5), title, { anchor: 'middle', size: 13, tone: 'label' });
    if (sub) {
      this.label(x + w / 2, y + h / 2 + 15, sub, { anchor: 'middle', size: 10, weight: 400, tone: 'pin' });
    }
    return { left: x, right: x + w, mid: y + h / 2, top: y, bottom: y + h };
  }

  resistor(x, y, length = 60, vertical = false, name = '') {
    const z = length * 0.12;
    const zig = vertical
      ? `M${x},${y} v${z} l9,${z * 0.7} l-18,${z * 0.7} l18,${z * 0.7} l-18,${z * 0.7} l18,${z * 0.7} l-9,${z * 0.7} v${z}`
      : `M${x},${y} h${z} l${z * 0.7},-9 l${z * 0.7},18 l${z * 0.7},-18 l${z * 0.7},18 l${z * 0.7},-18 l${z * 0.7},9 h${z}`;
    this.parts.push(`<path d="${zig}" fill="none" stroke="${INK.input}" stroke-width="2" stroke-linejoin="round"/>`);
    if (name) {
      this.label(vertical ? x + 20 : x + length / 2, vertical ? y + length / 2 + 4 : y - 12, name, {
        size: 10,
        weight: 400,
        tone: 'pin',
        anchor: vertical ? 'start' : 'middle'
      });
    }
    return { start: vertical ? [x, y] : [x, y], end: vertical ? [x, y + length] : [x + length, y] };
  }

  /**
   * N/P channel MOSFET. Returns the three external pins so callers can wire
   * exactly onto the symbol.
   */
  mosfet(cx, cy, opts = {}) {
    const { name = 'M1', pchannel = false } = opts;
    const barX = cx - 16;

    // gate bar + gate lead (comes in from the left)
    this.parts.push(`<path d="M${cx - 28},${cy - 26} v52" stroke="${INK.bodyStroke}" stroke-width="2.4"/>`);
    this.parts.push(`<path d="M${cx - 70},${cy} h42" stroke="${INK.input}" stroke-width="2"/>`);

    // channel: three dashes
    this.parts.push(
      `<path d="M${barX},${cy - 24} v14 M${barX},${cy - 5} v10 M${barX},${cy + 10} v14" stroke="${INK.input}" stroke-width="2.4" stroke-linecap="round"/>`
    );

    // drain (top) and source (bottom) legs
    this.parts.push(
      `<path d="M${barX},${cy - 17} h34" stroke="${INK.input}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M${barX},${cy + 17} h34" stroke="${INK.input}" stroke-width="2" stroke-linecap="round"/>`
    );

    // body arrow (N-channel points in, P-channel points out)
    if (pchannel) {
      this.parts.push(`<path d="M${barX},${cy} h20 M${barX},${cy} l9,-5 v10 z" fill="${INK.input}" stroke="${INK.input}" stroke-width="1"/>`);
    } else {
      this.parts.push(`<path d="M${barX},${cy} h20 M${barX + 20},${cy} l-9,-5 v10 z" fill="${INK.input}" stroke="${INK.input}" stroke-width="1"/>`);
    }

    this.label(cx - 26, cy - 30, name, { size: 10, weight: 400, tone: 'pin' });

    return {
      gate: [cx - 70, cy],
      drain: [barX + 34, cy - 17],
      source: [barX + 34, cy + 17]
    };
  }

  diode(x, y, opts = {}) {
    const { kind = 'diode', name = '', angle = 0 } = opts;
    const g = [];
    // triangle points in +x before rotation
    if (angle === 90) {
      g.push(`<path d="M${x - 12},${y - 10} h24 l-12,20 z" fill="${INK.body}" stroke="${INK.input}" stroke-width="2" stroke-linejoin="round"/>`);
      g.push(`<path d="M${x - 12},${y + 10} h24" stroke="${INK.input}" stroke-width="2.2"/>`);
      if (kind === 'zener') g.push(`<path d="M${x - 12},${y + 10} l-5,6 M${x + 12},${y + 10} l5,-6" stroke="${INK.input}" stroke-width="2"/>`);
      if (kind === 'led') g.push(`<path d="M${x + 18},${y - 4} l9,-9 M${x + 18},${y + 6} l9,-9" stroke="${INK.output}" stroke-width="1.6"/>`);
    } else {
      g.push(`<path d="M${x - 12},${y - 12} v24 l20,-12 z" fill="${INK.body}" stroke="${INK.input}" stroke-width="2" stroke-linejoin="round"/>`);
      g.push(`<path d="M${x + 10},${y - 12} v24" stroke="${INK.input}" stroke-width="2.2"/>`);
      if (kind === 'zener') g.push(`<path d="M${x + 10},${y - 12} l-5,-6 M${x + 10},${y + 12} l5,6" stroke="${INK.input}" stroke-width="2"/>`);
      if (kind === 'led') g.push(`<path d="M${x + 2},${y - 16} l9,-9 M${x + 11},${y - 13} l9,-9" stroke="${INK.output}" stroke-width="1.6"/>`);
    }
    this.parts.push(...g);
    if (name) this.label(x, y - (angle === 90 ? 20 : 20), name, { anchor: 'middle', size: 10, weight: 400, tone: 'pin' });
    return this;
  }

  ground(x, y) {
    this.parts.push(
      `<path d="M${x - 13},${y} h26 M${x - 8},${y + 6} h16 M${x - 4},${y + 12} h8" stroke="${INK.control}" stroke-width="2" stroke-linecap="round"/>`
    );
    return this;
  }

  toSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" role="img" aria-label="${esc(
      this.title
    )} circuit diagram">
  <title>${esc(this.title)} — circuit diagram</title>
  <g>
    ${this.parts.join('\n    ')}
  </g>
</svg>
`;
  }
}

// ================================================================== families

/** Logic gates: the Boolean symbol plus its canonical realisation. */
function gateFamily(slug, name) {
  const s = new Schematic(name);
  const key = slug.replace(/-gate$/, '');
  const inverters = { nand: 'and', nor: 'or', xnor: 'xor' };

  if (key === 'not' || key === 'buffer') {
    const g = s.gate(key === 'not' ? 'not' : 'buf', 220, 120, 90, 70, '');
    s.label(70, 128, 'A', { size: 12, tone: 'label' });
    s.wire([[70, 136], [220, 136]], 'input');
    s.wire([[g.out.x, g.out.y], [520, g.out.y]], 'output');
    s.label(70, 300 - 12, 'Y', { tone: 'output', size: 12 });
    s.parts.pop();
    s.label(524, g.out.y + 4, 'Y', { tone: 'output', size: 12 });
    s.caption('CMOS inverter stage; the buffer is the same pair without inversion');
    return s;
  }

  const base = inverters[key] || key;
  const showNot = Object.prototype.hasOwnProperty.call(inverters, key);

  const g = s.gate(showNot ? base : key, 200, 120, 96, 76, base.toUpperCase());
  s.label(64, 130, 'A', { size: 12, tone: 'label' });
  s.label(64, 186, 'B', { size: 12, tone: 'label' });
  s.wire([[64, 143], [200, 143]], 'input');
  s.wire([[64, 173], [200, 173]], 'input');

  if (showNot) {
    const inv = s.gate('not', g.out.x + 40, g.out.y - 20, 44, 40, '');
    s.wire([[g.out.x, g.out.y], [inv.in1.x, inv.out.y]], 'input');
    s.wire([[inv.out.x, inv.out.y], [520, inv.out.y]], 'output');
    s.label(524, inv.out.y + 4, 'Y', { tone: 'output', size: 12 });
  } else {
    s.wire([[g.out.x, g.out.y], [520, g.out.y]], 'output');
    s.label(524, g.out.y + 4, 'Y', { tone: 'output', size: 12 });
  }

  const notes = {
    and: 'AND = NAND followed by an inverter',
    or: 'OR = NOR followed by an inverter',
    not: 'Single input inverter',
    buffer: 'Two inverters in series',
    nand: 'NAND: pull-up network in parallel, pull-down in series',
    nor: 'NOR: pull-up network in series, pull-down in parallel',
    xor: 'XOR from four NAND gates; output is high when inputs differ',
    xnor: 'XNOR is XOR with a final inverter'
  };
  s.caption(notes[key] || 'Logic function realised from inverting gates');
  return s;
}

/** Sequential counters: a flip-flop chain sharing a clock. */
function counterFamily(slug, name, bits) {
  const s = new Schematic(name);
  const stages = Math.max(2, Math.min(bits, 4));
  const boxes = [];
  for (let i = 0; i < stages; i += 1) {
    boxes.push(s.block(120 + i * 120, 104, 84, 96, 'FF', `Q${i}`));
  }

  // shared clock rail (solid, feeds every stage directly)
  s.label(36, 96, 'CLK', { size: 11, tone: 'pin' });
  s.wire([[36, 104], [36, 200], [120, 200]], 'input');
  boxes.forEach(b => s.wire([[b.left, 200], [b.left + 20, 200], [b.left + 20, 200]], 'input'));

  // ripple carry between stages
  boxes.forEach((b, i) => {
    if (i === boxes.length - 1) return;
    s.wire([[b.right, 132], [boxes[i + 1].left, 132]], 'input', true);
  });

  // outputs
  boxes.forEach((b, i) => {
    s.wire([[b.right - 22, 104], [b.right - 22, 84]], 'output');
    s.label(b.right - 22, 74, `Q${i}`, { anchor: 'middle', size: 10, tone: 'output' });
  });

  // asynchronous clear
  s.label(36, 300, 'CLR', { size: 10, tone: 'pin' });
  s.wire([[36, 291], [560, 291]], 'control', true);
  boxes.forEach(b => s.wire([[b.left + 62, 291], [b.left + 62, 200]], 'control', true));

  s.caption(`${stages}-stage sequential chain: dashed links are the ripple carry and asynchronous clear`);
  return s;
}

/** Cross-coupled NAND storage loop. */
function flipFlopFamily(slug, name) {
  const s = new Schematic(name);

  if (/master-slave|dual|quad/.test(slug)) {
    const a = s.block(150, 120, 130, 100, 'MASTER', 'latch');
    const b = s.block(360, 120, 130, 100, 'SLAVE', 'latch');
    s.wire([[70, 170], [150, 170]], 'input');
    s.label(52, 176, 'D', { size: 12, tone: 'label' });
    s.wire([[a.right, 170], [360, 170]], 'input');
    s.wire([[b.right, 170], [560, 170]], 'output');
    s.label(566, 176, 'Q', { tone: 'output', size: 12 });
    s.wire([[60, 268], [580, 268]], 'control', true);
    s.wire([[200, 220], [200, 268]], 'control', true);
    s.wire([[420, 220], [420, 268]], 'control', true);
    s.caption('Two level-sensitive latches clocked in anti-phase to block race-through');
    return s;
  }

  const g1 = s.gate('nand', 250, 96, 88, 64, 'NAND');
  const g2 = s.gate('nand', 250, 216, 88, 64, 'NAND');

  const labels = /sr-/.test(slug) ? ['S', 'R'] : /jk/.test(slug) ? ['J', 'K'] : /d-flip|d-latch|edge/.test(slug) ? ['D', 'CLK'] : ['T', 'CLK'];
  s.label(60, g1.in1.y - 6, labels[0], { size: 12, tone: 'label' });
  s.wire([[60, g1.in1.y], [250, g1.in1.y]], 'input');
  s.label(60, g2.in1.y - 6, labels[1], { size: 12, tone: 'label' });
  s.wire([[60, g2.in1.y], [250, g2.in1.y]], labels[1] === 'CLK' ? 'control' : 'input', labels[1] === 'CLK');

  // cross-coupled feedback
  s.wire([[g2.out.x, g2.out.y], [420, g2.out.y], [420, 70], [196, 70], [196, g1.in2.y], [250, g1.in2.y]], 'input');
  s.wire([[g1.out.x, g1.out.y], [450, g1.out.y], [450, 300], [176, 300], [176, g2.in2.y], [250, g2.in2.y]], 'input');

  // outputs branch off the gate outputs
  s.wire([[g1.out.x, g1.out.y], [560, g1.out.y]], 'output');
  s.label(564, g1.out.y + 4, 'Q', { tone: 'output', size: 12 });
  s.wire([[g1.out.x + 12, g1.out.y], [g1.out.x + 12, 56]], 'output');
  s.wire([[g2.out.x, g2.out.y], [520, g2.out.y]], 'output');
  s.label(524, g2.out.y + 4, "Q'", { tone: 'output', size: 12 });
  s.node(g1.out.x + 12, g1.out.y, 'output');

  s.caption('Cross-coupled NAND storage loop with clocked input steering');
  return s;
}

/** Multiplexers: one AND term per channel, combined by an OR gate. */
function muxFamily(slug, name) {
  const s = new Schematic(name);
  const channels = /16-to-1|16to1/.test(slug) ? 4 : /8-to-1|8to1/.test(slug) ? 4 : /4-to-1|4to1/.test(slug) ? 4 : 2;
  const ands = [];
  for (let i = 0; i < channels; i += 1) {
    const y = 74 + i * 62;
    ands.push(s.gate('and', 190, y, 72, 52, ''));
    s.label(60, y + 20, `D${i}`, { size: 11, tone: 'label' });
    s.wire([[60, y + 26], [190, y + 26]], 'input');
  }

  const or = s.gate('or', 360, 120, 84, 76, 'OR');
  ands.forEach(a => {
    s.wire([[a.out.x, a.out.y], [320, a.out.y], [320, or.out.y]], 'input');
  });

  // select rail feeding the second input of every AND term
  s.label(60, 300, 'S', { size: 11, tone: 'pin' });
  s.wire([[60, 292], [160, 292]], 'control');
  ands.forEach(a => s.wire([[160, a.in2.y], [190, a.in2.y]], 'control', true));

  s.wire([[or.out.x, or.out.y], [560, or.out.y]], 'output');
  s.label(564, or.out.y + 4, 'Y', { tone: 'output', size: 12 });
  s.caption(`${channels}:1 selection — one AND term per channel, combined by an OR gate`);
  return s;
}

/** Decoders / encoders: an AND array over the input rails. */
function decoderFamily(slug, name) {
  const s = new Schematic(name);
  const outputs = /4-to-16|4to16/.test(slug) ? 4 : /3-to-8|3to8/.test(slug) ? 4 : /2-to-4|2to4/.test(slug) ? 4 : 2;
  const rows = outputs;

  for (let i = 0; i < rows; i += 1) {
    const y = 66 + i * 66;
    const g = s.gate('and', 200, y, 76, 50, '');
    s.label(60, y + 24, `A${(i % 2) + 1}`, { size: 11, tone: 'pin' });
    s.wire([[60, y + 30], [200, y + 30]], 'input', i % 2 === 1);
    s.wire([[g.out.x, g.out.y], [400, g.out.y]], 'output');
    s.label(406, g.out.y + 4, `Y${i}`, { tone: 'output', size: 11 });
  }

  s.label(60, 320 - 4, 'Input code', { size: 10, weight: 400, tone: 'pin' });
  s.caption(`${rows} one-of-N outputs; each AND term decodes one input code`);
  return s;
}

function diodeFamily(slug, name) {
  const s = new Schematic(name);
  const kind = /zener/.test(slug) ? 'zener' : /led/.test(slug) ? 'led' : 'diode';

  s.wire([[60, 96], [560, 96]], 'input');
  s.resistor(180, 96, 110, false, 'R1');
  s.diode(400, 96, { kind, name: 'D1' });
  s.wire([[60, 96], [60, 240]], 'input');
  s.ground(60, 240);
  s.wire([[470, 96], [520, 96], [520, 240]], 'input');
  s.ground(520, 240);
  s.label(60, 84, 'V_IN', { size: 11, tone: 'pin' });

  if (kind === 'zener') {
    s.node(520, 96, 'output');
    s.wire([[520, 96], [600, 96]], 'output');
    s.label(566, 84, 'V_OUT', { size: 10, tone: 'output' });
    s.caption('Series resistor with the Zener reversed across the load clamps V_OUT');
  } else if (kind === 'led') {
    s.caption('Current-limited LED: the series resistor sets the forward current');
  } else {
    s.caption('Forward-biased diode with a current-limiting series resistor');
  }
  return s;
}

/** NPN common-emitter stage (BJTs, Darlingtons, phototransistors). */
function bjtFamily(slug, name) {
  const s = new Schematic(name);
  const cx = 300;
  const cy = 190;

  // collector / emitter leads
  s.parts.push(
    `<path d="M${cx},${cy - 42} v56" stroke="${INK.bodyStroke}" stroke-width="2.6"/>` +
      `<path d="M${cx},${cy - 18} L${cx + 46},${cy - 46} V${cy - 96}" stroke="${INK.input}" stroke-width="2" fill="none"/>` +
      `<path d="M${cx},${cy + 18} L${cx + 46},${cy + 46} V${cy + 96}" stroke="${INK.input}" stroke-width="2" fill="none"/>` +
      `<path d="M${cx},${cy} h-52" stroke="${INK.input}" stroke-width="2"/>` +
      `<path d="M${cx + 30},${cy + 34} l-12,-2 l6,12 z" fill="${INK.input}"/>`
  );
  s.label(cx + 54, cy + 6, 'Q1', { size: 10, weight: 400, tone: 'pin' });

  // supply rail, collector resistor, output node
  s.wire([[cx + 46, cy - 96], [cx + 46, 56], [520, 56]], 'input');
  s.label(470, 48, 'V_CC', { size: 10, weight: 400, tone: 'pin' });
  s.resistor(cx + 46, 56, 46, true, 'R_C');
  s.node(cx + 46, 96, 'output');
  s.wire([[cx + 46, 96], [cx + 46, cy - 96]], 'input');
  s.wire([[cx + 46, 96], [540, 96]], 'output');
  s.label(546, 100, 'V_OUT', { tone: 'output', size: 10 });

  // base resistor and input
  s.resistor(140, cy, 84, false, 'R_B');
  s.wire([[60, cy], [140, cy]], 'input');
  s.label(60, cy - 8, 'V_IN', { size: 10, tone: 'pin' });

  // emitter to ground
  s.wire([[cx + 46, cy + 96], [cx + 46, cy + 118]], 'input');
  s.ground(cx + 46, cy + 118);

  s.caption('Common-emitter stage: base current controls the collector current');
  return s;
}

/** MOSFET switch / amplifier. */
function mosfetFamily(slug, name) {
  const s = new Schematic(name);
  const pchannel = /pmos|p-channel/.test(slug);
  const m = s.mosfet(300, 190, { name: 'M1', pchannel });

  // gate input
  s.wire([[60, m.gate[1]], [m.gate[0], m.gate[1]]], 'input');
  s.label(60, m.gate[1] - 8, 'V_IN', { size: 10, tone: 'pin' });

  // drain → load resistor → supply
  s.wire([m.drain, [m.drain[0], 96]], 'input');
  s.resistor(m.drain[0], 56, 40, true, 'R_D');
  s.wire([[m.drain[0], 56], [520, 56]], 'input');
  s.label(470, 48, 'V_DD', { size: 10, weight: 400, tone: 'pin' });
  s.node(m.drain[0], 96, 'output');
  s.wire([[m.drain[0], 96], [540, 96]], 'output');
  s.label(546, 100, 'V_OUT', { tone: 'output', size: 10 });

  // source → ground
  s.wire([m.source, [m.source[0], 290]], 'input');
  s.ground(m.source[0], 290);

  s.caption(pchannel ? 'P-channel device: conducts when the gate is pulled below the source' : 'N-channel device: the gate voltage sets the drain current');
  return s;
}

function opAmpFamily(slug, name) {
  const s = new Schematic(name);
  const top = 116;
  const left = 300;
  const apex = [430, 170];

  // Triangle body with "−" on top and "+" underneath.
  s.parts.push(
    `<path d="M${left},${top} L${left},${224} L${apex[0]},${apex[1]} Z" fill="${INK.body}" stroke="${INK.bodyStroke}" stroke-width="2" stroke-linejoin="round"/>`
  );
  s.label(left + 22, 146, '−', { size: 16, tone: 'labelMuted' });
  s.label(left + 22, 200, '+', { size: 14, tone: 'labelMuted' });
  s.label(left + 62, 176, 'A1', { size: 10, weight: 400, tone: 'pin' });

  const minusY = 138;
  const plusY = 196;
  const outY = apex[1];
  const feedbackY = 66;

  // Output rail
  s.wire([[apex[0], outY], [560, outY]], 'output');
  s.node(560, outY, 'output');
  s.label(566, outY + 4, 'V_OUT', { tone: 'output', size: 10 });

  const adding = /summing/.test(slug);
  const follower = /follower/.test(slug);
  const nonInverting = /non-inverting/.test(slug);

  if (follower) {
    // Unity-gain buffer: output fed straight back to the inverting input.
    s.label(40, plusY - 8, 'V_IN', { size: 10, tone: 'pin' });
    s.wire([[40, plusY], [left, plusY]], 'input');
    s.wire([[500, outY], [500, feedbackY], [240, feedbackY], [240, minusY], [left, minusY]], 'input');
    s.caption('Unity-gain buffer: the output is tied directly to the inverting input');
    return s;
  }

  if (nonInverting) {
    // Signal to "+", feedback divider (R_f / R1) around the inverting input.
    s.label(40, 290, 'V_IN', { size: 10, tone: 'pin' });
    s.wire([[40, 298], [150, 298], [150, plusY], [left, plusY]], 'input');
    s.wire([[left, minusY], [110, minusY]], 'input');
    s.resistor(110, minusY, 80, true, 'R1');
    s.wire([[110, 218], [110, 250]], 'input');
    s.ground(110, 250);
    s.node(240, minusY, 'input');
    s.wire([[240, minusY], [240, feedbackY]], 'input');
    s.resistor(260, feedbackY, 80, false, 'R_f');
    s.wire([[240, feedbackY], [260, feedbackY]], 'input');
    s.wire([[340, feedbackY], [500, feedbackY], [500, outY]], 'input');
    s.caption('Non-inverting amplifier: closed-loop gain is 1 + R_f / R1');
    return s;
  }

  // Inverting (and summing) amplifier.
  s.label(40, minusY - 8, 'V_IN', { size: 10, tone: 'pin' });
  s.wire([[40, minusY], [100, minusY]], 'input');
  s.resistor(100, minusY, 80, false, 'R1');
  s.wire([[180, minusY], [left, minusY]], 'input');
  s.node(240, minusY, 'input');

  if (adding) {
    s.wire([[40, minusY + 56], [160, minusY + 56]], 'input');
    s.label(40, minusY + 48, 'V_IN2', { size: 10, tone: 'pin' });
    s.resistor(160, minusY + 56, 60, false, 'R2');
    s.wire([[220, minusY + 56], [240, minusY + 56], [240, minusY]], 'input');
  }

  // Non-inverting input to ground.
  s.wire([[left, plusY], [266, plusY], [266, 268]], 'input');
  s.ground(266, 268);

  // Feedback resistor from the output back to the inverting node.
  s.wire([[240, minusY], [240, feedbackY]], 'input');
  s.resistor(260, feedbackY, 80, false, 'R_f');
  s.wire([[240, feedbackY], [260, feedbackY]], 'input');
  s.wire([[340, feedbackY], [500, feedbackY], [500, outY]], 'input');

  s.caption(
    adding
      ? 'Summing amplifier: the input currents add across the feedback resistor'
      : 'Inverting amplifier: closed-loop gain is −R_f / R1'
  );
  return s;
}

function regulatorFamily(slug, name) {
  const s = new Schematic(name);
  const switching = /buck|boost|charge-pump|switching|flyback/.test(slug);

  if (switching) {
    s.label(60, 78, 'V_IN', { size: 10, tone: 'pin' });
    s.wire([[60, 86], [170, 86]], 'input');
    s.block(170, 60, 96, 52, 'SW', 'switch');
    s.wire([[266, 86], [340, 86]], 'input');
    s.parts.push(
      `<path d="M340,86 q14,-16 28,0 q14,16 28,0 q14,-16 28,0" fill="none" stroke="${INK.output}" stroke-width="2"/>`
    );
    s.label(392, 56, 'L1', { size: 10, weight: 400, tone: 'pin' });
    s.wire([[424, 86], [560, 86]], 'output');
    s.node(520, 86, 'output');
    s.label(526, 76, 'V_OUT', { size: 10, tone: 'output' });
    s.wire([[470, 86], [470, 136]], 'input');
    s.diode(470, 168, { kind: 'diode', name: 'D1', angle: 90 });
    s.wire([[470, 200], [470, 240]], 'input');
    s.ground(470, 240);
    s.caption('Switching regulator: inductor, freewheeling diode, and output capacitor');
    return s;
  }

  s.label(60, 78, 'V_IN', { size: 10, tone: 'pin' });
  s.wire([[60, 86], [150, 86]], 'input');
  s.parts.push(
    `<circle cx="180" cy="86" r="30" fill="${INK.body}" stroke="${INK.bodyStroke}" stroke-width="2"/>` +
      `<path d="M150,86 h-10 M180,56 v-10 M180,116 v10" stroke="${INK.bodyStroke}" stroke-width="2"/>`
  );
  s.label(180, 90, 'Q1', { size: 10, weight: 400, tone: 'pin', anchor: 'middle' });
  s.wire([[210, 86], [430, 86]], 'output');
  s.resistor(430, 86, 60, false, 'R2');
  s.wire([[490, 86], [566, 86]], 'output');
  s.node(566, 86, 'output');
  s.label(500, 70, 'V_OUT', { size: 10, tone: 'output' });
  s.wire([[520, 86], [520, 150]], 'control');
  s.resistor(520, 150, 56, true, 'R3');
  s.wire([[520, 206], [520, 250]], 'control');
  s.ground(520, 250);
  s.wire([[180, 116], [180, 210], [330, 210]], 'control');
  s.label(250, 196, 'error amplifier', { size: 9, weight: 400, tone: 'pin' });
  s.caption('Linear regulator: a series pass transistor driven by an error amplifier');
  return s;
}

function sensorFamily(slug, name) {
  const s = new Schematic(name);
  s.label(60, 66, 'V+', { size: 10, tone: 'pin' });
  s.wire([[60, 74], [300, 74]], 'input');
  s.wire([[220, 74], [220, 120]], 'input');
  s.resistor(220, 120, 76, true, 'R1');
  s.node(220, 196, 'output');
  s.wire([[220, 196], [400, 196]], 'output');
  s.resistor(220, 196, 78, true, 'R_s');
  s.wire([[220, 274], [220, 300]], 'input');
  s.ground(220, 300);
  s.block(400, 166, 110, 60, 'BUF', 'amp');
  s.wire([[510, 196], [590, 196]], 'output');
  s.label(560, 182, 'V_OUT', { size: 10, tone: 'output' });
  s.wire([[300, 74], [300, 300]], 'control', true);
  s.caption('Sensing element in a divider network followed by a buffer stage');
  return s;
}

function adcFamily(slug, name) {
  const s = new Schematic(name);

  if (/flash/.test(slug)) {
    // resistor ladder with a comparator per tap
    s.wire([[120, 62], [520, 62]], 'input');
    s.label(60, 58, 'V_REF', { size: 10, tone: 'pin' });
    s.wire([[60, 70], [120, 62]], 'input');
    for (let i = 0; i < 4; i += 1) {
      s.resistor(150 + i * 96, 62, 60, false, '');
    }
    s.wire([[120, 62], [120, 200]], 'input');
    s.ground(120, 200);
    for (let i = 0; i < 3; i += 1) {
      const x = 210 + i * 96;
      s.parts.push(`<path d="M${x},62 v34" stroke="${INK.control}" stroke-width="1.6" stroke-dasharray="6 4"/>`);
      s.block(x - 26, 96, 52, 44, 'CMP');
      s.wire([[x, 140], [x, 240]], 'output');
      s.label(x + 8, 254, `D${i}`, { size: 10, tone: 'output' });
    }
    s.caption('Flash ADC: a resistor ladder feeds one comparator per code');
    return s;
  }

  const sh = s.block(120, 140, 100, 64, 'S/H');
  const cmp = s.block(280, 140, 84, 64, 'CMP');
  s.block(424, 140, 104, 64, 'SAR', 'logic');
  s.label(52, 166, 'V_IN', { size: 10, tone: 'pin' });
  s.wire([[52, 174], [120, 174]], 'input');
  s.wire([[sh.right, 174], [280, 174]], 'input');
  s.wire([[cmp.right, 174], [424, 174]], 'output');
  s.wire([[476, 140], [476, 74], [221, 74], [221, 140]], 'output', true);
  s.label(300, 66, 'DAC feedback', { size: 9, weight: 400, tone: 'pin' });
  s.wire([[528, 174], [596, 174]], 'output');
  s.label(562, 158, 'D_OUT', { size: 10, tone: 'output', anchor: 'middle' });
  s.caption('Successive-approximation loop: sample, compare, and drive the DAC back');
  return s;
}

function memoryFamily(slug, name) {
  const s = new Schematic(name);
  s.block(80, 110, 40, 120, 'ROW', 'DEC');
  s.block(150, 110, 190, 120, 'CELL', 'ARRAY');
  s.block(370, 110, 40, 120, 'COL', 'DEC');
  s.wire([[40, 150], [80, 150]], 'input');
  s.label(40, 142, 'ADDR', { size: 9, tone: 'pin' });
  s.wire([[410, 150], [450, 150]], 'input');
  s.wire([[340, 190], [450, 190]], 'output');
  s.block(450, 164, 66, 52, 'S/A');
  s.wire([[516, 190], [590, 190]], 'output');
  s.label(530, 176, 'D_OUT', { size: 10, tone: 'output' });
  s.wire([[150, 250], [130, 250], [130, 300]], 'control');
  s.label(96, 296, 'R/W', { size: 9, weight: 400, tone: 'pin' });
  s.caption('Row and column decoding around a cell array with sense amplifiers');
  return s;
}

function relayFamily(slug, name) {
  const s = new Schematic(name);
  const solidState = /solid-state/.test(slug);

  if (solidState) {
    s.label(40, 122, 'V_CTRL', { size: 10, tone: 'pin' });
    s.wire([[40, 130], [120, 130]], 'input');
    s.resistor(120, 130, 60, false, 'R1');
    s.wire([[180, 130], [240, 130]], 'input');
    s.parts.push(
      `<rect x="240" y="104" width="130" height="66" rx="8" fill="${INK.body}" stroke="${INK.bodyStroke}" stroke-width="2"/>` +
        `<path d="M300,124 l26,26 M326,124 l-26,26" stroke="${INK.output}" stroke-width="2"/>`
    );
    s.label(305, 158, 'OC', { size: 9, weight: 400, tone: 'pin' });
    s.wire([[240, 158], [240, 240]], 'input');
    s.ground(240, 240);
    s.wire([[370, 120], [450, 120]], 'output');
    s.parts.push(`<path d="M450,96 v48" stroke="${INK.output}" stroke-width="2"/>`);
    s.wire([[450, 96], [560, 96]], 'output');
    s.wire([[450, 144], [560, 144]], 'output');
    s.label(520, 88, 'LOAD', { size: 9, weight: 400, tone: 'pin' });
    s.caption('Solid-state relay: an LED pair drives a photo-sensitive output stage');
    return s;
  }

  // Driver stage
  s.label(40, 128, 'V_CTRL', { size: 10, tone: 'pin' });
  s.wire([[40, 136], [120, 136]], 'input');
  s.resistor(120, 136, 60, false, 'R1');
  s.parts.push(
    `<circle cx="230" cy="176" r="30" fill="${INK.body}" stroke="${INK.bodyStroke}" stroke-width="2"/>` +
      `<path d="M230,146 v-14 M230,206 v26" stroke="${INK.input}" stroke-width="2"/>` +
      `<path d="M200,176 h-20" stroke="${INK.input}" stroke-width="2"/>`
  );
  s.label(230, 180, 'Q1', { size: 9, weight: 400, tone: 'pin', anchor: 'middle' });
  s.wire([[180, 136], [180, 176], [200, 176]], 'input');

  // Coil between the supply rail and the collector
  s.wire([[230, 132], [230, 96], [400, 96]], 'input');
  s.label(452, 88, 'V+', { size: 10, weight: 400, tone: 'pin' });
  s.parts.push(
    `<rect x="330" y="72" width="72" height="48" rx="8" fill="${INK.body}" stroke="${INK.output}" stroke-width="2"/>`
  );
  s.label(366, 100, 'COIL', { size: 9, weight: 400, tone: 'pin', anchor: 'middle' });
  s.wire([[330, 96], [230, 96]], 'input');
  s.wire([[430, 96], [470, 96]], 'input');

  // Flyback diode in parallel with the coil (cathode to the supply rail)
  s.wire([[330, 96], [300, 96], [300, 150]], 'input');
  s.wire([[430, 96], [430, 150], [312, 150]], 'input');
  s.diode(300, 150, { kind: 'diode', name: 'D1' });
  s.wire([[230, 96], [300, 96]], 'input');

  // Emitter to ground
  s.wire([[230, 232], [230, 262]], 'input');
  s.ground(230, 262);

  // Isolated contact + load
  s.wire([[470, 210], [520, 210]], 'output');
  s.parts.push(`<path d="M520,210 L566,182" stroke="${INK.output}" stroke-width="2"/>`);
  s.node(520, 210, 'output');
  s.wire([[470, 260], [566, 260]], 'output');
  s.wire([[566, 182], [610, 182]], 'output');
  s.wire([[566, 260], [610, 260]], 'output');
  s.label(470, 202, 'LOAD', { size: 9, weight: 400, tone: 'pin' });

  s.caption('Transistor-driven coil with a flyback diode and an isolated contact');
  return s;
}

function motorFamily(slug, name) {
  const s = new Schematic(name);
  const stepper = /stepper/.test(slug);
  const brushless = /brushless/.test(slug);

  if (stepper) {
    s.block(210, 120, 120, 110, 'DRV', 'bridge');
    for (let i = 0; i < 4; i += 1) {
      s.wire([[70, 140 + i * 26], [210, 140 + i * 26]], 'input');
      s.label(70, 134 + i * 26, `A${i + 1}`, { size: 9, tone: 'pin' });
    }
    s.parts.push(`<circle cx="470" cy="176" r="52" fill="${INK.body}" stroke="${INK.output}" stroke-width="2"/>`);
    s.label(470, 186, 'M', { size: 28, anchor: 'middle', tone: 'output', weight: 700 });
    s.wire([[330, 160], [418, 160]], 'output');
    s.wire([[330, 192], [418, 192]], 'output');
    s.caption('Stepper drive: four half-bridge outputs sequence the phase currents');
    return s;
  }

  s.block(180, 120, 120, 110, 'H', 'BRIDGE');
  s.wire([[70, 150], [180, 150]], 'input');
  s.wire([[70, 200], [180, 200]], 'input');
  s.label(70, 142, 'PWM', { size: 9, tone: 'pin' });
  s.label(70, 192, 'DIR', { size: 9, tone: 'pin' });
  s.wire([[300, 150], [420, 150]], 'output');
  s.wire([[300, 200], [420, 200]], 'output');
  s.parts.push(`<circle cx="470" cy="176" r="50" fill="${INK.body}" stroke="${INK.output}" stroke-width="2"/>`);
  s.label(470, 188, brushless ? 'BL' : 'M', { size: 24, anchor: 'middle', tone: 'output', weight: 700 });
  s.wire([[420, 150], [428, 146]], 'output');
  s.wire([[420, 200], [428, 206]], 'output');
  s.caption(brushless ? 'Brushless drive: a three-phase bridge commutates the windings' : 'Four-switch bridge sets direction and average motor voltage');
  return s;
}

// ------------------------------------------------------------------ mapping
const FAMILY_BY_CATEGORY = {
  6: (c) => counterFamily(c.slug, c.name, /mod-?5|mod5|6|johnson|ring/.test(c.slug) ? 3 : /mod-?8|mod8/.test(c.slug) ? 3 : 4),
  7: (c) => flipFlopFamily(c.slug, c.name),
  8: (c) => gateFamily(c.slug, c.name),
  9: (c) => muxFamily(c.slug, c.name),
  10: (c) => decoderFamily(c.slug, c.name),
  11: (c) => diodeFamily(c.slug, c.name),
  12: (c) => diodeFamily(c.slug, c.name),
  13: (c) => diodeFamily(c.slug, c.name),
  14: (c) => diodeFamily(c.slug, c.name),
  15: (c) => bjtFamily(c.slug, c.name),
  16: (c) => mosfetFamily(c.slug, c.name),
  17: (c) => opAmpFamily(c.slug, c.name),
  18: (c) => regulatorFamily(c.slug, c.name),
  19: (c) => sensorFamily(c.slug, c.name),
  20: (c) => adcFamily(c.slug, c.name),
  21: (c) => memoryFamily(c.slug, c.name),
  22: (c) => relayFamily(c.slug, c.name),
  23: (c) => motorFamily(c.slug, c.name)
};

function familyFor(component) {
  const build = FAMILY_BY_CATEGORY[component.category_id] || FAMILY_BY_CATEGORY[16];
  return build(component);
}

// ------------------------------------------------------------------ sql parse
function splitTuple(line) {
  const fields = [];
  let current = '';
  let quoted = false;
  const source = line.replace(/^\s*\(/, '');
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "'" && source[i - 1] !== '\\') {
      if (quoted && source[i + 1] === "'") {
        current += "'";
        i += 1;
        continue;
      }
      quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) {
      fields.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current.trim().replace(/\);?\s*$/, ''));
  return fields;
}

function readComponents() {
  const lines = fs.readFileSync(SQL_FILE, 'utf8').split('\n');
  const components = [];
  let inComponents = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('INSERT INTO components')) {
      inComponents = true;
      continue;
    }
    if (!inComponents) continue;
    if (line.startsWith('SELECT ')) {
      inComponents = false;
      continue;
    }
    if (!line.startsWith('(')) continue;
    const f = splitTuple(line);
    if (!/^\d+$/.test(f[0])) continue;
    components.push({
      category_id: Number(f[0]),
      name: f[1],
      slug: f[2],
      circuit_symbol_path: f[6]
    });
  }
  return components;
}

function main() {
  const check = process.argv.includes('--check');
  const components = readComponents();
  if (!components.length) {
    console.error('No components parsed from electrodb.sql');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  const seen = new Set();
  for (const component of components) {
    if (seen.has(component.slug)) continue;
    seen.add(component.slug);
    if (component.slug === 'jk-flip-flop') continue; // hand-drawn reference drawing
    const svg = familyFor(component).toSvg();
    const target = path.join(OUT_DIR, `${component.slug}.svg`);
    const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (existing !== svg) {
      written += 1;
      if (!check) fs.writeFileSync(target, svg);
    }
  }

  console.log(`${check ? 'would write' : 'wrote'} ${written} circuit diagrams for ${seen.size} components`);
  console.log('preserved: circuits/jk-flip-flop-circuit.svg (design reference)');
}

if (require.main === module) main();

module.exports = { familyFor, Schematic };
