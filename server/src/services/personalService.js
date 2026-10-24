/**
 * Bookmarks, collections, recently viewed and the dashboard.
 *
 * Every function takes the user id supplied by the authenticated session -
 * never one taken from the request body - which is what keeps one account's
 * private data out of another's reach.
 */
const { getStore } = require('../db/personalStore');
const validators = require('../validators/personalValidators');
const { notFound, conflict, badRequest } = require('../errors');

const RECENT_LIMIT = 8;

// ------------------------------------------------------------------ bookmarks
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
  // Idempotent on purpose: deleting something that is already gone is a
  // success for the caller's intent, and it never touches another user's row.
  return { componentId, bookmarked: false, removed };
}

// ---------------------------------------------------------------- collections
async function listCollections(userId) {
  const store = getStore();
  const [collections, bookmarkIdsList] = await Promise.all([store.collections.list(userId), store.bookmarks.ids(userId)]);
  return { items: collections, bookmarkedComponentIds: bookmarkIdsList };
}

async function getCollection(userId, rawCollectionId) {
  const collectionId = validators.parseId(rawCollectionId, 'collectionId');
  const store = getStore();
  const collection = await store.collections.find(userId, collectionId);
  // Another user's collection is reported as missing rather than forbidden, so
  // the endpoint cannot be used to discover which ids exist.
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

// ------------------------------------------------------------- recently viewed
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

// -------------------------------------------------------------------- dashboard
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

module.exports = {
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
