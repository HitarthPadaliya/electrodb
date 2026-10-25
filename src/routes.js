const fs = require('fs');
const path = require('path');
const express = require('express');
const { config } = require('./config');
const { adminService, authService, catalogueService, contentService, labService, personalService } = require('./services');
const { roles, tokens } = require('./security');
const { pool } = require('./db');
const { unauthorized, forbidden, tooManyRequests } = require('./errors');

function readToken(req) {
  const cookies = tokens.parseCookies(req.headers.cookie);
  return cookies[tokens.cookieName()] || null;
}

async function attachUser(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return next();

    const found = await authService.resolveSession(token);
    if (!found) {
            res.setHeader('Set-Cookie', tokens.clearSessionCookie(tokens.cookieAttributesFor(req)));
      return next();
    }

    req.authToken = token;
    req.session = found.session;
    req.user = authService.publicUser(found.user);
    await authService.touchSession(found.session);
    next();
  } catch (err) {
    next(err);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return next(unauthorized('Sign in to continue.', 'AUTH_REQUIRED'));
  }
  next();
}

function requireRole(...allowed) {
  const permitted = allowed.flat();
  return (req, res, next) => {
    if (!req.user) return next(unauthorized('Sign in to continue.', 'AUTH_REQUIRED'));
    if (!roles.hasRole(req.user, permitted)) {
      return next(forbidden('Your account does not have access to this resource.', 'ROLE_REQUIRED'));
    }
    next();
  };
}

const requireContentAuthor = requireRole(roles.CONTENT_ROLES);
const requireAdmin = requireRole(roles.ADMIN_ROLES);

function requireSameOrigin(req, res, next) {
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safeMethod) return next();

          const fetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (fetchSite) {
    if (['same-origin', 'same-site', 'none'].includes(fetchSite)) return next();
    return next(forbidden('Cross-site request rejected.', 'CSRF_BLOCKED'));
  }

  const origin = req.headers.origin;
  if (origin) {
    let originHost = null;
    try {
      originHost = new URL(origin).host;
    } catch (err) {
      originHost = null;
    }

    if (!originHost || !acceptableHosts(req).has(originHost)) {
      return next(forbidden('Cross-site request rejected.', 'CSRF_BLOCKED'));
    }
  }

  next();
}

function acceptableHosts(req) {
  const hosts = new Set();
  const add = value => {
    if (!value) return;
    const text = String(value).split(',')[0].trim();
    if (!text) return;
    try {
      hosts.add(new URL(text.includes('://') ? text : `http://${text}`).host);
    } catch (err) {
          }
  };

  add(req.headers.host);
  add(req.headers['x-forwarded-host']);
  add(config.publicBaseUrl);
  return hosts;
}

const buckets = new Map();

function rateLimit({ name, windowMs = 15 * 60 * 1000, max = 10, key = req => req.ip || 'unknown' }) {
  return (req, res, next) => {
    const bucketKey = `${name}:${key(req)}`;
    const now = Date.now();
    const entries = (buckets.get(bucketKey) || []).filter(ts => now - ts < windowMs);

    if (entries.length >= max) {
      const retryAfter = Math.ceil((windowMs - (now - entries[0])) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
      buckets.set(bucketKey, entries);
      return next(tooManyRequests('Too many attempts. Try again in a few minutes.', retryAfter));
    }

    entries.push(now);
    buckets.set(bucketKey, entries);

    if (buckets.size > 5000) {
      for (const [bucketName, timestamps] of buckets) {
        if (!timestamps.some(ts => now - ts < windowMs)) buckets.delete(bucketName);
      }
    }

    next();
  };
}

function resetRateLimits() {
  buckets.clear();
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function listUsers(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await adminService.listAccounts(req.query) });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await adminService.getAccount(req.params.userId) });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    res.status(201).json({ data: await adminService.createAccount(req.body || {}) });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    res.json({ data: await adminService.updateAccount(req.user, req.params.userId, req.body || {}) });
  } catch (err) {
    next(err);
  }
}

const COOKIE_MAX_AGE = config.session.ttlHours * 60 * 60;

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body || {});
    res.setHeader(
      'Set-Cookie',
      tokens.serializeSessionCookie(result.token, COOKIE_MAX_AGE, tokens.cookieAttributesFor(req))
    );
    noStore(res);
    res.status(201).json({
      data: {
        user: result.user,
        bookmarkIds: [],
        message: 'Welcome to ElectroDB.'
      }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body || {});
    res.setHeader(
      'Set-Cookie',
      tokens.serializeSessionCookie(result.token, COOKIE_MAX_AGE, tokens.cookieAttributesFor(req))
    );
    noStore(res);
    const bookmarkIds = await personalService.bookmarkIds(result.user.userId);
    res.json({ data: { user: result.user, bookmarkIds } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
            await authService.logout(req.authToken || tokens.parseCookies(req.headers.cookie)[tokens.cookieName()]);
    res.setHeader('Set-Cookie', tokens.clearSessionCookie(tokens.cookieAttributesFor(req)));
    noStore(res);
    res.json({ data: { signedOut: true } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    noStore(res);
    if (!req.user) return res.json({ data: { user: null, bookmarkIds: [] } });
    const bookmarkIds = await personalService.bookmarkIds(req.user.userId);
    res.json({ data: { user: req.user, bookmarkIds } });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.userId, req.body || {});
            await authService.logoutEverywhere(req.user.userId, req.authToken);
    noStore(res);
    res.json({ data: { updated: true, message: 'Password changed. Other sessions were signed out.' } });
  } catch (err) {
    next(err);
  }
}

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

async function getStats(req, res, next) {
  try {
    const stats = await catalogueService.getStats();
    res.json({ data: stats });
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

async function getCatalog(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '24', 10);

    let categoryId = null;
    if (req.query.categoryId !== undefined && req.query.categoryId !== '') {
      categoryId = parseInt(req.query.categoryId, 10);
      if (!Number.isInteger(categoryId) || categoryId < 1) {
        const error = new Error('categoryId must be a positive integer');
        error.statusCode = 400;
        throw error;
      }
    }

    const catalog = await catalogueService.getCatalog({ page, pageSize, categoryId });
    res.json({ data: catalog });
  } catch (err) {
    next(err);
  }
}

async function getTags(req, res, next) {
  try {
    const tags = await catalogueService.getTags();
    res.json({ data: tags });
  } catch (err) {
    next(err);
  }
}

async function getTag(req, res, next) {
  try {
    const { tagId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '24', 10);

    const tag = await catalogueService.getTagDetail(tagId, { page, pageSize });
    res.json({ data: tag });
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

async function getSubquery(req, res, next) {
  try {
    const kind = req.query.kind || 'categories_in_digital';
    const result = await labService.getQuery6Subquery(kind);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getCorrelated(req, res, next) {
  try {
    const kind = req.query.kind || 'categories_with_components';
    const result = await labService.getQuery7Correlated(kind);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

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

async function getSum(req, res, next) {
  try {
    const result = await labService.getSumMetrics();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

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

async function getAuditLogs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await labService.listAuditLogs(limit);
    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
}

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

async function getLabDashboard(req, res, next) {
  try {
    const stats = await labService.getLabDashboard();
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

async function getTimingReport(req, res, next) {
  try {
    const reportPath = path.resolve(__dirname, '../database/10_query_timing_results.md');
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

async function getProfile(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: { user: req.user } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.userId, req.body || {});
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}

async function listBookmarks(req, res, next) {
  try {
    const result = await personalService.listBookmarks(req.user.userId, req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function bookmarkIds(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: { ids: await personalService.bookmarkIds(req.user.userId) } });
  } catch (err) {
    next(err);
  }
}

async function addBookmark(req, res, next) {
  try {
    const componentId = req.body && req.body.componentId !== undefined ? req.body.componentId : req.params.componentId;
    const result = await personalService.addBookmark(req.user.userId, componentId);
    res.status(result.created ? 201 : 200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function removeBookmark(req, res, next) {
  try {
    const result = await personalService.removeBookmark(req.user.userId, req.params.componentId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function listCollections(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await personalService.listCollections(req.user.userId) });
  } catch (err) {
    next(err);
  }
}

async function createCollection(req, res, next) {
  try {
    const collection = await personalService.createCollection(req.user.userId, req.body || {});
    res.status(201).json({ data: collection });
  } catch (err) {
    next(err);
  }
}

async function getCollection(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await personalService.getCollection(req.user.userId, req.params.collectionId) });
  } catch (err) {
    next(err);
  }
}

async function updateCollection(req, res, next) {
  try {
    const collection = await personalService.updateCollection(req.user.userId, req.params.collectionId, req.body || {});
    res.json({ data: collection });
  } catch (err) {
    next(err);
  }
}

async function deleteCollection(req, res, next) {
  try {
    const result = await personalService.deleteCollection(req.user.userId, req.params.collectionId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function addCollectionItem(req, res, next) {
  try {
    const componentId = req.body && req.body.componentId !== undefined ? req.body.componentId : req.params.componentId;
    const result = await personalService.addCollectionItem(
      req.user.userId,
      req.params.collectionId,
      componentId
    );
    res.status(result.created ? 201 : 200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function removeCollectionItem(req, res, next) {
  try {
    const result = await personalService.removeCollectionItem(
      req.user.userId,
      req.params.collectionId,
      req.params.componentId
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function listRecent(req, res, next) {
  try {
    const limit = Number(req.query.limit) || personalService.RECENT_LIMIT;
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await personalService.listRecent(req.user.userId, limit) });
  } catch (err) {
    next(err);
  }
}

async function recordRecent(req, res, next) {
  try {
    const componentId = req.body && req.body.componentId !== undefined ? req.body.componentId : req.params.componentId;
            const result = await personalService.recordView(req.user.userId, componentId);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function clearRecent(req, res, next) {
  try {
    res.json({ data: await personalService.clearRecent(req.user.userId) });
  } catch (err) {
    next(err);
  }
}

async function dashboard(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await personalService.getDashboard(req.user) });
  } catch (err) {
    next(err);
  }
}

const authRouter = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();
const catalogueRouter = express.Router();
const contentRouter = express.Router();
const labRouter = express.Router();

const loginLimit = rateLimit({ name: 'login', windowMs: 15 * 60 * 1000, max: 10 });
const registerLimit = rateLimit({ name: 'register', windowMs: 60 * 60 * 1000, max: 20 });
const passwordLimit = rateLimit({ name: 'change-password', windowMs: 15 * 60 * 1000, max: 10 });

authRouter.post('/register', requireSameOrigin, registerLimit, asyncHandler(register));
authRouter.post('/login', requireSameOrigin, loginLimit, asyncHandler(login));
authRouter.post('/logout', requireSameOrigin, asyncHandler(logout));
authRouter.get('/me', asyncHandler(me));
authRouter.post(
  '/change-password',
  requireSameOrigin,
  requireAuth,
  passwordLimit,
  asyncHandler(changePassword)
);

userRouter.use(requireAuth);
userRouter.use(requireSameOrigin);

userRouter.get('/me', asyncHandler(getProfile));
userRouter.patch('/me', asyncHandler(updateProfile));

userRouter.get('/me/bookmarks', asyncHandler(listBookmarks));
userRouter.get('/me/bookmark-ids', asyncHandler(bookmarkIds));
userRouter.post('/me/bookmarks', asyncHandler(addBookmark));
userRouter.delete('/me/bookmarks/:componentId', asyncHandler(removeBookmark));

userRouter.get('/me/collections', asyncHandler(listCollections));
userRouter.post('/me/collections', asyncHandler(createCollection));
userRouter.get('/me/collections/:collectionId', asyncHandler(getCollection));
userRouter.patch('/me/collections/:collectionId', asyncHandler(updateCollection));
userRouter.delete('/me/collections/:collectionId', asyncHandler(deleteCollection));
userRouter.post('/me/collections/:collectionId/components', asyncHandler(addCollectionItem));
userRouter.delete(
  '/me/collections/:collectionId/components/:componentId',
  asyncHandler(removeCollectionItem)
);

userRouter.get('/me/recently-viewed', asyncHandler(listRecent));
userRouter.post('/me/recently-viewed', asyncHandler(recordRecent));
userRouter.delete('/me/recently-viewed', asyncHandler(clearRecent));

userRouter.get('/me/dashboard', asyncHandler(dashboard));

adminRouter.use(requireAdmin);
adminRouter.use(requireSameOrigin);

adminRouter.get('/users', asyncHandler(listUsers));
adminRouter.post('/users', asyncHandler(createUser));
adminRouter.get('/users/:userId', asyncHandler(getUser));
adminRouter.patch('/users/:userId', asyncHandler(updateUser));

catalogueRouter.get('/health', getHealth);
catalogueRouter.get('/stats', getStats);
catalogueRouter.get('/categories', getCategories);
catalogueRouter.get('/categories/:categoryId', getCategory);
catalogueRouter.get('/categories/:categoryId/components', getCategoryComponents);
catalogueRouter.get('/categories/:categoryId/content-template', getCategoryTemplate);
catalogueRouter.get('/components', getCatalog);
catalogueRouter.get('/components/:componentId', getComponent);
catalogueRouter.get('/tags', getTags);
catalogueRouter.get('/tags/:tagId', getTag);
catalogueRouter.get('/search', search);

contentRouter.use(requireSameOrigin);

contentRouter.post('/categories', requireAdmin, asyncHandler(async (req, res) => {
  res.status(201).json({ data: await contentService.createCategory(req.body || {}) });
}));
contentRouter.patch('/categories/:categoryId', requireAdmin, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.updateCategory(req.params.categoryId, req.body || {}) });
}));
contentRouter.delete('/categories/:categoryId', requireAdmin, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.deleteCategory(req.params.categoryId) });
}));

contentRouter.post('/tags', requireContentAuthor, asyncHandler(async (req, res) => {
  res.status(201).json({ data: await contentService.createTag(req.body || {}) });
}));
contentRouter.delete('/tags/:tagId', requireAdmin, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.deleteTag(req.params.tagId) });
}));

contentRouter.post('/components/:componentId/tags', requireContentAuthor, asyncHandler(async (req, res) => {
  const tagId = req.body && req.body.tagId;
  const result = await contentService.assignTag(req.params.componentId, tagId);
  res.status(result.created ? 201 : 200).json({ data: result });
}));
contentRouter.delete('/components/:componentId/tags/:tagId', requireContentAuthor, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.unassignTag(req.params.componentId, req.params.tagId) });
}));

labRouter.use(requireSameOrigin);
labRouter.use(requireAuth);
labRouter.use(requireContentAuthor);

labRouter.get('/components', getComponents);
labRouter.get('/components.xml', getComponentsXml);

labRouter.post('/components', createComponent);
labRouter.patch('/components/:id', updateComponent);
labRouter.delete('/components/:id', requireAdmin, deleteComponent);

labRouter.get('/aggregate', getAggregate);
labRouter.get('/aggregate.xml', getAggregateXml);

labRouter.get('/filter', getFilter);
labRouter.get('/filter.xml', getFilterXml);

labRouter.get('/join', getJoin);

labRouter.get('/subquery', getSubquery);

labRouter.get('/correlated-query', getCorrelated);

labRouter.get('/cursors/all', getCursorsAll);
labRouter.get('/cursors/limited', getCursorsLimited);

labRouter.get('/sum', getSum);

labRouter.get('/users', requireAdmin, getAppUsers);
labRouter.post('/users', requireAdmin, createAppUser);
labRouter.patch('/users/:id', requireAdmin, updateAppUser);
labRouter.delete('/users/:id', requireAdmin, deleteAppUser);

labRouter.get('/audit-log', getAuditLogs);

labRouter.get('/views/catalogue', getViewCatalogue);
labRouter.get('/views/counts', getViewCounts);

labRouter.get('/dashboard', getLabDashboard);

labRouter.get('/timing-report', getTimingReport);

module.exports = {
  authRouter,
  userRouter,
  adminRouter,
  catalogueRouter,
  contentRouter,
  labRouter,
  attachUser,
  requireAuth,
  requireRole,
  requireContentAuthor,
  requireAdmin,
  requireSameOrigin,
  rateLimit,
  resetRateLimits,
  asyncHandler,
  readToken
};
