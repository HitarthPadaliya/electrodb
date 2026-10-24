/**
 * Account administration (DBA only).
 *
 * The guards here are deliberately boring and explicit:
 *   - nobody may change their own role or disable their own account;
 *   - the last active DBA cannot be demoted or disabled;
 *   - a role change or a disable revokes that account's live sessions.
 *
 * The routes above this service already require the DBA role; these checks are
 * the second line of defence that survives a future refactor of the router.
 */
const { getStore } = require('../db/personalStore');
const roles = require('../security/roles');
const passwords = require('../security/passwords');
const authService = require('./authService');
const validators = require('../validators/personalValidators');
const { notFound, forbidden, conflict } = require('../errors');

async function listAccounts(query = {}) {
  const { page, pageSize, limit, offset } = validators.parsePagination(query, { defaultPageSize: 25 });
  const result = await getStore().users.list({ limit, offset, query: query.q || '' });
  return {
    items: result.items.map(user => ({
      ...user,
      role: roles.toApiRole(user.roleCode)
    })),
    pagination: {
      page,
      pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize))
    }
  };
}

async function getAccount(rawUserId) {
  const userId = validators.parseId(rawUserId, 'userId');
  const user = await getStore().users.findById(userId);
  if (!user) throw notFound('Account not found.');
  return { ...user, role: roles.toApiRole(user.roleCode) };
}

async function createAccount(body = {}) {
  const username = validators.validateUsername(body.username);
  const email = validators.validateEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  const strength = passwords.validatePasswordStrength(password);
  if (!strength.ok) throw conflict(strength.message, 'WEAK_PASSWORD');

  const roleCode = roles.toRoleCode(body.role) || roles.ROLE_TO_CODE[roles.ROLE.USER];
  const store = getStore();

  if (await store.users.findByEmail(email)) throw conflict('An account with that email address already exists.', 'EMAIL_TAKEN');
  if (await store.users.findByUsername(username)) throw conflict('That username is already taken.', 'USERNAME_TAKEN');

  const user = await store.users.create({
    username,
    email,
    passwordHash: await passwords.hashPassword(password),
    roleCode
  });

  return { ...user, role: roles.toApiRole(user.roleCode) };
}

async function updateAccount(actor, rawUserId, body = {}) {
  const userId = validators.parseId(rawUserId, 'userId');
  const store = getStore();

  const target = await store.users.findById(userId);
  if (!target) throw notFound('Account not found.');

  const patch = {};
  if (body.role !== undefined) {
    const roleCode = roles.toRoleCode(body.role);
    if (!roleCode) throw conflict('Unknown role. Use User, Developer or DBA.', 'INVALID_ROLE');
    patch.roleCode = roleCode;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw conflict('isActive must be true or false.', 'INVALID_STATUS');
    patch.isActive = body.isActive;
  }
  if (!Object.keys(patch).length) throw conflict('Send a role or an account status to change.', 'NOTHING_TO_UPDATE');

  if (actor && Number(actor.userId) === userId) {
    if (patch.roleCode && patch.roleCode !== target.roleCode) {
      throw forbidden('You cannot change your own role. Ask another DBA.', 'SELF_ROLE_CHANGE');
    }
    if (patch.isActive === false) {
      throw forbidden('You cannot disable your own account.', 'SELF_DEACTIVATION');
    }
  }

  // Never leave the installation without an administrator.
  const losingDba =
    target.roleCode === roles.ROLE_TO_CODE[roles.ROLE.DBA] &&
    ((patch.roleCode && patch.roleCode !== roles.ROLE_TO_CODE[roles.ROLE.DBA]) || patch.isActive === false);

  if (losingDba) {
    const remaining = await store.users.countActiveByRole(roles.ROLE_TO_CODE[roles.ROLE.DBA], userId);
    if (remaining === 0) {
      throw conflict('This is the last active DBA account. Promote another account first.', 'LAST_DBA');
    }
  }

  const updated = await store.users.setRoleAndStatus(userId, patch);
  if (!updated) throw notFound('Account not found.');

  // Privilege changes and disables take effect now, not when the cookie expires.
  const roleChanged = patch.roleCode !== undefined && patch.roleCode !== target.roleCode;
  if (roleChanged || patch.isActive === false) {
    await store.sessions.deleteForUser(userId);
  }

  return { ...updated, role: roles.toApiRole(updated.roleCode) };
}

module.exports = { listAccounts, getAccount, createAccount, updateAccount };
