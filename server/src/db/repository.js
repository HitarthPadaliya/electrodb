const pool = require('./pool');
const {
  validateTable,
  validateColumn,
  validateAggregateFunction,
  validateOperator,
  validateJoinType
} = require('../validators/inputValidators');

// ================================================================
// Catalogue Repository
// ================================================================

async function getAllCategories() {
  const [rows] = await pool.query(
    `SELECT category_id, parent_category_id, name, slug, description, display_order, is_active
     FROM categories
     WHERE is_active = 1
     ORDER BY parent_category_id ASC, display_order ASC, name ASC`
  );
  return rows;
}

async function getCategoryById(categoryId) {
  const [rows] = await pool.query(
    `SELECT category_id, parent_category_id, name, slug, description, display_order, is_active
     FROM categories
     WHERE category_id = ? AND is_active = 1`,
    [categoryId]
  );
  return rows[0] || null;
}

async function getCategoryBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT category_id, parent_category_id, name, slug, description, display_order, is_active
     FROM categories
     WHERE slug = ? AND is_active = 1`,
    [slug]
  );
  return rows[0] || null;
}

async function getCategoryBreadcrumb(categoryId) {
  const breadcrumb = [];
  let currentId = categoryId;
  let depth = 0;

  while (currentId && depth < 10) {
    const [rows] = await pool.query(
      `SELECT category_id, parent_category_id, name, slug
       FROM categories
       WHERE category_id = ?`,
      [currentId]
    );
    if (!rows.length) break;
    breadcrumb.unshift(rows[0]);
    currentId = rows[0].parent_category_id;
    depth++;
  }
  return breadcrumb;
}

async function getChildCategories(parentCategoryId) {
  const [rows] = await pool.query(
    `SELECT cat.category_id, cat.parent_category_id, cat.name, cat.slug, cat.description,
            cat.display_order, COUNT(c.component_id) AS component_count
     FROM categories cat
     LEFT JOIN components c ON c.category_id = cat.category_id AND c.is_published = 1
     WHERE cat.parent_category_id = ? AND cat.is_active = 1
     GROUP BY cat.category_id, cat.parent_category_id, cat.name, cat.slug, cat.description, cat.display_order
     ORDER BY cat.display_order ASC, cat.name ASC`,
    [parentCategoryId]
  );
  return rows;
}

async function getComponentsByCategory(categoryId, { limit, offset }) {
  const [rows] = await pool.query(
    `SELECT component_id, category_id, name, slug, short_description, main_image_path,
            circuit_symbol_path, is_illustrative, is_published, created_at
     FROM components
     WHERE category_id = ? AND is_published = 1
     ORDER BY name ASC, component_id ASC
     LIMIT ? OFFSET ?`,
    [categoryId, limit, offset]
  );
  return rows;
}

async function countComponentsByCategory(categoryId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM components
     WHERE category_id = ? AND is_published = 1`,
    [categoryId]
  );
  return rows[0].total;
}

async function getCategoryContentTemplates(categoryId) {
  const [rows] = await pool.query(
    `SELECT cct.category_id, cct.section_key, cct.section_label, cct.is_required,
            cct.display_order, ct.code AS type_code, ct.label AS type_label, ct.render_kind
     FROM category_content_types cct
     JOIN content_types ct ON ct.content_type_id = cct.content_type_id
     WHERE cct.category_id = ?
     ORDER BY cct.display_order ASC`,
    [categoryId]
  );
  return rows;
}

async function getComponentByIdOrSlug(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const sql = isNumeric
    ? `SELECT c.*, cat.name AS category_name, cat.slug AS category_slug, cat.parent_category_id
       FROM components c
       JOIN categories cat ON cat.category_id = c.category_id
       WHERE c.component_id = ?`
    : `SELECT c.*, cat.name AS category_name, cat.slug AS category_slug, cat.parent_category_id
       FROM components c
       JOIN categories cat ON cat.category_id = c.category_id
       WHERE c.slug = ?`;

  const [rows] = await pool.query(sql, [idOrSlug]);
  return rows[0] || null;
}

async function getComponentContent(componentId) {
  const [rows] = await pool.query(
    `SELECT cc.component_content_id, cc.section_key, cc.title, cc.content,
            cc.alt_text, cc.caption, cc.display_order,
            ct.code AS content_type, ct.label AS type_label, ct.render_kind
     FROM component_content cc
     JOIN content_types ct ON ct.content_type_id = cc.content_type_id
     WHERE cc.component_id = ?
     ORDER BY cc.display_order ASC`,
    [componentId]
  );
  return rows;
}

async function getComponentDiagrams(componentId) {
  const [rows] = await pool.query(
    `SELECT diagram_id, component_id, title, image_path, alt_text, caption, display_order
     FROM component_diagrams
     WHERE component_id = ?
     ORDER BY display_order ASC, diagram_id ASC`,
    [componentId]
  );
  return rows;
}

async function getComponentSpecifications(componentId) {
  const [rows] = await pool.query(
    `SELECT cs.specification_id, s.name, s.unit, s.value_kind, s.description,
            cs.numeric_value, cs.text_value, cs.range_min, cs.range_max,
            cs.unit_override, cs.source_note
     FROM component_specifications cs
     JOIN specifications s ON s.specification_id = cs.specification_id
     WHERE cs.component_id = ?
     ORDER BY s.specification_id ASC`,
    [componentId]
  );
  return rows;
}

async function searchComponents(searchTerm, { limit, offset }) {
  const pattern = `%${searchTerm}%`;
  const [rows] = await pool.query(
    `SELECT c.component_id, c.category_id, c.name, c.slug, c.short_description,
            c.main_image_path, c.circuit_symbol_path, c.is_illustrative,
            cat.name AS category_name, cat.slug AS category_slug
     FROM components c
     JOIN categories cat ON cat.category_id = c.category_id
     WHERE c.is_published = 1 AND (c.name LIKE ? OR c.short_description LIKE ?)
     ORDER BY c.name ASC
     LIMIT ? OFFSET ?`,
    [pattern, pattern, limit, offset]
  );
  return rows;
}

async function countSearchComponents(searchTerm) {
  const pattern = `%${searchTerm}%`;
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM components
     WHERE is_published = 1 AND (name LIKE ? OR short_description LIKE ?)`,
    [pattern, pattern]
  );
  return rows[0].total;
}

// ================================================================
// Assignment 10 Stored Programs Repository
// ================================================================

async function insertComponentSP(categoryId, name, slug, shortDescription) {
  const results = await pool.executeProcedure('sp_insert_component', [
    categoryId,
    name,
    slug || null,
    shortDescription || null
  ]);
  // mysql2 returns [[rows], [meta]] for procedure calls
  const row = (Array.isArray(results) && Array.isArray(results[0])) ? results[0][0] : results[0];
  return row ? row.component_id : null;
}

async function updateComponentSP(componentId, categoryId, name, shortDescription) {
  return await pool.executeProcedure('sp_update_component', [
    componentId,
    categoryId,
    name,
    shortDescription || null
  ]);
}

async function deleteComponentSP(componentId) {
  return await pool.executeProcedure('sp_delete_component', [componentId]);
}

async function getCursorComponentsAllSP() {
  const results = await pool.executeProcedure('sp_cursor_components_all', []);
  return (Array.isArray(results) && Array.isArray(results[0])) ? results[0] : results;
}

async function getCursorComponentsLimitedSP(limit) {
  const results = await pool.executeProcedure('sp_cursor_components_limited', [limit]);
  return (Array.isArray(results) && Array.isArray(results[0])) ? results[0] : results;
}

async function getSumUngrouped() {
  const [rows] = await pool.query('SELECT fn_sum_component_ids() AS total_sum');
  return rows[0].total_sum;
}

async function getSumGroupedSP() {
  const results = await pool.executeProcedure('sp_sum_component_ids_by_category', []);
  return (Array.isArray(results) && Array.isArray(results[0])) ? results[0] : results;
}

async function insertAppUserSP(username, passwordHash, roleCode) {
  const results = await pool.executeProcedure('sp_insert_app_user', [username, passwordHash, roleCode]);
  const row = (Array.isArray(results) && Array.isArray(results[0])) ? results[0][0] : results[0];
  return row ? row.user_id : null;
}

async function updateAppUserSP(userId, roleCode, isActive) {
  return await pool.executeProcedure('sp_update_app_user', [userId, roleCode, isActive ? 1 : 0]);
}

async function deleteAppUserSP(userId) {
  return await pool.executeProcedure('sp_delete_app_user', [userId]);
}

async function getAppUsers() {
  const [rows] = await pool.query(
    `SELECT user_id, username, role_code, is_active, created_at, updated_at, last_login_at
     FROM app_users
     ORDER BY user_id DESC`
  );
  return rows;
}

async function getAuditLogs(limit = 50) {
  const [rows] = await pool.query(
    `SELECT audit_id, table_name, operation_type, row_key, changed_at, db_user, application_user,
            old_values, new_values
     FROM application_audit_log
     ORDER BY audit_id DESC
     LIMIT ?`,
    [Math.min(limit, 200)]
  );
  return rows;
}

// ================================================================
// Assignment 11 Lab Repository
// ================================================================

async function getFullTableComponents({ limit, offset, bounded = true }) {
  if (bounded) {
    const [rows] = await pool.query(
      `SELECT * FROM components ORDER BY component_id ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }
  const [rows] = await pool.query(`SELECT * FROM components ORDER BY component_id ASC`);
  return rows;
}

async function countAllComponents() {
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM components`);
  return rows[0].total;
}

async function executeDynamicAggregate(table, fnName, field) {
  const validTable = validateTable(table);
  const validFn = validateAggregateFunction(fnName);
  const validField = validateColumn(validTable, field);

  const sql = `SELECT ${validFn}(${validField}) AS aggregate_value, COUNT(*) AS row_count FROM ${validTable}`;
  const [rows] = await pool.query(sql);
  return {
    table: validTable,
    function: validFn,
    field: validField,
    value: rows[0].aggregate_value,
    rowCount: rows[0].row_count
  };
}

async function executeDynamicFilter(table, field, operatorKey, value, { limit, offset }) {
  const validTable = validateTable(table);
  const validField = validateColumn(validTable, field);
  const validOp = validateOperator(operatorKey);

  const queryVal = operatorKey === 'like' ? `%${value}%` : value;

  const dataSql = `SELECT * FROM ${validTable} WHERE ${validField} ${validOp} ? ORDER BY 1 ASC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total FROM ${validTable} WHERE ${validField} ${validOp} ?`;

  const [rows] = await pool.query(dataSql, [queryVal, limit, offset]);
  const [countRows] = await pool.query(countSql, [queryVal]);

  return {
    items: rows,
    total: countRows[0].total,
    filter: {
      table: validTable,
      field: validField,
      operator: validOp,
      value
    }
  };
}

async function executeDynamicJoin(leftTable, rightTable, joinTypeKey, { limit, offset }) {
  const validLeft = validateTable(leftTable);
  const validRight = validateTable(rightTable);
  const validJoin = validateJoinType(joinTypeKey);

  let joinCondition = '';
  if (validLeft === 'components' && validRight === 'categories') {
    joinCondition = 'components.category_id = categories.category_id';
  } else if (validLeft === 'categories' && validRight === 'components') {
    joinCondition = 'categories.category_id = components.category_id';
  } else if (validLeft === 'components' && validRight === 'component_diagrams') {
    joinCondition = 'components.component_id = component_diagrams.component_id';
  } else if (validLeft === 'components' && validRight === 'component_specifications') {
    joinCondition = 'components.component_id = component_specifications.component_id';
  } else if (validLeft === 'components' && validRight === 'component_content') {
    joinCondition = 'components.component_id = component_content.component_id';
  } else {
    // Default safe fallback join if relationship isn't directly pre-mapped
    joinCondition = `${validLeft}.component_id = ${validRight}.component_id`;
  }

  const sql = `SELECT ${validLeft}.*, ${validRight}.name AS joined_name
               FROM ${validLeft}
               ${validJoin} ${validRight} ON ${joinCondition}
               LIMIT ? OFFSET ?`;

  const [rows] = await pool.query(sql, [limit, offset]);
  return {
    leftTable: validLeft,
    rightTable: validRight,
    joinType: validJoin,
    joinCondition,
    rows
  };
}

async function executeSubquery(kind = 'categories_in_digital') {
  let sql = '';
  let description = '';

  if (kind === 'components_with_high_specs') {
    description = 'Components with numeric specifications higher than the average numeric value';
    sql = `SELECT c.component_id, c.name, cs.numeric_value
           FROM components c
           JOIN component_specifications cs ON cs.component_id = c.component_id
           WHERE cs.numeric_value > (
             SELECT AVG(numeric_value) FROM component_specifications WHERE numeric_value IS NOT NULL
           )
           LIMIT 25`;
  } else {
    // Default: Components in subcategories under parent category 1 (Digital Electronics)
    description = 'Components belonging to categories under Digital Electronics (parent_category_id = 1)';
    sql = `SELECT component_id, name, category_id, slug
           FROM components
           WHERE category_id IN (
             SELECT category_id FROM categories WHERE parent_category_id = 1
           )
           LIMIT 25`;
  }

  const [rows] = await pool.query(sql);
  return { kind, description, sql, rows };
}

async function executeCorrelatedQuery(kind = 'categories_with_components') {
  let sql = '';
  let description = '';

  if (kind === 'components_with_diagrams') {
    description = 'Components that have at least one associated diagram in component_diagrams';
    sql = `SELECT c.component_id, c.name, c.slug
           FROM components c
           WHERE EXISTS (
             SELECT 1 FROM component_diagrams cd WHERE cd.component_id = c.component_id
           )
           LIMIT 25`;
  } else {
    // Default: Categories that have at least one published component
    description = 'Categories that have at least one published component';
    sql = `SELECT cat.category_id, cat.name, cat.slug
           FROM categories cat
           WHERE EXISTS (
             SELECT 1 FROM components c WHERE c.category_id = cat.category_id AND c.is_published = 1
           )
           ORDER BY cat.category_id`;
  }

  const [rows] = await pool.query(sql);
  return { kind, description, sql, rows };
}

async function getViewCatalogue({ limit, offset }) {
  const [rows] = await pool.query(
    `SELECT * FROM v_component_catalogue LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM v_component_catalogue`);
  return { rows, total: countRows[0].total };
}

async function getViewCounts() {
  const [rows] = await pool.query(`SELECT * FROM v_category_component_counts ORDER BY category_id`);
  return rows;
}

async function getDashboardStats() {
  const [counts] = await pool.query(
    `SELECT 'categories' AS table_name, COUNT(*) AS row_count FROM categories
     UNION ALL SELECT 'components', COUNT(*) FROM components
     UNION ALL SELECT 'tags', COUNT(*) FROM tags
     UNION ALL SELECT 'component_tags', COUNT(*) FROM component_tags
     UNION ALL SELECT 'content_types', COUNT(*) FROM content_types
     UNION ALL SELECT 'category_content_types', COUNT(*) FROM category_content_types
     UNION ALL SELECT 'component_content', COUNT(*) FROM component_content
     UNION ALL SELECT 'component_diagrams', COUNT(*) FROM component_diagrams
     UNION ALL SELECT 'specifications', COUNT(*) FROM specifications
     UNION ALL SELECT 'component_specifications', COUNT(*) FROM component_specifications
     UNION ALL SELECT 'app_users', COUNT(*) FROM app_users
     UNION ALL SELECT 'application_audit_log', COUNT(*) FROM application_audit_log`
  );

  const [publishedStats] = await pool.query(
    `SELECT
       SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published_components,
       SUM(CASE WHEN is_illustrative = 1 THEN 1 ELSE 0 END) AS illustrative_components
     FROM components`
  );

  return {
    tables: counts,
    componentMetrics: publishedStats[0]
  };
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryBreadcrumb,
  getChildCategories,
  getComponentsByCategory,
  countComponentsByCategory,
  getCategoryContentTemplates,
  getComponentByIdOrSlug,
  getComponentContent,
  getComponentDiagrams,
  getComponentSpecifications,
  searchComponents,
  countSearchComponents,
  insertComponentSP,
  updateComponentSP,
  deleteComponentSP,
  getCursorComponentsAllSP,
  getCursorComponentsLimitedSP,
  getSumUngrouped,
  getSumGroupedSP,
  insertAppUserSP,
  updateAppUserSP,
  deleteAppUserSP,
  getAppUsers,
  getAuditLogs,
  getFullTableComponents,
  countAllComponents,
  executeDynamicAggregate,
  executeDynamicFilter,
  executeDynamicJoin,
  executeSubquery,
  executeCorrelatedQuery,
  getViewCatalogue,
  getViewCounts,
  getDashboardStats
};
