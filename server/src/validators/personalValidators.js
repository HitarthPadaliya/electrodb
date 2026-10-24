/**
 * Validation for everything account-shaped.
 *
 * Every rule here runs on the server. The forms in the browser repeat a few of
 * them for a nicer experience, but nothing in this file trusts the client.
 */

class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_FAILED';
    this.details = details;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,39}$/;

function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  // Lower-casing the whole address is what makes the uniqueness constraint
  // meaningful: Foo@Example.com and foo@example.com are the same mailbox.
  return value.trim().toLowerCase();
}

function requireString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') throw new ValidationError(`${field} is required.`, { field });
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ValidationError(`${field} is required.`, { field });
  if (trimmed.length > max) throw new ValidationError(`${field} must be ${max} characters or fewer.`, { field });
  return trimmed;
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email) throw new ValidationError('Email address is required.', { field: 'email' });
  if (email.length > 255) throw new ValidationError('Email address is too long.', { field: 'email' });
  if (!EMAIL_PATTERN.test(email)) throw new ValidationError('Enter a valid email address.', { field: 'email' });
  return email;
}

function validateUsername(value) {
  const username = requireString(value, 'Username', { min: 3, max: 40 });
  if (!USERNAME_PATTERN.test(username)) {
    throw new ValidationError(
      'Username must be 3-40 characters and use only letters, numbers, dots, underscores or hyphens.',
      { field: 'username' }
    );
  }
  return username;
}

function validateRegistration(body = {}) {
  const username = validateUsername(body.username);
  const email = validateEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const confirm =
    typeof body.confirmPassword === 'string'
      ? body.confirmPassword
      : typeof body.passwordConfirm === 'string'
        ? body.passwordConfirm
        : body.password_confirmation;

  const strength = require('../security/passwords').validatePasswordStrength(password);
  if (!strength.ok) throw new ValidationError(strength.message, { field: 'password' });

  if (confirm !== undefined && password !== confirm) {
    throw new ValidationError('Passwords do not match.', { field: 'confirmPassword' });
  }

  return { username, email, password };
}

function validateLogin(body = {}) {
  const email = normalizeEmail(body.email || body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email) throw new ValidationError('Email address is required.', { field: 'email' });
  if (!password) throw new ValidationError('Password is required.', { field: 'password' });
  return { email, password };
}

function validateProfileUpdate(body = {}) {
  const patch = {};
  if (body.username !== undefined) patch.username = validateUsername(body.username);
  if (body.email !== undefined) patch.email = validateEmail(body.email);
  if (!Object.keys(patch).length) {
    throw new ValidationError('Nothing to update. Send a username or an email address.');
  }
  // Anything else in the payload (role_code, is_active, password_hash, ...) is
  // deliberately ignored: a profile update can never change privileges.
  return patch;
}

function validatePasswordChange(body = {}) {
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword) throw new ValidationError('Current password is required.', { field: 'currentPassword' });

  const strength = require('../security/passwords').validatePasswordStrength(newPassword);
  if (!strength.ok) throw new ValidationError(strength.message, { field: 'newPassword' });
  if (currentPassword === newPassword) {
    throw new ValidationError('The new password must be different from the current one.', { field: 'newPassword' });
  }
  return { currentPassword, newPassword };
}

function validateCollectionInput(body = {}, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    out.name = requireString(body.name, 'Collection name', { min: 1, max: 80 });
  }
  if (body.description !== undefined) {
    if (body.description === null) out.description = null;
    else {
      const description = String(body.description).trim();
      if (description.length > 280) {
        throw new ValidationError('Description must be 280 characters or fewer.', { field: 'description' });
      }
      out.description = description || null;
    }
  }
  if (!Object.keys(out).length) throw new ValidationError('Nothing to update.');
  return out;
}

/** Route/query parameters are always strings; accept only positive integers. */
function parseId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ValidationError(`Invalid ${field}.`, { field });
  return id;
}

function parsePagination(query = {}, { defaultPageSize = 20, maxPageSize = 100 } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(query.pageSize) || defaultPageSize));
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

function validateRegistrationAllowedRole() {
  // Public registration can only ever create ordinary users. The role is not
  // read from the request at all - this helper exists to document that.
  return 'NAIVE_USER';
}

module.exports = {
  ValidationError,
  normalizeEmail,
  validateEmail,
  validateUsername,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateCollectionInput,
  validateRegistrationAllowedRole,
  parseId,
  parsePagination
};
