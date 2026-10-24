/**
 * ElectroDB — SVG diagram kit
 *
 * One authoritative implementation of the diagram visual language, reverse
 * engineered from the two reference drawings supplied in `electrodb-frontend/img/`:
 *
 *   jk-flip-flop.svg          360x320 box diagram
 *   jk-flip-flop_circuit.svg  1080x480 all-NAND circuit
 *
 * Palette and metrics are taken from those files:
 *   body        #0d1117   pin-level body / gate fill
 *   bodyStroke  #21262d   dark grey body border
 *   gateStroke  #168fe5   gate outline (light blue accent)
 *   accent      #00a7da   input pins, gate outline, active-low bubbles
 *   output      #00dfc1   output pins
 *   wire        #c5c7c9   circuit wires and junction dots
 *   label       #e8eaed   pin labels, box name
 *   labelMuted  #c5c7c9   box name / control labels
 *   control     #8a8d93   dashed preset/clear stubs, pin numbers
 *
 * consolasAdvance: every string in the references lands on 0.55em, which is
 * Consolas' monospace advance; all text fitting below relies on it.
 */

const PALETTE = {
  bg: '#0d1117',
  body: '#0d1117',
  bodyStroke: '#21262d',
  gateStroke: '#168fe5',
  accent: '#00a7da',
  accentDim: '#101f38',
  output: '#00dfc1',
  wire: '#c5c7c9',
  label: '#e8eaed',
  labelMuted: '#c5c7c9',
  control: '#8a8d93',
  inputText: '#168fe5',
  outputText: '#00dfdf'
};

// The reference artwork sets `font-family: Consolas, Consolas`, so every
// generated drawing uses Consolas and nothing else. Monospace advance for
// Consolas is 0.55em, which makes the width maths below exact.
const FONT = 'Consolas';
const ADVANCE = 0.55; // em per character, exact for Consolas

const num = n => (Math.round(n * 100) / 100).toString();

/** Measured width of a string in Consolas at the given font size. */
function textWidth(text, size) {
  return String(text).length * size * ADVANCE;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap a label to a pixel width, then shrink the size until every line fits.
 * Returns { lines, size, lineHeight }.
 */
function fitLabel(text, maxWidth, { maxSize = 18, minSize = 10, lineHeightRatio = 1.2 } = {}) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  let size = maxSize;
  // Wrap at 96% of the available width: Consolas is measured exactly, and the
  // margin keeps the line clear of the border if a fallback face is ever used.
  const limit = maxWidth * 0.96;

  const wrapAt = s => {
    const lines = [];
    let line = '';
    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, s) <= limit || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    return lines;
  };

  let lines = wrapAt(size);
  while (size > minSize && lines.some(l => textWidth(l, size) > limit)) {
    size -= 1;
    lines = wrapAt(size);
  }
  // A single very long token still cannot fit: allow a tighter step.
  while (size > minSize && lines.some(l => textWidth(l, size) > limit)) size -= 0.5;

  return { lines, size, lineHeight: size * lineHeightRatio };
}

function svgOpen(viewBox, { title, ariaLabel } = {}) {
  const [w, h] = viewBox;
  const label = ariaLabel || title;
  const titleEl = title ? `\n  <title>${escapeXml(title)}</title>` : '';
  const roleAttr = label ? ` role="img" aria-label="${escapeXml(label)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(w)} ${num(h)}"${roleAttr}>${titleEl}`;
}

function svgClose() {
  return '\n</svg>\n';
}

// ---------------------------------------------------------------- primitives

const line = (x1, y1, x2, y2, stroke, width = 2) =>
  `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${stroke}" stroke-width="${num(width)}" stroke-linecap="round"/>`;

const dashed = (x1, y1, x2, y2, stroke = PALETTE.control, width = 2) =>
  `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${stroke}" stroke-width="${num(
    width
  )}" stroke-dasharray="8 4"/>`;

const hollowCircle = (cx, cy, r, stroke = PALETTE.label, width = 2) =>
  `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="none" stroke="${stroke}" stroke-width="${num(width)}"/>`;

const dot = (cx, cy, r = 4, fill = PALETTE.wire) =>
  `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}"/>`;

const text = (x, y, value, { size = 16, fill = PALETTE.label, anchor = 'start', weight = 400 } = {}) =>
  `<text x="${num(x)}" y="${num(y)}" fill="${fill}" font-family="${FONT}" font-size="${num(
    size
  )}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(value)}</text>`;

// ---------------------------------------------------------------- box diagram

/**
 * Pin-level box diagram. Geometry mirrors jk-flip-flop.svg exactly:
 *   box 160x160 at (100,80) with rx 12, 40px pin pitch, 30px stubs,
 *   labels 13px clear of the stub, name centred in two 18px lines.
 *
 * spec = {
 *   name: string,
 *   inputs:  [{ label, clock?, bubble? }],
 *   outputs: [{ label, bubble? }],
 *   top:     [{ label, bubble?, dashed? }],
 *   bottom:  [{ label, bubble?, dashed? }],
 *   boxWidth?: number,
 *   minWidth?: number
 * }
 */
function boxDiagram(spec) {
  const inputs = spec.inputs || [];
  const outputs = spec.outputs || [];
  const top = spec.top || [];
  const bottom = spec.bottom || [];

  const PIN_TEXT = 16;
  const STUB = 30;
  const GAP = 13;
  const BOX_W = spec.boxWidth || 160;
  const PITCH = 40;

  const inputWidth = Math.max(0, ...inputs.map(p => textWidth(p.label, PIN_TEXT)));
  const outputWidth = Math.max(0, ...outputs.map(p => textWidth(p.label, PIN_TEXT)));
  const topWidth = Math.max(0, ...top.map(p => textWidth(p.label, 14)));
  const bottomWidth = Math.max(0, ...bottom.map(p => textWidth(p.label, 14)));

  const leftPad = Math.max(100, inputWidth + GAP + STUB + 12);
  const rightPad = Math.max(70, STUB + 15 + outputWidth + 16);

  const rows = Math.max(inputs.length, outputs.length, 1);
  const boxH = Math.max(160, (rows - 1) * PITCH + 40);

  const topSpread = Math.max(topWidth, bottomWidth, 40) + 24;
  const sideNeeded = BOX_W + 20;
  const topRows = Math.max(top.length, bottom.length, 1);
  const boxW = Math.max(BOX_W, topRows > 1 ? (topRows - 1) * topSpread + 60 : BOX_W, sideNeeded);

  const topArea = top.length || bottom.length ? 80 : 40;
  const bottomArea = top.length || bottom.length ? 80 : 40;

  const boxX = leftPad;
  const boxY = topArea;
  const boxRight = boxX + boxW;
  const boxBottom = boxY + boxH;
  const width = Math.max(spec.minWidth || 360, boxRight + rightPad);
  const height = boxY + boxH + bottomArea;

  const cx = boxX + boxW / 2;
  const cyMid = boxY + boxH / 2;

  const parts = [];

  // Pin stubs first so the body draws over them.
  const inputPitch = inputs.length >= 3 ? PITCH : Math.min(60, PITCH);
  const inputYs = inputs.map((pin, i) => cyMid + (i - (inputs.length - 1) / 2) * inputPitch);
  inputs.forEach((pin, i) => {
    const y = inputYs[i];
    parts.push(line(boxX - STUB, y, boxX - (pin.clock ? 12 : 0), y, PALETTE.accent, 2));
    if (pin.clock) {
      parts.push(
        `<polygon points="${num(boxX - 12)},${num(y - 8)} ${num(boxX)},${num(y)} ${num(boxX - 12)},${num(
          y + 8
        )}" fill="none" stroke="${PALETTE.accent}" stroke-width="2"/>`
      );
    }
    if (pin.bubble) parts.push(hollowCircle(boxX, y, 6, PALETTE.label, 2));
  });

  const outputYs = outputs.map(
    (pin, i) => cyMid + (i - (outputs.length - 1) / 2) * (outputs.length === 2 ? 60 : PITCH)
  );
  outputs.forEach((pin, i) => {
    const y = outputYs[i];
    const start = pin.bubble ? boxRight + 12 : boxRight;
    if (pin.bubble) parts.push(hollowCircle(boxRight, y, 6, PALETTE.label, 2));
    parts.push(line(start, y, boxRight + STUB, y, PALETTE.output, 2.5));
  });

  const topXs = top.map((pin, i) => cx + (i - (top.length - 1) / 2) * topSpread);
  top.forEach((pin, i) => {
    const x = topXs[i];
    if (pin.dashed) parts.push(dashed(x, boxY - 40, x, boxY - 6, PALETTE.control, 2));
    else parts.push(line(x, boxY - STUB, x, boxY, PALETTE.accent, 2));
    if (pin.bubble) parts.push(hollowCircle(x, boxY, 6, PALETTE.label, 2));
  });

  const bottomXs = bottom.map((pin, i) => cx + (i - (bottom.length - 1) / 2) * topSpread);
  bottom.forEach((pin, i) => {
    const x = bottomXs[i];
    if (pin.dashed) parts.push(dashed(x, boxBottom + 6, x, boxBottom + 40, PALETTE.control, 2));
    else parts.push(line(x, boxBottom, x, boxBottom + STUB, PALETTE.accent, 2));
    if (pin.bubble) parts.push(hollowCircle(x, boxBottom, 6, PALETTE.label, 2));
  });

  // Body
  parts.push(
    `<rect x="${num(boxX)}" y="${num(boxY)}" width="${num(boxW)}" height="${num(
      boxH
    )}" rx="12" ry="12" fill="${PALETTE.body}" stroke="${PALETTE.bodyStroke}" stroke-width="2"/>`
  );

  // Name, wrapped and shrunk so it can never overflow the body.
  const nameLines = [];
  let nameSize = 18;
  const requested = Array.isArray(spec.name) ? spec.name : String(spec.name).split('\n');
  requested.forEach(chunk => {
    const fitted = fitLabel(chunk, boxW - 24, { maxSize: 18, minSize: 10 });
    nameLines.push(...fitted.lines);
    nameSize = Math.min(nameSize, fitted.size);
  });
  // A wrapped name can also overflow vertically in a short body, so shrink
  // until the whole block fits with clear space above and below.
  const maxBlockH = boxH - 30;
  while (nameSize > 10 && nameLines.length * nameSize * 1.2 > maxBlockH) {
    nameSize -= 1;
  }
  const name = { lines: nameLines, size: nameSize, lineHeight: nameSize * 1.2 };
  const blockH = name.lines.length * name.lineHeight;
  const firstBaseline = cyMid - blockH / 2 + name.lineHeight * 0.78;
  name.lines.forEach((label, i) => {
    parts.push(
      text(cx, firstBaseline + i * name.lineHeight, label, {
        size: name.size,
        fill: PALETTE.labelMuted,
        anchor: 'middle'
      })
    );
  });

  // Pin labels, outside the stubs.
  inputs.forEach((pin, i) => {
    parts.push(
      text(boxX - STUB - GAP, inputYs[i] + 5.5, pin.label, {
        size: PIN_TEXT,
        fill: pin.textFill || PALETTE.label,
        anchor: 'end'
      })
    );
  });
  outputs.forEach((pin, i) => {
    parts.push(
      text(boxRight + STUB + 15, outputYs[i] + 5.5, pin.label, {
        size: PIN_TEXT,
        fill: pin.textFill || PALETTE.label,
        anchor: 'start'
      })
    );
  });
  top.forEach((pin, i) => {
    parts.push(text(topXs[i], boxY - 50, pin.label, { size: 14, fill: PALETTE.labelMuted, anchor: 'middle' }));
  });
  bottom.forEach((pin, i) => {
    parts.push(
      text(bottomXs[i], boxBottom + 60, pin.label, { size: 14, fill: PALETTE.labelMuted, anchor: 'middle' })
    );
  });

  return {
    svg: `${svgOpen([width, height], { title: spec.title || `${spec.name} pin diagram` })}\n  ${parts.join(
      '\n  '
    )}${svgClose()}`,
    width,
    height
  };
}

// ---------------------------------------------------------------- IC pinout

/**
 * DIP-style IC pinout in the same visual language as the box diagram:
 * dark body, dark grey border, light blue inputs, cyan outputs, grey pin
 * numbers and control pins, notch and pin-1 marker.
 *
 * spec = {
 *   part: '74LS73',
 *   left:  [{ label, num, type: 'in'|'out'|'power'|'control' }],
 *   right: [{ label, num, type }]
 * }
 */
function pinoutDiagram(spec) {
  const left = spec.left || [];
  const right = spec.right || [];
  const PIN_TEXT = 14;
  const STUB = 34;
  const PITCH = 34;

  const nameWidth = Math.max(0, ...left.map(p => textWidth(p.label, PIN_TEXT)));
  const outWidth = Math.max(0, ...right.map(p => textWidth(p.label, PIN_TEXT)));
  const numberWidth = 20;
  const pad = 16;

  const leftPad = pad + numberWidth + STUB + nameWidth + 12;
  const rightPad = pad + numberWidth + STUB + outWidth + 12;

  const rows = Math.max(left.length, right.length, 1);
  const bodyH = Math.max(150, (rows - 1) * PITCH + 44);
  // Keep a clear centre column for the part number: left pin names + part name
  // + right pin names must never collide.
  const partW = textWidth(spec.part || '', 20);
  const bodyW = Math.max(150, nameWidth + outWidth + partW + 56);

  const bodyX = leftPad;
  const bodyY = 44;
  const bodyRight = bodyX + bodyW;
  const bodyBottom = bodyY + bodyH;

  const width = Math.max(360, bodyRight + rightPad);
  const height = bodyBottom + 40;

  const cx = bodyX + bodyW / 2;
  const cyMid = bodyY + bodyH / 2;

  const strokeFor = type =>
    type === 'out' ? PALETTE.output : type === 'power' || type === 'control' ? PALETTE.control : PALETTE.accent;

  const parts = [];

  const leftYs = left.map((pin, i) => cyMid + (i - (left.length - 1) / 2) * PITCH);
  const rightYs = right.map((pin, i) => cyMid + (i - (right.length - 1) / 2) * PITCH);

  // Pin stubs and external pin numbers first, then the body, so the body can
  // never cover the internal pin names.
  left.forEach((pin, i) => {
    const y = leftYs[i];
    parts.push(line(bodyX - STUB, y, bodyX, y, strokeFor(pin.type), 2));
    parts.push(
      text(bodyX - STUB - 6, y + 4, String(pin.num), { size: 12, fill: PALETTE.control, anchor: 'end' })
    );
  });
  right.forEach((pin, i) => {
    const y = rightYs[i];
    parts.push(line(bodyRight, y, bodyRight + STUB, y, strokeFor(pin.type), 2));
    parts.push(
      text(bodyRight + STUB + 6, y + 4, String(pin.num), { size: 12, fill: PALETTE.control, anchor: 'start' })
    );
  });

  // Body, pin-1 notch and pin-1 marker.
  parts.push(
    `<rect x="${num(bodyX)}" y="${num(bodyY)}" width="${num(bodyW)}" height="${num(
      bodyH
    )}" rx="10" ry="10" fill="${PALETTE.body}" stroke="${PALETTE.bodyStroke}" stroke-width="2"/>`
  );
  // Notch dips into the body, as on a DIP package; pin 1 is marked outside so
  // it never collides with an internal pin name.
  // The notch is a half-circle cut into the package edge, so the arc sweeps
  // downward into the body rather than bulging above it.
  parts.push(
    `<path d="M${num(cx - 14)},${num(bodyY)} A14,14 0 0 0 ${num(cx + 14)},${num(
      bodyY
    )}" fill="${PALETTE.body}" stroke="${PALETTE.bodyStroke}" stroke-width="2"/>`
  );
  if (left.length) {
    parts.push(hollowCircle(bodyX - STUB - 22, leftYs[0] - 16, 3.5, PALETTE.control, 2));
  }

  // Internal pin names.
  left.forEach((pin, i) => {
    parts.push(text(bodyX + 12, leftYs[i] + 5, pin.label, { size: PIN_TEXT, fill: PALETTE.label, anchor: 'start' }));
  });
  right.forEach((pin, i) => {
    parts.push(text(bodyRight - 12, rightYs[i] + 5, pin.label, { size: PIN_TEXT, fill: PALETTE.label, anchor: 'end' }));
  });

  const part = fitLabel(spec.part || '', bodyW - 40, { maxSize: 20, minSize: 11 });
  const blockH = part.lines.length * part.lineHeight;
  part.lines.forEach((label, i) => {
    parts.push(
      text(cx, cyMid - blockH / 2 + part.lineHeight * 0.78 + i * part.lineHeight, label, {
        size: part.size,
        fill: PALETTE.labelMuted,
        anchor: 'middle'
      })
    );
  });

  return {
    svg: `${svgOpen([width, height], { title: spec.title || `${spec.part} pinout` })}\n  ${parts.join(
      '\n  '
    )}${svgClose()}`,
    width,
    height
  };
}

// ---------------------------------------------------------------- circuit

const WIRE = 2;
const GATE = 50;

/** NAND gate: D body, accent outline, hollow output bubble. Returns {svg, out:{x,y}, in:[...]}. */
function nand(x, y, size = GATE) {
  const s = size;
  const half = s / 2;
  const flat = s * 0.5;
  const d = `M${num(x)},${num(y)} H${num(x + flat)} A${num(half)},${num(half)} 0 0 1 ${num(x + flat)},${num(
    y + s
  )} H${num(x)} Z`;
  const svg = [
    `<path d="${d}" fill="${PALETTE.accentDim}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>`,
    hollowCircle(x + s + 4, y + half, 4, PALETTE.accent, 2)
  ].join('\n  ');
  return {
    svg,
    width: s + 8,
    out: { x: x + s + 8, y: y + half },
    inputs: [
      { x, y: y + s * 0.3 },
      { x, y: y + s * 0.7 }
    ]
  };
}

function wire(points, stroke = PALETTE.wire) {
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${num(p[0])},${num(p[1])}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${WIRE}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const inLabel = (x, y, value) => text(x, y, value, { size: 24, fill: PALETTE.inputText });
const outLabel = (x, y, value) => text(x, y, value, { size: 24, fill: PALETTE.outputText });

/**
 * Compose a circuit from a list of draw calls. Everything that is not a NAND
 * gate, wire, junction dot or pin label is intentionally impossible here.
 */
function circuit({ width = 1080, height = 480, title, body }) {
  const content = body.filter(Boolean).join('\n  ');
  return `${svgOpen([width, height], { title })}\n  ${content}${svgClose()}`;
}

// ---------------------------------------------------------------- state diagram

/**
 * State machine drawings.
 *
 * Both machines for a part live in ONE svg, side by side (Moore left, Mealy
 * right). The canvas is wider than the artwork and the states are small, so the
 * diagram renders small in the page. Borders are hairline (1) by design.
 */
const CAPTION_GAP = 44;

/** Baseline for a panel caption: just below the lowest drawn state. */
function captionBaseline(states, radius) {
  const bottom = states.reduce(
    (max, s) => Math.max(max, s.y + radius + (s.output ? (radius < 20 ? 11 : 14) : 0)),
    0
  );
  return bottom + CAPTION_GAP;
}

function machinePanel(states, edges, { ox, oy, caption, width, height, radius = 24, showOutputs = true, inlineOutput = false }) {
  const byId = new Map(states.map(s => [s.id, s]));
  const parts = [];
  const STROKE = 1;

  // The machines are drawn free-standing: no panel border. The name of the
  // model is written underneath its own drawing.

  edges.forEach(edge => {
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) return;
    const ax = a.x + ox;
    const ay = a.y + oy;
    const bx = b.x + ox;
    const by = b.y + oy;

    if (a === b) {
      parts.push(
        `<path d="M${num(ax - 10)},${num(ay - radius + 3)} C${num(ax - 26)},${num(ay - radius - 26)} ${num(
          ax + 16
        )},${num(ay - radius - 34)} ${num(ax + 10)},${num(ay - radius + 1)}" fill="none" stroke="${PALETTE.control}" stroke-width="${STROKE}"/>`
      );
      if (edge.label) {
        parts.push(text(ax + 20, ay - radius - 12, edge.label, { size: 11, fill: PALETTE.accent, anchor: 'start' }));
      }
      return;
    }

    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const sx = ax + ux * radius;
    const sy = ay + uy * radius;
    const ex = bx - ux * radius;
    const ey = by - uy * radius;

    const bend = edge.curve || 0;
    const mx = (sx + ex) / 2 - uy * bend;
    const my = (sy + ey) / 2 + ux * bend;

    parts.push(
      `<path d="M${num(sx)},${num(sy)} Q${num(mx)},${num(my)} ${num(ex)},${num(ey)}" fill="none" stroke="${PALETTE.control}" stroke-width="${STROKE}"/>`
    );

    const tx = ex - mx;
    const ty = ey - my;
    const tl = Math.hypot(tx, ty) || 1;
    const nx = tx / tl;
    const ny = ty / tl;
    const px = -ny;
    const py = nx;
    parts.push(
      `<path d="M${num(ex)},${num(ey)} L${num(ex - nx * 7 + px * 3)},${num(ey - ny * 7 + py * 3)} L${num(
        ex - nx * 7 - px * 3
      )},${num(ey - ny * 7 - py * 3)} Z" fill="${PALETTE.control}"/>`
    );

    if (edge.label) {
      const lx = (sx + 2 * mx + ex) / 4;
      const ly = (sy + 2 * my + ey) / 4;
      // Offset perpendicular to the curve so the label never sits on the line,
      // choosing the side that faces away from the panel centre.
      const perpX = -ny;
      const perpY = nx;
      const cx0 = ox + width / 2;
      const cy0 = oy + height / 2;
      const away = perpX * (lx - cx0) + perpY * (ly - cy0) >= 0 ? 1 : -1;
      const off = 15 * away;
      parts.push(
        text(lx + perpX * off, ly + perpY * off, edge.label, {
          size: 11,
          fill: PALETTE.accent,
          anchor: 'middle'
        })
      );
    }
  });

  states.forEach(state => {
    const x = state.x + ox;
    const y = state.y + oy;
    parts.push(
      `<circle cx="${num(x)}" cy="${num(y)}" r="${radius}" fill="${PALETTE.body}" stroke="${
        PALETTE.bodyStroke
      }" stroke-width="${STROKE}"/>`
    );
    const labelY = y + (radius < 20 ? 3.5 : 4);
    parts.push(
      text(inlineOutput ? x : x, inlineOutput ? labelY - 6 : labelY, state.label, {
        size: radius < 20 ? 11 : 13,
        fill: PALETTE.label,
        anchor: 'middle'
      })
    );
    if (state.output && showOutputs) {
      // On a tight ring the output is written inside the state so it cannot
      // collide with the transition labels running past it.
      const outputY = inlineOutput ? labelY + 10 : y + radius + (radius < 20 ? 16 : 14);
      parts.push(
        text(x, outputY, state.output, {
          size: inlineOutput ? 10 : radius < 20 ? 9 : 11,
          fill: PALETTE.output,
          anchor: 'middle'
        })
      );
    }
  });

  if (caption) {
    // Sit the caption just under the artwork rather than under the nominal
    // panel height, so a small machine does not leave a gap above its name.
    parts.push(
      text(ox + width / 2, oy + captionBaseline(states, radius), caption, {
        size: 16,
        fill: PALETTE.labelMuted,
        anchor: 'middle'
      })
    );
  }

  return parts.join('\n  ');
}

/**
 * Lay states out on an ellipse so both panels stay compact. Two-state machines
 * sit side by side (the natural reading for a transition pair); longer cycles
 * wrap around the ellipse.
 */
/**
 * Serpentine layout for long cycles (counters): states flow left to right along
 * one row, then turn and flow back along the next, so nothing overlaps and the
 * reading order stays obvious.
 */
function snakeStates(items, panelW, panelH, perRow) {
  const rows = Math.ceil(items.length / perRow);
  const rowH = (panelH - 70) / Math.max(rows, 1);
  return items.map((item, i) => {
    const row = Math.floor(i / perRow);
    const inRow = i % perRow;
    const count = Math.min(perRow, items.length - row * perRow);
    const step = (panelW - 70) / Math.max(perRow - 1, 1);
    const leftToRight = row % 2 === 0;
    const x = 35 + (leftToRight ? inRow : count - 1 - inRow) * step;
    const y = 60 + row * rowH;
    return { ...item, x, y };
  });
}

function ringStates(items, cx, cy, rx, ry = rx) {
  const n = items.length;
  if (n === 2) {
    return items.map((item, i) => ({ ...item, x: cx + (i === 0 ? -1 : 1) * rx, y: cy }));
  }
  return items.map((item, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { ...item, x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
}

/**
 * spec = { part, states: [{id,label,output?}], moore: {edges}, mealy: {edges} }
 * Both panels use the same state layout; only the transitions and the output
 * annotation differ (Moore prints the output on the state, Mealy on the edge).
 */
function stateMachine(spec) {
  const PANEL_W = 400;
  const n = spec.states.length;
  const PANEL_H = n <= 2 ? 210 : n <= 4 ? 270 : n <= 8 ? 300 : 330;
  const GAP = 16;
  const width = PANEL_W * 2 + GAP + 24;
  const OY = 32;
  const dense = n > 8;
  const radius = dense ? 15 : 24;
  const layout = dense
    ? snakeStates(spec.states, PANEL_W, PANEL_H, Math.ceil(n / 2))
    : ringStates(
        spec.states,
        PANEL_W / 2,
        PANEL_H / 2 + 10,
        spec.rx || (n <= 2 ? 108 : 118),
        spec.ry || (n <= 2 ? 60 : 100)
      );

  // The canvases are sized from the artwork so the caption sits tight beneath
  // each machine.
  const height = OY + captionBaseline(layout, radius) + 16;

  const left = machinePanel(layout, spec.moore.edges, {
    ox: 10,
    oy: OY,
    caption: 'Moore',
    width: PANEL_W,
    height: PANEL_H,
    radius,
    showOutputs: true,
    inlineOutput: !dense && n > 4
  });
  const right = machinePanel(layout, spec.mealy.edges, {
    ox: 10 + PANEL_W + GAP,
    oy: OY,
    caption: 'Mealy',
    width: PANEL_W,
    height: PANEL_H,
    radius,
    showOutputs: false
  });

  return `${svgOpen([width, height], { title: spec.title })}\n  ${left}\n  ${right}${svgClose()}`;
}

// ---------------------------------------------------------------- timing

/**
 * Compact digital timing diagram: rail-to-rail traces with hairline guides.
 * spec = { rows: [{ label, values: [0|1, ...] }], clocks?: number }
 */
function timingDiagram(spec) {
  const rows = spec.rows || [];
  const WAVE_W = 620;
  const X0 = 96;
  const Y0 = 40;
  const ROW_H = 46;
  const HIGH = 16;
  const LOW = 38; // relative to row baseline
  const cols = Math.max(1, ...rows.map(r => r.values.length));

  const width = X0 + WAVE_W + 40;
  const height = Y0 + rows.length * ROW_H + 24;

  const parts = [];
  const step = WAVE_W / cols;

  // Hairline cycle guides.
  for (let i = 0; i <= cols; i += 1) {
    const x = X0 + i * step;
    parts.push(
      `<line x1="${num(x)}" y1="${num(Y0 - 8)}" x2="${num(x)}" y2="${num(
        height - 14
      )}" stroke="${PALETTE.bodyStroke}" stroke-width="1"/>`
    );
  }

  rows.forEach((row, r) => {
    const base = Y0 + r * ROW_H + 10;
    const hi = base + 2;
    const lo = base + 22;
    parts.push(text(X0 - 12, base + 15, row.label, { size: 15, fill: PALETTE.labelMuted, anchor: 'end' }));

    let d = '';
    let prev = null;
    for (let i = 0; i < cols; i += 1) {
      const x = X0 + i * step;
      const isHigh = Number(row.values[i]) === 1;
      const y = isHigh ? hi : lo;
      if (prev === null) d += `M${num(x)},${num(y)}`;
      else if (prev !== y) d += ` V${num(prev)} H${num(x)} V${num(y)}`;
      d += ` H${num(x + step)}`;
      prev = y;
    }
    const stroke = row.color || (r % 2 === 0 ? PALETTE.accent : PALETTE.output);
    parts.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
  });

  return `${svgOpen([width, height], { title: spec.title })}\n  ${parts.join('\n  ')}${svgClose()}`;
}

module.exports = {
  PALETTE,
  FONT,
  ADVANCE,
  textWidth,
  fitLabel,
  escapeXml,
  svgOpen,
  svgClose,
  line,
  dashed,
  hollowCircle,
  dot,
  text,
  boxDiagram,
  pinoutDiagram,
  nand,
  wire,
  inLabel,
  outLabel,
  circuit,
  stateMachine,
  machinePanel,
  ringStates,
  timingDiagram
};
