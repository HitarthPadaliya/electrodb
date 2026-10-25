/**
 * Session tokens and cookie plumbing.
 *
 * The cookie carries a random, high-entropy token. The database only ever sees
 * a SHA-256 digest of it, so a leaked database dump cannot be replayed as a
 * live session. Cookies are HttpOnly + SameSite=Lax (and Secure in
 * production), which keeps the token out of reach of scripts on the page.
 */
const crypto = require('crypto');
const config = require('../config');

const TOKEN_BYTES = 32;

function createToken() {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, hash: hashToken(token) };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function parseCookies(header) {
  const jar = {};
  if (!header) return jar;
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const name = part.slice(0, index).trim();
    if (!name) continue;
    const value = part.slice(index + 1).trim();
    try {
      jar[name] = decodeURIComponent(value);
    } catch (err) {
      jar[name] = value;
    }
  }
  return jar;
}

function cookieName() {
  return config.session.cookieName;
}

/**
 * Was this request made over HTTPS?
 *
 * Behind a reverse proxy the connection to Node is plain HTTP, so the scheme
 * has to come from the proxy: X-Forwarded-Proto when it sets one, otherwise the
 * browser's own Origin/Referer, which a proxy cannot strip by accident. A
 * caller who spoofs this only succeeds in making their own cookie Secure, which
 * costs them nothing and gains them nothing.
 */
function isHttps(req) {
  if (!req) return false;
  if (req.secure) return true;

  const forwarded = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  if (forwarded === 'https') return true;

  const origin = String(req.headers.origin || '');
  if (origin.startsWith('https://')) return true;

  const referer = String(req.headers.referer || '');
  return referer.startsWith('https://');
}

/**
 * Cookie flags for one request.
 *
 * `SameSite=Lax` is right for a site the visitor opens directly, and it is the
 * default. It is, however, not sent at all when the page is embedded in another
 * origin - and then a perfectly good sign-in produces a session the browser
 * never hands back, which looks exactly like being signed out a second after
 * signing in. For an embedded deployment the cookie has to be
 * `SameSite=None`, which browsers only honour together with `Secure`, so this
 * is decided per request from the connection's protocol.
 *
 * CSRF protection does not rest on this flag alone: every state-changing
 * request also passes the same-origin check in middleware/auth.js.
 */
function cookieAttributesFor(req) {
  const mode = config.session.sameSite;
  const https = isHttps(req);

  if (mode === 'none' || mode === 'auto') {
    if (https) return { sameSite: 'None', secure: true };
    // Over plain HTTP a Secure cookie is dropped by the browser, so there is
    // nothing to gain from None here.
    return { sameSite: 'Lax', secure: false };
  }

  return {
    sameSite: mode === 'strict' ? 'Strict' : 'Lax',
    secure: config.session.secureCookie
  };
}

function serializeSessionCookie(token, maxAgeSeconds, attributes) {
  return serialize(cookieName(), token, maxAgeSeconds, attributes);
}

function clearSessionCookie(attributes) {
  return serialize(cookieName(), '', 0, attributes);
}

function serialize(name, value, maxAgeSeconds, attributes = {}) {
  const sameSite = attributes.sameSite || 'Lax';
  const secure = attributes.secure !== undefined ? attributes.secure : config.session.secureCookie;

  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

module.exports = {
  createToken,
  hashToken,
  parseCookies,
  cookieName,
  cookieAttributesFor,
  isHttps,
  serializeSessionCookie,
  clearSessionCookie
};
