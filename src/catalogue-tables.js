'use strict';

// Logical educational models, not package-specific electrical specifications.
const table = (sectionKey, title, columns, rows, caption = null) => ({
  sectionKey, title, type: 'TABLE', content: { columns, rows }, caption
});
const bits = (n, width) => n.toString(2).padStart(width, '0');
const combinations = width => Array.from({ length: 2 ** width }, (_, n) => [...bits(n, width)].map(Number));

function flipFlopKind(slug) {
  if (slug.includes('jk')) return 'jk';
  if (slug.includes('sr')) return 'sr';
  if (slug.includes('toggle') || slug === 't-flip-flop') return 't';
  return 'd';
}

function flipFlopTables(slug) {
  const kind = flipFlopKind(slug);
  const low = slug === 'active-low-sr-latch';
  const inputs = kind === 'jk' ? ['J', 'K'] : kind === 'sr' ? (low ? ['S̅', 'R̅'] : ['S', 'R']) : [kind.toUpperCase()];
  const next = (values, q) => {
    let [a, b] = values;
    if (low) { a = 1 - a; b = 1 - b; }
    if (kind === 'd') return a;
    if (kind === 't') return a ^ q;
    if (!a && !b) return q;
    if (!a && b) return 0;
    if (a && !b) return 1;
    return kind === 'jk' ? 1 - q : 'X';
  };
  const truth = combinations(inputs.length).map(values => {
    const zero = next(values, 0), one = next(values, 1);
    const operation = zero === 'X' ? 'Invalid' : zero === 0 && one === 1 ? 'Hold' : zero === 1 && one === 0 ? 'Toggle' : zero === 0 ? 'Reset' : 'Set';
    return [...values, operation === 'Hold' ? '\\(Q_n\\)' : operation === 'Toggle' ? '\\(\\overline{Q_n}\\)' : zero, operation];
  });
  const characteristic = combinations(inputs.length).flatMap(values => [0, 1].map(q => [...values, q, next(values, q)]));
  const excitation = kind === 'jk' ? [[0, 0, 0, 'X'], [0, 1, 1, 'X'], [1, 0, 'X', 1], [1, 1, 'X', 0]]
    : kind === 'sr' ? [[0, 0, 0, 'X'], [0, 1, 1, 0], [1, 0, 0, 1], [1, 1, 'X', 0]]
      : [0, 1].flatMap(q => [0, 1].map(n => [q, n, kind === 'd' ? n : q ^ n]));
  if (low) excitation.forEach(row => { for (let i = 2; i < row.length; i++) if (row[i] !== 'X') row[i] = 1 - row[i]; });
  const caption = 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.';
  return [
    table('truth_table', 'Truth Table', [...inputs, 'Q(n+1)', 'Operation'], truth, caption),
    table('characteristic_table', 'Characteristic Table', [...inputs, 'Q(n)', 'Q(n+1)'], characteristic, caption),
    table('excitation_table', 'Excitation Table', ['Q(n)', 'Q(n+1)', ...inputs], excitation, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.')
  ];
}

function counterTable(slug) {
  const modulus = slug.includes('mod8') ? 8 : slug.includes('mod5') ? 5 : slug.includes('mod6') ? 6 : /decade|mod10|bcd/.test(slug) ? 10 : 16;
  let width = Math.ceil(Math.log2(modulus));
  let states = Array.from({ length: modulus }, (_, n) => bits(n, width));
  let caption = 'Advances on each active clock event, with reset inactive.';
  if (/ring|johnson/.test(slug)) {
    width = 4;
    states = slug === 'ring-counter' ? ['0001', '0010', '0100', '1000'] : ['0000', '0001', '0011', '0111', '1111', '1110', '1100', '1000'];
    caption += ' Four-stage model; only the initialized valid cycle is shown.';
  } else if (!/mod8|mod5|mod6|decade|mod10|bcd/.test(slug)) {
    caption += ' Illustrative four-bit model (modulus 16).';
    if (slug === 'programmable-modulo-counter') caption += ' Programmed modulus M = 16; load inactive.';
  }
  const down = slug.includes('down') && slug !== 'up-down-counter';
  const rows = states.map((state, n) => [state, states[(n + (down ? states.length - 1 : 1)) % states.length]]);
  if (slug === 'up-down-counter') return table('state_table', 'State / Next-State Table', ['Current state', 'Next (UP)', 'Next (DOWN)'], states.map((state, n) => [state, states[(n + 1) % states.length], states[(n + states.length - 1) % states.length]]), caption);
  return table('state_table', 'State / Next-State Table', ['Current state', 'Next state'], rows, caption);
}

function gateTable(slug) {
  if (slug === 'tri-state-buffer') return table('truth_table', 'Truth Table', ['A', 'OE', 'Y'], [[0, 0, 'Z'], [1, 0, 'Z'], [0, 1, 0], [1, 1, 1]], 'Active-high output enable. Z means high impedance.');
  if (slug === 'schmitt-trigger-inverter') return table('truth_table', 'Switching Table', ['Input condition', 'Y'], [['Vin < VT−', 1], ['VT− ≤ Vin ≤ VT+', 'Previous output'], ['Vin > VT+', 0]], 'Hysteresis thresholds are device-specific.');
  const unary = /^(not-gate|buffer-gate|open-collector-inverter)$/.test(slug);
  const width = unary ? 1 : slug.startsWith('four-input') ? 4 : /majority|aoi21|oai21/.test(slug) ? 3 : 2;
  const evaluate = v => {
    const [a, b, c] = v;
    switch (slug) {
      case 'buffer-gate': return a;
      case 'not-gate': return 1 - a;
      case 'open-collector-inverter': return a ? 0 : 'Z';
      case 'and-gate': return a & b;
      case 'or-gate': return a | b;
      case 'xor-gate': return a ^ b;
      case 'xnor-gate': return 1 - (a ^ b);
      case 'majority-gate': return Number(a + b + c >= 2);
      case 'aoi21-gate': return 1 - ((a & b) | c);
      case 'oai21-gate': return 1 - ((a | b) & c);
      default: return slug.includes('nand') ? Number(!v.every(Boolean)) : Number(!v.some(Boolean));
    }
  };
  return table('truth_table', 'Truth Table', [...'ABCD'.slice(0, width), 'Y'], combinations(width).map(v => [...v, evaluate(v)]), slug === 'open-collector-inverter' ? 'Z is the released output; an external pull-up produces logic high.' : null);
}

function selectionTable(slug) {
  const demux = slug.startsWith('demux');
  const count = Number((slug.match(/(?:mux-|to-)(\d+)/) || [])[1]) || 4;
  const channels = demux ? Number(slug.match(/to-(\d+)/)[1]) : count;
  const width = Math.log2(channels);
  const columns = Array.from({ length: width }, (_, i) => `S${width - 1 - i}`);
  const rows = combinations(width).map((v, n) => [...v, demux ? `Y${n} = D; other outputs = 0` : `I${n}`]);
  return table('selection_table', 'Selection Table', [...columns, demux ? 'Outputs' : 'Y'], rows, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.');
}

function mappingTable(slug) {
  let columns, rows, caption = null;
  if (slug.startsWith('decoder')) {
    const width = Number(slug.match(/decoder-(\d+)/)[1]);
    columns = ['Input code', ...Array.from({ length: 2 ** width }, (_, n) => `Y${n}`)];
    rows = Array.from({ length: 2 ** width }, (_, n) => [bits(n, width), ...Array.from({ length: 2 ** width }, (_, k) => Number(n === k))]);
    caption = 'Enabled, active-high logical decoder; package output polarity may differ.';
  } else if (slug.includes('encoder')) {
    const count = slug.includes('8-to-3') ? 8 : 4;
    const priority = slug.startsWith('priority');
    columns = [`Inputs D${count - 1}…D0`, 'Output code', 'Valid'];
    rows = Array.from({ length: count }, (_, n) => [(priority ? '0'.repeat(n) + '1' + 'X'.repeat(count - 1 - n) : bits(1 << (count - 1 - n), count)), bits(count - 1 - n, Math.log2(count)), 1]);
    rows.push(['0'.repeat(count), 'X', 0]);
    caption = priority ? 'Highest-numbered asserted input wins. X means don’t care; output is undefined when Valid = 0.' : 'One-hot active-high input required; multiple asserted inputs are invalid. Output is undefined when Valid = 0.';
  } else if (slug === 'bcd-to-7-segment-decoder') {
    columns = ['BCD', 'abcdefg'];
    rows = ['1111110', '0110000', '1101101', '1111001', '0110011', '1011011', '1011111', '1110000', '1111111', '1111011'].map((s, n) => [bits(n, 4), s]);
    rows.push(['1010–1111', 'Invalid BCD']);
    caption = 'Active-high segments (common-cathode model); invalid BCD inputs are unspecified.';
  } else {
    const bcdIn = slug.startsWith('bcd-to');
    const bcdOut = slug === 'binary-to-bcd-converter';
    columns = [bcdIn ? 'BCD' : slug.startsWith('gray') ? 'Gray' : 'Binary', bcdOut ? 'BCD (tens units)' : slug.includes('to-gray') ? 'Gray' : 'Binary'];
    rows = Array.from({ length: bcdIn ? 10 : 16 }, (_, n) => {
      let out = n;
      if (slug === 'binary-to-gray-converter') out = n ^ (n >> 1);
      if (slug === 'gray-to-binary-converter') { out = 0; for (let v = n; v; v >>= 1) out ^= v; }
      return [bits(n, 4), bcdOut ? `${bits(Math.floor(n / 10), 4)} ${bits(n % 10, 4)}` : bits(out, 4)];
    });
    caption = bcdIn ? 'Single BCD digit model; codes 1010–1111 are invalid.' : 'Illustrative four-bit input model.';
  }
  return table('mapping_table', 'Code Mapping', columns, rows, caption);
}

function tablesFor(component) {
  switch (Number(component.category_id)) {
    case 6: return [counterTable(component.slug)];
    case 7: return flipFlopTables(component.slug);
    case 8: return [gateTable(component.slug)];
    case 9: return [selectionTable(component.slug)];
    case 10: return [mappingTable(component.slug)];
    default: return [];
  }
}

module.exports = { tablesFor, flipFlopKind };
