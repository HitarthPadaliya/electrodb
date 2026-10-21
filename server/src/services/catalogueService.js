const repo = require('../db/repository');

/**
 * Get top-level categories with subcategories and component counts
 */
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

/**
 * Get category detail with breadcrumbs, subcategories, and components
 */
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

/**
 * Get category content template
 */
async function getCategoryTemplate(categoryId) {
  const templates = await repo.getCategoryContentTemplates(categoryId);
  return templates;
}

/**
 * Parse structured content payload (e.g. JSON tables)
 */
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

/**
 * Format component specifications
 */
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

/**
 * Get full component detail
 */
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

  // Format content sections
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

  // Format diagrams
  const diagrams = rawDiagrams.map(d => ({
    diagramId: d.diagram_id,
    title: d.title,
    imagePath: d.image_path,
    altText: d.alt_text,
    caption: d.caption,
    displayOrder: d.display_order
  }));

  // Format specifications
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
    specifications
  };
}

/**
 * Search components with pagination
 */
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

module.exports = {
  getCategoriesTree,
  getCategoryDetail,
  getCategoryTemplate,
  getComponentDetail,
  search
};
