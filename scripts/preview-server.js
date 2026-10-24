/**
 * ElectroDB — Frontend Preview Server (no database required)
 *
 * Serves the real `public/` frontend and answers the same REST contract as
 * `server/src/` using data derived from `electrodb.sql`, so the UI can be
 * reviewed on machines where MySQL/MariaDB is not installed.
 *
 * This is a development convenience only. It is NOT the application backend:
 * it has no connection pool, no stored programs, and no write support, and it
 * must not be used to demonstrate the Assignment 10/11 database behaviour.
 * Use `npm start` for the real Express API against a seeded MySQL database.
 *
 * Usage:
 *   npm run preview                 # http://localhost:3000
 *   PORT=4000 npm run preview       # custom port
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const PUBLIC = path.join(REPO, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

// ---------------------------------------------------------------- seed parsing
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

const sql = fs.readFileSync(path.join(REPO, 'electrodb.sql'), 'utf8');
const lines = sql.split('\n');
const categories = [];
const components = [];
let mode = null;

for (const line of lines) {
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

const tagDefs = [
  ['digital', 'digital'], ['sequential-logic', 'sequential-logic'], ['combinational-logic', 'combinational-logic'],
  ['semiconductor', 'semiconductor'], ['analog', 'analog'], ['power', 'power'], ['sensor', 'sensor'],
  ['memory', 'memory'], ['electromechanical', 'electromechanical'], ['educational-example', 'educational-example'],
  ['timing', 'timing'], ['state-machine', 'state-machine'], ['la-te-x', 'latex']
];
const tags = tagDefs.map(([name, slug], index) => ({ tag_id: index + 1, name, slug }));

const tagSlugById = new Map(tags.map(t => [t.tag_id, t.slug]));
const componentTags = components.map(component => {
  const ids = new Set();
  const cid = component.category_id;
  const add = slug => {
    const tag = tags.find(t => t.slug === slug);
    if (tag) ids.add(tag.tag_id);
  };
  if ([6, 7].includes(cid)) ['digital', 'sequential-logic', 'timing', 'state-machine'].forEach(add);
  if ([8, 9, 10].includes(cid)) ['digital', 'combinational-logic'].forEach(add);
  if ([11, 12, 13, 14, 15, 16].includes(cid)) add('semiconductor');
  if ([17, 18].includes(cid)) ['analog', 'power'].forEach(add);
  if ([19, 20].includes(cid)) add('sensor');
  if (cid === 21) add('memory');
  if ([22, 23].includes(cid)) add('electromechanical');
  if (component.is_illustrative === 1) add('educational-example');
  return { component_id: component.component_id, tag_ids: [...ids] };
});

const categoryById = new Map(categories.map(c => [c.category_id, c]));
const componentBySlug = new Map(components.map(c => [c.slug, c]));
const componentsByCategory = new Map();
components.forEach(component => {
  if (!componentsByCategory.has(component.category_id)) componentsByCategory.set(component.category_id, []);
  componentsByCategory.get(component.category_id).push(component);
});

components.forEach(component => {
  const cat = categoryById.get(component.category_id);
  component.category_name = cat ? cat.name : '';
  component.category_slug = cat ? cat.slug : '';
});

function breadcrumbsFor(categoryId) {
  const chain = [];
  let current = categoryById.get(categoryId);
  let depth = 0;
  while (current && depth < 10) {
    chain.unshift({ category_id: current.category_id, name: current.name, slug: current.slug });
    current = current.parent_category_id ? categoryById.get(current.parent_category_id) : null;
    depth += 1;
  }
  return chain;
}

function catChildren(parentId) {
  return categories
    .filter(c => c.parent_category_id === parentId)
    .sort((a, b) => (a.display_order - b.display_order) || a.name.localeCompare(b.name))
    .map(c => ({ ...c, component_count: (componentsByCategory.get(c.category_id) || []).length }));
}

function categoryCount(id) {
  return (componentsByCategory.get(id) || []).length;
}

function categoriesTree() {
  return categories
    .filter(c => c.parent_category_id === null)
    .sort((a, b) => a.display_order - b.display_order)
    .map(c => ({
      ...c,
      componentCount: categoryCount(c.category_id),
      children: catChildren(c.category_id)
    }));
}

function tagCounts() {
  return tags.map(tag => ({
    tagId: tag.tag_id,
    name: tag.name,
    slug: tag.slug,
    component_count: componentTags.filter(ct => ct.tag_ids.includes(tag.tag_id)).length
  }));
}

function displayComponents(list) {
  return list.map(c => ({ ...c }));
}

function tagDetail(identifier, page, pageSize) {
  const tag = /^\d+$/.test(identifier)
    ? tags.find(t => t.tag_id === Number(identifier))
    : tags.find(t => t.slug === identifier);
  if (!tag) return null;
  const ids = componentTags.filter(ct => ct.tag_ids.includes(tag.tag_id)).map(ct => ct.component_id);
  const list = components.filter(c => ids.includes(c.component_id)).sort((a, b) => a.name.localeCompare(b.name));
  const offset = (page - 1) * pageSize;
  return {
    tag: { tagId: tag.tag_id, name: tag.name, slug: tag.slug },
    components: displayComponents(list.slice(offset, offset + pageSize)),
    pagination: { page, pageSize, total: list.length, totalPages: Math.ceil(list.length / pageSize) || 1 }
  };
}

// ---------------------------------------------------------------- mock content
function equationFor(component) {
  const map = {
    'jk-flip-flop': 'Q_{next}=J\\overline{Q}+\\overline{K}Q',
    'd-flip-flop': 'Q_{next}=D',
    't-flip-flop': 'Q_{next}=T\\overline{Q}+\\overline{T}Q',
    'sr-flip-flop': 'Q_{next}=S+\\overline{R}Q',
    'and-gate': 'Y=A\\cdot B',
    'or-gate': 'Y=A+B',
    'not-gate': 'Y=\\overline{A}',
    'nand-gate': 'Y=\\overline{A\\cdot B}',
    'nor-gate': 'Y=\\overline{A+B}',
    'xor-gate': 'Y=A\\oplus B',
    'xnor-gate': 'Y=\\overline{A\\oplus B}',
    'half-adder': 'S=A\\oplus B,\\; C=A\\cdot B',
    'full-adder': 'S=A\\oplus B\\oplus C_{in}',
    'inverting-amplifier': 'V_{out}=-\\frac{R_f}{R_{in}}V_{in}',
    'non-inverting-amplifier': 'V_{out}=\\left(1+\\frac{R_f}{R_{in}}\\right)V_{in}',
    'summing-amplifier': 'V_{out}=-R_f\\left(\\frac{V_1}{R_1}+\\frac{V_2}{R_2}\\right)'
  };
  if (map[component.slug]) return map[component.slug];
  const cid = component.category_id;
  if (cid === 6) return 'Q_{next}=Q+1\\pmod{M}';
  if (cid === 7) return 'Q_{next}=f(inputs,Q)';
  if ([8, 9, 10].includes(cid)) return 'Y=f(A,B,C)';
  if ([17, 18].includes(cid)) return 'V_{out}=f(V_{in})';
  if ([19, 20].includes(cid)) return 'D_{out}=f(S_{in})';
  return null;
}

function contentFor(component) {
  const content = [{
    sectionKey: 'overview', title: 'Overview', type: 'TEXT',
    content: component.description, caption: null
  }];
  const cid = component.category_id;

  if (cid === 6) {
    content.push({
      sectionKey: 'state_table', title: 'State / Next-State Table', type: 'TABLE',
      content: {
        columns: ['Decimal', 'Current state Q3Q2Q1Q0', 'Next state Q3Q2Q1Q0'],
        rows: [[0, '0000', '0001'], [1, '0001', '0010'], [2, '0010', '0011'], [3, '0011', '0100'], [4, '0100', '0101'], [5, '0101', '0110'], [6, '0110', '0111'], [7, '0111', '1000'], [8, '1000', '1001'], [9, '1001', '0000']]
      },
      caption: 'The state sequence wraps back to 0000 after the final valid state.'
    });
  }

  if (cid === 7) {
    const isJk = component.slug.includes('jk');
    content.push({
      sectionKey: 'truth_table', title: 'Truth Table', type: 'TABLE',
      content: {
        columns: isJk ? ['J', 'K', 'Q', 'Q(next)', 'Operation'] : ['D', 'Q', 'Q(next)'],
        rows: isJk
          ? [[0, 0, 0, 0, 'Hold'], [0, 0, 1, 1, 'Hold'], [0, 1, 0, 0, 'Reset'], [0, 1, 1, 0, 'Reset'], [1, 0, 0, 1, 'Set'], [1, 0, 1, 1, 'Set'], [1, 1, 0, 1, 'Toggle'], [1, 1, 1, 0, 'Toggle']]
          : [[0, 0, 0], [0, 1, 0], [1, 0, 1], [1, 1, 1]]
      },
      caption: 'Q(next) is the output after the active clock edge.'
    });
    content.push({
      sectionKey: 'characteristic_table', title: 'Characteristic Table', type: 'TABLE',
      content: {
        columns: isJk ? ['J', 'K', 'Q', 'Q(next)'] : ['D', 'Q', 'Q(next)'],
        rows: isJk
          ? [[0, 0, 0, 0], [0, 0, 1, 1], [0, 1, 0, 0], [0, 1, 1, 0], [1, 0, 0, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 0]]
          : [[0, 0, 0], [0, 1, 0], [1, 0, 1], [1, 1, 1]]
      },
      caption: null
    });
  }

  if (cid === 8) {
    content.push({
      sectionKey: 'truth_table', title: 'Truth Table', type: 'TABLE',
      content: { columns: ['A', 'B', 'Y'], rows: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]] },
      caption: 'Illustrative two-input truth table; compound gates expose their own input sets.'
    });
  }

  if (cid === 9) {
    content.push({
      sectionKey: 'selection_table', title: 'Selection Table', type: 'TABLE',
      content: {
        columns: ['S1', 'S0', 'Y'],
        rows: [[0, 0, 'I\u2080'], [0, 1, 'I\u2081'], [1, 0, 'I\u2082'], [1, 1, 'I\u2083']]
      },
      caption: 'Select inputs route one data input to the output.'
    });
  }

  if (cid === 10) {
    content.push({
      sectionKey: 'mapping_table', title: 'Code Mapping', type: 'TABLE',
      content: {
        columns: ['Input', 'Output code'],
        rows: [['D0', '000'], ['D1', '001'], ['D2', '010'], ['D3', '011']]
      },
      caption: 'Representative mapping for a 4-to-3 encoder.'
    });
  }

  const equation = equationFor(component);
  if (equation && cid !== 7) {
    content.push({ sectionKey: 'boolean_equation', title: 'Boolean / Transfer Equation', type: 'EQUATION', content: equation, caption: null });
  }
  if (equation && cid === 7) {
    content.push({ sectionKey: 'characteristic_equation', title: 'Characteristic Equation', type: 'EQUATION', content: equation, caption: null });
  }

  if ([11, 12, 13, 14, 15, 16, 21, 22, 23].includes(cid)) {
    content.push({
      sectionKey: 'applications', title: 'Applications', type: 'TEXT',
      content: 'Used in educational circuit examples, switching stages, and reference designs. Verify all ratings against a manufacturer datasheet before using a part in production.',
      caption: null
    });
  }

  return content;
}

function specificationsFor(component) {
  const cid = component.category_id;
  const definitions = {
    6: [['Modulus', '10', null], ['State bits', '4', 'bits'], ['Supply voltage', '3.3', 'V']],
    7: [['Propagation delay', '12', 'ns'], ['Setup time', '4', 'ns'], ['Hold time', '1.5', 'ns'], ['Supply voltage', '3.3', 'V']],
    8: [['Propagation delay', '8', 'ns'], ['Fan-out', '8', null], ['Supply voltage', '3.3', 'V']],
    9: [['Propagation delay', '9', 'ns'], ['Channels', '4', null], ['Supply voltage', '3.3', 'V']],
    10: [['Propagation delay', '10', 'ns'], ['Inputs', '4', null], ['Supply voltage', '3.3', 'V']],
    11: [['Forward current', '1', 'A'], ['Reverse voltage', '50', 'V'], ['Forward voltage', '0.7', 'V']],
    12: [['Zener voltage', '5.1', 'V'], ['Power dissipation', '500', 'mW']],
    13: [['Forward voltage', '0.35', 'V'], ['Reverse voltage', '40', 'V']],
    14: [['Forward voltage', '2.0', 'V'], ['Luminous intensity', '120', 'mcd']],
    15: [['Collector current', '100', 'mA'], ['V_CE(sat)', '0.2', 'V']],
    16: [['Drain current', '2', 'A'], ['V_DS', '60', 'V'], ['R_DS(on)', '45', 'mΩ']],
    17: [['Gain bandwidth', '1', 'MHz'], ['Slew rate', '0.5', 'V/µs'], ['Supply voltage', '±15', 'V']],
    18: [['Output current', '1', 'A'], ['Dropout', '0.3', 'V']],
    19: [['Temperature range', '-40 to 125', '°C'], ['Accuracy', '±0.5', '°C']],
    20: [['Resolution', '12', 'bits'], ['Sample rate', '1', 'MSPS']],
    21: [['Capacity', '256', 'Kbit'], ['Access time', '45', 'ns']],
    22: [['Contact rating', '5', 'A'], ['Coil voltage', '12', 'V']],
    23: [['Voltage', '12', 'V'], ['Speed', '3000', 'rpm']]
  };
  const defs = definitions[cid] || [['Supply voltage', '3.3', 'V'], ['Operating temperature', '-40 to 85', '°C']];
  return defs.map(([name, value, unit]) => ({ name, value, unit, sourceNote: 'Illustrative educational value' }));
}

function diagramsFor(component) {
  const diagrams = [];
  if (component.circuit_symbol_path) {
    const absolute = path.join(PUBLIC, component.circuit_symbol_path);
    if (fs.existsSync(absolute)) {
      diagrams.push({
        diagramId: 1, title: 'Circuit / Symbol Diagram',
        imagePath: component.circuit_symbol_path,
        altText: `Circuit symbol for ${component.name}`,
        caption: 'Pin-level circuit representation.'
      });
    }
  }
  const candidates = [
    ['State Diagram', `/assets/svg/flipflops/${component.slug}-state.svg`],
    ['State Diagram', `/assets/svg/counters/${component.slug}-state.svg`],
    ['Timing Diagram', `/assets/svg/flipflops/${component.slug}-timing.svg`],
    ['Timing Diagram', `/assets/svg/counters/${component.slug}-timing.svg`]
  ];
  for (const [title, imagePath] of candidates) {
    if (fs.existsSync(path.join(PUBLIC, imagePath)) && !diagrams.some(d => d.title === title)) {
      diagrams.push({
        diagramId: diagrams.length + 1, title, imagePath,
        altText: `${title} for ${component.name}`, caption: `Illustrative ${title.toLowerCase()}.`
      });
    }
  }
  return diagrams;
}

function componentDetail(identifier) {
  const component = /^\d+$/.test(identifier)
    ? components.find(c => c.component_id === Number(identifier))
    : componentBySlug.get(identifier);
  if (!component) return null;

  const tagIds = componentTags.find(ct => ct.component_id === component.component_id).tag_ids;
  const overview = component.description;
  return {
    componentId: component.component_id,
    name: component.name,
    slug: component.slug,
    category: {
      categoryId: component.category_id,
      name: component.category_name,
      slug: component.category_slug
    },
    breadcrumbs: breadcrumbsFor(component.category_id),
    shortDescription: component.short_description,
    description: overview,
    mainImagePath: component.main_image_path,
    circuitSymbolPath: component.circuit_symbol_path,
    datasheetUrl: component.datasheet_url,
    isIllustrative: Boolean(component.is_illustrative),
    isPublished: Boolean(component.is_published),
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00',
    content: contentFor(component),
    diagrams: diagramsFor(component),
    specifications: specificationsFor(component),
    tags: tagIds.map(id => {
      const tag = tags.find(t => t.tag_id === id);
      return { tag_id: tag.tag_id, name: tag.name, slug: tag.slug };
    })
  };
}

// ---------------------------------------------------------------- XML helpers
function xmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function componentsXml(list) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<components>\n${list.map(c => `  <component id="${c.component_id}" categoryId="${c.category_id}">\n    <name>${xmlEscape(c.name)}</name>\n    <slug>${xmlEscape(c.slug)}</slug>\n    <shortDescription>${xmlEscape(c.short_description || '')}</shortDescription>\n  </component>`).join('\n')}\n</components>`;
}

// ---------------------------------------------------------------- request handling
function json(res, body, status = 200) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(payload);
}

function xml(res, body) {
  res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function paginate(list, page, pageSize) {
  const offset = (page - 1) * pageSize;
  return {
    items: list.slice(offset, offset + pageSize),
    pagination: { page, pageSize, total: list.length, totalPages: Math.ceil(list.length / pageSize) || 1 }
  };
}

function handleApi(req, res, url) {
  const p = url.pathname;
  const q = url.searchParams;
  const page = Math.max(1, Number(q.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(q.get('pageSize')) || 24));

  if (p === '/api/health') return json(res, { status: 'ok', service: 'ElectroDB API (preview mock)', database: 'mock' });

  if (p === '/api/categories') return json(res, { data: categoriesTree() });

  if (p.startsWith('/api/categories/')) {
    const identifier = decodeURIComponent(p.split('/')[3] || '');
    const category = /^\d+$/.test(identifier)
      ? categoryById.get(Number(identifier))
      : categories.find(c => c.slug === identifier);
    if (!category) return json(res, { error: { code: 'NOT_FOUND', message: `Category not found: ${identifier}` } }, 404);

    const direct = componentsByCategory.get(category.category_id) || [];
    const paged = paginate(direct, page, pageSize);
    return json(res, { data: {
      category,
      breadcrumbs: breadcrumbsFor(category.category_id),
      children: catChildren(category.category_id),
      components: paged.items,
      pagination: { page, pageSize, total: direct.length, totalPages: paged.pagination.totalPages }
    } });
  }

  if (p === '/api/components') {
    const categoryId = q.get('categoryId') ? Number(q.get('categoryId')) : null;
    const source = categoryId ? components.filter(c => c.category_id === categoryId) : components;
    const sorted = [...source].sort((a, b) => a.name.localeCompare(b.name));
    const result = paginate(sorted, page, pageSize);
    return json(res, { data: result });
  }

  if (p.startsWith('/api/components/')) {
    const identifier = decodeURIComponent(p.split('/')[3] || '');
    const detail = componentDetail(identifier);
    if (!detail) return json(res, { error: { code: 'NOT_FOUND', message: `Component not found: ${identifier}` } }, 404);
    return json(res, { data: detail });
  }

  if (p === '/api/tags') return json(res, { data: tagCounts() });

  if (p.startsWith('/api/tags/')) {
    const identifier = decodeURIComponent(p.split('/')[3] || '');
    const detail = tagDetail(identifier, page, pageSize);
    if (!detail) return json(res, { error: { code: 'NOT_FOUND', message: `Tag not found: ${identifier}` } }, 404);
    return json(res, { data: detail });
  }

  if (p === '/api/search') {
    const query = (q.get('q') || '').trim();
    const pattern = query.toLowerCase();
    const matches = query
      ? components.filter(c => c.name.toLowerCase().includes(pattern) || (c.short_description || '').toLowerCase().includes(pattern))
      : [];
    const sorted = [...matches].sort((a, b) => a.name.localeCompare(b.name));
    const result = paginate(sorted, page, 20);
    return json(res, { data: { query, items: result.items, pagination: result.pagination } });
  }

  // ---- Lab endpoints ----
  if (p === '/api/lab/users') {
    return json(res, { data: [
      { user_id: 1, username: 'lab_student', role_code: 'APP_DEVELOPER', is_active: 1, created_at: '2026-01-12 10:20:00' },
      { user_id: 2, username: 'catalogue_dba', role_code: 'DBA', is_active: 1, created_at: '2026-01-12 10:24:00' }
    ] });
  }

  if (p === '/api/lab/audit-log') {
    return json(res, { data: [
      { audit_id: 12, table_name: 'components', operation_type: 'INSERT', row_key: '148', db_user: 'electrodb_app', changed_at: '2026-01-12 11:02:14', new_values: { name: 'Quad OR Gate', category_id: 8 } },
      { audit_id: 11, table_name: 'components', operation_type: 'UPDATE', row_key: '17', db_user: 'electrodb_app', changed_at: '2026-01-12 10:58:03', new_values: { short_description: 'Updated summary' } },
      { audit_id: 10, table_name: 'components', operation_type: 'DELETE', row_key: '149', db_user: 'electrodb_app', changed_at: '2026-01-12 10:55:41', old_values: { name: 'Temporary Example' } }
    ] });
  }

  if (p === '/api/lab/timing-report') {
    const report = fs.readFileSync(path.join(REPO, 'database/10_query_timing_results.md'), 'utf8');
    return json(res, { data: { report } });
  }

  if (p === '/api/lab/dashboard') {
    return json(res, { data: {
      tables: [
        { table_name: 'categories', row_count: categories.length },
        { table_name: 'components', row_count: components.length },
        { table_name: 'tags', row_count: tags.length },
        { table_name: 'component_tags', row_count: componentTags.reduce((s, ct) => s + ct.tag_ids.length, 0) },
        { table_name: 'component_content', row_count: components.length * 3 },
        { table_name: 'component_diagrams', row_count: components.length },
        { table_name: 'specifications', row_count: 18 },
        { table_name: 'component_specifications', row_count: components.length * 3 },
        { table_name: 'app_users', row_count: 2 },
        { table_name: 'application_audit_log', row_count: 12 }
      ],
      componentMetrics: {
        published_components: components.filter(c => c.is_published).length,
        illustrative_components: components.filter(c => c.is_illustrative).length
      }
    } });
  }

  if (p === '/api/lab/components.xml') {
    const result = paginate(components, page, pageSize);
    return xml(res, componentsXml(result.items));
  }

  if (p === '/api/lab/components') {
    const result = paginate(components, page, pageSize);
    return json(res, { data: result });
  }

  if (p === '/api/lab/aggregate') {
    const fn = (q.get('function') || 'COUNT').toUpperCase();
    const field = q.get('field') || 'component_id';
    const values = components.map(c => Number(c[field])).filter(v => !Number.isNaN(v));
    let value = 0;
    if (fn === 'COUNT') value = components.length;
    else if (fn === 'SUM') value = values.reduce((a, b) => a + b, 0);
    else if (fn === 'AVG') value = values.reduce((a, b) => a + b, 0) / values.length;
    else if (fn === 'MIN') value = Math.min(...values);
    else if (fn === 'MAX') value = Math.max(...values);
    return json(res, { data: { table: 'components', function: fn, field, value: Number(value.toFixed(2)), rowCount: components.length } });
  }

  if (p === '/api/lab/aggregate.xml') {
    return xml(res, `<?xml version="1.0" encoding="UTF-8"?>\n<aggregate table="components" function="${xmlEscape(q.get('function') || 'COUNT')}" field="${xmlEscape(q.get('field') || 'component_id')}" value="${components.length}" />`);
  }

  if (p === '/api/lab/filter') {
    const field = q.get('field') || 'category_id';
    const operator = q.get('operator') || 'eq';
    const value = q.get('value') || '6';
    let matched = components.filter(c => String(c[field]) === String(value));
    if (operator === 'neq') matched = components.filter(c => String(c[field]) !== String(value));
    if (operator === 'like') matched = components.filter(c => String(c[field] || '').toLowerCase().includes(String(value).toLowerCase()));
    const result = paginate(matched, page, pageSize);
    return json(res, { data: { items: result.items, total: matched.length, filter: { table: 'components', field, operator, value } } });
  }

  if (p === '/api/lab/filter.xml') {
    return xml(res, `<?xml version="1.0" encoding="UTF-8"?>\n<components total="${components.length}" />`);
  }

  if (p === '/api/lab/join') {
    const left = q.get('left') || 'components';
    const right = q.get('right') || 'categories';
    const type = q.get('type') || 'inner';
    const rows = components.slice(0, pageSize).map(c => ({
      component_id: c.component_id, category_id: c.category_id, name: c.name,
      joined_name: c.category_name
    }));
    return json(res, { data: {
      leftTable: left, rightTable: right,
      joinType: `${type.toUpperCase()} JOIN`,
      joinCondition: `${left}.category_id = ${right}.category_id`,
      rows
    } });
  }

  if (p === '/api/lab/subquery') {
    return json(res, { data: {
      kind: 'categories_in_digital',
      description: 'Components belonging to categories under Digital Electronics (parent_category_id = 1)',
      sql: 'SELECT component_id, name, category_id, slug FROM components WHERE category_id IN (SELECT category_id FROM categories WHERE parent_category_id = 1) LIMIT 25',
      rows: components.filter(c => breadcrumbsFor(c.category_id)[0] && breadcrumbsFor(c.category_id)[0].category_id === 1).slice(0, 25).map(c => ({ component_id: c.component_id, name: c.name, category_id: c.category_id, slug: c.slug }))
    } });
  }

  if (p === '/api/lab/correlated-query') {
    return json(res, { data: {
      kind: 'categories_with_components',
      description: 'Categories that have at least one published component',
      sql: 'SELECT cat.category_id, cat.name, cat.slug FROM categories cat WHERE EXISTS (SELECT 1 FROM components c WHERE c.category_id = cat.category_id AND c.is_published = 1) ORDER BY cat.category_id',
      rows: categories.filter(cat => (componentsByCategory.get(cat.category_id) || []).some(c => c.is_published)).map(cat => ({ category_id: cat.category_id, name: cat.name, slug: cat.slug }))
    } });
  }

  if (p === '/api/lab/cursors/all') {
    return json(res, { data: { rowCount: components.length, rows: components.map(c => ({ component_id: c.component_id, name: c.name })) } });
  }

  if (p === '/api/lab/cursors/limited') {
    const limit = Math.max(1, Number(q.get('limit')) || 10);
    return json(res, { data: { rowCount: Math.min(limit, components.length), rows: components.slice(0, limit).map(c => ({ component_id: c.component_id, name: c.name })) } });
  }

  if (p === '/api/lab/sum') {
    const grouped = categories
      .filter(cat => categoryCount(cat.category_id) > 0)
      .map(cat => {
        const list = componentsByCategory.get(cat.category_id);
        return {
          category_id: cat.category_id, category_name: cat.name,
          component_count: list.length,
          sum_component_ids: list.reduce((s, c) => s + c.component_id, 0)
        };
      });
    return json(res, { data: {
      ungrouped: { totalSum: components.reduce((s, c) => s + c.component_id, 0) },
      grouped: { items: grouped }
    } });
  }

  if (p === '/api/lab/views/catalogue') {
    const result = paginate(components, page, pageSize);
    return json(res, { data: { items: result.items.map(c => ({
      component_id: c.component_id,
      component_name: c.name,
      category_name: c.category_name,
      parent_category_name: breadcrumbsFor(c.category_id).length > 1 ? breadcrumbsFor(c.category_id)[0].name : null
    })), pagination: result.pagination } });
  }

  if (p === '/api/lab/views/counts') {
    return json(res, { data: { items: categories.map(c => ({
      category_id: c.category_id, category_name: c.name, category_slug: c.slug,
      component_count: categoryCount(c.category_id)
    })) } });
  }

  return json(res, { error: { code: 'NOT_FOUND', message: `Unknown preview endpoint: ${p}` } }, 404);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    try {
      return handleApi(req, res, url);
    } catch (err) {
      console.error(err);
      return json(res, { error: { code: 'PREVIEW_ERROR', message: err.message } }, 500);
    }
  }

  let filePath = path.join(PUBLIC, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`ElectroDB frontend preview (seed-derived data) on http://${HOST}:${PORT}`);
  console.log(`Seed-derived catalogue: ${components.length} components, ${categories.length} categories, ${tags.length} tags`);
  console.log('Preview data only — run `npm start` with MySQL for the real API.');
});
