/**
 * Content management: categories and tags.
 *
 * These are the structural parts of the catalogue, so they live behind the DBA
 * (categories) and DBA/Developer (tags, tag assignment) guards. Component
 * records themselves are edited through the existing stored-procedure-backed
 * lab endpoints, which are guarded the same way.
 *
 * All statements are parameterised and all identifiers are fixed strings.
 */
const pool = require('../db/pool');
const validators = require('../validators/personalValidators');
const { notFound, conflict, badRequest } = require('../errors');

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

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  deleteTag,
  assignTag,
  unassignTag
};
