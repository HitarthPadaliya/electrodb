const pool = require('../db/pool');
const catalogueService = require('../services/catalogueService');

async function getHealth(req, res, next) {
  try {
    const health = await pool.checkHealth();
    res.json({
      status: 'ok',
      service: 'ElectroDB API',
      database: 'connected',
      details: health
    });
  } catch (err) {
    next(err);
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await catalogueService.getCategoriesTree();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);

    const categoryData = await catalogueService.getCategoryDetail(categoryId, { page, pageSize });
    res.json({ data: categoryData });
  } catch (err) {
    next(err);
  }
}

async function getCategoryComponents(req, res, next) {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);

    const categoryData = await catalogueService.getCategoryDetail(categoryId, { page, pageSize });
    res.json({
      data: categoryData.components,
      pagination: categoryData.pagination
    });
  } catch (err) {
    next(err);
  }
}

async function getCategoryTemplate(req, res, next) {
  try {
    const { categoryId } = req.params;
    const template = await catalogueService.getCategoryTemplate(categoryId);
    res.json({ data: template });
  } catch (err) {
    next(err);
  }
}

async function getComponent(req, res, next) {
  try {
    const { componentId } = req.params;
    const component = await catalogueService.getComponentDetail(componentId);
    res.json({ data: component });
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const q = req.query.q || '';
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);

    const results = await catalogueService.search(q, { page, pageSize });
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHealth,
  getCategories,
  getCategory,
  getCategoryComponents,
  getCategoryTemplate,
  getComponent,
  search
};
