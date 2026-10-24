/**
 * ElectroDB — state machines and timing traces
 *
 * One SVG holds both the Moore and the Mealy machine for a part, side by side.
 * States are laid out on a compact ring and drawn with hairline borders, so the
 * artwork itself is small and it does not shout on the page.
 */

const kit = require('./svg-kit');

const { PALETTE } = kit;

// ---------------------------------------------------------------- families

const FLIP_FLOP_FAMILIES = {
  sr: {
    states: [
      { id: 's0', label: 'Q=0', output: '0' },
      { id: 's1', label: 'Q=1', output: '1' }
    ],
    moore: {
      edges: [
        { from: 's0', to: 's0', label: 'SR=00' },
        { from: 's0', to: 's1', label: 'SR=10', curve: 0 },
        { from: 's1', to: 's0', label: 'SR=01', curve: 40 },
        { from: 's1', to: 's1', label: 'SR=00' }
      ]
    },
    mealy: {
      edges: [
        { from: 's0', to: 's0', label: '00/0' },
        { from: 's0', to: 's1', label: '10/1' },
        { from: 's1', to: 's0', label: '01/0', curve: 40 },
        { from: 's1', to: 's1', label: '00/1' }
      ]
    }
  },
  jk: {
    states: [
      { id: 's0', label: 'Q=0', output: '0' },
      { id: 's1', label: 'Q=1', output: '1' }
    ],
    moore: {
      edges: [
        { from: 's0', to: 's0', label: 'JK=00,01' },
        { from: 's0', to: 's1', label: 'JK=10' },
        { from: 's1', to: 's0', label: 'JK=01', curve: 44 },
        { from: 's1', to: 's1', label: 'JK=00,10' }
      ]
    },
    mealy: {
      edges: [
        { from: 's0', to: 's0', label: '00/0' },
        { from: 's0', to: 's1', label: '10/1' },
        { from: 's1', to: 's0', label: '01/0', curve: 44 },
        { from: 's1', to: 's1', label: '11/0' }
      ]
    }
  },
  d: {
    states: [
      { id: 's0', label: 'Q=0', output: '0' },
      { id: 's1', label: 'Q=1', output: '1' }
    ],
    moore: {
      edges: [
        { from: 's0', to: 's0', label: 'D=0' },
        { from: 's0', to: 's1', label: 'D=1' },
        { from: 's1', to: 's0', label: 'D=0', curve: 44 },
        { from: 's1', to: 's1', label: 'D=1' }
      ]
    },
    mealy: {
      edges: [
        { from: 's0', to: 's0', label: '0/0' },
        { from: 's0', to: 's1', label: '1/1' },
        { from: 's1', to: 's0', label: '0/0', curve: 44 },
        { from: 's1', to: 's1', label: '1/1' }
      ]
    }
  },
  t: {
    states: [
      { id: 's0', label: 'Q=0', output: '0' },
      { id: 's1', label: 'Q=1', output: '1' }
    ],
    moore: {
      edges: [
        { from: 's0', to: 's0', label: 'T=0' },
        { from: 's0', to: 's1', label: 'T=1' },
        { from: 's1', to: 's0', label: 'T=1', curve: 44 },
        { from: 's1', to: 's1', label: 'T=0' }
      ]
    },
    mealy: {
      edges: [
        { from: 's0', to: 's0', label: '0/0' },
        { from: 's0', to: 's1', label: '1/1' },
        { from: 's1', to: 's0', label: '1/0', curve: 44 },
        { from: 's1', to: 's1', label: '0/1' }
      ]
    }
  }
};

const COUNTER_MODULUS = {
  counter3: 8,
  counter4: 16,
  counter5: 5,
  counter6: 6,
  counter8: 8,
  counter10: 10
};

function counterFamily(modulus) {
  const states = Array.from({ length: modulus }, (_, i) => ({
    id: `s${i}`,
    label: String(i),
    output: i.toString(2).padStart(Math.max(3, Math.ceil(Math.log2(modulus))), '0')
  }));
  const mooreEdges = states.map((s, i) => ({
    from: s.id,
    to: states[(i + 1) % modulus].id,
    label: '1'
  }));
  const mealyEdges = states.map((s, i) => ({
    from: s.id,
    to: states[(i + 1) % modulus].id,
    label: `1/${states[(i + 1) % modulus].label}`
  }));
  return { states, moore: { edges: mooreEdges }, mealy: { edges: mealyEdges } };
}

function ringFamily() {
  const states = [0, 1, 2, 3].map(i => ({
    id: `s${i}`,
    label: `Q${i}`,
    output: ['1000', '0100', '0010', '0001'][i]
  }));
  return {
    states,
    moore: {
      edges: states.map((s, i) => ({ from: s.id, to: states[(i + 1) % 4].id, label: '1' }))
    },
    mealy: {
      edges: states.map((s, i) => ({ from: s.id, to: states[(i + 1) % 4].id, label: '1/1' }))
    }
  };
}

function johnsonFamily() {
  const states = [0, 1, 2, 3].map(i => ({
    id: `s${i}`,
    label: `Q${i}`,
    output: ['1000', '1100', '1110', '1111'][i]
  }));
  return {
    states,
    moore: {
      edges: states.map((s, i) => ({ from: s.id, to: states[(i + 1) % 4].id, label: '1' }))
    },
    mealy: {
      edges: states.map((s, i) => ({ from: s.id, to: states[(i + 1) % 4].id, label: '1/1' }))
    }
  };
}

function family(name) {
  if (FLIP_FLOP_FAMILIES[name]) return FLIP_FLOP_FAMILIES[name];
  if (name === 'ring') return ringFamily();
  if (name === 'johnson') return johnsonFamily();
  if (COUNTER_MODULUS[name]) return counterFamily(COUNTER_MODULUS[name]);
  return null;
}

function buildState(familyName, title) {
  const spec = family(familyName);
  if (!spec) return null;
  const radius = spec.states.length > 6 ? 104 : spec.states.length > 3 ? 92 : 86;
  return kit.stateMachine({ states: spec.states, moore: spec.moore, mealy: spec.mealy, title, radius });
}

// ---------------------------------------------------------------- timing

const TIMING = {
  clock: [1, 0, 1, 0, 1, 0, 1, 0],
  jk: {
    rows: [
      { label: 'CLK', values: [1, 0, 1, 0, 1, 0, 1, 0] },
      { label: 'J', values: [1, 1, 0, 0, 0, 0, 1, 1] },
      { label: 'K', values: [0, 0, 0, 1, 0, 0, 0, 0] },
      { label: 'Q', values: [0, 0, 1, 1, 1, 1, 0, 0] }
    ]
  },
  d: {
    rows: [
      { label: 'CLK', values: [1, 0, 1, 0, 1, 0, 1, 0] },
      { label: 'D', values: [0, 0, 1, 1, 0, 0, 1, 1] },
      { label: 'Q', values: [0, 0, 0, 1, 1, 0, 0, 1] }
    ]
  },
  counter: {
    rows: [
      { label: 'CLK', values: [1, 0, 1, 0, 1, 0, 1, 0] },
      { label: 'Q0', values: [0, 1, 0, 1, 0, 1, 0, 1] },
      { label: 'Q1', values: [0, 1, 1, 0, 0, 1, 1, 0] },
      { label: 'Q2', values: [0, 1, 1, 1, 0, 1, 1, 1] }
    ]
  }
};

function timingFor(kind, title) {
  const spec = TIMING[kind] || TIMING.counter;
  return kit.timingDiagram({ rows: spec.rows, title });
}

module.exports = { buildState, timingFor, family, FLIP_FLOP_FAMILIES };
