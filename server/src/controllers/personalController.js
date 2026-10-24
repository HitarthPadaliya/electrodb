/**
 * The signed-in user's own data: profile, bookmarks, collections, recently
 * viewed and the dashboard. Every handler reads the owner id from `req.user`.
 */
const authService = require('../services/authService');
const personalService = require('../services/personalService');

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
    // Only ever records the caller's own history - there is no userId field to
    // tamper with.
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

module.exports = {
  getProfile,
  updateProfile,
  listBookmarks,
  bookmarkIds,
  addBookmark,
  removeBookmark,
  listCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
  addCollectionItem,
  removeCollectionItem,
  listRecent,
  recordRecent,
  clearRecent,
  dashboard
};
