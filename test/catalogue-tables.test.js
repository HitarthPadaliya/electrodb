'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { tablesFor } = require('../src/catalogue-tables');
const root = path.resolve(__dirname, '..');
const seed = fs.readFileSync(path.join(root, 'database/07_seed_data.sql'), 'utf8');
const components = [...seed.matchAll(/^\((\d+), '([^']+)', '([^']+)'/gm)]
  .map(([, category, name, slug]) => ({ category_id: Number(category), name, slug }));
const get = (category_id, slug, index = 0) => tablesFor({ category_id, slug })[index].content;

test('every digital component has populated, rectangular, component-specific tables', () => {
  let count = 0;
  for (const component of components.filter(c => c.category_id <= 10)) {
    const sections = tablesFor(component);
    assert.equal(sections.length, component.category_id === 7 ? 3 : 1, component.slug);
    for (const section of sections) {
      count++;
      assert.ok(section.content.rows.length, component.slug);
      for (const row of section.content.rows) {
        assert.equal(row.length, section.content.columns.length, component.slug);
        assert.ok(row.every(cell => cell !== undefined && cell !== null && cell !== ''));
      }
    }
  }
  assert.equal(count, 101);
});

test('counter cycles respect modulus, direction, and ring/Johnson sequences', () => {
  assert.equal(get(6, 'mod8-up-counter').rows.length, 8);
  assert.deepEqual(get(6, 'mod8-down-counter').rows[0], ['000', '111']);
  assert.deepEqual(get(6, 'decade-counter').rows.at(-1), ['1001', '0000']);
  assert.equal(get(6, 'ring-counter').rows.length, 4);
  assert.equal(get(6, 'johnson-counter').rows.length, 8);
  assert.deepEqual(get(6, 'up-down-counter').rows[0], ['0000', '0001', '1111']);
});

test('T, JK variants, and active-low SR use their own state and excitation functions', () => {
  assert.deepEqual(get(7, 't-flip-flop', 1).rows, [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]]);
  assert.deepEqual(get(7, 'master-slave-jk-flip-flop', 2).rows, get(7, 'jk-flip-flop', 2).rows);
  assert.deepEqual(get(7, 'active-low-sr-latch').rows[0], [0, 0, 'X', 'Invalid']);
  assert.deepEqual(get(7, 'active-low-sr-latch').rows.at(-1), [1, 1, '\\(Q_n\\)', 'Hold']);
  assert.deepEqual(get(7, 'sr-flip-flop', 2).rows[2], [1, 0, 0, 1]);
});

test('gates are not all XOR and high impedance is represented explicitly', () => {
  assert.deepEqual(get(8, 'and-gate').rows.map(r => r.at(-1)), [0, 0, 0, 1]);
  assert.deepEqual(get(8, 'or-gate').rows.map(r => r.at(-1)), [0, 1, 1, 1]);
  assert.deepEqual(get(8, 'not-gate').rows, [[0, 1], [1, 0]]);
  assert.equal(get(8, 'four-input-nand-gate').rows.length, 16);
  assert.deepEqual(get(8, 'tri-state-buffer').rows[0], [0, 0, 'Z']);
  assert.deepEqual(get(8, 'open-collector-inverter').rows[0], [0, 'Z']);
});

test('selectors and code mappings have complete widths and valid output codes', () => {
  assert.equal(get(9, 'mux-2-to-1').rows.length, 2);
  assert.equal(get(9, 'mux-16-to-1').rows.length, 16);
  assert.equal(get(9, 'demux-1-to-8').rows.length, 8);
  assert.equal(get(10, 'decoder-4-to-16').rows.length, 16);
  assert.deepEqual(get(10, 'priority-encoder-4-to-2').rows[0], ['1XXX', '11', 1]);
  assert.deepEqual(get(10, 'priority-encoder-4-to-2').rows[3], ['0001', '00', 1]);
  const gray = get(10, 'binary-to-gray-converter').rows;
  const binary = get(10, 'gray-to-binary-converter').rows;
  for (const [input, output] of gray) assert.equal(binary.find(row => row[0] === output)[1], input);
  assert.deepEqual(get(10, 'binary-to-bcd-converter').rows.at(-1), ['1111', '0001 0101']);
});

test('merged seed, modular seed, and upgrade migration contain identical completion SQL', () => {
  const block = text => text.match(/-- BEGIN COMPLETE CATALOGUE TABLES[^]*?-- END COMPLETE CATALOGUE TABLES/)[0];
  assert.equal(block(seed), block(fs.readFileSync(path.join(root, 'electrodb.sql'), 'utf8')));
  assert.equal(block(seed), block(fs.readFileSync(path.join(root, 'database/13_complete_catalogue_tables.sql'), 'utf8')));
});

test('all referenced SVG files exist, including dynamic circuit, pinout, state, and timing paths', () => {
  const exists = asset => assert.ok(fs.existsSync(path.join(root, 'public', asset)), asset);
  for (const [, asset] of seed.matchAll(/'(\/assets\/svg\/[^']+\.svg)'/g)) exists(asset);
  for (const component of components) {
    exists(`/assets/svg/circuits/${component.slug === 'jk-flip-flop' ? 'jk-flip-flop-circuit' : component.slug}.svg`);
    if ([6, 7, 8, 9, 10, 17, 18, 19, 20, 21].includes(component.category_id)) exists(`/assets/svg/pinouts/${component.slug}.svg`);
    if ([6, 7].includes(component.category_id)) {
      for (const suffix of ['state', 'timing']) exists(`/assets/svg/${component.category_id === 6 ? 'counters' : 'flipflops'}/${component.slug}-${suffix}.svg`);
    }
  }
});

test('missing diagram files are separate byte-for-byte copies of the JK circuit', () => {
  const reference = fs.readFileSync(path.join(root, 'public/assets/svg/circuits/jk-flip-flop-circuit.svg'));
  for (const asset of ['circuits/and-gate.svg', 'circuits/eeprom.svg', 'circuits/stepper-motor.svg', 'pinouts/t-flip-flop.svg']) {
    assert.deepEqual(fs.readFileSync(path.join(root, 'public/assets/svg', asset)), reference);
  }
});
