const { passwords } = require('./security');

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

class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_FAILED';
    this.details = details;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,39}$/;

function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
      return value.trim().toLowerCase();
}

function requireString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') throw new ValidationError(`${field} is required.`, { field });
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ValidationError(`${field} is required.`, { field });
  if (trimmed.length > max) throw new ValidationError(`${field} must be ${max} characters or fewer.`, { field });
  return trimmed;
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email) throw new ValidationError('Email address is required.', { field: 'email' });
  if (email.length > 255) throw new ValidationError('Email address is too long.', { field: 'email' });
  if (!EMAIL_PATTERN.test(email)) throw new ValidationError('Enter a valid email address.', { field: 'email' });
  return email;
}

function validateUsername(value) {
  const username = requireString(value, 'Username', { min: 3, max: 40 });
  if (!USERNAME_PATTERN.test(username)) {
    throw new ValidationError(
      'Username must be 3-40 characters and use only letters, numbers, dots, underscores or hyphens.',
      { field: 'username' }
    );
  }
  return username;
}

function validateRegistration(body = {}) {
  const username = validateUsername(body.username);
  const email = validateEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const confirm =
    typeof body.confirmPassword === 'string'
      ? body.confirmPassword
      : typeof body.passwordConfirm === 'string'
        ? body.passwordConfirm
        : body.password_confirmation;

  const strength = passwords.validatePasswordStrength(password);
  if (!strength.ok) throw new ValidationError(strength.message, { field: 'password' });

  if (confirm !== undefined && password !== confirm) {
    throw new ValidationError('Passwords do not match.', { field: 'confirmPassword' });
  }

  return { username, email, password };
}

function validateLogin(body = {}) {
  const email = normalizeEmail(body.email || body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email) throw new ValidationError('Email address is required.', { field: 'email' });
  if (!password) throw new ValidationError('Password is required.', { field: 'password' });
  return { email, password };
}

function validateProfileUpdate(body = {}) {
  const patch = {};
  if (body.username !== undefined) patch.username = validateUsername(body.username);
  if (body.email !== undefined) patch.email = validateEmail(body.email);
  if (!Object.keys(patch).length) {
    throw new ValidationError('Nothing to update. Send a username or an email address.');
  }
      return patch;
}

function validatePasswordChange(body = {}) {
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword) throw new ValidationError('Current password is required.', { field: 'currentPassword' });

  const strength = passwords.validatePasswordStrength(newPassword);
  if (!strength.ok) throw new ValidationError(strength.message, { field: 'newPassword' });
  if (currentPassword === newPassword) {
    throw new ValidationError('The new password must be different from the current one.', { field: 'newPassword' });
  }
  return { currentPassword, newPassword };
}

function validateCollectionInput(body = {}, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    out.name = requireString(body.name, 'Collection name', { min: 1, max: 80 });
  }
  if (body.description !== undefined) {
    if (body.description === null) out.description = null;
    else {
      const description = String(body.description).trim();
      if (description.length > 280) {
        throw new ValidationError('Description must be 280 characters or fewer.', { field: 'description' });
      }
      out.description = description || null;
    }
  }
  if (!Object.keys(out).length) throw new ValidationError('Nothing to update.');
  return out;
}

function parseId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ValidationError(`Invalid ${field}.`, { field });
  return id;
}

function parsePagination(query = {}, { defaultPageSize = 20, maxPageSize = 100 } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(query.pageSize) || defaultPageSize));
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

function validateRegistrationAllowedRole() {
      return 'NAIVE_USER';
}

module.exports = {
  validateTable,
  validateColumn,
  validateAggregateFunction,
  validateOperator,
  validateJoinType,
  validatePagination,
  ALLOWED_TABLES,
  ALLOWED_AGGREGATE_FUNCTIONS,
  ALLOWED_OPERATORS,
  ALLOWED_JOIN_TYPES,
  TABLE_COLUMNS,
  ValidationError,
  normalizeEmail,
  validateEmail,
  validateUsername,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateCollectionInput,
  validateRegistrationAllowedRole,
  parseId,
  parsePagination
};
