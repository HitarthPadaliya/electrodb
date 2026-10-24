const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireSameOrigin, rateLimit, asyncHandler } = require('../middleware/auth');

// Credential endpoints are rate-limited per IP and refuse cross-site posts.
const loginLimit = rateLimit({ name: 'login', windowMs: 15 * 60 * 1000, max: 10 });
const registerLimit = rateLimit({ name: 'register', windowMs: 60 * 60 * 1000, max: 20 });
const passwordLimit = rateLimit({ name: 'change-password', windowMs: 15 * 60 * 1000, max: 10 });

router.post('/register', requireSameOrigin, registerLimit, asyncHandler(authController.register));
router.post('/login', requireSameOrigin, loginLimit, asyncHandler(authController.login));
router.post('/logout', requireSameOrigin, asyncHandler(authController.logout));
router.get('/me', asyncHandler(authController.me));
router.post(
  '/change-password',
  requireSameOrigin,
  requireAuth,
  passwordLimit,
  asyncHandler(authController.changePassword)
);

module.exports = router;
