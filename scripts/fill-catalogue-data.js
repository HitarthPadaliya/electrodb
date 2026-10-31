#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { tablesFor } = require('../src/catalogue-tables');
const root = path.resolve(__dirname, '..');
const seedPath = path.join(root, 'database/07_seed_data.sql');
const start = '-- BEGIN COMPLETE CATALOGUE TABLES (scripts/fill-catalogue-data.js)';
const end = '-- END COMPLETE CATALOGUE TABLES';
const seed = fs.readFileSync(seedPath, 'utf8');
const components = [...seed.matchAll(/^\((\d+), '([^']+)', '([^']+)'/gm)]
  .map(([, category, name, slug]) => ({ category_id: Number(category), name, slug }));
const quote = value => value == null ? 'NULL' : `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
const statements = [];
let sections = 0;
for (const component of components) {
  for (const section of tablesFor(component)) {
    statements.push(`INSERT INTO component_content\n(component_id, content_type_id, section_key, title, content, caption, display_order)\nSELECT c.component_id, ct.content_type_id, ${quote(section.sectionKey)}, ${quote(section.title)},\n       ${quote(JSON.stringify(section.content))}, ${quote(section.caption)}, ${section.sectionKey === 'excitation_table' ? 6 : section.sectionKey === 'characteristic_table' ? 4 : 3}\nFROM components c JOIN content_types ct ON ct.code='TABLE'\nWHERE c.slug=${quote(component.slug)}\nON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);`);
    sections++;
  }
}
const block = `${start}\n${statements.join('\n\n')}\n${end}`;
for (const relative of ['database/07_seed_data.sql', 'electrodb.sql']) {
  const file = path.join(root, relative);
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes(start)) {
    const first = text.indexOf(start), last = text.indexOf(end, first) + end.length;
    text = text.slice(0, first) + block + text.slice(last);
  } else if (relative === 'electrodb.sql') {
    // Keep the data completion with the seed, before stored programs and triggers.
    const marker = text.indexOf('INSERT INTO component_specifications');
    const lastSeed = text.indexOf("WHERE c.slug='not-gate';", marker) + "WHERE c.slug='not-gate';".length;
    if (lastSeed < marker) throw new Error('Could not locate end of merged seed');
    text = text.slice(0, lastSeed) + '\n\n' + block + text.slice(lastSeed);
  } else text = text.trimEnd() + '\n\n' + block + '\n';
  fs.writeFileSync(file, text);
}
fs.writeFileSync(path.join(root, 'database/13_complete_catalogue_tables.sql'),
  '-- Add missing tables and repair empty or generic logical table data. Safe to reapply.\nUSE electrodb;\n\n' + block + '\n');

// Never regenerate or overwrite existing artwork: missing files are intentional
// byte-for-byte copies of the JK reference, as requested, not new schematics.
const reference = fs.readFileSync(path.join(root, 'public/assets/svg/circuits/jk-flip-flop-circuit.svg'));
let created = 0;
for (const component of components) {
  const slug = component.slug === 'jk-flip-flop' ? 'jk-flip-flop-circuit' : component.slug;
  const paths = [`circuits/${slug}.svg`];
  if ([6, 7, 8, 9, 10, 17, 18, 19, 20, 21].includes(component.category_id)) {
    paths.push(`pinouts/${component.slug}.svg`);
  }
  if ([6, 7].includes(component.category_id)) {
    const directory = component.category_id === 6 ? 'counters' : 'flipflops';
    paths.push(`${directory}/${component.slug}-state.svg`, `${directory}/${component.slug}-timing.svg`);
  }
  for (const relative of paths) {
    const file = path.join(root, 'public/assets/svg', relative);
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, reference);
      created++;
    }
  }
}
console.log(`Completed ${sections} table sections; created ${created} missing SVG files from the JK reference.`);
