const express = require('express');
const router = express.Router();
const catalogueController = require('../controllers/catalogueController');

router.get('/health', catalogueController.getHealth);
router.get('/categories', catalogueController.getCategories);
router.get('/categories/:categoryId', catalogueController.getCategory);
router.get('/categories/:categoryId/components', catalogueController.getCategoryComponents);
router.get('/categories/:categoryId/content-template', catalogueController.getCategoryTemplate);
router.get('/components', catalogueController.getCatalog);
router.get('/components/:componentId', catalogueController.getComponent);
router.get('/tags', catalogueController.getTags);
router.get('/tags/:tagId', catalogueController.getTag);
router.get('/search', catalogueController.search);

module.exports = router;
