/**
 * Account administration. DBA only, enforced here and again in the service.
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin, requireSameOrigin, asyncHandler } = require('../middleware/auth');

router.use(requireAdmin);
router.use(requireSameOrigin);

router.get('/users', asyncHandler(adminController.listUsers));
router.post('/users', asyncHandler(adminController.createUser));
router.get('/users/:userId', asyncHandler(adminController.getUser));
router.patch('/users/:userId', asyncHandler(adminController.updateUser));

module.exports = router;
