const express = require('express');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const catalogue = require('../services/catalogue');
const { query, getPool } = require('../db/pool');
const { toXml } = require('../serializers/xml');
const router = express.Router();
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const send = (res, data) => res.json({ data });
const intParam = (value, fallback, max = 100) => {
  if (value == null || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) throw Object.assign(new Error('Page and pageSize must be positive integers.'), { status: 400, code: 'VALIDATION_ERROR' });
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) throw Object.assign(new Error(`Value must be between 1 and ${max}.`), { status: 400, code: 'VALIDATION_ERROR' });
  return parsed;
};

router.get('/health', asyncRoute(async (_req, res) => {
  await query('SELECT 1 AS ok');
  res.json({ data: { status: 'ok', database: 'connected' } });
}));
router.get('/categories', asyncRoute(async (_req, res) => send(res, await catalogue.categories())));
router.get('/categories/:id(\\d+)', asyncRoute(async (req, res) => {
  const data = await catalogue.categoryById(Number(req.params.id));
  if (!data) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } });
  send(res, data);
}));
router.get('/categories/slug/:slug', asyncRoute(async (req, res) => {
  const data = await catalogue.categoryBySlug(req.params.slug);
  if (!data) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } });
  send(res, data);
}));
router.get('/categories/:id(\\d+)/components', asyncRoute(async (req, res) => {
  const category = await catalogue.categoryById(Number(req.params.id));
  if (!category) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } });
  send(res, await catalogue.componentsByCategory(Number(req.params.id), {
    page: intParam(req.query.page, 1, 100000), pageSize: intParam(req.query.pageSize, 20, 100)
  }));
}));
router.get('/components/:id(\\d+)', asyncRoute(async (req, res) => {
  const data = await catalogue.componentById(Number(req.params.id));
  if (!data) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Component not found.' } });
  send(res, data);
}));
router.get('/components/slug/:slug', asyncRoute(async (req, res) => {
  const data = await catalogue.componentBySlug(req.params.slug);
  if (!data) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Component not found.' } });
  send(res, data);
}));
router.get('/search', asyncRoute(async (req, res) => {
  const q = String(req.query.q || '').slice(0, 120);
  send(res, await catalogue.search({ q, page: intParam(req.query.page, 1, 100000), pageSize: intParam(req.query.pageSize, 12, 100) }));
}));

const lab = express.Router();
const tableNames = {
  categories: 'categories', components: 'components', component_content: 'component_content',
  component_diagrams: 'component_diagrams', specifications: 'specifications',
  component_specifications: 'component_specifications', content_types: 'content_types',
  category_content_types: 'category_content_types', tags: 'tags', component_tags: 'component_tags',
  app_users: 'app_users', application_audit_log: 'application_audit_log'
};
const fieldMap = {
  component_id: 'c.component_id', name: 'c.name', category_id: 'c.category_id',
  is_published: 'c.is_published', is_illustrative: 'c.is_illustrative'
};
lab.get('/components/full-table', asyncRoute(async (_req, res) => send(res, await query('SELECT * FROM components ORDER BY component_id LIMIT 500'))));
lab.get('/components', asyncRoute(async (req, res) => {
  const page = intParam(req.query.page, 1, 100000), pageSize = intParam(req.query.pageSize, 100, 200);
  const [rows, count] = await Promise.all([
    query(`SELECT component_id AS componentId,category_id AS categoryId,name,slug,short_description AS shortDescription,is_published AS isPublished FROM components ORDER BY component_id LIMIT ? OFFSET ?`, [pageSize, (page - 1) * pageSize]),
    query('SELECT COUNT(*) AS total FROM components')
  ]);
  send(res, { items: rows, page, pageSize, total: Number(count[0].total) });
}));
lab.post('/components', asyncRoute(async (req, res) => {
  const categoryId = Number(req.body.categoryId), name = String(req.body.name || '').trim(), description = String(req.body.shortDescription || '').trim();
  if (!Number.isInteger(categoryId) || categoryId < 1 || !name || name.length > 180 || description.length > 1000) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a category, enter a component name (1–180 characters), and keep the summary under 1000 characters.' } });
  const slug = (String(req.body.slug || name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).slice(0, 200);
  if (!slug) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid URL slug is required.' } });
  const [sets] = await getPool().query('CALL sp_insert_component(?,?,?,?)', [categoryId, name, slug, description || null]);
  const insertedId = sets?.[0]?.[0]?.component_id;
  res.status(201).json({ data: { componentId: insertedId, slug, message: 'Component created.' } });
}));
lab.patch('/components/:id(\\d+)', asyncRoute(async (req, res) => {
  const id = Number(req.params.id), categoryId = Number(req.body.categoryId), name = String(req.body.name || '').trim(), description = String(req.body.shortDescription || '').trim();
  if (!Number.isInteger(categoryId) || categoryId < 1 || !name || name.length > 180 || description.length > 1000) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a category, enter a component name (1–180 characters), and keep the summary under 1000 characters.' } });
  await getPool().query('CALL sp_update_component(?,?,?,?)', [id, categoryId, name, description || null]);
  res.json({ data: { componentId: id, message: 'Component updated.' } });
}));
lab.delete('/components/:id(\\d+)', asyncRoute(async (req, res) => {
  await getPool().query('CALL sp_delete_component(?)', [Number(req.params.id)]);
  res.json({ data: { message: 'Component deleted.' } });
}));
lab.get('/app-users', asyncRoute(async (_req, res) => {
  send(res, await query('SELECT user_id AS userId,username,role_code AS roleCode,is_active AS isActive,created_at AS createdAt FROM app_users ORDER BY user_id'));
}));
lab.post('/app-users', asyncRoute(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const roleCode = String(req.body.roleCode || 'NAIVE_USER');
  if (!/^[A-Za-z0-9_.-]{2,100}$/.test(username) || password.length < 12 || password.length > 200 || !['NAIVE_USER','APP_DEVELOPER','DBA'].includes(roleCode)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Use a 2–100 character username, a password of at least 12 characters, and a listed role.' } });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  const passwordHash = `scrypt$${salt}$${hash.toString('hex')}`;
  await getPool().query('CALL sp_insert_app_user(?,?,?)', [username, passwordHash, roleCode]);
  res.status(201).json({ data: { message: 'Lab login record created. The password hash is never returned.' } });
}));
lab.patch('/app-users/:id(\\d+)', asyncRoute(async (req, res) => {
  const roleCode = String(req.body.roleCode || ''), isActive = Number(req.body.isActive);
  if (!['NAIVE_USER','APP_DEVELOPER','DBA'].includes(roleCode) || ![0,1].includes(isActive)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a valid role and active state.' } });
  await getPool().query('CALL sp_update_app_user(?,?,?)', [Number(req.params.id), roleCode, isActive]);
  res.json({ data: { message: 'Lab login record updated.' } });
}));
lab.delete('/app-users/:id(\\d+)', asyncRoute(async (req, res) => {
  await getPool().query('CALL sp_delete_app_user(?)', [Number(req.params.id)]);
  res.json({ data: { message: 'Lab login record deleted.' } });
}));
lab.get('/aggregate', asyncRoute(async (req, res) => {
  const fn = String(req.query.function || 'count').toLowerCase();
  const field = String(req.query.field || 'component_id');
  const functions = { count: 'COUNT', sum: 'SUM', average: 'AVG', min: 'MIN', max: 'MAX' };
  const columns = { component_id: 'component_id', category_id: 'category_id', is_published: 'is_published' };
  if (!functions[fn] || !columns[field]) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Select an available aggregate and numeric field.' } });
  if (req.query.groupBy && !['', 'category_id'].includes(String(req.query.groupBy))) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose an available grouping.' } });
  const grouped = req.query.groupBy === 'category_id';
  const group = grouped ? ', category_id AS groupValue' : '';
  const by = grouped ? ' GROUP BY category_id ORDER BY category_id' : '';
  send(res, await query(`SELECT ${functions[fn]}(${columns[field]}) AS value${group} FROM components${by}`));
}));
lab.get('/filter', asyncRoute(async (req, res) => {
  const field = String(req.query.field || 'category_id'), operator = String(req.query.operator || 'eq');
  const col = fieldMap[field], op = { eq: '=', neq: '<>', contains: 'LIKE', gt: '>', lt: '<' }[operator];
  if (!col || !op || (operator === 'contains' && field !== 'name') || (['gt','lt'].includes(operator) && !['component_id','category_id'].includes(field))) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a compatible filter field and operator.' } });
  if (req.query.value == null || String(req.query.value).trim() === '') return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A filter value is required.' } });
  const value = operator === 'contains' ? `%${String(req.query.value).slice(0, 120)}%` : req.query.value;
  send(res, await query(`SELECT c.component_id AS componentId,c.name,c.slug,c.category_id AS categoryId,c.short_description AS shortDescription FROM components c WHERE ${col} ${op} ? ORDER BY c.name LIMIT 200`, [value]));
}));
lab.get('/join', asyncRoute(async (req, res) => {
  const left = String(req.query.left || 'components'), right = String(req.query.right || 'categories'), type = String(req.query.type || 'inner').toLowerCase();
  if (!['components', 'categories'].includes(left) || !['components', 'categories'].includes(right) || left === right || !['inner', 'left', 'right'].includes(type)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose components and categories with an available join type.' } });
  const joinWord = { inner: 'INNER JOIN', left: 'LEFT JOIN', right: 'RIGHT JOIN' }[type];
  const sql = left === 'components'
    ? `SELECT c.component_id AS componentId,c.name AS componentName,cat.category_id AS categoryId,cat.name AS categoryName FROM components c ${joinWord} categories cat ON cat.category_id=c.category_id ORDER BY c.component_id LIMIT 200`
    : `SELECT cat.category_id AS categoryId,cat.name AS categoryName,c.component_id AS componentId,c.name AS componentName FROM categories cat ${joinWord} components c ON c.category_id=cat.category_id ORDER BY cat.category_id LIMIT 200`;
  send(res, await query(sql));
}));
lab.get('/subquery', asyncRoute(async (_req, res) => send(res, await query(`SELECT name,slug FROM categories WHERE category_id IN (SELECT category_id FROM components WHERE is_published=1) ORDER BY name`))));
lab.get('/correlated-query', asyncRoute(async (_req, res) => send(res, await query(`SELECT cat.category_id AS categoryId,cat.name, (SELECT COUNT(*) FROM components c WHERE c.category_id=cat.category_id) AS componentCount FROM categories cat WHERE EXISTS (SELECT 1 FROM components c WHERE c.category_id=cat.category_id) ORDER BY cat.name`))));
lab.get('/dashboard', asyncRoute(async (_req, res) => {
  const stats = await Promise.all(Object.entries(tableNames).map(async ([key, table]) => {
    const rows = await query(`SELECT COUNT(*) AS total FROM \`${table}\``);
    return { table: key, total: Number(rows[0].total) };
  }));
  send(res, stats);
}));
lab.get('/views', asyncRoute(async (_req, res) => send(res, await query(`SELECT component_id AS componentId,component_name AS componentName,category_name AS categoryName,parent_category_name AS parentCategoryName,slug,is_published AS isPublished FROM v_component_catalogue ORDER BY category_name,component_name LIMIT 200`))));
lab.post('/view-demo', asyncRoute(async (_req, res) => {
  const slug = `lab-view-demo-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const [category] = await query("SELECT category_id AS categoryId FROM categories WHERE slug='logic-gates' AND is_active=1");
  if (!category) return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'The logic-gates category is required for the joined-view demonstration.' } });
  const [sets] = await getPool().query('CALL sp_insert_component(?,?,?,?)', [category.categoryId, 'Lab View Demo', slug, 'Temporary record created to demonstrate the stored procedure, audit trigger, and joined view.']);
  const componentId = sets?.[0]?.[0]?.component_id;
  const [viewRow] = await query('SELECT component_id AS componentId,component_name AS componentName,category_name AS categoryName,parent_category_name AS parentCategoryName,slug FROM v_component_catalogue WHERE component_id=?', [componentId]);
  const [auditRow] = await query(`SELECT audit_id AS auditId,operation_type AS operationType,table_name AS tableName,row_key AS rowKey,changed_at AS changedAt,db_user AS dbUser FROM application_audit_log WHERE table_name='components' AND operation_type='INSERT' AND row_key=? ORDER BY audit_id DESC LIMIT 1`, [String(componentId)]);
  res.status(201).json({ data: { componentId, viewRow, auditRow, message: 'The stored procedure inserted the base-table row; the AFTER trigger wrote the audit entry; the joined view exposes the new row.' } });
}));
lab.delete('/view-demo/:id(\\d+)', asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const [record] = await query("SELECT component_id FROM components WHERE component_id=? AND slug LIKE 'lab-view-demo-%'", [id]);
  if (!record) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Temporary view-demo record not found.' } });
  await getPool().query('CALL sp_delete_component(?)', [id]);
  res.json({ data: { message: 'Temporary view-demo record removed; the delete audit trigger ran.' } });
}));
lab.get('/components.xml', asyncRoute(async (_req, res) => {
  const rows = await query('SELECT * FROM components ORDER BY component_id');
  res.type('application/xml').send(toXml('components', rows));
}));
lab.get('/aggregate.xml', asyncRoute(async (_req, res) => {
  const rows = await query('SELECT COUNT(*) AS component_count FROM components');
  res.type('application/xml').send(toXml('aggregate', rows));
}));
lab.get('/filter.xml', asyncRoute(async (req, res) => {
  const categoryId = Number(req.query.categoryId || 6);
  if (!Number.isInteger(categoryId) || categoryId < 1) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid category id is required.' } });
  const rows = await query('SELECT component_id,name,slug,category_id FROM components WHERE category_id=? ORDER BY name LIMIT 200', [categoryId]);
  res.type('application/xml').send(toXml('filteredComponents', rows));
}));

router.use('/lab', (req, res, next) => {
  const { labEnabled } = require('../config/env');
  if (!labEnabled) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lab console is disabled.' } });
  next();
}, lab);
module.exports = router;
