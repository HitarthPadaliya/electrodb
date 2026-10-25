const crypto = require('crypto');
const { config } = require('./config');

const ROLE = {
  USER: 'User',
  DEVELOPER: 'Developer',
  DBA: 'DBA'
};

const ROLE_TO_CODE = {
  [ROLE.USER]: 'NAIVE_USER',
  [ROLE.DEVELOPER]: 'APP_DEVELOPER',
  [ROLE.DBA]: 'DBA'
};

const CODE_TO_ROLE = {
  NAIVE_USER: ROLE.USER,
  APP_DEVELOPER: ROLE.DEVELOPER,
  DBA: ROLE.DBA
};

const CONTENT_ROLES = [ROLE.DEVELOPER, ROLE.DBA];

const ADMIN_ROLES = [ROLE.DBA];

function toApiRole(code) {
  return CODE_TO_ROLE[code] || ROLE.USER;
}

function toRoleCode(role) {
  if (!role) return null;
  const exact = ROLE_TO_CODE[role];
  if (exact) return exact;
  const normalised = String(role).trim().toUpperCase();
  const aliases = {
    USER: ROLE.USER,
    DEVELOPER: ROLE.DEVELOPER,
    DBA: ROLE.DBA,
    NAIVE_USER: ROLE.USER,
    APP_DEVELOPER: ROLE.DEVELOPER
  };
  const mapped = aliases[normalised];
  return mapped ? ROLE_TO_CODE[mapped] : null;
}

function hasRole(user, allowedRoles) {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };
const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 200;

function derive(password, salt, params) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      Buffer.from(password.normalize('NFKC'), 'utf8'),
      salt,
      params.keylen,
      { N: params.N, r: params.r, p: params.p, maxmem: params.maxmem },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
}

async function hashPassword(password) {
  const params = DEFAULT_PARAMS;
  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt, params);
  return [
    'scrypt',
    params.N,
    params.r,
    params.p,
    salt.toString('base64'),
    key.toString('base64')
  ].join('$');
}

async function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;

  const parts = stored.split('$');
  if (parts.length !== 6) return false;

  const [, n, r, p, saltB64, keyB64] = parts;
  const params = {
    ...DEFAULT_PARAMS,
    N: Number(n),
    r: Number(r),
    p: Number(p)
  };

  if (!Number.isInteger(params.N) || params.N < 1024 || params.N > 1048576) return false;
  if (!Number.isInteger(params.r) || params.r < 1 || params.r > 32) return false;
  if (!Number.isInteger(params.p) || params.p < 1 || params.p > 16) return false;

  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(keyB64, 'base64');
  if (!salt.length || !expected.length) return false;

  const key = await derive(password, salt, { ...params, keylen: expected.length });
  if (key.length !== expected.length) return false;
  return crypto.timingSafeEqual(key, expected);
}

async function dummyVerify() {
  await verifyPassword('not-the-real-password', await hashPassword('placeholder-value'));
  return false;
}

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, message: 'Password is required.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.` };
  }
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(re => re.test(password)).length;
  if (classes < 3) {
    return {
      ok: false,
      message: 'Password must include at least three of: lowercase letters, uppercase letters, digits, symbols.'
    };
  }
  return { ok: true };
}

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

function cookieAttributesFor(req) {
  const mode = config.session.sameSite;
  const https = isHttps(req);

  if (mode === 'none' || mode === 'auto') {
    if (https) return { sameSite: 'None', secure: true };
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

const roles = {
  ROLE,
  ROLE_TO_CODE,
  CODE_TO_ROLE,
  CONTENT_ROLES,
  ADMIN_ROLES,
  toApiRole,
  toRoleCode,
  hasRole
};

const passwords = {
  hashPassword,
  verifyPassword,
  dummyVerify,
  validatePasswordStrength,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH
};

const tokens = {
  createToken,
  hashToken,
  parseCookies,
  cookieName,
  isHttps,
  cookieAttributesFor,
  serializeSessionCookie,
  clearSessionCookie
};

module.exports = { roles, passwords, tokens };
