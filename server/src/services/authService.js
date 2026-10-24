/**
 * Authentication service.
 *
 * Owns the account lifecycle: registration, login, session resolution, logout
 * and password changes. Controllers never see a password hash and never decide
 * who a request belongs to - they ask this module.
 */
const crypto = require('crypto');
const config = require('../config');
const roles = require('../security/roles');
const passwords = require('../security/passwords');
const tokens = require('../security/tokens');
const { getStore } = require('../db/personalStore');
const { toDbDateTime, fromDbDateTime, nowPlus } = require('../utils/datetime');
const validators = require('../validators/personalValidators');
const { unauthorized, conflict, forbidden, badRequest, notFound } = require('../errors');

const SESSION_TTL_MS = config.session.ttlHours * 60 * 60 * 1000;

function publicUser(user) {
  if (!user) return null;
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: roles.toApiRole(user.roleCode),
    roleCode: user.roleCode,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    permissions: {
      canAuthorContent: roles.hasRole({ role: roles.toApiRole(user.roleCode) }, roles.CONTENT_ROLES),
      canAdminister: roles.hasRole({ role: roles.toApiRole(user.roleCode) }, roles.ADMIN_ROLES)
    }
  };
}

/** One session row, one cookie value; the caller decides where to put it. */
async function startSession(userId) {
  const store = getStore();
  const { token, hash } = tokens.createToken();
  const expiresAt = nowPlus(SESSION_TTL_MS);
  await store.sessions.create({ userId, tokenHash: hash, expiresAt });
  return { token, expiresAt };
}

async function register(body = {}) {
  const { username, email, password } = validators.validateRegistration(body);
  const store = getStore();

  const [byEmail, byUsername] = await Promise.all([
    store.users.findByEmail(email),
    store.users.findByUsername(username)
  ]);

  if (byEmail) throw conflict('An account with that email address already exists.', 'EMAIL_TAKEN');
  if (byUsername) throw conflict('That username is already taken.', 'USERNAME_TAKEN');

  const passwordHash = await passwords.hashPassword(password);

  // The role is fixed here, not read from the request: public registration can
  // only ever create an ordinary user.
  const user = await store.users.create({
    username,
    email,
    passwordHash,
    roleCode: validators.validateRegistrationAllowedRole()
  });

  await store.users.touchLogin(user.userId);
  const session = await startSession(user.userId);
  return { user: publicUser(user), ...session };
}

async function login(body = {}) {
  const { email, password } = validators.validateLogin(body);
  const store = getStore();

  const user = await store.users.findByEmail(email);
  if (!user) {
    // Same work, same generic answer: nothing here reveals whether the address
    // exists.
    await passwords.dummyVerify();
    throw unauthorized('Email address or password is incorrect.', 'INVALID_CREDENTIALS');
  }

  const hash = await store.users.passwordHash(user.userId);
  const ok = await passwords.verifyPassword(password, hash);
  if (!ok) throw unauthorized('Email address or password is incorrect.', 'INVALID_CREDENTIALS');

  if (!user.isActive) {
    throw forbidden('This account has been disabled. Contact an administrator.', 'ACCOUNT_DISABLED');
  }

  await store.users.touchLogin(user.userId);
  const session = await startSession(user.userId);
  return { user: publicUser(user), ...session };
}

/**
 * Resolve a cookie token into a live session. Returns null when the token is
 * unknown, expired, or belongs to an account that has been disabled.
 */
async function resolveSession(token) {
  if (!token) return null;
  const store = getStore();
  const hash = tokens.hashToken(token);
  const found = await store.sessions.findWithUser(hash);
  if (!found) return null;

  const expiry = fromDbDateTime(found.session.expiresAt);
  if (!expiry || expiry.getTime() <= Date.now()) {
    await store.sessions.deleteByTokenHash(hash);
    return null;
  }

  if (!found.user.isActive) {
    // A disabled account loses its sessions immediately rather than keeping a
    // usable cookie until it happens to expire.
    await store.sessions.deleteForUser(found.user.userId);
    return null;
  }

  return { session: found.session, user: found.user, tokenHash: hash };
}

async function touchSession(session) {
  const store = getStore();
  const lastSeen = fromDbDateTime(session.lastSeenAt);
  const stale = !lastSeen || Date.now() - lastSeen.getTime() > 60 * 60 * 1000;
  if (!stale) return;
  await store.sessions.touch(session.sessionId, {
    lastSeenAt: toDbDateTime(Date.now()),
    expiresAt: nowPlus(SESSION_TTL_MS)
  });
}

async function logout(token) {
  if (!token) return;
  await getStore().sessions.deleteByTokenHash(tokens.hashToken(token));
}

async function logoutEverywhere(userId, keepToken) {
  const keepTokenHash = keepToken ? tokens.hashToken(keepToken) : null;
  await getStore().sessions.deleteForUser(userId, { keepTokenHash });
}

async function changePassword(userId, body = {}) {
  const { currentPassword, newPassword } = validators.validatePasswordChange(body);
  const store = getStore();

  const user = await store.users.findById(userId);
  if (!user) throw notFound('Account not found.');

  const hash = await store.users.passwordHash(userId);
  const ok = await passwords.verifyPassword(currentPassword, hash);
  if (!ok) throw unauthorized('Current password is incorrect.', 'INVALID_CREDENTIALS');

  await store.users.updatePassword(userId, await passwords.hashPassword(newPassword));
  return true;
}

async function updateProfile(userId, body = {}) {
  const patch = validators.validateProfileUpdate(body);
  const store = getStore();

  if (patch.email) {
    const existing = await store.users.findByEmail(patch.email);
    if (existing && existing.userId !== Number(userId)) {
      throw conflict('An account with that email address already exists.', 'EMAIL_TAKEN');
    }
  }
  if (patch.username) {
    const existing = await store.users.findByUsername(patch.username);
    if (existing && existing.userId !== Number(userId)) {
      throw conflict('That username is already taken.', 'USERNAME_TAKEN');
    }
  }

  const updated = await store.users.updateProfile(userId, patch);
  if (!updated) throw notFound('Account not found.');
  return publicUser(updated);
}

async function getUser(userId) {
  const user = await getStore().users.findById(userId);
  if (!user) throw notFound('Account not found.');
  return publicUser(user);
}

/** Used by the DBA bootstrap script and by the admin API. */
function bootstrapPasswordHash(password) {
  const strength = passwords.validatePasswordStrength(password);
  if (!strength.ok) throw badRequest(strength.message);
  return passwords.hashPassword(password);
}

module.exports = {
  register,
  login,
  logout,
  logoutEverywhere,
  resolveSession,
  touchSession,
  changePassword,
  updateProfile,
  getUser,
  publicUser,
  bootstrapPasswordHash,
  startSession,
  SESSION_TTL_MS,
  randomToken: () => crypto.randomBytes(16).toString('hex')
};
