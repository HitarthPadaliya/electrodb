/**
 * Application roles.
 *
 * The database keeps the role names the schema was designed with
 * (NAIVE_USER / APP_DEVELOPER / DBA). The API and the UI speak in the three
 * application roles, so the mapping lives here and nowhere else.
 */

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

/** Roles allowed to author content (components, equations, tables, diagrams). */
const CONTENT_ROLES = [ROLE.DEVELOPER, ROLE.DBA];

/** Roles allowed to administer accounts, categories, roles and deletions. */
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

module.exports = {
  ROLE,
  ROLE_TO_CODE,
  CODE_TO_ROLE,
  CONTENT_ROLES,
  ADMIN_ROLES,
  toApiRole,
  toRoleCode,
  hasRole
};
