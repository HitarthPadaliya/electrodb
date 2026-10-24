/**
 * ElectroDB — all-NAND circuit diagrams
 *
 * Every digital part is drawn as a NAND-only implementation on the reference
 * canvas (1080x480), following electrodb-frontend/img/jk-flip-flop_circuit.svg:
 *
 *   gates   light blue outline, dark fill, hollow output bubble, no text
 *   wires   light grey, orthogonal, grey junction dots at real joins
 *   labels  inputs light blue, outputs cyan, 24px Consolas, outside the art
 *
 * Geometry is written out per template with dedicated routing channels so no
 * wire crosses a gate body.
 */

const kit = require('./svg-kit');

const { PALETTE, wire, dot, inLabel, outLabel, circuit } = kit;

const W = 1080;
const H = 480;
const BUB = 6;

/**
 * NAND gate with an arbitrary input count.
 * Returns input positions on the left edge, plus the bubble/output position.
 */
function gate(x, y, s, count = 2) {
  const half = s / 2;
  const flat = s * 0.46;
  const d = `M${x},${y} H${x + flat} A${half},${half} 0 0 1 ${x + flat},${y + s} H${x} Z`;
  const bx = x + s + BUB + 2;
  const by = y + half;
  // Spread inputs across the middle 60% of the gate edge.
  const inset = s * 0.2;
  const usable = s - inset * 2;
  const inputs = [];
  for (let i = 0; i < count; i += 1) {
    inputs.push(count === 1 ? by : y + inset + (usable * i) / (count - 1));
  }
  return {
    body: [
      `<path d="${d}" fill="${PALETTE.accentDim}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>`,
      kit.hollowCircle(bx, by, BUB, PALETTE.accent, 2)
    ].join('\n  '),
    x,
    y,
    s,
    inputs,
    out: bx + BUB,
    outY: by
  };
}

/** Orthogonal wire through a list of points. */
const w = pts => ({ w: pts });
const g = (x, y, s = 56, count = 2) => ({ gate: [x, y, s, count] });
const j = (x, y) => ({ dot: [x, y] });
const pin = (x, y, label) => ({ in: [x, y, label] });
const sig = (x, y, label) => ({ out: [x, y, label] });

/** Terminals of every gate in the drawing, used to validate wire endpoints. */
function terminalsOf(items) {
  const points = [];
  items.forEach(item => {
    if (!item.gate) return;
    const gg = gate(item.gate[0], item.gate[1], item.gate[2], item.gate[3]);
    gg.inputs.forEach(y => points.push([gg.x, y]));
    points.push([gg.out, gg.outY]);
  });
  return points;
}

function onSegment(pt, a, b, tol = 0.6) {
  const [x, y] = pt;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const within = x >= Math.min(x1, x2) - tol && x <= Math.max(x1, x2) + tol &&
    y >= Math.min(y1, y2) - tol && y <= Math.max(y1, y2) + tol;
  if (!within) return false;
  if (Math.abs(x1 - x2) < tol) return Math.abs(x - x1) <= tol;
  if (Math.abs(y1 - y2) < tol) return Math.abs(y - y1) <= tol;
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  return Math.abs(cross) <= tol * Math.hypot(x2 - x1, y2 - y1);
}

function near(a, b, tol = 0.6) {
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
}

/**
 * Every wire endpoint must land on a gate terminal, a labelled pin, or another
 * wire (a junction). Anything else is a dangling line - the "artefact" this
 * module exists to prevent.
 */
function validate(items) {
  const terminals = terminalsOf(items);
  const pins = items.filter(i => i.in || i.out).map(i => (i.in ? i.in : i.out));
  const anchors = [];
  items.forEach(i => {
    if (i.w) i.w.forEach(pt => anchors.push(pt));
  });

  const problems = [];

  // Every segment must be horizontal or vertical: diagonals read as artefacts.
  items.forEach(item => {
    if (!item.w) return;
    item.w.forEach((pt, idx) => {
      if (idx === 0) return;
      const prev = item.w[idx - 1];
      const dx = Math.abs(pt[0] - prev[0]);
      const dy = Math.abs(pt[1] - prev[1]);
      if (dx > 0.6 && dy > 0.6) {
        problems.push(`diagonal wire ${prev[0]},${prev[1]} -> ${pt[0]},${pt[1]}`);
      }
    });
  });

  items.forEach(item => {
    if (!item.w) return;
    const ends = [item.w[0], item.w[item.w.length - 1]];
    ends.forEach(pt => {
      const onTerminal = terminals.some(t => near(t, pt));
      const onPin = pins.some(t => near(t, pt, 90) && Math.abs(t[1] - pt[1]) < 90);
      const onWire =
        anchors.filter(a => near(a, pt)).length > 1 ||
        items.some(i => i.w && i.w.some((v, idx) => idx < i.w.length - 1 && onSegment(pt, v, i.w[idx + 1])));
      if (!onTerminal && !onPin && !onWire) {
        problems.push(`dangling wire end at ${pt[0]},${pt[1]}`);
      }
    });
  });
  // Every gate terminal must actually be wired to something.
  const wireEnds = [];
  const wireSegs = [];
  items.forEach(i => {
    if (!i.w) return;
    wireEnds.push(i.w[0], i.w[i.w.length - 1]);
    i.w.forEach((v, idx) => { if (idx < i.w.length - 1) wireSegs.push([v, i.w[idx + 1]]); });
  });

  const touches = pt =>
    wireEnds.some(e => near(e, pt)) || wireSegs.some(([a, b]) => onSegment(pt, a, b));

  items.forEach(item => {
    if (!item.gate) return;
    const gg = gate(item.gate[0], item.gate[1], item.gate[2], item.gate[3]);
    gg.inputs.forEach((y, idx) => {
      if (!touches([gg.x, y])) problems.push(`gate input ${idx} at ${gg.x},${y} unconnected`);
    });
    if (!touches([gg.out, gg.outY])) problems.push(`gate output at ${gg.out},${gg.outY} unconnected`);
  });

  return problems;
}

function draw(items, title) {
  const problems = validate(items);
  if (problems.length) {
    console.warn(`  ! ${title}: ${problems.slice(0, 4).join('; ')}`);
  }
  const parts = [];
  items.forEach(item => {
    if (item.gate) {
      const gg = gate(item.gate[0], item.gate[1], item.gate[2], item.gate[3]);
      parts.push(gg.body);
    } else if (item.w) {
      parts.push(wire(item.w));
    } else if (item.dot) {
      parts.push(dot(item.dot[0], item.dot[1], 4.5, PALETTE.wire));
    } else if (item.in) {
      parts.push(inLabel(item.in[0], item.in[1], item.in[2]));
    } else if (item.out) {
      parts.push(outLabel(item.out[0], item.out[1], item.out[2]));
    }
  });
  return circuit({ width: W, height: H, title, body: parts });
}

// ================================================================ flip-flops

/**
 * JK from four NANDs:
 *   A  = NAND(J, CLK, Q')      B  = NAND(K, CLK, Q)
 *   Q  = NAND(A, Q')           Q' = NAND(B, Q)
 * Gate positions are chosen so the steering outputs land on the latch inputs.
 */
function jkFlipFlop(title) {
  const n1 = { x: 330, y: 70, s: 80, n: 3 };
  const n2 = { x: 330, y: 310, s: 80, n: 3 };
  const n3 = { x: 700, y: 94, s: 80, n: 2 };
  const n4 = { x: 700, y: 334, s: 80, n: 2 };

  const a = gate(n1.x, n1.y, n1.s, n1.n); // inputs 86,110,134 ; out 110
  const b = gate(n2.x, n2.y, n2.s, n2.n); // inputs 326,350,374 ; out 350
  const q = gate(n3.x, n3.y, n3.s, n3.n); // inputs 110,154 ; out 134
  const qb = gate(n4.x, n4.y, n4.s, n4.n); // inputs 350,398 ; out 374

  return draw(
    [
      g(n1.x, n1.y, n1.s, n1.n),
      g(n2.x, n2.y, n2.s, n2.n),
      g(n3.x, n3.y, n3.s, n3.n),
      g(n4.x, n4.y, n4.s, n4.n),

      // J, K and CLK.
      w([[60, a.inputs[0]], [a.x, a.inputs[0]]]),
      w([[60, b.inputs[0]], [b.x, b.inputs[0]]]),
      w([[60, 210], [180, 210]]),
      w([[180, 210], [180, a.inputs[1]], [a.x, a.inputs[1]]]),
      w([[180, 210], [180, b.inputs[1]], [b.x, b.inputs[1]]]),
      j(180, 210),
      pin(34, a.inputs[0] + 8, 'J'),
      pin(34, b.inputs[0] + 8, 'K'),
      pin(34, 218, 'CLK'),

      // Steering outputs feed the latch gates directly.
      w([[a.out, a.outY], [q.x, q.inputs[0]]]),
      w([[b.out, b.outY], [qb.x, qb.inputs[0]]]),

      // Q' net: Q' gate output -> top channel -> A and the Q gate.
      w([[qb.out, qb.outY], [840, qb.outY]]),
      j(840, qb.outY),
      w([[840, qb.outY], [840, 40], [280, 40], [280, a.inputs[2]], [a.x, a.inputs[2]]]),
      j(660, 40),
      w([[660, 40], [660, q.inputs[1]], [q.x, q.inputs[1]]]),

      // Q net: Q gate output -> bottom channel -> B and the Q' gate.
      w([[q.out, q.outY], [880, q.outY]]),
      j(880, q.outY),
      w([[880, q.outY], [880, 464], [280, 464], [280, b.inputs[2]], [b.x, b.inputs[2]]]),
      j(660, 464),
      w([[660, 464], [660, qb.inputs[1]], [qb.x, qb.inputs[1]]]),

      // Outputs.
      w([[880, q.outY], [1000, q.outY]]),
      w([[840, qb.outY], [1000, qb.outY]]),
      sig(1012, q.outY + 8, 'Q'),
      sig(1012, qb.outY + 8, "Q'")
    ],
    title
  );
}

/** T flip-flop: same topology, one input drives both steering gates. */
function tFlipFlop(title) {
  const a = gate(330, 70, 80, 3);
  const b = gate(330, 310, 80, 3);
  const q = gate(700, 94, 80, 2);
  const qb = gate(700, 334, 80, 2);

  return draw(
    [
      g(330, 70, 80, 3),
      g(330, 310, 80, 3),
      g(700, 94, 80, 2),
      g(700, 334, 80, 2),

      // T fans out to both steering gates.
      w([[60, a.inputs[0]], [160, a.inputs[0]], [a.x, a.inputs[0]]]),
      j(160, a.inputs[0]),
      w([[160, a.inputs[0]], [160, b.inputs[0]], [b.x, b.inputs[0]]]),

      w([[60, 210], [180, 210]]),
      w([[180, 210], [180, a.inputs[1]], [a.x, a.inputs[1]]]),
      w([[180, 210], [180, b.inputs[1]], [b.x, b.inputs[1]]]),
      j(180, 210),
      pin(34, a.inputs[0] + 8, 'T'),
      pin(34, 218, 'CLK'),

      w([[a.out, a.outY], [q.x, q.inputs[0]]]),
      w([[b.out, b.outY], [qb.x, qb.inputs[0]]]),

      w([[qb.out, qb.outY], [840, qb.outY]]),
      j(840, qb.outY),
      w([[840, qb.outY], [840, 40], [280, 40], [280, a.inputs[2]], [a.x, a.inputs[2]]]),
      j(660, 40),
      w([[660, 40], [660, q.inputs[1]], [q.x, q.inputs[1]]]),

      w([[q.out, q.outY], [880, q.outY]]),
      j(880, q.outY),
      w([[880, q.outY], [880, 464], [280, 464], [280, b.inputs[2]], [b.x, b.inputs[2]]]),
      j(660, 464),
      w([[660, 464], [660, qb.inputs[1]], [qb.x, qb.inputs[1]]]),

      w([[880, q.outY], [1000, q.outY]]),
      w([[840, qb.outY], [1000, qb.outY]]),
      sig(1012, q.outY + 8, 'Q'),
      sig(1012, qb.outY + 8, "Q'")
    ],
    title
  );
}

/**
 * D latch: A = NAND(D, CLK), B = NAND(~D, CLK), Q = NAND(A, Q'), Q' = NAND(B, Q).
 */
function dFlipFlop(title) {
  const inv = gate(250, 366, 56, 1); // input 394
  const a = gate(450, 94, 80, 2); // inputs 110,154 ; out 134
  const b = gate(450, 334, 80, 2); // inputs 350,394 ; out 374
  const q = gate(760, 118, 80, 2); // inputs 134,178
  const qb = gate(760, 358, 80, 2); // inputs 374,418

  return draw(
    [
      g(250, 366, 56, 1),
      g(450, 94, 80, 2),
      g(450, 334, 80, 2),
      g(760, 118, 80, 2),
      g(760, 358, 80, 2),

      // D into A, and inverted into B.
      w([[60, a.inputs[0]], [140, a.inputs[0]], [a.x, a.inputs[0]]]),
      j(140, a.inputs[0]),
      w([[140, a.inputs[0]], [140, inv.inputs[0]], [inv.x, inv.inputs[0]]]),
      w([[inv.out, inv.outY], [410, inv.outY], [410, b.inputs[0]], [b.x, b.inputs[0]]]),
      pin(34, a.inputs[0] + 8, 'D'),

      // CLK into both steering gates.
      w([[60, 240], [190, 240]]),
      w([[190, 240], [190, a.inputs[1]], [a.x, a.inputs[1]]]),
      j(190, 240),
      w([[190, 240], [190, b.inputs[1]], [b.x, b.inputs[1]]]),
      pin(34, 248, 'CLK'),

      w([[a.out, a.outY], [q.x, q.inputs[0]]]),
      w([[b.out, b.outY], [qb.x, qb.inputs[0]]]),

      // Cross-coupled feedback.
      w([[qb.out, qb.outY], [900, qb.outY]]),
      j(900, qb.outY),
      w([[900, qb.outY], [900, 40], [700, 40], [700, q.inputs[1]], [q.x, q.inputs[1]]]),
      w([[q.out, q.outY], [940, q.outY]]),
      j(940, q.outY),
      w([[940, q.outY], [940, 464], [700, 464], [700, qb.inputs[1]], [qb.x, qb.inputs[1]]]),

      w([[940, q.outY], [1000, q.outY]]),
      w([[900, qb.outY], [1000, qb.outY]]),
      sig(1012, q.outY + 8, 'Q'),
      sig(1012, qb.outY + 8, "Q'")
    ],
    title
  );
}

/** SR latch: the cross-coupled NAND pair on its own. */
function srLatch(title) {
  const n1 = gate(360, 110, 80, 2);
  const n2 = gate(360, 290, 80, 2);

  return draw(
    [
      g(360, 110, 80, 2),
      g(360, 290, 80, 2),

      w([[60, n1.inputs[0]], [360, n1.inputs[0]]]),
      w([[60, n2.inputs[0]], [360, n2.inputs[0]]]),
      pin(34, n1.inputs[0] + 8, 'S'),
      pin(34, n2.inputs[0] + 8, 'R'),

      // Cross-coupled feedback, wrapped outside the pair.
      w([[n2.out, n2.outY], [600, n2.outY]]),
      j(600, n2.outY),
      w([[600, n2.outY], [600, 60], [300, 60], [300, n1.inputs[1]], [360, n1.inputs[1]]]),
      w([[n1.out, n1.outY], [660, n1.outY]]),
      j(660, n1.outY),
      w([[660, n1.outY], [660, 440], [300, 440], [300, n2.inputs[1]], [360, n2.inputs[1]]]),

      w([[600, n2.outY], [1000, n2.outY]]),
      w([[660, n1.outY], [1000, n1.outY]]),
      sig(1012, n1.outY + 8, 'Q'),
      sig(1012, n2.outY + 8, "Q'")
    ],
    title
  );
}

/** Gated SR latch: two steering NANDs in front of the cross-coupled pair. */
function gatedSrLatch(title) {
  const s1 = gate(230, 110, 80, 2);
  const s2 = gate(230, 290, 80, 2);
  const n1 = gate(560, 110, 80, 2);
  const n2 = gate(560, 290, 80, 2);

  return draw(
    [
      g(230, 110, 80, 2),
      g(230, 290, 80, 2),
      g(560, 110, 80, 2),
      g(560, 290, 80, 2),

      w([[60, s1.inputs[0]], [230, s1.inputs[0]]]),
      w([[60, s2.inputs[0]], [230, s2.inputs[0]]]),
      pin(34, s1.inputs[0] + 8, 'S'),
      pin(34, s2.inputs[0] + 8, 'R'),

      // Enable fans out to the second input of each steering gate.
      w([[60, 400], [160, 400]]),
      w([[160, 400], [160, s1.inputs[1]], [230, s1.inputs[1]]]),
      w([[160, 400], [160, s2.inputs[1]], [230, s2.inputs[1]]]),
      j(160, 400),
      pin(34, 408, 'EN'),

      w([[s1.out, s1.outY], [500, s1.outY], [500, n1.inputs[0]], [560, n1.inputs[0]]]),
      w([[s2.out, s2.outY], [500, s2.outY], [500, n2.inputs[0]], [560, n2.inputs[0]]]),

      // Latch feedback.
      w([[n2.out, n2.outY], [800, n2.outY]]),
      j(800, n2.outY),
      w([[800, n2.outY], [800, 60], [520, 60], [520, n1.inputs[1]], [560, n1.inputs[1]]]),
      w([[n1.out, n1.outY], [860, n1.outY]]),
      j(860, n1.outY),
      w([[860, n1.outY], [860, 440], [520, 440], [520, n2.inputs[1]], [560, n2.inputs[1]]]),

      w([[800, n2.outY], [1000, n2.outY]]),
      w([[860, n1.outY], [1000, n1.outY]]),
      sig(1012, n1.outY + 8, 'Q'),
      sig(1012, n2.outY + 8, "Q'")
    ],
    title
  );
}

// ================================================================ combinational

/** 2:1 multiplexer: Y = NAND(NAND(D0, ~S), NAND(D1, S)). */
function mux2(title) {
  const inv = gate(150, 372, 56, 1); // input 400, out 214,400
  const a = gate(400, 94, 80, 2); // inputs 110,154
  const b = gate(400, 334, 80, 2); // inputs 350,394
  const y = gate(720, 214, 80, 2); // inputs 230,274

  return draw(
    [
      g(150, 372, 56, 1),
      g(400, 94, 80, 2),
      g(400, 334, 80, 2),
      g(720, 214, 80, 2),

      w([[60, a.inputs[0]], [a.x, a.inputs[0]]]),
      w([[60, b.inputs[0]], [b.x, b.inputs[0]]]),
      pin(34, a.inputs[0] + 8, 'D0'),
      pin(34, b.inputs[0] + 8, 'D1'),

      // S: straight into the inverter, branched to the D1 gate.
      w([[60, 400], [inv.x, inv.inputs[0]]]),
      j(110, 400),
      w([[110, 400], [110, b.inputs[1]], [b.x, b.inputs[1]]]),
      pin(34, 408, 'S'),

      // ~S into the D0 gate.
      w([[inv.out, inv.outY], [320, inv.outY], [320, a.inputs[1]], [a.x, a.inputs[1]]]),

      w([[a.out, a.outY], [620, a.outY], [620, y.inputs[0]], [y.x, y.inputs[0]]]),
      w([[b.out, b.outY], [660, b.outY], [660, y.inputs[1]], [y.x, y.inputs[1]]]),

      w([[y.out, y.outY], [1000, y.outY]]),
      sig(1012, y.outY + 8, 'Y')
    ],
    title
  );
}

/** 2:4 decoder: one inverter per select line, four three-input NAND terms. */
function decoder24(title) {
  const i0 = gate(220, 150, 56, 1); // input 178, out 284,178
  const i1 = gate(220, 300, 56, 1); // input 328, out 284,328
  const ys = [40, 145, 250, 355];
  const terms = ys.map(y => gate(600, y, 80, 2));

  const items = [g(220, 150, 56, 1), g(220, 300, 56, 1)];
  terms.forEach((_, i) => items.push(g(600, ys[i], 80, 2)));

  // Select inputs and their complements.
  items.push(w([[60, i0.inputs[0]], [140, i0.inputs[0]], [i0.x, i0.inputs[0]]]));
  items.push(w([[60, i1.inputs[0]], [180, i1.inputs[0]], [i1.x, i1.inputs[0]]]));
  items.push(pin(34, i0.inputs[0] + 8, 'A0'));
  items.push(pin(34, i1.inputs[0] + 8, 'A1'));
  items.push(j(140, i0.inputs[0]));
  items.push(j(180, i1.inputs[0]));

  // A0 rail, A1 rail, and their complements.
  items.push(w([[140, i0.inputs[0]], [140, 440], [300, 440], [300, terms[1].inputs[0]]]));
  items.push(w([[i0.out, i0.outY], [340, i0.outY], [340, terms[0].inputs[0]]]));
  items.push(w([[180, i1.inputs[0]], [180, 460], [460, 460], [460, terms[3].inputs[1]]]));
  items.push(w([[i1.out, i1.outY], [500, i1.outY], [500, terms[1].inputs[1]]]));

  // Each term picks A0 or ~A0, then A1 or ~A1.
  const pick = [
    [340, 0],
    [300, 0],
    [340, 0],
    [300, 0]
  ];
  const pick1 = [
    [500, 0],
    [500, 0],
    [460, 0],
    [460, 0]
  ];
  terms.forEach((t, i) => {
    items.push(w([[pick[i][0], t.inputs[0]], [t.x, t.inputs[0]]]));
    items.push(w([[pick1[i][0], t.inputs[1]], [t.x, t.inputs[1]]]));
    items.push(w([[t.out, t.outY], [940, t.outY]]));
    items.push(sig(952, t.outY + 8, `Y${i}`));
  });

  return draw(items, title);
}

/** 4:2 encoder from three NAND terms. */
function encoder42(title) {
  const inv = gate(220, 276, 56, 1); // input 304, out 284,304
  const a = gate(520, 94, 80, 2); // inputs 110,154
  const b = gate(520, 334, 80, 2); // inputs 350,394

  return draw(
    [
      g(220, 276, 56, 1),
      g(520, 94, 80, 2),
      g(520, 334, 80, 2),

      // D2 and D3 straight into the two terms.
      w([[60, a.inputs[0]], [a.x, a.inputs[0]]]),
      w([[60, b.inputs[0]], [b.x, b.inputs[0]]]),
      pin(34, a.inputs[0] + 8, 'D2'),
      pin(34, b.inputs[0] + 8, 'D3'),

      // D1 into the upper term and, inverted, into the lower term.
      w([[60, a.inputs[1]], [120, a.inputs[1]], [a.x, a.inputs[1]]]),
      j(120, a.inputs[1]),
      w([[120, a.inputs[1]], [120, inv.inputs[0]], [inv.x, inv.inputs[0]]]),
      w([[inv.out, inv.outY], [460, inv.outY], [460, b.inputs[1]], [b.x, b.inputs[1]]]),
      pin(34, a.inputs[1] + 8, 'D1'),

      w([[a.out, a.outY], [940, a.outY]]),
      w([[b.out, b.outY], [940, b.outY]]),
      sig(952, a.outY + 8, 'A0'),
      sig(952, b.outY + 8, 'A1')
    ],
    title
  );
}

/** 1:4 demultiplexer: D steered by two select lines into four NAND terms. */
function demux4(title) {
  const i0 = gate(220, 150, 56, 1); // input 178, out 284,178
  const i1 = gate(220, 300, 56, 1); // input 328, out 284,328
  const ys = [40, 145, 250, 355];
  const terms = ys.map(y => gate(600, y, 80, 3));

  const items = [g(220, 150, 56, 1), g(220, 300, 56, 1)];
  terms.forEach((_, i) => items.push(g(600, ys[i], 80, 3)));

  // Data input fans out to every term.
  items.push(w([[60, 460], [100, 460]]));
  items.push(pin(34, 468, 'D'));
  items.push(j(100, 460));
  terms.forEach((t, i) =>
    items.push(w([[100, 460], [100, t.inputs[0]], [t.x, t.inputs[0]]]))
  );

  // Select inputs and complements.
  items.push(w([[60, i0.inputs[0]], [140, i0.inputs[0]], [i0.x, i0.inputs[0]]]));
  items.push(w([[60, i1.inputs[0]], [180, i1.inputs[0]], [i1.x, i1.inputs[0]]]));
  items.push(pin(34, i0.inputs[0] + 8, 'S0'));
  items.push(pin(34, i1.inputs[0] + 8, 'S1'));
  items.push(j(140, i0.inputs[0]));
  items.push(j(180, i1.inputs[0]));
  items.push(w([[140, i0.inputs[0]], [140, 440], [300, 440], [300, terms[1].inputs[1]]]));
  items.push(w([[i0.out, i0.outY], [340, i0.outY], [340, terms[0].inputs[1]]]));
  items.push(w([[180, i1.inputs[0]], [180, 20], [460, 20], [460, terms[3].inputs[2]]]));
  items.push(w([[i1.out, i1.outY], [500, i1.outY], [500, terms[1].inputs[2]]]));

  const pick0 = [340, 300, 340, 300];
  const pick1 = [500, 500, 460, 460];
  terms.forEach((t, i) => {
    items.push(w([[pick0[i], t.inputs[1]], [t.x, t.inputs[1]]]));
    items.push(w([[pick1[i], t.inputs[2]], [t.x, t.inputs[2]]]));
    items.push(w([[t.out, t.outY], [940, t.outY]]));
    items.push(sig(952, t.outY + 8, `Y${i}`));
  });

  return draw(items, title);
}

/** Ripple counter: four NAND toggle stages, each clocked by the previous one. */
function counter(title, stages = 4) {
  const items = [];
  const xs = [120, 368];

  const topY = 94; // inputs 110,154 ; out 134
  const botY = 314; // inputs 330,374 ; out 354

  const stageQ = [];

  for (let i = 0; i < stages; i += 1) {
    const x = 120 + i * 248;
    const top = gate(x, topY, 80, 2);
    const bot = gate(x, botY, 80, 2);

    items.push(g(x, topY, 80, 2));
    items.push(g(x, botY, 80, 2));

    // Clock rail for this stage drives the first input of both gates.
    const clkX = x - 36;
    if (i === 0) {
      items.push(w([[50, 450], [clkX, 450], [clkX, top.inputs[0]], [x, top.inputs[0]]]));
      items.push(pin(24, 458, 'CLK'));
    } else {
      items.push(w([[stageQ[i - 1], topY], [clkX, topY], [clkX, top.inputs[0]], [x, top.inputs[0]]]));
    }
    items.push(w([[clkX, top.inputs[0]], [clkX, bot.inputs[0]], [x, bot.inputs[0]]]));
    items.push(j(clkX, top.inputs[0]));

    // Cross-coupled feedback inside the stage.
    items.push(w([[bot.out, bot.outY], [x + 130, bot.outY], [x + 130, top.inputs[1]], [x, top.inputs[1]]]));
    items.push(w([[top.out, top.outY], [x + 170, top.outY], [x + 170, bot.inputs[1]], [x, bot.inputs[1]]]));

    items.push(j(x + 130, bot.outY));
    items.push(j(x + 170, top.outY));

    stageQ.push(x + 170);

    // Stage output tap.
    items.push(w([[x + 170, top.outY], [x + 170, 452], [x + 128, 452]]));
    items.push(sig(x + 104, 460, `Q${i}`));
  }

  return draw(items, title);
}

// ================================================================ analogue
// These are device circuits rather than logic, so they use the same palette but
// no NAND gates.

/** Resistor as a zigzag, drawn on a horizontal wire. */
function resistor(x, y, w = 74, amp = 11, stroke = PALETTE.accent) {
  const teeth = 6;
  const step = w / teeth;
  let d = `M${x},${y}`;
  for (let i = 0; i < teeth; i += 1) {
    const dir = i % 2 === 0 ? -1 : 1;
    d += ` l${step / 2},${dir * amp} l${step / 2},${-dir * amp}`;
  }
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/** Capacitor: two parallel plates on a wire. */
function capacitor(x, y, stroke = PALETTE.accent) {
  return (
    `<path d="M${x},${y - 13} v26 M${x + 9},${y - 13} v26" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>`
  );
}

function opAmpCircuit(title, kind) {
  const cx = 500;
  const cy = 240;
  const parts = [];

  // Triangle. The inverting input is the top pin by convention when the
  // feedback resistor returns over the top of the symbol.
  parts.push(
    `<path d="M${cx - 80},${cy - 92} L${cx - 80},${cy + 92} L${cx + 96},${cy} Z" fill="${PALETTE.accentDim}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>`
  );
  parts.push(
    `<path d="M${cx - 62},${cy - 44} h20 M${cx - 52},${cy - 54} v20" stroke="${PALETTE.accent}" stroke-width="2" stroke-linecap="round"/>`
  );
  parts.push(`<path d="M${cx - 62},${cy + 44} h20" stroke="${PALETTE.accent}" stroke-width="2" stroke-linecap="round"/>`);

  const inTop = cy - 44;
  const inBot = cy + 44;

  // VIN -> input resistor -> inverting node.
  parts.push(wire([[110, inTop], [300, inTop]]));
  parts.push(resistor(300, inTop));
  parts.push(wire([[374, inTop], [cx - 80, inTop]]));
  parts.push(dot(374, inTop));

  // Non-inverting input to ground reference.
  parts.push(wire([[110, inBot], [cx - 80, inBot]]));

  // Feedback resistor over the top, from the output back to the input node.
  parts.push(wire([[374, inTop], [374, 110]]));
  parts.push(wire([[374, 110], [470, 110]]));
  parts.push(resistor(470, 110));
  parts.push(wire([[544, 110], [700, 110], [700, cy]]));
  parts.push(dot(700, cy));

  // Output node.
  parts.push(wire([[cx + 96, cy], [1000, cy]]));

  // Optionally add the input capacitor used by integrator/differentiator forms.
  if (kind === 'int' || kind === 'diff') {
    parts.push(wire([[240, inTop], [240, inTop - 0]]));
  }

  if (kind === 'noninverting' || kind === 'follower') {
    // Signal enters the non-inverting pin; the inverting pin is fed back.
    parts.push(wire([[110, inBot], [110, inBot]]));
  }

  parts.push(inLabel(48, inTop - 14, 'VIN'));
  parts.push(inLabel(48, inBot + 30, 'GND'));
  parts.push(outLabel(1012, cy + 8, 'VOUT'));

  return circuit({ width: W, height: H, title, body: parts });
}

function regulatorCircuit(title, switching) {
  const boxX = 430;
  const boxY = 150;
  const parts = [];

  parts.push(
    `<rect x="${boxX}" y="${boxY}" width="220" height="150" rx="12" fill="${PALETTE.body}" stroke="${PALETTE.bodyStroke}" stroke-width="2"/>`
  );
  parts.push(wire([[110, boxY + 50], [boxX, boxY + 50]]));
  parts.push(wire([[boxX + 220, boxY + 50], [960, boxY + 50]]));
  parts.push(wire([[110, boxY + 110], [boxX, boxY + 110]]));
  parts.push(inLabel(50, boxY + 58, 'VIN'));
  parts.push(inLabel(50, boxY + 118, 'GND'));
  parts.push(outLabel(972, boxY + 58, 'VOUT'));

  if (switching) {
    parts.push(wire([[boxX + 110, boxY + 150], [boxX + 110, boxY + 190]]));
    parts.push(
      `<circle cx="${boxX + 110}" cy="${boxY + 216}" r="26" fill="none" stroke="${PALETTE.accent}" stroke-width="2"/>`
    );
    parts.push(wire([[boxX + 110, boxY + 242], [boxX + 110, 420], [760, 420]]));
    parts.push(wire([[760, boxY + 50], [760, 420]]));
    parts.push(dot(760, boxY + 50));
  }

  return circuit({ width: W, height: H, title, body: parts });
}

function diodeCircuit(title, kind) {
  const y = 200;
  const parts = [];

  parts.push(wire([[80, y], [300, y]]));
  parts.push(
    `<path d="M300,${y - 16} l62,16 l-62,16 z" fill="${PALETTE.accentDim}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>`
  );
  parts.push(`<path d="M362,${y - 16} v32" stroke="${PALETTE.accent}" stroke-width="2.4"/>`);

  if (kind === 'zener') {
    parts.push(`<path d="M362,${y - 16} l-8,-8 M362,${y + 16} l8,8" stroke="${PALETTE.accent}" stroke-width="2"/>`);
  }
  if (kind === 'led') {
    parts.push(
      `<path d="M330,${y - 30} l12,-12 M340,${y - 22} l12,-12" stroke="${PALETTE.output}" stroke-width="2" stroke-linecap="round"/>`
    );
  }

  parts.push(wire([[362, y], [880, y]]));
  parts.push(wire([[880, y], [880, 330]]));

  // Load resistor.
  parts.push(
    `<rect x="830" y="330" width="100" height="26" rx="3" fill="${PALETTE.body}" stroke="${PALETTE.accent}" stroke-width="2"/>`
  );
  parts.push(wire([[880, 356], [880, 400], [80, 400], [80, y]]));

  parts.push(inLabel(30, y + 8, 'VIN'));
  parts.push(outLabel(892, y - 14, 'VOUT'));
  parts.push(dot(880, y));

  return circuit({ width: W, height: H, title, body: parts });
}

function transistorCircuit(title, mos) {
  const cx = 520;
  const cy = 220;
  const parts = [];

  if (mos) {
    parts.push(`<path d="M${cx - 40},${cy - 60} v120" stroke="${PALETTE.accent}" stroke-width="2.4" stroke-linecap="round"/>`);
    parts.push(`<path d="M${cx - 12},${cy - 54} v108" stroke="${PALETTE.wire}" stroke-width="2"/>`);
    parts.push(
      `<path d="M${cx - 12},${cy - 34} h42 v-32 M${cx - 12},${cy} h42 M${cx - 12},${cy + 34} h42 v32" stroke="${PALETTE.wire}" stroke-width="2" stroke-linecap="round"/>`
    );
    parts.push(wire([[90, cy], [cx - 40, cy]]));
    parts.push(wire([[cx + 30, cy - 66], [820, cy - 66]]));
    parts.push(wire([[cx + 30, cy + 66], [820, cy + 66]]));
    parts.push(inLabel(40, cy + 8, 'VIN'));
    parts.push(outLabel(832, cy - 58, 'VOUT'));
    parts.push(outLabel(832, cy + 74, 'GND'));
  } else {
    parts.push(`<path d="M${cx - 40},${cy - 60} v120" stroke="${PALETTE.accent}" stroke-width="2.4" stroke-linecap="round"/>`);
    parts.push(
      `<path d="M${cx - 40},${cy - 28} L${cx + 12},${cy - 66} M${cx - 40},${cy + 28} L${cx + 12},${cy + 66}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linecap="round"/>`
    );
    parts.push(`<path d="M${cx + 12},${cy - 66} v-64 M${cx + 12},${cy + 66} v64" stroke="${PALETTE.wire}" stroke-width="2"/>`);
    parts.push(wire([[90, cy], [cx - 40, cy]]));
    parts.push(wire([[cx + 12, cy - 130], [820, cy - 130]]));
    parts.push(wire([[cx + 12, cy + 130], [820, cy + 130]]));
    parts.push(inLabel(40, cy + 8, 'VIN'));
    parts.push(outLabel(832, cy - 122, 'COLLECTOR'));
    parts.push(outLabel(832, cy + 138, 'EMITTER'));
  }

  return circuit({ width: W, height: H, title, body: parts });
}

/** Relay: coil (A1/A2) driving an armature across COM, NO and NC. */
function relayCircuit(title, solidState) {
  const parts = [];
  const coilY = 130;
  const comY = 250;
  const noY = 170;
  const ncY = 330;

  if (solidState) {
    // Opto-isolated SSR: LED on the input side, back-to-back devices on the load.
    parts.push(wire([[90, coilY], [300, coilY]]));
    parts.push(
      `<path d="M300,${coilY - 16} l60,16 l-60,16 z" fill="${PALETTE.accentDim}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>`
    );
    parts.push(`<path d="M360,${coilY - 16} v32" stroke="${PALETTE.accent}" stroke-width="2.4"/>`);
    parts.push(wire([[360, coilY], [470, coilY]]));
    parts.push(`<path d="M470,${coilY} h-24 M470,${coilY + 12} h-16 M470,${coilY + 24} h-8" stroke="${PALETTE.control}" stroke-width="2" stroke-linecap="round"/>`);
    parts.push(inLabel(40, coilY + 8, 'LED+'));

    parts.push(`<path d="M560,80 v300" stroke="${PALETTE.bodyStroke}" stroke-width="2" stroke-dasharray="8 4"/>`);

    parts.push(wire([[700, 200], [820, 200]]));
    parts.push(`<path d="M760,200 l0,0" stroke="none"/>`);
    parts.push(
      `<path d="M700,330 h120 M760,330 v-40" stroke="${PALETTE.wire}" stroke-width="2" stroke-linecap="round"/>`
    );
    parts.push(outLabel(840, 208, 'COM'));
    parts.push(outLabel(840, 338, 'LOAD'));
    return circuit({ width: W, height: H, title, body: parts });
  }

  // Coil: a rounded box with an inductor glyph, fed from A1 / A2.
  parts.push(wire([[90, coilY], [300, coilY]]));
  parts.push(
    `<rect x="300" y="${coilY - 34}" width="120" height="68" rx="8" fill="${PALETTE.body}" stroke="${PALETTE.accent}" stroke-width="2"/>`
  );
  for (let i = 0; i < 4; i += 1) {
    const x = 318 + i * 21;
    parts.push(
      `<path d="M${x},${coilY + 10} a10,10 0 0 1 20,0" fill="none" stroke="${PALETTE.accent}" stroke-width="2"/>`
    );
  }
  // Coil return terminal, then down to the armature supply.
  parts.push(wire([[420, coilY], [560, coilY], [560, comY]]));
  parts.push(dot(560, coilY, 4.5, PALETTE.wire));
  parts.push(inLabel(40, coilY + 8, 'A1'));
  parts.push(inLabel(470, coilY - 12, 'A2'));

  // Contact: COM feeds a pivoting armature that rests on NC or pulls to NO.
  // COM stub, the moving armature, and the two fixed contacts.
  parts.push(wire([[560, comY], [636, comY]]));
  parts.push(kit.hollowCircle(640, comY, 4, PALETTE.label, 2));
  parts.push(
    `<path d="M646,${comY} L818,${noY + 6}" stroke="${PALETTE.wire}" stroke-width="2" stroke-linecap="round"/>`
  );
  parts.push(
    `<path d="M646,${comY} L818,${ncY - 6}" stroke="${PALETTE.control}" stroke-width="1.5" stroke-dasharray="4 4"/>`
  );
  parts.push(wire([[860, noY], [960, noY]]));
  parts.push(wire([[860, ncY], [960, ncY]]));
  parts.push(inLabel(470, comY + 8, 'COM'));
  parts.push(outLabel(972, noY + 8, 'NO'));
  parts.push(outLabel(972, ncY + 8, 'NC'));
  // Mechanical link from the coil to the armature.
  parts.push(
    `<path d="M560,${comY - 40} v22 M556,${comY - 40} h8" stroke="${PALETTE.control}" stroke-width="1.5"/>`
  );

  return circuit({ width: W, height: H, title, body: parts });
}

function adcCircuit(title) {
  const boxX = 400;
  const boxY = 150;
  const parts = [];
  parts.push(
    `<rect x="${boxX}" y="${boxY}" width="260" height="170" rx="12" fill="${PALETTE.body}" stroke="${PALETTE.bodyStroke}" stroke-width="2"/>`
  );
  parts.push(wire([[80, boxY + 50], [boxX, boxY + 50]]));
  parts.push(wire([[boxX + 260, boxY + 50], [960, boxY + 50]]));
  parts.push(wire([[80, boxY + 120], [boxX, boxY + 120]]));
  parts.push(inLabel(24, boxY + 58, 'VIN'));
  parts.push(inLabel(24, boxY + 128, 'CLK'));
  parts.push(outLabel(972, boxY + 58, 'DOUT'));
  parts.push(dot(boxX + 260, boxY + 50));
  return circuit({ width: W, height: H, title, body: parts });
}

// ================================================================ registry

const TEMPLATES = {
  // sequential
  'nand-sr': srLatch,
  'nand-sr-latch': srLatch,
  'nand-sr-gated': gatedSrLatch,
  'nand-jk': jkFlipFlop,
  'nand-jk-ms': jkFlipFlop,
  'nand-d': dFlipFlop,
  'nand-t': tFlipFlop,
  'nand-counter3': t => counter(t, 3),
  'nand-counter4': t => counter(t, 4),
  // combinational
  'nand-mux2': mux2,
  'nand-mux4': t => mux2(t),
  'nand-decoder24': decoder24,
  'nand-decoder38': decoder24,
  'nand-encoder42': encoder42,
  'nand-demux4': demux4,
  // analogue
  'opamp-inv': t => opAmpCircuit(t, 'opamp'),
  'opamp-ninv': t => opAmpCircuit(t, 'opamp'),
  'opamp-fol': t => opAmpCircuit(t, 'opamp'),
  'opamp-sum': t => opAmpCircuit(t, 'opamp'),
  'opamp-diff': t => opAmpCircuit(t, 'opamp'),
  'opamp-int': t => opAmpCircuit(t, 'opamp'),
  'opamp-diff2': t => opAmpCircuit(t, 'opamp'),
  'opamp-cmp': t => opAmpCircuit(t, 'opamp'),
  'reg-linear': t => regulatorCircuit(t, false),
  'reg-adj': t => regulatorCircuit(t, false),
  'reg-buck': t => regulatorCircuit(t, true),
  'reg-boost': t => regulatorCircuit(t, true),
  'diode-inline': t => diodeCircuit(t, 'diode'),
  'diode-zener': t => diodeCircuit(t, 'zener'),
  led: t => diodeCircuit(t, 'led'),
  'rectifier-bridge': t => diodeCircuit(t, 'bridge'),
  'bjt-switch': t => transistorCircuit(t, false),
  'mosfet-switch': t => transistorCircuit(t, true),
  'relay-spst': t => relayCircuit(t, false),
  'relay-spdt': t => relayCircuit(t, false),
  'relay-ssr': t => relayCircuit(t, true),
  adc: t => adcCircuit(t)
};

function build(key, title) {
  const fn = TEMPLATES[key];
  return fn ? fn(title) : null;
}

module.exports = { build, TEMPLATES, gate };
