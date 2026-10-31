const http = require('http');
const fs = require('fs');
const path = require('path');

const { tablesFor, flipFlopKind } = require('../src/catalogue-tables');
const truthTableFor = slug => tablesFor({ category_id: 7, slug })[0].content;
const characteristicTableFor = slug => tablesFor({ category_id: 7, slug })[1].content;
module.exports = { flipFlopKind, truthTableFor, characteristicTableFor };

const REPO = path.resolve(__dirname, '..');
const PUBLIC = path.join(REPO, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

function splitTuple(line) {
    const inner = line.trim().replace(/^\(/, '').replace(/\)[;,]*$/, '');
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
const rowOnlyCounts = { specifications: 0, content_types: 0 };
let mode = null;

const INSERT_MODES = [
  ['INSERT INTO categories', 'categories'],
  ['INSERT INTO components', 'components'],
  ['INSERT INTO tags', 'tags'],
  ['INSERT INTO specifications', 'specifications'],
  ['INSERT INTO content_types', 'content_types']
];

for (const line of lines) {
  if (line.startsWith('INSERT INTO ')) {
    const match = INSERT_MODES.find(([prefix]) => line.startsWith(prefix));
    mode = match ? match[1] : null;
    continue;
  }
  if (mode && line.startsWith('SELECT ')) { mode = null; continue; }
  if (mode && line.startsWith('VALUES')) continue;

  if (mode === 'categories' && line.trim().startsWith('(')) {
    const f = splitTuple(line);
    categories.push({
      category_id: Number(f[0]), parent_category_id: f[1] ? Number(f[1]) : null,
      name: f[2], slug: f[3], description: f[4], display_order: Number(f[5] || 0)
    });
  } else if (mode && rowOnlyCounts[mode] !== undefined && line.trim().startsWith('(')) {
    rowOnlyCounts[mode] += 1;
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
  ['memory', 'memory'], ['electromechanical', 'electromechanical'],
  ['timing', 'timing'], ['state-machine', 'state-machine'], ['la-te-x', 'latex']
];
const tags = tagDefs.map(([name, slug], index) => ({ tag_id: index + 1, name, slug }));

const AUDIT_LOG_FIXTURES = [
  { audit_id: 12, table_name: 'components', operation_type: 'INSERT', row_key: '148', db_user: 'electrodb_app', changed_at: '2026-01-12 11:02:14', new_values: { name: 'Quad OR Gate', category_id: 8 } },
  { audit_id: 11, table_name: 'components', operation_type: 'UPDATE', row_key: '17', db_user: 'electrodb_app', changed_at: '2026-01-12 10:58:03', new_values: { short_description: 'Updated summary' } },
  { audit_id: 10, table_name: 'components', operation_type: 'DELETE', row_key: '149', db_user: 'electrodb_app', changed_at: '2026-01-12 10:55:41', old_values: { name: 'Temporary Example' } }
];

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

function catalogueStats() {
  return {
    components: components.filter(c => c.is_published).length,
    componentsTotal: components.length,
    categories: categories.length,
    subfamilies: categories.filter(c => c.parent_category_id !== null).length,
    tags: tags.length,
    diagrams: components.reduce((total, c) => total + diagramsFor(c).length, 0),
    specifications: rowOnlyCounts.specifications,
    contentSections: components.reduce((total, c) => total + contentFor(c).length, 0),
    specificationValues: components.reduce((total, c) => total + specificationsFor(c).length, 0),
    taggedComponents: componentTags.reduce((total, ct) => total + ct.tag_ids.length, 0)
  };
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

  content.push(...tablesFor(component));

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

const PINOUT_CATEGORIES = new Set([6, 7, 8, 9, 10, 17, 18, 19, 20, 21]);
const PINOUT_EXCLUDE = new Set();

function diagramsFor(component) {
  const diagrams = [];
  const add = (title, kind, imagePath, altText, caption) => {
    if (!imagePath) return;
    if (!fs.existsSync(path.join(PUBLIC, imagePath))) return;
    if (diagrams.some(d => d.imagePath === imagePath)) return;
    diagrams.push({ diagramId: diagrams.length + 1, title, kind, imagePath, altText, caption });
  };

    add('Symbol Diagram', 'SYMBOL', component.circuit_symbol_path,
    `Pin-level diagram for ${component.name}, showing its functional symbol and labeled signal terminals where applicable.`,
    `The symbol identifies ${component.name} and labels its principal input, output, clock, control, and supply terminals when present.`);

  {
    const circuitPath =
      component.slug === 'jk-flip-flop'
        ? '/assets/svg/circuits/jk-flip-flop-circuit.svg'
        : `/assets/svg/circuits/${component.slug}.svg`;
    add('Circuit Diagram', 'CIRCUIT', circuitPath,
      `Circuit schematic for ${component.name}, showing connected logic or device stages and their principal signal paths.`,
      `The schematic shows the main logic or device stages in ${component.name}, how they interconnect, and the signal and control paths in the reference implementation.`);
  }

    if (PINOUT_CATEGORIES.has(component.category_id) && !PINOUT_EXCLUDE.has(component.slug)) {
    add('Pinout Diagram', 'PINOUT', `/assets/svg/pinouts/${component.slug}.svg`,
      `Package pin map for ${component.name}, showing numbered terminals and signal names.`,
      `The pin map identifies package terminals and signal names for ${component.name}. Confirm package variant and pin-one orientation against the device datasheet.`);
  }

    const supportDir = component.category_id === 6 ? 'counters' : 'flipflops';
  add('State Machine', 'STATE', `/assets/svg/${supportDir}/${component.slug}-state.svg`,
    `${component.name} state-transition comparison: MOORE machine first on the left, followed by MEALY on the right.`,
    `MOORE is shown first on the left, with outputs associated with states. MEALY follows on the right, with input/output labels on directed transitions. Arrowheads mark every transition, including self-loops.`);
  add('Timing Diagram', 'TIMING', `/assets/svg/${supportDir}/${component.slug}-timing.svg`,
    `Timing waveform for ${component.name}, showing clock and related logic signals across successive cycles.`,
    `The timing trace aligns clock and logic signals to show active transitions and resulting state or output changes. Setup, hold, and propagation limits depend on the selected device.`);

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

function xmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function componentsXml(list) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<components>\n${list.map(c => `  <component id="${c.component_id}" categoryId="${c.category_id}">\n    <name>${xmlEscape(c.name)}</name>\n    <slug>${xmlEscape(c.slug)}</slug>\n    <shortDescription>${xmlEscape(c.short_description || '')}</shortDescription>\n  </component>`).join('\n')}\n</components>`;
}

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

  if (p === '/api/stats') return json(res, { data: catalogueStats() });

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

    if (p === '/api/lab/users') {
    return json(res, { data: [
      { user_id: 1, username: 'lab_student', role_code: 'APP_DEVELOPER', is_active: 1, created_at: '2026-01-12 10:20:00' },
      { user_id: 2, username: 'catalogue_dba', role_code: 'DBA', is_active: 1, created_at: '2026-01-12 10:24:00' }
    ] });
  }

  if (p === '/api/lab/audit-log') return json(res, { data: AUDIT_LOG_FIXTURES });

  if (p === '/api/lab/timing-report') {
    const report = fs.readFileSync(path.join(REPO, 'database/10_query_timing_results.md'), 'utf8');
    return json(res, { data: { report } });
  }

  if (p === '/api/lab/dashboard') {
    const stats = catalogueStats();
    return json(res, { data: {
      tables: [
        { table_name: 'categories', row_count: stats.categories },
        { table_name: 'components', row_count: stats.componentsTotal },
        { table_name: 'tags', row_count: stats.tags },
        { table_name: 'component_tags', row_count: stats.taggedComponents },
        { table_name: 'component_content', row_count: stats.contentSections },
        { table_name: 'component_diagrams', row_count: stats.diagrams },
        { table_name: 'specifications', row_count: stats.specifications },
        { table_name: 'component_specifications', row_count: stats.specificationValues },
        { table_name: 'app_users', row_count: PREVIEW_ACCOUNTS.length },
        { table_name: 'application_audit_log', row_count: AUDIT_LOG_FIXTURES.length }
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

process.env.PERSONAL_STORE = 'memory';
process.env.SESSION_COOKIE_SAMESITE = process.env.SESSION_COOKIE_SAMESITE || 'auto';

const express = require('express');
const { errorHandler } = require('../src/errors');
const { authRouter, userRouter, adminRouter, attachUser } = require('../src/routes');
const { getStore } = require('../src/store');
const { passwords } = require('../src/security');

const PREVIEW_PASSWORD = 'Electrodb#2025';
const STATE_FILE = path.join(REPO, '.preview-state.json');
const PREVIEW_ACCOUNTS = [
  { key: 'dba', username: 'preview_dba', email: 'dba@preview.local', roleCode: 'DBA' },
  { key: 'developer', username: 'preview_developer', email: 'developer@preview.local', roleCode: 'APP_DEVELOPER' },
  { key: 'user', username: 'preview_user', email: 'user@preview.local', roleCode: 'NAIVE_USER' }
];

const accountApi = express();
accountApi.disable('x-powered-by');
accountApi.use(express.json({ limit: '64kb' }));

let stateSaveTimer = null;
function persistAccountState() {
  if (stateSaveTimer) return;
  stateSaveTimer = setTimeout(() => {
    stateSaveTimer = null;
    try {
                  const temporary = `${STATE_FILE}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify(getStore().snapshot()));
      fs.renameSync(temporary, STATE_FILE);
    } catch (err) {
      console.warn('Could not persist preview account state:', err.message);
    }
  }, 250);
}

accountApi.use((req, res, next) => {
  res.on('finish', persistAccountState);
  next();
});

accountApi.use('/api', attachUser);
accountApi.use('/api/auth', authRouter);
accountApi.use('/api/users', userRouter);
accountApi.use('/api/admin', adminRouter);
accountApi.get('/api/preview/demo-accounts', (req, res) =>
  json(res, {
    data: {
      password: PREVIEW_PASSWORD,
      accounts: PREVIEW_ACCOUNTS.map(account => ({
        role: account.roleCode,
        email: account.email
      }))
    }
  })
);

accountApi.use('/api', (req, res) =>
  json(res, { error: { code: 'NOT_FOUND', message: `Unknown account endpoint: ${req.method} ${req.path}` } }, 404)
);
accountApi.use(errorHandler);

async function seedAccounts() {
  const store = getStore();
  store.components.seed(components);

  if (fs.existsSync(STATE_FILE)) {
    try {
      store.restore(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')));
    } catch (err) {
      console.warn('Ignoring unreadable preview state:', err.message);
    }
  }

  const passwordHash = await passwords.hashPassword(PREVIEW_PASSWORD);
  const accounts = {};
  let created = false;

  for (const account of PREVIEW_ACCOUNTS) {
    const existing = await store.users.findByEmail(account.email);
    accounts[account.key] = existing || (await store.users.create({
      username: account.username,
      email: account.email,
      passwordHash,
      roleCode: account.roleCode
    }));
    if (!existing) created = true;
  }

    if (created) {
    const demo = accounts.user;
    const picks = components.slice(0, 3).map(component => component.component_id);
    for (const componentId of picks) await store.bookmarks.add(demo.userId, componentId);
    for (const componentId of picks.slice(0, 2)) await store.recent.record(demo.userId, componentId);

    const collection = await store.collections.create(demo.userId, {
      name: 'Revision shortlist',
      description: 'Gates and adders worth re-reading before the exam.'
    });
    await store.collections.addItem(demo.userId, collection.collectionId, picks[0]);
  }

  return accounts;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

const ACCOUNT_PATH = /^\/api\/(auth|users|admin|preview)(\/|$)/;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (ACCOUNT_PATH.test(url.pathname)) return accountApi(req, res);
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
        const stat = fs.statSync(filePath);
  const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ETag: etag,
    'Last-Modified': stat.mtime.toUTCString()
  };

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
});

seedAccounts()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`ElectroDB frontend preview (seed-derived data) on http://${HOST}:${PORT}`);
      console.log(`Seed-derived catalogue: ${components.length} components, ${categories.length} categories, ${tags.length} tags`);
      console.log(`Demo accounts (password ${PREVIEW_PASSWORD}):`);
      PREVIEW_ACCOUNTS.forEach(account => console.log(`  ${account.roleCode.padEnd(14)} ${account.email}`));
      console.log('Preview data only — run `npm start` with MySQL for the real API.');
    });
  })
  .catch(err => {
    console.error('Could not start the preview server:', err);
    process.exit(1);
  });
