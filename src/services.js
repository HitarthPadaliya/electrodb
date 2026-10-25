const crypto = require('crypto');
const { config, toDbDateTime, fromDbDateTime, nowPlus } = require('./config');
const { roles, passwords, tokens } = require('./security');
const { getStore } = require('./store');
const { pool, repo } = require('./db');
const validators = require('./validate');
const { AppError, badRequest, unauthorized, forbidden, notFound, conflict, tooManyRequests } = require('./errors');

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function objectToXml(obj, indent = '    ') {
  let xml = '';
  for (const [key, val] of Object.entries(obj)) {
    const tag = key.replace(/[^a-zA-Z0-9_]/g, '_');
    if (val === null || val === undefined) {
      xml += `${indent}<${tag}/>\n`;
    } else if (typeof val === 'object' && !(val instanceof Date)) {
      xml += `${indent}<${tag}>\n${objectToXml(val, indent + '  ')}${indent}</${tag}>\n`;
    } else {
      xml += `${indent}<${tag}>${escapeXml(val)}</${tag}>\n`;
    }
  }
  return xml;
}

function serializeQuery1Xml(components, totalCount) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<assignment11_query1>\n';
  xml += '  <query_info>\n';
  xml += '    <assignment>Practical Assignment 11</assignment>\n';
  xml += '    <query_id>1</query_id>\n';
  xml += '    <title>Full-Table Display Query</title>\n';
  xml += '    <table_name>components</table_name>\n';
  xml += `    <total_records>${totalCount || components.length}</total_records>\n`;
  xml += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xml += '  </query_info>\n';
  xml += '  <components>\n';
  for (const comp of components) {
    xml += '    <component>\n';
    xml += objectToXml(comp, '      ');
    xml += '    </component>\n';
  }
  xml += '  </components>\n';
  xml += '</assignment11_query1>\n';
  return xml;
}

function serializeQuery3Xml(aggregateData) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<assignment11_query3>\n';
  xml += '  <query_info>\n';
  xml += '    <assignment>Practical Assignment 11</assignment>\n';
  xml += '    <query_id>3</query_id>\n';
  xml += '    <title>Aggregate Query</title>\n';
  xml += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xml += '  </query_info>\n';
  xml += '  <aggregate_data>\n';
  xml += objectToXml(aggregateData, '    ');
  xml += '  </aggregate_data>\n';
  xml += '</assignment11_query3>\n';
  return xml;
}

function serializeQuery4Xml(filterParams, items, totalCount) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<assignment11_query4>\n';
  xml += '  <query_info>\n';
  xml += '    <assignment>Practical Assignment 11</assignment>\n';
  xml += '    <query_id>4</query_id>\n';
  xml += '    <title>Conditional Query</title>\n';
  xml += `    <total_matches>${totalCount || items.length}</total_matches>\n`;
  xml += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xml += '  </query_info>\n';
  xml += '  <filter_condition>\n';
  xml += objectToXml(filterParams, '    ');
  xml += '  </filter_condition>\n';
  xml += '  <items>\n';
  for (const item of items) {
    xml += '    <item>\n';
    xml += objectToXml(item, '      ');
    xml += '    </item>\n';
  }
  xml += '  </items>\n';
  xml += '</assignment11_query4>\n';
  return xml;
}

async function listAccounts(query = {}) {
  const { page, pageSize, limit, offset } = validators.parsePagination(query, { defaultPageSize: 25 });
  const result = await getStore().users.list({ limit, offset, query: query.q || '' });
  return {
    items: result.items.map(user => ({
      ...user,
      role: roles.toApiRole(user.roleCode)
    })),
    pagination: {
      page,
      pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize))
    }
  };
}

async function getAccount(rawUserId) {
  const userId = validators.parseId(rawUserId, 'userId');
  const user = await getStore().users.findById(userId);
  if (!user) throw notFound('Account not found.');
  return { ...user, role: roles.toApiRole(user.roleCode) };
}

async function createAccount(body = {}) {
  const username = validators.validateUsername(body.username);
  const email = validators.validateEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  const strength = passwords.validatePasswordStrength(password);
  if (!strength.ok) throw conflict(strength.message, 'WEAK_PASSWORD');

  const roleCode = roles.toRoleCode(body.role) || roles.ROLE_TO_CODE[roles.ROLE.USER];
  const store = getStore();

  if (await store.users.findByEmail(email)) throw conflict('An account with that email address already exists.', 'EMAIL_TAKEN');
  if (await store.users.findByUsername(username)) throw conflict('That username is already taken.', 'USERNAME_TAKEN');

  const user = await store.users.create({
    username,
    email,
    passwordHash: await passwords.hashPassword(password),
    roleCode
  });

  return { ...user, role: roles.toApiRole(user.roleCode) };
}

async function updateAccount(actor, rawUserId, body = {}) {
  const userId = validators.parseId(rawUserId, 'userId');
  const store = getStore();

  const target = await store.users.findById(userId);
  if (!target) throw notFound('Account not found.');

  const patch = {};
  if (body.role !== undefined) {
    const roleCode = roles.toRoleCode(body.role);
    if (!roleCode) throw conflict('Unknown role. Use User, Developer or DBA.', 'INVALID_ROLE');
    patch.roleCode = roleCode;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw conflict('isActive must be true or false.', 'INVALID_STATUS');
    patch.isActive = body.isActive;
  }
  if (!Object.keys(patch).length) throw conflict('Send a role or an account status to change.', 'NOTHING_TO_UPDATE');

  if (actor && Number(actor.userId) === userId) {
    if (patch.roleCode && patch.roleCode !== target.roleCode) {
      throw forbidden('You cannot change your own role. Ask another DBA.', 'SELF_ROLE_CHANGE');
    }
    if (patch.isActive === false) {
      throw forbidden('You cannot disable your own account.', 'SELF_DEACTIVATION');
    }
  }

    const losingDba =
    target.roleCode === roles.ROLE_TO_CODE[roles.ROLE.DBA] &&
    ((patch.roleCode && patch.roleCode !== roles.ROLE_TO_CODE[roles.ROLE.DBA]) || patch.isActive === false);

  if (losingDba) {
    const remaining = await store.users.countActiveByRole(roles.ROLE_TO_CODE[roles.ROLE.DBA], userId);
    if (remaining === 0) {
      throw conflict('This is the last active DBA account. Promote another account first.', 'LAST_DBA');
    }
  }

  const updated = await store.users.setRoleAndStatus(userId, patch);
  if (!updated) throw notFound('Account not found.');

    const roleChanged = patch.roleCode !== undefined && patch.roleCode !== target.roleCode;
  if (roleChanged || patch.isActive === false) {
    await store.sessions.deleteForUser(userId);
  }

  return { ...updated, role: roles.toApiRole(updated.roleCode) };
}

const SESSION_TTL_MS = config.session.ttlHours * 60 * 60 * 1000;

function publicUser(user) {
  if (!user) return null;
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: roles.toApiRole(user.roleCode),
    roleCode: user.roleCode,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    permissions: {
      canAuthorContent: roles.hasRole({ role: roles.toApiRole(user.roleCode) }, roles.CONTENT_ROLES),
      canAdminister: roles.hasRole({ role: roles.toApiRole(user.roleCode) }, roles.ADMIN_ROLES)
    }
  };
}

async function startSession(userId) {
  const store = getStore();
  const { token, hash } = tokens.createToken();
  const expiresAt = nowPlus(SESSION_TTL_MS);
  await store.sessions.create({ userId, tokenHash: hash, expiresAt });
  return { token, expiresAt };
}

async function register(body = {}) {
  const { username, email, password } = validators.validateRegistration(body);
  const store = getStore();

  const [byEmail, byUsername] = await Promise.all([
    store.users.findByEmail(email),
    store.users.findByUsername(username)
  ]);

  if (byEmail) throw conflict('An account with that email address already exists.', 'EMAIL_TAKEN');
  if (byUsername) throw conflict('That username is already taken.', 'USERNAME_TAKEN');

  const passwordHash = await passwords.hashPassword(password);

      const user = await store.users.create({
    username,
    email,
    passwordHash,
    roleCode: validators.validateRegistrationAllowedRole()
  });

  await store.users.touchLogin(user.userId);
  const session = await startSession(user.userId);
  return { user: publicUser(user), ...session };
}

async function login(body = {}) {
  const { email, password } = validators.validateLogin(body);
  const store = getStore();

  const user = await store.users.findByEmail(email);
  if (!user) {
            await passwords.dummyVerify();
    throw unauthorized('Email address or password is incorrect.', 'INVALID_CREDENTIALS');
  }

  const hash = await store.users.passwordHash(user.userId);
  const ok = await passwords.verifyPassword(password, hash);
  if (!ok) throw unauthorized('Email address or password is incorrect.', 'INVALID_CREDENTIALS');

  if (!user.isActive) {
    throw forbidden('This account has been disabled. Contact an administrator.', 'ACCOUNT_DISABLED');
  }

  await store.users.touchLogin(user.userId);
  const session = await startSession(user.userId);
  return { user: publicUser(user), ...session };
}

async function resolveSession(token) {
  if (!token) return null;
  const store = getStore();
  const hash = tokens.hashToken(token);
  const found = await store.sessions.findWithUser(hash);
  if (!found) return null;

  const expiry = fromDbDateTime(found.session.expiresAt);
  if (!expiry || expiry.getTime() <= Date.now()) {
    await store.sessions.deleteByTokenHash(hash);
    return null;
  }

  if (!found.user.isActive) {
            await store.sessions.deleteForUser(found.user.userId);
    return null;
  }

  return { session: found.session, user: found.user, tokenHash: hash };
}

async function touchSession(session) {
  const store = getStore();
  const lastSeen = fromDbDateTime(session.lastSeenAt);
  const stale = !lastSeen || Date.now() - lastSeen.getTime() > 60 * 60 * 1000;
  if (!stale) return;
  await store.sessions.touch(session.sessionId, {
    lastSeenAt: toDbDateTime(Date.now()),
    expiresAt: nowPlus(SESSION_TTL_MS)
  });
}

async function logout(token) {
  if (!token) return;
  await getStore().sessions.deleteByTokenHash(tokens.hashToken(token));
}

async function logoutEverywhere(userId, keepToken) {
  const keepTokenHash = keepToken ? tokens.hashToken(keepToken) : null;
  await getStore().sessions.deleteForUser(userId, { keepTokenHash });
}

async function changePassword(userId, body = {}) {
  const { currentPassword, newPassword } = validators.validatePasswordChange(body);
  const store = getStore();

  const user = await store.users.findById(userId);
  if (!user) throw notFound('Account not found.');

  const hash = await store.users.passwordHash(userId);
  const ok = await passwords.verifyPassword(currentPassword, hash);
  if (!ok) throw unauthorized('Current password is incorrect.', 'INVALID_CREDENTIALS');

  await store.users.updatePassword(userId, await passwords.hashPassword(newPassword));
  return true;
}

async function updateProfile(userId, body = {}) {
  const patch = validators.validateProfileUpdate(body);
  const store = getStore();

  if (patch.email) {
    const existing = await store.users.findByEmail(patch.email);
    if (existing && existing.userId !== Number(userId)) {
      throw conflict('An account with that email address already exists.', 'EMAIL_TAKEN');
    }
  }
  if (patch.username) {
    const existing = await store.users.findByUsername(patch.username);
    if (existing && existing.userId !== Number(userId)) {
      throw conflict('That username is already taken.', 'USERNAME_TAKEN');
    }
  }

  const updated = await store.users.updateProfile(userId, patch);
  if (!updated) throw notFound('Account not found.');
  return publicUser(updated);
}

async function getUser(userId) {
  const user = await getStore().users.findById(userId);
  if (!user) throw notFound('Account not found.');
  return publicUser(user);
}

function bootstrapPasswordHash(password) {
  const strength = passwords.validatePasswordStrength(password);
  if (!strength.ok) throw badRequest(strength.message);
  return passwords.hashPassword(password);
}

async function getCategoriesTree() {
  const allCategories = await repo.getAllCategories();
  const topLevel = allCategories.filter(c => c.parent_category_id === null);

  const enriched = await Promise.all(
    topLevel.map(async cat => {
      const children = await repo.getChildCategories(cat.category_id);
      const componentCount = await repo.countComponentsByCategory(cat.category_id);
      return {
        ...cat,
        componentCount,
        children
      };
    })
  );

  return enriched;
}

async function getCategoryDetail(idOrSlug, { page = 1, pageSize = 20 }) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const category = isNumeric
    ? await repo.getCategoryById(parseInt(idOrSlug, 10))
    : await repo.getCategoryBySlug(idOrSlug);

  if (!category) {
    const error = new Error(`Category not found: ${idOrSlug}`);
    error.statusCode = 404;
    throw error;
  }

  const breadcrumbs = await repo.getCategoryBreadcrumb(category.category_id);
  const children = await repo.getChildCategories(category.category_id);
  const totalComponents = await repo.countComponentsByCategory(category.category_id);
  const offset = (page - 1) * pageSize;
  const components = await repo.getComponentsByCategory(category.category_id, {
    limit: pageSize,
    offset
  });

  return {
    category,
    breadcrumbs,
    children,
    components,
    pagination: {
      page,
      pageSize,
      total: totalComponents,
      totalPages: Math.ceil(totalComponents / pageSize) || 1
    }
  };
}

async function getCategoryTemplate(categoryId) {
  const templates = await repo.getCategoryContentTemplates(categoryId);
  return templates;
}

function parseSectionContent(typeCode, rawContent) {
  if (typeCode === 'TABLE') {
    if (typeof rawContent === 'object' && rawContent !== null) {
      return rawContent;
    }
    try {
      return JSON.parse(rawContent);
    } catch (e) {
      return { columns: [], rows: [], raw: rawContent };
    }
  }
  return rawContent;
}

function formatSpecification(spec) {
  let displayValue = '';
  if (spec.numeric_value !== null && spec.numeric_value !== undefined) {
    displayValue = String(spec.numeric_value);
  } else if (spec.text_value !== null && spec.text_value !== undefined) {
    displayValue = spec.text_value;
  } else if (spec.range_min !== null && spec.range_max !== null) {
    displayValue = `${spec.range_min} - ${spec.range_max}`;
  } else if (spec.range_min !== null) {
    displayValue = `≥ ${spec.range_min}`;
  } else if (spec.range_max !== null) {
    displayValue = `≤ ${spec.range_max}`;
  }

  const unit = spec.unit_override || spec.unit || null;
  if (unit && displayValue && !displayValue.includes(unit)) {
    displayValue = `${displayValue} ${unit}`;
  }

  return {
    specificationId: spec.specification_id,
    name: spec.name,
    value: displayValue,
    rawValue: {
      numeric: spec.numeric_value,
      text: spec.text_value,
      rangeMin: spec.range_min,
      rangeMax: spec.range_max
    },
    unit,
    valueKind: spec.value_kind,
    description: spec.description,
    sourceNote: spec.source_note
  };
}

async function getComponentDetail(idOrSlug) {
  const component = await repo.getComponentByIdOrSlug(idOrSlug);

  if (!component) {
    const error = new Error(`Component not found: ${idOrSlug}`);
    error.statusCode = 404;
    throw error;
  }

  const breadcrumbs = await repo.getCategoryBreadcrumb(component.category_id);
  const rawContent = await repo.getComponentContent(component.component_id);
  const rawDiagrams = await repo.getComponentDiagrams(component.component_id);
  const rawSpecs = await repo.getComponentSpecifications(component.component_id);
  const tags = await repo.getComponentTags(component.component_id);

    const content = rawContent.map(sec => ({
    sectionId: sec.component_content_id,
    sectionKey: sec.section_key,
    title: sec.title,
    type: sec.content_type,
    renderKind: sec.render_kind,
    content: parseSectionContent(sec.content_type, sec.content),
    altText: sec.alt_text,
    caption: sec.caption,
    displayOrder: sec.display_order
  }));

    const diagrams = rawDiagrams.map(d => ({
    diagramId: d.diagram_id,
    title: d.title,
    kind: d.diagram_kind || 'OTHER',
    imagePath: d.image_path,
    altText: d.alt_text,
    caption: d.caption,
    displayOrder: d.display_order
  }));

    const specifications = rawSpecs.map(formatSpecification);

  return {
    componentId: component.component_id,
    name: component.name,
    slug: component.slug,
    category: {
      categoryId: component.category_id,
      name: component.category_name,
      slug: component.category_slug
    },
    breadcrumbs,
    shortDescription: component.short_description,
    description: component.description,
    mainImagePath: component.main_image_path,
    circuitSymbolPath: component.circuit_symbol_path,
    datasheetUrl: component.datasheet_url,
    isIllustrative: Boolean(component.is_illustrative),
    isPublished: Boolean(component.is_published),
    createdAt: component.created_at,
    updatedAt: component.updated_at,
    content,
    diagrams,
    specifications,
    tags
  };
}

async function getCatalog({ page = 1, pageSize = 24, categoryId = null } = {}) {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const size = Math.min(Math.max(Number.parseInt(pageSize, 10) || 24, 1), 100);
  const offset = (currentPage - 1) * size;

  const [items, total] = await Promise.all([
    repo.getPublishedComponents({ limit: size, offset, categoryId }),
    repo.countPublishedComponents({ categoryId })
  ]);

  return {
    items,
    pagination: {
      page: currentPage,
      pageSize: size,
      total,
      totalPages: Math.ceil(total / size) || 1
    }
  };
}

async function getTags() {
  const tags = await repo.getTagsWithCounts();
  return tags.map(tag => ({
    tagId: tag.tag_id,
    name: tag.name,
    slug: tag.slug,
    component_count: Number(tag.component_count)
  }));
}

async function getTagDetail(idOrSlug, { page = 1, pageSize = 24 } = {}) {
  const tag = await repo.getTagByIdOrSlug(idOrSlug);

  if (!tag) {
    const error = new Error(`Tag not found: ${idOrSlug}`);
    error.statusCode = 404;
    throw error;
  }

  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const size = Math.min(Math.max(Number.parseInt(pageSize, 10) || 24, 1), 100);
  const offset = (currentPage - 1) * size;

  const [components, total] = await Promise.all([
    repo.getComponentsByTag(tag.tag_id, { limit: size, offset }),
    repo.countComponentsByTag(tag.tag_id)
  ]);

  return {
    tag: {
      tagId: tag.tag_id,
      name: tag.name,
      slug: tag.slug
    },
    components,
    pagination: {
      page: currentPage,
      pageSize: size,
      total,
      totalPages: Math.ceil(total / size) || 1
    }
  };
}

async function search(queryStr, { page = 1, pageSize = 20 }) {
  const trimmed = (queryStr || '').trim();
  if (!trimmed) {
    return {
      query: '',
      items: [],
      pagination: { page: 1, pageSize, total: 0, totalPages: 0 }
    };
  }

  const offset = (page - 1) * pageSize;
  const items = await repo.searchComponents(trimmed, { limit: pageSize, offset });
  const total = await repo.countSearchComponents(trimmed);

  return {
    query: trimmed,
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    }
  };
}

async function getStats() {
  const counts = (await repo.getCatalogueCounts()) || {};
  const asCount = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    components: asCount(counts.components),
    componentsTotal: asCount(counts.components_total),
    categories: asCount(counts.categories),
    subfamilies: asCount(counts.subfamilies),
    tags: asCount(counts.tags),
    diagrams: asCount(counts.diagrams),
    specifications: asCount(counts.specifications),
    contentSections: asCount(counts.content_sections)
  };
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function normaliseSlug(value, fallbackName) {
  const slug = value ? slugify(value) : slugify(fallbackName);
  if (!slug || !SLUG_PATTERN.test(slug)) {
    throw badRequest('Slug must contain lowercase letters, numbers and hyphens.');
  }
  return slug;
}

function optionalText(value, field, max) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (text.length > max) throw badRequest(`${field} must be ${max} characters or fewer.`);
  return text || null;
}

async function createCategory(body = {}) {
  const name = String(body.name || '').trim();
  if (!name) throw badRequest('Category name is required.');
  if (name.length > 120) throw badRequest('Category name must be 120 characters or fewer.');

  const slug = normaliseSlug(body.slug, name);
  const parentId = body.parentCategoryId === null || body.parentCategoryId === undefined
    ? null
    : validators.parseId(body.parentCategoryId, 'parentCategoryId');
  const description = optionalText(body.description, 'Description', 2000);
  const displayOrder = Number.isInteger(Number(body.displayOrder)) ? Number(body.displayOrder) : 0;

  if (parentId) {
    const [parents] = await pool.query('SELECT category_id FROM categories WHERE category_id = ?', [parentId]);
    if (!parents.length) throw notFound('Parent category not found.');
  }

  const [result] = await pool.query(
    'INSERT INTO categories (parent_category_id, name, slug, description, display_order) VALUES (?, ?, ?, ?, ?)',
    [parentId, name, slug, description, displayOrder]
  );

  return { categoryId: result.insertId, name, slug, parentCategoryId: parentId };
}

async function updateCategory(rawId, body = {}) {
  const categoryId = validators.parseId(rawId, 'categoryId');
  const fields = [];
  const params = [];

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length > 120) throw badRequest('Category name must be 1-120 characters.');
    fields.push('name = ?');
    params.push(name);
  }
  if (body.slug !== undefined) {
    fields.push('slug = ?');
    params.push(normaliseSlug(body.slug, body.name || 'category'));
  }
  if (body.description !== undefined) {
    fields.push('description = ?');
    params.push(optionalText(body.description, 'Description', 2000));
  }
  if (body.displayOrder !== undefined) {
    const order = Number(body.displayOrder);
    if (!Number.isInteger(order)) throw badRequest('displayOrder must be an integer.');
    fields.push('display_order = ?');
    params.push(order);
  }
  if (body.parentCategoryId !== undefined) {
    const parentId = body.parentCategoryId === null ? null : validators.parseId(body.parentCategoryId, 'parentCategoryId');
    if (parentId === categoryId) throw badRequest('A category cannot be its own parent.');
    fields.push('parent_category_id = ?');
    params.push(parentId);
  }
  if (!fields.length) throw badRequest('Nothing to update.');

  params.push(categoryId);
  const [result] = await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE category_id = ?`, params);
  if (result.affectedRows === 0) throw notFound('Category not found.');
  return { categoryId, updated: true };
}

async function deleteCategory(rawId) {
  const categoryId = validators.parseId(rawId, 'categoryId');

  const [children] = await pool.query('SELECT COUNT(*) AS total FROM categories WHERE parent_category_id = ?', [categoryId]);
  if (Number(children[0].total) > 0) {
    throw conflict('This category still has subcategories. Move or delete them first.', 'CATEGORY_HAS_CHILDREN');
  }
  const [components] = await pool.query('SELECT COUNT(*) AS total FROM components WHERE category_id = ?', [categoryId]);
  if (Number(components[0].total) > 0) {
    throw conflict('This category still has components. Move them first.', 'CATEGORY_HAS_COMPONENTS');
  }

  const [result] = await pool.query('DELETE FROM categories WHERE category_id = ?', [categoryId]);
  if (result.affectedRows === 0) throw notFound('Category not found.');
  return { categoryId, deleted: true };
}

async function createTag(body = {}) {
  const name = String(body.name || '').trim();
  if (!name || name.length > 80) throw badRequest('Tag name must be 1-80 characters.');
  const slug = normaliseSlug(body.slug, name);

  const [result] = await pool.query('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
  return { tagId: result.insertId, name, slug };
}

async function deleteTag(rawId) {
  const tagId = validators.parseId(rawId, 'tagId');
  const [result] = await pool.query('DELETE FROM tags WHERE tag_id = ?', [tagId]);
  if (result.affectedRows === 0) throw notFound('Tag not found.');
  return { tagId, deleted: true };
}

async function assignTag(rawComponentId, rawTagId) {
  const componentId = validators.parseId(rawComponentId, 'componentId');
  const tagId = validators.parseId(rawTagId, 'tagId');

  const [component] = await pool.query('SELECT component_id FROM components WHERE component_id = ?', [componentId]);
  if (!component.length) throw notFound('Component not found.');
  const [tag] = await pool.query('SELECT tag_id FROM tags WHERE tag_id = ?', [tagId]);
  if (!tag.length) throw notFound('Tag not found.');

  try {
    await pool.query('INSERT INTO component_tags (component_id, tag_id) VALUES (?, ?)', [componentId, tagId]);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    return { componentId, tagId, assigned: true, created: false };
  }
  return { componentId, tagId, assigned: true, created: true };
}

async function unassignTag(rawComponentId, rawTagId) {
  const componentId = validators.parseId(rawComponentId, 'componentId');
  const tagId = validators.parseId(rawTagId, 'tagId');
  const [result] = await pool.query('DELETE FROM component_tags WHERE component_id = ? AND tag_id = ?', [
    componentId,
    tagId
  ]);
  return { componentId, tagId, assigned: false, removed: result.affectedRows > 0 };
}

async function createComponentViaSP(data) {
  const { categoryId, name, slug, shortDescription } = data;
  if (!name || !categoryId) {
    const error = new Error('Component name and category ID are required');
    error.statusCode = 400;
    throw error;
  }
  const componentId = await repo.insertComponentSP(categoryId, name, slug, shortDescription);
  return { componentId, message: 'Component created via stored procedure sp_insert_component' };
}

async function updateComponentViaSP(id, data) {
  const { categoryId, name, shortDescription } = data;
  if (!name || !categoryId) {
    const error = new Error('Component name and category ID are required');
    error.statusCode = 400;
    throw error;
  }
  await repo.updateComponentSP(id, categoryId, name, shortDescription);
  return { componentId: id, message: 'Component updated via stored procedure sp_update_component' };
}

async function deleteComponentViaSP(id) {
  await repo.deleteComponentSP(id);
  return { componentId: id, message: 'Component deleted via stored procedure sp_delete_component' };
}

async function getCursorAll() {
  const rows = await repo.getCursorComponentsAllSP();
  return {
    procedure: 'sp_cursor_components_all',
    type: 'Unbounded explicit cursor',
    rowCount: rows.length,
    rows
  };
}

async function getCursorLimited(limit = 10) {
  const safeLimit = Math.max(1, Math.min(1000, parseInt(limit, 10) || 10));
  const rows = await repo.getCursorComponentsLimitedSP(safeLimit);
  return {
    procedure: 'sp_cursor_components_limited',
    type: 'Bounded explicit cursor with limit',
    limit: safeLimit,
    rowCount: rows.length,
    rows
  };
}

async function getSumMetrics() {
  const ungrouped = await repo.getSumUngrouped();
  const grouped = await repo.getSumGroupedSP();
  return {
    ungrouped: {
      functionName: 'fn_sum_component_ids',
      totalSum: ungrouped
    },
    grouped: {
      procedureName: 'sp_sum_component_ids_by_category',
      items: grouped
    }
  };
}

async function createAppUserViaSP(data) {
  const { username, passwordHash, roleCode } = data;
  if (!username || !passwordHash || !roleCode) {
    const error = new Error('Username, password hash, and role code are required');
    error.statusCode = 400;
    throw error;
  }
  const userId = await repo.insertAppUserSP(username, passwordHash, roleCode);
  return { userId, message: 'App user created via stored procedure sp_insert_app_user' };
}

async function updateAppUserViaSP(id, data) {
  const { roleCode, isActive } = data;
  await repo.updateAppUserSP(id, roleCode, isActive);
  return { userId: id, message: 'App user updated via stored procedure sp_update_app_user' };
}

async function deleteAppUserViaSP(id) {
  await repo.deleteAppUserSP(id);
  return { userId: id, message: 'App user deleted via stored procedure sp_delete_app_user' };
}

async function listAppUsers() {
  const users = await repo.getAppUsers();
  return users;
}

async function listAuditLogs(limit = 50) {
  const logs = await repo.getAuditLogs(limit);
  return logs;
}

async function getQuery1Components({ page = 1, pageSize = 50, bounded = true, format = 'json' }) {
  const offset = (page - 1) * pageSize;
  const components = await repo.getFullTableComponents({ limit: pageSize, offset, bounded });
  const total = await repo.countAllComponents();

  if (format === 'xml') {
    return xmlSerializer.serializeQuery1Xml(components, total);
  }

  return {
    queryId: 1,
    title: 'Query 1: Full-Table Display',
    items: components,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
}

async function getQuery3Aggregate({ table = 'components', fn = 'COUNT', field = 'component_id', format = 'json' }) {
  const result = await repo.executeDynamicAggregate(table, fn, field);

  if (format === 'xml') {
    return xmlSerializer.serializeQuery3Xml(result);
  }

  return {
    queryId: 3,
    title: 'Query 3: Aggregate Query',
    ...result
  };
}

async function getQuery4Filter({
  table = 'components',
  field = 'category_id',
  operator = 'eq',
  value = '6',
  page = 1,
  pageSize = 50,
  format = 'json'
}) {
  const offset = (page - 1) * pageSize;
  const result = await repo.executeDynamicFilter(table, field, operator, value, { limit: pageSize, offset });

  if (format === 'xml') {
    return xmlSerializer.serializeQuery4Xml(result.filter, result.items, result.total);
  }

  return {
    queryId: 4,
    title: 'Query 4: Conditional Query',
    ...result,
    pagination: { page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) }
  };
}

async function getQuery5Join({ left = 'components', right = 'categories', type = 'inner', page = 1, pageSize = 25 }) {
  const offset = (page - 1) * pageSize;
  const result = await repo.executeDynamicJoin(left, right, type, { limit: pageSize, offset });
  return {
    queryId: 5,
    title: 'Query 5: Join Query',
    ...result
  };
}

async function getQuery6Subquery(kind) {
  const result = await repo.executeSubquery(kind);
  return {
    queryId: 6,
    title: 'Query 6: Subquery Across Tables',
    ...result
  };
}

async function getQuery7Correlated(kind) {
  const result = await repo.executeCorrelatedQuery(kind);
  return {
    queryId: 7,
    title: 'Query 7: Correlated Subquery Across Tables',
    ...result
  };
}

async function getViewCatalogueData({ page = 1, pageSize = 25 }) {
  const offset = (page - 1) * pageSize;
  const result = await repo.getViewCatalogue({ limit: pageSize, offset });
  return {
    viewName: 'v_component_catalogue',
    items: result.rows,
    pagination: { page, pageSize, total: result.total }
  };
}

async function getViewCountsData() {
  const rows = await repo.getViewCounts();
  return {
    viewName: 'v_category_component_counts',
    items: rows
  };
}

async function getLabDashboard() {
  const stats = await repo.getDashboardStats();
  return stats;
}

const RECENT_LIMIT = 8;

async function listBookmarks(userId, query = {}) {
  const { page, pageSize, limit, offset } = validators.parsePagination(query, { defaultPageSize: 24 });
  const result = await getStore().bookmarks.list(userId, { limit, offset });
  return {
    items: result.items,
    pagination: {
      page,
      pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize))
    }
  };
}

async function bookmarkIds(userId) {
  if (!userId) return [];
  return getStore().bookmarks.ids(userId);
}

async function addBookmark(userId, rawComponentId) {
  const componentId = validators.parseId(rawComponentId, 'componentId');
  const store = getStore();

  if (!(await store.components.exists(componentId))) {
    throw notFound('Component not found.');
  }

  const result = await store.bookmarks.add(userId, componentId);
  return { componentId, bookmarked: true, created: result.created };
}

async function removeBookmark(userId, rawComponentId) {
  const componentId = validators.parseId(rawComponentId, 'componentId');
  const store = getStore();
  const removed = await store.bookmarks.remove(userId, componentId);
      return { componentId, bookmarked: false, removed };
}

async function listCollections(userId) {
  const store = getStore();
  const [collections, bookmarkIdsList] = await Promise.all([store.collections.list(userId), store.bookmarks.ids(userId)]);
  return { items: collections, bookmarkedComponentIds: bookmarkIdsList };
}

async function getCollection(userId, rawCollectionId) {
  const collectionId = validators.parseId(rawCollectionId, 'collectionId');
  const store = getStore();
  const collection = await store.collections.find(userId, collectionId);
      if (!collection) throw notFound('Collection not found.');

  const items = await store.collections.items(userId, collectionId);
  const bookmarked = await store.bookmarks.ids(userId);
  return { ...collection, itemCount: items.length, items, bookmarkedComponentIds: bookmarked };
}

async function createCollection(userId, body = {}) {
  const input = validators.validateCollectionInput(body);
  const store = getStore();

  const existing = (await store.collections.list(userId)).find(
    c => c.name.toLowerCase() === input.name.toLowerCase()
  );
  if (existing) throw conflict('You already have a collection with that name.', 'COLLECTION_EXISTS');

  return store.collections.create(userId, input);
}

async function updateCollection(userId, rawCollectionId, body = {}) {
  const collectionId = validators.parseId(rawCollectionId, 'collectionId');
  const patch = validators.validateCollectionInput(body, { partial: true });
  const store = getStore();

  if (patch.name) {
    const collision = (await store.collections.list(userId)).find(
      c => c.collectionId !== collectionId && c.name.toLowerCase() === patch.name.toLowerCase()
    );
    if (collision) throw conflict('You already have a collection with that name.', 'COLLECTION_EXISTS');
  }

  const updated = await store.collections.update(userId, collectionId, patch);
  if (!updated) throw notFound('Collection not found.');
  return updated;
}

async function deleteCollection(userId, rawCollectionId) {
  const collectionId = validators.parseId(rawCollectionId, 'collectionId');
  const removed = await getStore().collections.remove(userId, collectionId);
  if (!removed) throw notFound('Collection not found.');
  return { collectionId, deleted: true };
}

async function addCollectionItem(userId, rawCollectionId, rawComponentId) {
  const collectionId = validators.parseId(rawCollectionId, 'collectionId');
  const componentId = validators.parseId(rawComponentId, 'componentId');
  const store = getStore();

  if (!(await store.components.exists(componentId))) throw notFound('Component not found.');

  const result = await store.collections.addItem(userId, collectionId, componentId);
  if (!result.found) throw notFound('Collection not found.');
  return { collectionId, componentId, added: true, created: result.created };
}

async function removeCollectionItem(userId, rawCollectionId, rawComponentId) {
  const collectionId = validators.parseId(rawCollectionId, 'collectionId');
  const componentId = validators.parseId(rawComponentId, 'componentId');

  const result = await getStore().collections.removeItem(userId, collectionId, componentId);
  if (!result.found) throw notFound('Collection not found.');
  return { collectionId, componentId, added: false, removed: result.removed };
}

async function recordView(userId, rawComponentId) {
  const componentId = validators.parseId(rawComponentId, 'componentId');
  const store = getStore();
  if (!(await store.components.exists(componentId))) throw notFound('Component not found.');
  await store.recent.record(userId, componentId);
  return { componentId, recorded: true };
}

async function listRecent(userId, limit = RECENT_LIMIT) {
  const items = await getStore().recent.list(userId, Math.min(Math.max(1, limit), 20));
  return { items };
}

async function clearRecent(userId) {
  await getStore().recent.clear(userId);
  return { cleared: true };
}

async function getDashboard(user) {
  const store = getStore();
  const [bookmarkTotal, collections, recent] = await Promise.all([
    store.bookmarks.count(user.userId),
    store.collections.list(user.userId),
    store.recent.list(user.userId, RECENT_LIMIT)
  ]);

  return {
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role
    },
    counts: {
      bookmarks: bookmarkTotal,
      collections: collections.length,
      recentlyViewed: recent.length
    },
    collections,
    recent
  };
}

const xmlSerializer = {
  escapeXml,
  serializeQuery1Xml,
  serializeQuery3Xml,
  serializeQuery4Xml
};

const adminService = {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount
};

const authService = {
  register,
  login,
  logout,
  logoutEverywhere,
  resolveSession,
  touchSession,
  changePassword,
  updateProfile,
  getUser,
  publicUser,
  bootstrapPasswordHash,
  startSession,
  SESSION_TTL_MS,
  randomToken: () => crypto.randomBytes(16).toString('hex')
};

const catalogueService = {
  getCategoriesTree,
  getCategoryDetail,
  getCategoryTemplate,
  getComponentDetail,
  getCatalog,
  getTags,
  getTagDetail,
  search,
  getStats
};

const contentService = {
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  deleteTag,
  assignTag,
  unassignTag
};

const labService = {
  createComponentViaSP,
  updateComponentViaSP,
  deleteComponentViaSP,
  getCursorAll,
  getCursorLimited,
  getSumMetrics,
  createAppUserViaSP,
  updateAppUserViaSP,
  deleteAppUserViaSP,
  listAppUsers,
  listAuditLogs,
  getQuery1Components,
  getQuery3Aggregate,
  getQuery4Filter,
  getQuery5Join,
  getQuery6Subquery,
  getQuery7Correlated,
  getViewCatalogueData,
  getViewCountsData,
  getLabDashboard
};

const personalService = {
  listBookmarks,
  bookmarkIds,
  addBookmark,
  removeBookmark,
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addCollectionItem,
  removeCollectionItem,
  recordView,
  listRecent,
  clearRecent,
  getDashboard,
  RECENT_LIMIT
};

module.exports = {
  adminService,
  authService,
  catalogueService,
  contentService,
  labService,
  personalService,
  xmlSerializer
};
