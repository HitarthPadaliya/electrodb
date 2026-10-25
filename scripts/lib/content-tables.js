/**
 * ElectroDB — educational table definitions
 *
 * The flip-flop tables are written once here so the preview server (which
 * emulates the database) and the seed SQL can never drift apart.
 *
 * Two rules shape the content:
 *
 *  1. A truth table carries the operation next to the state it produces.
 *  2. There is no separate "current state" column: the next state is written
 *     as a function of the stored state - Q_n, 0 or 1 - so one row describes a
 *     whole behaviour instead of repeating it twice.
 *
 * Signal symbols are stored as inline LaTeX ("\( ... \)") so the renderer can
 * typeset them; the table headers pick them up in bold (\boldsymbol), the body
 * stays in the normal weight.
 */

/** Which flip-flop family a component belongs to. */
function flipFlopKind(slug) {
  const name = String(slug || '').toLowerCase();
  if (name.includes('jk')) return 'jk';
  if (name.includes('toggle') || /(^|-)t-/.test(name)) return 't';
  if (name.includes('sr')) return 'sr';
  return 'd';
}

const TRUTH_TABLES = {
  jk: {
    columns: ['\\(J\\)', '\\(K\\)', '\\(Q_{n+1}\\)', 'Operation'],
    rows: [
      [0, 0, '\\(Q_n\\)', 'Hold'],
      [0, 1, 0, 'Reset'],
      [1, 0, 1, 'Set'],
      [1, 1, '\\(\\overline{Q_n}\\)', 'Toggle']
    ]
  },
  sr: {
    columns: ['\\(S\\)', '\\(R\\)', '\\(Q_{n+1}\\)', 'Operation'],
    rows: [
      [0, 0, '\\(Q_n\\)', 'Hold'],
      [0, 1, 0, 'Reset'],
      [1, 0, 1, 'Set'],
      [1, 1, 'X', 'Invalid']
    ]
  },
  d: {
    columns: ['\\(D\\)', '\\(Q_{n+1}\\)', 'Operation'],
    rows: [
      [0, 0, 'Reset'],
      [1, 1, 'Set']
    ]
  },
  t: {
    columns: ['\\(T\\)', '\\(Q_{n+1}\\)', 'Operation'],
    rows: [
      [0, '\\(Q_n\\)', 'Hold'],
      [1, '\\(\\overline{Q_n}\\)', 'Toggle']
    ]
  }
};

const CHARACTERISTIC_TABLES = {
  jk: {
    columns: ['\\(J\\)', '\\(K\\)', '\\(Q_n\\)', '\\(Q_{n+1}\\)'],
    rows: [
      [0, 0, 0, 0],
      [0, 0, 1, 1],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 1, 1],
      [1, 1, 0, 1],
      [1, 1, 1, 0]
    ]
  },
  sr: {
    columns: ['\\(S\\)', '\\(R\\)', '\\(Q_n\\)', '\\(Q_{n+1}\\)'],
    rows: [
      [0, 0, 0, 0],
      [0, 0, 1, 1],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 1, 1],
      [1, 1, 0, 'X'],
      [1, 1, 1, 'X']
    ]
  },
  d: {
    columns: ['\\(D\\)', '\\(Q_n\\)', '\\(Q_{n+1}\\)'],
    rows: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 0, 1],
      [1, 1, 1]
    ]
  },
  t: {
    columns: ['\\(T\\)', '\\(Q_n\\)', '\\(Q_{n+1}\\)'],
    rows: [
      [0, 0, 0],
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0]
    ]
  }
};

const clone = table => ({ columns: [...table.columns], rows: table.rows.map(row => [...row]) });

const truthTableFor = slug => clone(TRUTH_TABLES[flipFlopKind(slug)]);
const characteristicTableFor = slug => clone(CHARACTERISTIC_TABLES[flipFlopKind(slug)]);

module.exports = { flipFlopKind, truthTableFor, characteristicTableFor };
