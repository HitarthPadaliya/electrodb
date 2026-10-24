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

function serializeSessionCookie(token, maxAgeSeconds) {
  return serialize(cookieName(), token, maxAgeSeconds);
}

function clearSessionCookie() {
  return serialize(cookieName(), '', 0);
}

function serialize(name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];
  if (config.session.secureCookie) parts.push('Secure');
  return parts.join('; ');
}

module.exports = {
  createToken,
  hashToken,
  parseCookies,
  cookieName,
  serializeSessionCookie,
  clearSessionCookie
};
