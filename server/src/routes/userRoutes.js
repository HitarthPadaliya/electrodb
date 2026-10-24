/**
 * Routes for the signed-in user's own data. The `requireAuth` at the top is the
 * only way these handlers are ever reached.
 */
const express = require('express');
const router = express.Router();
const controller = require('../controllers/personalController');
const { requireAuth, requireSameOrigin, asyncHandler } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireSameOrigin);

router.get('/me', asyncHandler(controller.getProfile));
router.patch('/me', asyncHandler(controller.updateProfile));

router.get('/me/bookmarks', asyncHandler(controller.listBookmarks));
router.get('/me/bookmark-ids', asyncHandler(controller.bookmarkIds));
router.post('/me/bookmarks', asyncHandler(controller.addBookmark));
router.delete('/me/bookmarks/:componentId', asyncHandler(controller.removeBookmark));

router.get('/me/collections', asyncHandler(controller.listCollections));
router.post('/me/collections', asyncHandler(controller.createCollection));
router.get('/me/collections/:collectionId', asyncHandler(controller.getCollection));
router.patch('/me/collections/:collectionId', asyncHandler(controller.updateCollection));
router.delete('/me/collections/:collectionId', asyncHandler(controller.deleteCollection));
router.post('/me/collections/:collectionId/components', asyncHandler(controller.addCollectionItem));
router.delete(
  '/me/collections/:collectionId/components/:componentId',
  asyncHandler(controller.removeCollectionItem)
);

router.get('/me/recently-viewed', asyncHandler(controller.listRecent));
router.post('/me/recently-viewed', asyncHandler(controller.recordRecent));
router.delete('/me/recently-viewed', asyncHandler(controller.clearRecent));

router.get('/me/dashboard', asyncHandler(controller.dashboard));

module.exports = router;
