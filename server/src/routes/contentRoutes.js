/**
 * Content-management endpoints for the structural parts of the catalogue.
 *
 * Roles follow the authorization matrix: categories are DBA territory, tags and
 * tag assignment are shared by Developer and DBA.
 */
const express = require('express');
const router = express.Router();
const contentService = require('../services/contentService');
const { requireAdmin, requireContentAuthor, requireSameOrigin, asyncHandler } = require('../middleware/auth');

router.use(requireSameOrigin);

// Categories - DBA only
router.post('/categories', requireAdmin, asyncHandler(async (req, res) => {
  res.status(201).json({ data: await contentService.createCategory(req.body || {}) });
}));
router.patch('/categories/:categoryId', requireAdmin, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.updateCategory(req.params.categoryId, req.body || {}) });
}));
router.delete('/categories/:categoryId', requireAdmin, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.deleteCategory(req.params.categoryId) });
}));

// Tags - Developer and DBA
router.post('/tags', requireContentAuthor, asyncHandler(async (req, res) => {
  res.status(201).json({ data: await contentService.createTag(req.body || {}) });
}));
router.delete('/tags/:tagId', requireAdmin, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.deleteTag(req.params.tagId) });
}));

// Tag assignment on a component - Developer and DBA
router.post('/components/:componentId/tags', requireContentAuthor, asyncHandler(async (req, res) => {
  const tagId = req.body && req.body.tagId;
  const result = await contentService.assignTag(req.params.componentId, tagId);
  res.status(result.created ? 201 : 200).json({ data: result });
}));
router.delete('/components/:componentId/tags/:tagId', requireContentAuthor, asyncHandler(async (req, res) => {
  res.json({ data: await contentService.unassignTag(req.params.componentId, req.params.tagId) });
}));

module.exports = router;
