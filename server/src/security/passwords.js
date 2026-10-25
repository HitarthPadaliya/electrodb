/**
 * Password hashing.
 *
 * Uses scrypt from Node's standard library: a memory-hard KDF (RFC 7914) that
 * is on OWASP's short list of acceptable password hashes, needs no native
 * module and adds no dependency to the project. The stored value carries the
 * parameters and the per-user salt, so the cost can be raised later without
 * invalidating existing accounts:
 *
 *   scrypt$N$r$p$<salt base64>$<derived key base64>
 *
 * Plaintext passwords are never stored, logged or returned by the API.
 */
const crypto = require('crypto');

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

/**
 * Burn roughly the same time as a real verification. Used when the account does
 * not exist so that a missing email and a wrong password look alike.
 */
async function dummyVerify() {
  await verifyPassword('not-the-real-password', await hashPassword('placeholder-value'));
  return false;
}

/**
 * Password policy: length first, then a small amount of variety. Deliberately
 * simple and explained in the validation message - the point is to make weak
 * passwords impossible, not to reject passphrases.
 */
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

module.exports = {
  hashPassword,
  verifyPassword,
  dummyVerify,
  validatePasswordStrength,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH
};
