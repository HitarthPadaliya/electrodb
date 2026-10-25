/**
 * ElectroDB — seed data reader
 *
 * Parses `electrodb.sql` into plain objects so tooling (the preview server and
 * the diagram builders) can work without a database. Kept dependency-free.
 *
 * The parser is deliberately literal: it walks the INSERT statements in the
 * dump and splits tuple lines, handling `''` escapes and NULL.
 */

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '../..');

function splitTuple(line) {
  const inner = line.trim().replace(/^\(/, '').replace(/\),?$/, '');
  const fields = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (quoted) {
      if (ch === "'" && inner[i + 1] === "'") { cur += "'"; i += 1; }
      else if (ch === "'") quoted = false;
      else cur += ch;
    } else if (ch === "'") quoted = true;
    else if (ch === ',') { fields.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  fields.push(cur.trim());
  return fields.map(f => (f === 'NULL' ? null : f));
}

const TAG_DEFS = [
  ['digital', 'digital'], ['sequential-logic', 'sequential-logic'], ['combinational-logic', 'combinational-logic'],
  ['semiconductor', 'semiconductor'], ['analog', 'analog'], ['power', 'power'], ['sensor', 'sensor'],
  ['memory', 'memory'], ['electromechanical', 'electromechanical'],
  ['timing', 'timing'], ['state-machine', 'state-machine'], ['la-te-x', 'latex']
];

function loadSeed(sqlFile = path.join(REPO, 'electrodb.sql')) {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const categories = [];
  const components = [];
  let mode = null;

  for (const line of sql.split('\n')) {
    if (line.startsWith('INSERT INTO categories')) { mode = 'categories'; continue; }
    if (line.startsWith('INSERT INTO components')) { mode = 'components'; continue; }
    if (line.startsWith('INSERT INTO tags')) { mode = 'tags'; continue; }
    if (mode && line.startsWith('SELECT ')) { mode = null; continue; }
    if (mode && line.startsWith('VALUES')) continue;

    if (mode === 'categories' && line.trim().startsWith('(')) {
      const f = splitTuple(line);
      categories.push({
        category_id: Number(f[0]), parent_category_id: f[1] ? Number(f[1]) : null,
        name: f[2], slug: f[3], description: f[4], display_order: Number(f[5] || 0)
      });
    } else if (mode === 'components' && line.trim().startsWith('(')) {
      const f = splitTuple(line);
      if (!/^\d+$/.test(f[0])) continue;
      components.push({
        component_id: components.length + 1,
        category_id: Number(f[0]), name: f[1], slug: f[2],
        short_description: f[3], description: f[4],
        main_image_path: f[5], circuit_symbol_path: f[6], datasheet_url: f[7],
        is_illustrative: Number(f[8]), is_published: Number(f[9])
      });
    }
  }

  const tags = TAG_DEFS.map(([name, slug], index) => ({ tag_id: index + 1, name, slug }));

  const componentsByCategory = new Map();
  const categoryById = new Map(categories.map(c => [c.category_id, c]));
  components.forEach(component => {
    const cat = categoryById.get(component.category_id);
    component.category_name = cat ? cat.name : '';
    component.category_slug = cat ? cat.slug : '';
    if (!componentsByCategory.has(component.category_id)) componentsByCategory.set(component.category_id, []);
    componentsByCategory.get(component.category_id).push(component);
  });

  return {
    categories,
    components,
    tags,
    categoryById,
    componentsByCategory,
    bySlug: new Map(components.map(c => [c.slug, c]))
  };
}

module.exports = { loadSeed, REPO, TAG_DEFS };
