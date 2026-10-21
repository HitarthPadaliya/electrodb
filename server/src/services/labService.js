const repo = require('../db/repository');
const xmlSerializer = require('../serializers/xml');

// ----------------------------------------------------------------
// Assignment 10 Services
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Assignment 11 Services
// ----------------------------------------------------------------

/**
 * Query 1: Full-table display query (JSON or XML)
 */
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

/**
 * Query 3: Aggregate query (JSON or XML)
 */
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

/**
 * Query 4: Conditional query (JSON or XML)
 */
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

/**
 * Query 5: Join query
 */
async function getQuery5Join({ left = 'components', right = 'categories', type = 'inner', page = 1, pageSize = 25 }) {
  const offset = (page - 1) * pageSize;
  const result = await repo.executeDynamicJoin(left, right, type, { limit: pageSize, offset });
  return {
    queryId: 5,
    title: 'Query 5: Join Query',
    ...result
  };
}

/**
 * Query 6: Subquery
 */
async function getQuery6Subquery(kind) {
  const result = await repo.executeSubquery(kind);
  return {
    queryId: 6,
    title: 'Query 6: Subquery Across Tables',
    ...result
  };
}

/**
 * Query 7: Correlated subquery
 */
async function getQuery7Correlated(kind) {
  const result = await repo.executeCorrelatedQuery(kind);
  return {
    queryId: 7,
    title: 'Query 7: Correlated Subquery Across Tables',
    ...result
  };
}

/**
 * Views
 */
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

/**
 * Dashboard stats
 */
async function getDashboard() {
  const stats = await repo.getDashboardStats();
  return stats;
}

module.exports = {
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
  getDashboard
};
