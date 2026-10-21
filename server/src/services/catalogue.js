const { query } = require('../db/pool');

const componentSelect = `SELECT c.component_id AS componentId, c.category_id AS categoryId,
  c.name, c.slug, c.short_description AS shortDescription, c.main_image_path AS mainImagePath,
  c.is_illustrative AS isIllustrative, cat.name AS categoryName, cat.slug AS categorySlug
  FROM components c JOIN categories cat ON cat.category_id = c.category_id`;

async function categories() {
  return query(`SELECT category_id AS categoryId, parent_category_id AS parentCategoryId,
    name, slug, description, display_order AS displayOrder
    FROM categories WHERE is_active=1 ORDER BY parent_category_id IS NOT NULL, parent_category_id, display_order, name`);
}
async function categoryPath(categoryId) {
  const path = [], seen = new Set();
  let id = categoryId;
  while (id != null && path.length < 50 && !seen.has(Number(id))) {
    seen.add(Number(id));
    const [node] = await query(`SELECT category_id AS categoryId,parent_category_id AS parentCategoryId,name,slug
      FROM categories WHERE category_id=? AND is_active=1`, [id]);
    if (!node) break;
    path.unshift(node);
    id = node.parentCategoryId;
  }
  return path;
}
async function categoryById(id) {
  const [category] = await query(`SELECT category_id AS categoryId, parent_category_id AS parentCategoryId,
    name, slug, description, display_order AS displayOrder FROM categories WHERE category_id=? AND is_active=1`, [id]);
  if (!category) return null;
  const [children, components, breadcrumb] = await Promise.all([
    query(`SELECT category_id AS categoryId, parent_category_id AS parentCategoryId, name, slug, description
      FROM categories WHERE parent_category_id=? AND is_active=1 ORDER BY display_order,name`, [id]),
    query(`${componentSelect} WHERE c.category_id=? AND c.is_published=1 ORDER BY c.name`, [id]),
    categoryPath(id)
  ]);
  return { ...category, breadcrumb, children, components };
}
async function categoryBySlug(slug) {
  const [row] = await query('SELECT category_id AS categoryId FROM categories WHERE slug=? AND is_active=1', [slug]);
  return row ? categoryById(row.categoryId) : null;
}
async function componentById(id) {
  const [component] = await query(`SELECT c.component_id AS componentId,c.category_id AS categoryId,
    c.name,c.slug,c.short_description AS shortDescription,c.description,c.main_image_path AS mainImagePath,
    c.circuit_symbol_path AS circuitSymbolPath,c.datasheet_url AS datasheetUrl,
    c.is_illustrative AS isIllustrative, cat.name AS categoryName,cat.slug AS categorySlug
    FROM components c JOIN categories cat ON cat.category_id=c.category_id
    WHERE c.component_id=? AND c.is_published=1`, [id]);
  if (!component) return null;
  const [content, diagrams, specifications, breadcrumb] = await Promise.all([
    query(`SELECT cc.section_key AS sectionKey,cc.title,ct.code AS type,cc.content,cc.alt_text AS altText,
      cc.caption,cc.display_order AS displayOrder FROM component_content cc
      JOIN content_types ct ON ct.content_type_id=cc.content_type_id
      WHERE cc.component_id=? ORDER BY cc.display_order,cc.component_content_id`, [id]),
    query(`SELECT title,image_path AS imagePath,alt_text AS altText,caption,display_order AS displayOrder
      FROM component_diagrams WHERE component_id=? ORDER BY display_order,diagram_id`, [id]),
    query(`SELECT s.name,s.unit,s.value_kind AS valueKind,cs.numeric_value AS numericValue,
      cs.text_value AS textValue,cs.range_min AS rangeMin,cs.range_max AS rangeMax,
      COALESCE(cs.unit_override,s.unit) AS displayUnit,cs.source_note AS sourceNote
      FROM component_specifications cs JOIN specifications s ON s.specification_id=cs.specification_id
      WHERE cs.component_id=? ORDER BY s.name`, [id]),
    categoryPath(component.categoryId)
  ]);
  const sections = content.map(item => {
    let data = item.content;
    if (item.type === 'TABLE') {
      try { data = JSON.parse(data); } catch { data = null; }
    } else if (item.type === 'GRAPH') {
      try { data = JSON.parse(data); } catch { data = item.content; }
    }
    return { ...item, content: data };
  });
  const { categoryName, categorySlug, ...componentFields } = component;
  return { ...componentFields, category: { categoryId: component.categoryId, name: categoryName, slug: categorySlug, breadcrumb }, content: sections, diagrams, specifications };
}
async function componentBySlug(slug) {
  const [row] = await query('SELECT component_id AS componentId FROM components WHERE slug=? AND is_published=1', [slug]);
  return row ? componentById(row.componentId) : null;
}
async function componentsByCategory(categoryId, { page = 1, pageSize = 20 } = {}) {
  const offset = (page - 1) * pageSize;
  const [items, count] = await Promise.all([
    query(`${componentSelect} WHERE c.category_id=? AND c.is_published=1 ORDER BY c.name LIMIT ? OFFSET ?`, [categoryId, pageSize, offset]),
    query('SELECT COUNT(*) AS total FROM components WHERE category_id=? AND is_published=1', [categoryId])
  ]);
  return { items, page, pageSize, total: Number(count[0]?.total || 0) };
}
async function search({ q = '', page = 1, pageSize = 12 }) {
  const term = `%${q.trim()}%`, offset = (page - 1) * pageSize;
  const filter = q.trim() ? ` AND (c.name LIKE ? OR c.short_description LIKE ? OR cat.name LIKE ? OR EXISTS
    (SELECT 1 FROM component_tags component_tag JOIN tags tag ON tag.tag_id=component_tag.tag_id
     WHERE component_tag.component_id=c.component_id AND tag.name LIKE ?))` : '';
  const args = q.trim() ? [term, term, term, term] : [];
  const [items, count] = await Promise.all([
    query(`${componentSelect} WHERE c.is_published=1${filter} ORDER BY c.name LIMIT ? OFFSET ?`, [...args, pageSize, offset]),
    query(`SELECT COUNT(*) AS total FROM components c JOIN categories cat ON cat.category_id=c.category_id WHERE c.is_published=1${filter}`, args)
  ]);
  return { items, page, pageSize, total: Number(count[0]?.total || 0), query: q.trim() };
}
module.exports = { categories, categoryById, categoryBySlug, componentById, componentBySlug, componentsByCategory, search };
