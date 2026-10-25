/**
 * Authentication and authorization middleware.
 *
 * Identity always comes from the session cookie, resolved against the
 * database. Nothing downstream may accept a user id or a role from the request
 * body, the query string or a header.
 */
const tokens = require('../security/tokens');
const roles = require('../security/roles');
const authService = require('../services/authService');
const config = require('../config');
const { unauthorized, forbidden, tooManyRequests } = require('../errors');

function readToken(req) {
  const cookies = tokens.parseCookies(req.headers.cookie);
  return cookies[tokens.cookieName()] || null;
}

/**
 * Optional authentication: populates req.user when a valid session exists and
 * does nothing when it does not. Public catalogue routes use this so a signed-in
 * user can see their own bookmark state on otherwise public pages.
 */
async function attachUser(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return next();

    const found = await authService.resolveSession(token);
    if (!found) {
      // Expired or revoked: drop the stale cookie so the browser stops sending it.
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

/** `requireRole('DBA')`, `requireRole('Developer', 'DBA')`, ... */
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

/**
 * CSRF defence for cookie-authenticated writes.
 *
 * The session cookie is SameSite=Lax, and this check adds a second lock: a
 * state-changing request must come from the same origin, as reported by the
 * browser in `Origin` / `Sec-Fetch-Site`. Requests made by tools (curl, the
 * test suite) simply have no Origin header and are still authenticated by the
 * session cookie.
 */
function requireSameOrigin(req, res, next) {
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safeMethod) return next();

  // Sec-Fetch-Site is set by the browser and cannot be forged by page script,
  // so when it is present it is the most reliable answer available. It also
  // survives a reverse proxy that rewrites Host, where comparing Origin to Host
  // would reject perfectly legitimate requests.
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

/**
 * The hosts a same-origin request may legitimately report.
 *
 * Normally that is just the Host header. Behind a reverse proxy that rewrites
 * Host (the preview environment does), the browser's Origin still names the
 * public host, so X-Forwarded-Host and PUBLIC_BASE_URL have to be admitted too.
 * A cross-site attacker controls neither, so this stays a same-origin check.
 */
function acceptableHosts(req) {
  const hosts = new Set();
  const add = value => {
    if (!value) return;
    const text = String(value).split(',')[0].trim();
    if (!text) return;
    try {
      hosts.add(new URL(text.includes('://') ? text : `http://${text}`).host);
    } catch (err) {
      /* ignore an unparseable value */
    }
  };

  add(req.headers.host);
  add(req.headers['x-forwarded-host']);
  add(config.publicBaseUrl);
  return hosts;
}

/**
 * Small fixed-window limiter. Enough to make credential stuffing pointless on a
 * single-instance deployment without dragging in a dependency; a multi-instance
 * deployment would move this to the shared cache instead.
 */
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

/** Test helper: forget every rate-limit window. */
function resetRateLimits() {
  buckets.clear();
}

/** Wrap an async controller so rejected promises reach the error handler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = {
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
