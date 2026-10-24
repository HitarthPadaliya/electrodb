const fs = require('fs');
const path = require('path');
const labService = require('../services/labService');

// Query 1: Full-table display
async function getComponents(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '50', 10);
    const bounded = req.query.bounded !== 'false';
    const format = req.query.format || (req.path.endsWith('.xml') ? 'xml' : 'json');

    const result = await labService.getQuery1Components({ page, pageSize, bounded, format });
    if (format === 'xml') {
      res.header('Content-Type', 'application/xml');
      return res.send(result);
    }
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getComponentsXml(req, res, next) {
  req.query.format = 'xml';
  return getComponents(req, res, next);
}

// Stored Procedure CRUD
async function createComponent(req, res, next) {
  try {
    const result = await labService.createComponentViaSP(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function updateComponent(req, res, next) {
  try {
    const { id } = req.params;
    const result = await labService.updateComponentViaSP(id, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function deleteComponent(req, res, next) {
  try {
    const { id } = req.params;
    const result = await labService.deleteComponentViaSP(id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Query 3: Aggregate
async function getAggregate(req, res, next) {
  try {
    const table = req.query.table || 'components';
    const fn = (req.query.function || req.query.fn || 'COUNT').toUpperCase();
    const field = req.query.field || 'component_id';
    const format = req.query.format || (req.path.endsWith('.xml') ? 'xml' : 'json');

    const result = await labService.getQuery3Aggregate({ table, fn, field, format });
    if (format === 'xml') {
      res.header('Content-Type', 'application/xml');
      return res.send(result);
    }
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getAggregateXml(req, res, next) {
  req.query.format = 'xml';
  return getAggregate(req, res, next);
}

// Query 4: Filter
async function getFilter(req, res, next) {
  try {
    const table = req.query.table || 'components';
    const field = req.query.field || 'category_id';
    const operator = req.query.operator || req.query.op || 'eq';
    const value = req.query.value !== undefined ? req.query.value : '6';
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '50', 10);
    const format = req.query.format || (req.path.endsWith('.xml') ? 'xml' : 'json');

    const result = await labService.getQuery4Filter({ table, field, operator, value, page, pageSize, format });
    if (format === 'xml') {
      res.header('Content-Type', 'application/xml');
      return res.send(result);
    }
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getFilterXml(req, res, next) {
  req.query.format = 'xml';
  return getFilter(req, res, next);
}

// Query 5: Join
async function getJoin(req, res, next) {
  try {
    const left = req.query.left || 'components';
    const right = req.query.right || 'categories';
    const type = req.query.type || 'inner';
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '25', 10);

    const result = await labService.getQuery5Join({ left, right, type, page, pageSize });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Query 6: Subquery
async function getSubquery(req, res, next) {
  try {
    const kind = req.query.kind || 'categories_in_digital';
    const result = await labService.getQuery6Subquery(kind);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Query 7: Correlated Query
async function getCorrelated(req, res, next) {
  try {
    const kind = req.query.kind || 'categories_with_components';
    const result = await labService.getQuery7Correlated(kind);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Cursors (Assignment 10)
async function getCursorsAll(req, res, next) {
  try {
    const result = await labService.getCursorAll();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getCursorsLimited(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await labService.getCursorLimited(limit);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Sum routines (Assignment 10)
async function getSum(req, res, next) {
  try {
    const result = await labService.getSumMetrics();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// App Users (Assignment 10)
async function getAppUsers(req, res, next) {
  try {
    const users = await labService.listAppUsers();
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
}

async function createAppUser(req, res, next) {
  try {
    const result = await labService.createAppUserViaSP(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function updateAppUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await labService.updateAppUserViaSP(id, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function deleteAppUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await labService.deleteAppUserViaSP(id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Audit Logs
async function getAuditLogs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await labService.listAuditLogs(limit);
    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
}

// Views
async function getViewCatalogue(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '25', 10);
    const result = await labService.getViewCatalogueData({ page, pageSize });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getViewCounts(req, res, next) {
  try {
    const result = await labService.getViewCountsData();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Dashboard
async function getDashboard(req, res, next) {
  try {
    const stats = await labService.getDashboard();
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

// Timing Report
async function getTimingReport(req, res, next) {
  try {
    const reportPath = path.resolve(__dirname, '../../../database/10_query_timing_results.md');
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf8');
      res.json({ data: { report: content } });
    } else {
      res.json({
        data: {
          report: '# Query Timing Report\n\nRun `npm run benchmark` to record timings before and after indexes.'
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getComponents,
  getComponentsXml,
  createComponent,
  updateComponent,
  deleteComponent,
  getAggregate,
  getAggregateXml,
  getFilter,
  getFilterXml,
  getJoin,
  getSubquery,
  getCorrelated,
  getCursorsAll,
  getCursorsLimited,
  getSum,
  getAppUsers,
  createAppUser,
  updateAppUser,
  deleteAppUser,
  getAuditLogs,
  getViewCatalogue,
  getViewCounts,
  getDashboard,
  getTimingReport
};
