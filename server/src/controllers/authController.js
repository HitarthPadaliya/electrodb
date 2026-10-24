/**
 * Authentication endpoints. Thin on purpose: validate, delegate, set or clear
 * the session cookie, answer. No password material ever leaves this module.
 */
const authService = require('../services/authService');
const personalService = require('../services/personalService');
const tokens = require('../security/tokens');
const config = require('../config');

const COOKIE_MAX_AGE = config.session.ttlHours * 60 * 60;

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body || {});
    res.setHeader('Set-Cookie', tokens.serializeSessionCookie(result.token, COOKIE_MAX_AGE));
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
    res.setHeader('Set-Cookie', tokens.serializeSessionCookie(result.token, COOKIE_MAX_AGE));
    noStore(res);
    const bookmarkIds = await personalService.bookmarkIds(result.user.userId);
    res.json({ data: { user: result.user, bookmarkIds } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // Clearing the cookie is not enough on its own: the row is deleted so the
    // token cannot be replayed from a copy of the cookie.
    await authService.logout(req.authToken || tokens.parseCookies(req.headers.cookie)[tokens.cookieName()]);
    res.setHeader('Set-Cookie', tokens.clearSessionCookie());
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
    // Every other session for this account is invalidated; the current one is
    // kept so the person who just changed their password is not signed out.
    await authService.logoutEverywhere(req.user.userId, req.authToken);
    noStore(res);
    res.json({ data: { updated: true, message: 'Password changed. Other sessions were signed out.' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, changePassword };
