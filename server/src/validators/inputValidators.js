const ALLOWED_TABLES = new Set([
  'categories',
  'components',
  'tags',
  'component_tags',
  'content_types',
  'category_content_types',
  'component_content',
  'component_diagrams',
  'specifications',
  'component_specifications',
  'app_users',
  'application_audit_log'
]);

const ALLOWED_AGGREGATE_FUNCTIONS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);

const ALLOWED_OPERATORS = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE'
};

const ALLOWED_JOIN_TYPES = {
  inner: 'INNER JOIN',
  left: 'LEFT JOIN',
  right: 'RIGHT JOIN'
};

const TABLE_COLUMNS = {
  components: new Set([
    'component_id', 'category_id', 'name', 'slug', 'short_description',
    'description', 'main_image_path', 'circuit_symbol_path', 'datasheet_url',
    'is_illustrative', 'is_published', 'created_at', 'updated_at'
  ]),
  categories: new Set([
    'category_id', 'parent_category_id', 'name', 'slug', 'description',
    'display_order', 'is_active', 'created_at', 'updated_at'
  ]),
  tags: new Set(['tag_id', 'name', 'slug']),
  content_types: new Set(['content_type_id', 'code', 'label', 'render_kind', 'description']),
  specifications: new Set(['specification_id', 'name', 'unit', 'value_kind', 'description']),
  component_specifications: new Set([
    'component_id', 'specification_id', 'numeric_value', 'text_value',
    'range_min', 'range_max', 'unit_override', 'source_note'
  ]),
  component_diagrams: new Set([
    'diagram_id', 'component_id', 'title', 'image_path', 'alt_text',
    'caption', 'display_order', 'created_at', 'updated_at'
  ]),
  component_content: new Set([
    'component_content_id', 'component_id', 'content_type_id', 'section_key',
    'title', 'content', 'alt_text', 'caption', 'display_order'
  ]),
  app_users: new Set([
    'user_id', 'username', 'role_code', 'is_active', 'created_at',
    'updated_at', 'last_login_at'
  ]),
  application_audit_log: new Set([
    'audit_id', 'table_name', 'operation_type', 'row_key', 'changed_at',
    'db_user', 'application_user'
  ])
};

function validateTable(tableName) {
  if (!tableName || !ALLOWED_TABLES.has(tableName.toLowerCase())) {
    throw new Error(`Invalid table name: '${tableName}'. Table must be one of: ${Array.from(ALLOWED_TABLES).join(', ')}`);
  }
  return tableName.toLowerCase();
}

function validateColumn(tableName, columnName) {
  const table = validateTable(tableName);
  const allowed = TABLE_COLUMNS[table];
  if (!columnName || !allowed || !allowed.has(columnName.toLowerCase())) {
    throw new Error(`Invalid column: '${columnName}' for table '${table}'`);
  }
  return columnName.toLowerCase();
}

function validateAggregateFunction(fnName) {
  if (!fnName || !ALLOWED_AGGREGATE_FUNCTIONS.has(fnName.toUpperCase())) {
    throw new Error(`Invalid aggregate function: '${fnName}'. Must be COUNT, SUM, AVG, MIN, or MAX.`);
  }
  return fnName.toUpperCase();
}

function validateOperator(op) {
  const normalized = (op || 'eq').toLowerCase();
  if (!ALLOWED_OPERATORS[normalized]) {
    throw new Error(`Invalid operator: '${op}'. Must be one of: ${Object.keys(ALLOWED_OPERATORS).join(', ')}`);
  }
  return ALLOWED_OPERATORS[normalized];
}

function validateJoinType(joinType) {
  const normalized = (joinType || 'inner').toLowerCase();
  if (!ALLOWED_JOIN_TYPES[normalized]) {
    throw new Error(`Invalid join type: '${joinType}'. Must be inner, left, or right.`);
  }
  return ALLOWED_JOIN_TYPES[normalized];
}

function validatePagination(page, pageSize, defaultPageSize = 20, maxPageSize = 100) {
  const p = Math.max(1, parseInt(page || '1', 10) || 1);
  const size = Math.min(maxPageSize, Math.max(1, parseInt(pageSize || defaultPageSize, 10) || defaultPageSize));
  const offset = (p - 1) * size;
  return { page: p, pageSize: size, offset };
}

module.exports = {
  validateTable,
  validateColumn,
  validateAggregateFunction,
  validateOperator,
  validateJoinType,
  validatePagination,
  ALLOWED_TABLES,
  TABLE_COLUMNS
};
