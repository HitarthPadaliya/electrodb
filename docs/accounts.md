# Accounts, authorization and personalization

This document covers the user system added on top of the existing catalogue: what it stores, how
it authenticates, which rules are enforced where, and how the pieces are tested. It is deliberately
honest about the gaps at the end.

Nothing here replaces the existing schema. `database/11_auth_and_personalization.sql` and
`database/12_app_user_audit.sql` are additive migrations: no table is dropped, recreated or
rewritten, and no component data is touched.

---

## 1. Roles

| Application role | `app_users.role_code` | May browse | May bookmark / collect | May author content (components, tags) | May administer accounts, roles, categories, deletions |
| --- | --- | --- | --- | --- | --- |
| Guest (not signed in) | — | yes | no | no | no |
| `User` | `NAIVE_USER` | yes | yes | no | no |
| `Developer` | `APP_DEVELOPER` | yes | yes | yes | no |
| `DBA` | `DBA` | yes | yes | yes | yes |

The database keeps the original enum (`NAIVE_USER` / `APP_DEVELOPER` / `DBA`) because
`database/01_schema.sql`, the stored procedures and the Assignment 10 demo data all depend on it.
The API and the interface speak `User` / `Developer` / `DBA`; the translation lives in exactly one
file, `server/src/security/roles.js`.

A role can only be granted by a DBA through `PATCH /api/admin/users/:id`, or by the bootstrap
script that runs with database credentials. Public registration ignores any role in the request
body and always writes `NAIVE_USER`.

## 2. Schema

`database/11_auth_and_personalization.sql`

| Object | Purpose | Key constraints |
| --- | --- | --- |
| `app_users.email` (added) | Login identifier | `uq_app_users_email` unique, nullable so legacy rows survive |
| `user_sessions` | Server-side sessions | `token_hash` unique (SHA-256 of the cookie token), FK → `app_users` `ON DELETE CASCADE` |
| `bookmarks` | Saved components | `uq_bookmarks_user_component (user_id, component_id)`, FKs to users and components with cascade |
| `collections` | Named lists | `uq_collections_user_name (user_id, name)`, `CHECK (CHAR_LENGTH(TRIM(name)) > 0)` |
| `collection_components` | Collection membership | PK `(collection_id, component_id)`, both FKs cascade |
| `recently_viewed` | One row per user + component | PK `(user_id, component_id)`, `DATETIME(6)` stamp so two views in one second still order correctly |

`database/12_app_user_audit.sql` adds `AFTER INSERT/UPDATE/DELETE` triggers on `app_users` that write
to the existing `application_audit_log`. Password hashes are never logged; an update records only
`password_changed: true|false`.

**Fresh installs do not need the migrations.** The one-shot `electrodb.sql` (the file the README
tells you to import) already contains the `email` column, the four tables and the three triggers, so
a new database is complete in a single import. Run `11` and `12` only against a database built by an
earlier version of `database/01_schema.sql`.

Rollback statements are at the top of each migration file.

## 3. How authentication works

- **Passwords** — `crypto.scrypt` with `N=16384, r=8, p=1, keylen=64`, a 16-byte random salt per
  password, stored as `scrypt$N$r$p$salt$key`. Verification uses `timingSafeEqual`; the parameters
  travel with the hash, so they can be raised later without invalidating existing accounts.
  Passwords are normalised to NFKC and must be 10–200 characters with at least three of the four
  character classes.
- **Sessions** — a 32-byte random token in an `HttpOnly`, `SameSite=Lax` cookie (plus `Secure` when
  `SESSION_COOKIE_SECURE=true`, which defaults to true when `NODE_ENV=production`). The database
  stores only the SHA-256 digest, so a database dump cannot be replayed as a live session.
- **Embedded deployments** — a `SameSite=Lax` cookie is *not sent at all* when the page is inside a
  frame from another origin. Sign-in then succeeds, the browser keeps the cookie, never returns it,
  and every following request is anonymous: it looks exactly like being signed out a second after
  signing in. `SESSION_COOKIE_SAMESITE=auto` makes the cookie `SameSite=None; Secure` when the
  request arrived over HTTPS and `Lax` otherwise (a `Secure` cookie is dropped over plain HTTP). The
  preview server uses `auto`; a normal top-level deployment should leave it at `lax`. The
  same-origin check is what protects state-changing requests, not this flag alone.
- **Stale probes cannot undo a sign-in** — the initial `/api/auth/me` request is discarded if the
  identity changed while it was in flight, and the sign-in page re-checks `/api/auth/me` before
  navigating away. If the browser did not keep the cookie, the form says so instead of bouncing the
  visitor back.
- **Session fixation** — every successful login creates a brand-new session row and cookie; a
  pre-existing cookie is never promoted.
- **Expiry and revocation** — sessions expire after `SESSION_TTL_HOURS` (default 168). The row is
  deleted when an expired token is presented. Logout deletes the row. Changing the password deletes
  every other session for that account. Changing a role or disabling an account deletes all of its
  sessions immediately, so a disabled account cannot keep using a valid cookie.
- **Session expiry is visible, not silent** — a session can end while a tab is open: the TTL
  passes, the password is changed elsewhere, an administrator disables the account, or the store is
  wiped. Any `401` from a personal endpoint makes the client drop its cached identity, correct the
  header, and either continue to the sign-in page (inside a guarded page) or say plainly that the
  session ended and the change was not saved, with a link back to the page the visitor was reading.
- **CSRF** — state-changing requests must be same-origin. `Sec-Fetch-Site`, which page script cannot
  forge, is trusted when present (`same-origin`, `same-site`, `none`); otherwise `Origin` must match
  the request host, `X-Forwarded-Host` or `PUBLIC_BASE_URL`, so a reverse proxy that rewrites `Host`
  does not reject legitimate writes. A `cross-site` value or a foreign origin is refused with
  `403 CSRF_BLOCKED`.
- **Rate limiting** — in-memory fixed windows per IP: 10 logins / 15 min, 20 registrations / hour,
  10 password changes / 15 min. Sufficient for a single instance; a multi-instance deployment would
  move this to shared storage.
- **Enumeration** — a wrong password and an unknown address return exactly the same `401`
  (`INVALID_CREDENTIALS`) with identical bodies, and the unknown-address path still performs a
  dummy scrypt verification so the timing does not give it away.
- **Mass assignment** — profile updates accept a username and an email address and nothing else.
  `role`, `roleCode`, `isActive` and `passwordHash` in the body are ignored.

## 4. API

All responses use the existing envelope: `{ "data": … }` on success,
`{ "error": { "code": …, "message": … } }` on failure. Cookie-authenticated.

### Authentication

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register` | `{ username, email, password, confirmPassword }` → `201`; always a `User`; `409 EMAIL_TAKEN` / `USERNAME_TAKEN`; `400 VALIDATION_FAILED` |
| `POST` | `/api/auth/login` | `{ email, password }` → `200`; `401 INVALID_CREDENTIALS`; `403 ACCOUNT_DISABLED`; `429 RATE_LIMITED` |
| `POST` | `/api/auth/logout` | Deletes the session row and clears the cookie |
| `GET` | `/api/auth/me` | `{ user, bookmarkIds }`; `user: null` when signed out (never `401`) |
| `POST` | `/api/auth/change-password` | `{ currentPassword, newPassword, confirmPassword }`; revokes other sessions |

### The signed-in user

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/users/me` | Profile |
| `PATCH` | `/api/users/me` | `{ username?, email? }` |
| `GET` | `/api/users/me/bookmarks` | `{ items, pagination }`, newest first |
| `POST` | `/api/users/me/bookmarks` | `{ componentId }` → `201` when created, `200` when already saved |
| `DELETE` | `/api/users/me/bookmarks/:componentId` | Idempotent; `200` with `removed: false` if it was not there |
| `GET` | `/api/users/me/collections` | Collections with `itemCount` |
| `POST` | `/api/users/me/collections` | `{ name, description? }`; `409 COLLECTION_EXISTS` |
| `GET` | `/api/users/me/collections/:id` | `404` if it belongs to someone else |
| `PATCH` | `/api/users/me/collections/:id` | Rename / re-describe |
| `DELETE` | `/api/users/me/collections/:id` | Removes the collection, not the components |
| `POST` | `/api/users/me/collections/:id/components` | `{ componentId }`; `404` for unknown component or not-yours collection |
| `DELETE` | `/api/users/me/collections/:id/components/:componentId` | Idempotent |
| `GET` | `/api/users/me/recently-viewed?limit=` | Newest first, one row per component |
| `POST` | `/api/users/me/recently-viewed` | `{ componentId }`; re-stamps an existing row |
| `DELETE` | `/api/users/me/recently-viewed` | Clears the caller's history |
| `GET` | `/api/users/me/dashboard` | `{ user, counts, collections, recent }`, all from the database |

### Administration (DBA)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/admin/users?q=` | Paged account list with `role`, `isActive`, bookmark/collection counts |
| `POST` | `/api/admin/users` | Create an account with an explicit role |
| `GET` | `/api/admin/users/:id` | One account |
| `PATCH` | `/api/admin/users/:id` | `{ role? }`, `{ isActive? }`; `403 SELF_ROLE_CHANGE` / `SELF_DEACTIVATION`; `409 LAST_DBA`, `INVALID_ROLE`, `NOTHING_TO_UPDATE` |

### Content (Developer / DBA)

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/categories` | DBA |
| `PATCH` | `/api/categories/:id` | DBA |
| `DELETE` | `/api/categories/:id` | DBA; `409` if it still has children or components |
| `POST` | `/api/tags` | Developer / DBA |
| `DELETE` | `/api/tags/:id` | DBA |
| `POST` | `/api/components/:id/tags` | Developer / DBA |
| `DELETE` | `/api/components/:id/tags/:tagId` | Developer / DBA |

The existing Lab Console routes (`/api/lab/*`) now require a signed-in Developer or DBA; the
account endpoints inside it (`/api/lab/users`) additionally require DBA, and
`DELETE /api/lab/components/:id` requires DBA.

## 5. Where authorization is enforced

Only one place matters: the request never supplies its own identity.

1. `attachUser` (`server/src/middleware/auth.js`) reads the cookie, looks the digest up in
   `user_sessions`, rejects expired or revoked rows, and puts the account on `req.user`.
2. `requireAuth`, `requireRole(...)`, `requireContentAuthor` and `requireAdmin` guard the routers.
3. Services take the user id from `req.user.userId`. There is no `userId` field in any request body
   for personal data, so there is nothing to tamper with.
4. Ownership is checked in SQL (`WHERE collection_id = ? AND user_id = ?`). Another account's
   collection is reported as `404`, not `403`, so the endpoint cannot be used to probe for ids.
5. `adminService` re-checks self-change and last-DBA rules even though the router already required
   the DBA role.

The interface hides links a role cannot use, but that is presentation. Removing the `hidden`
attribute in devtools changes nothing that the API will allow.

## 6. First DBA (bootstrap)

There is no "make me an admin" path in the web application, by design.

```bash
# 1. migrations
mysql -u <dba-user> -p electrodb < database/11_auth_and_personalization.sql
mysql -u <dba-user> -p electrodb < database/12_app_user_audit.sql

# 2. create the first administrator (reads BOOTSTRAP_DBA_* from .env)
npm run bootstrap:dba
# or explicitly:
node scripts/bootstrap-dba.js --username electrodb_dba \
  --email dba@example.com --password 'a long unique passphrase'

# 3. delete BOOTSTRAP_DBA_* from .env afterwards
```

Re-running the script is safe: it updates the password and re-asserts the DBA role. It refuses a
password that fails the strength rules, and prints a clear message if migration 11 has not been run.

## 7. Frontend

- `public/assets/js/account.js` holds the session in the browser, renders the account pages and the
  navigation, and owns the bookmark control.
- Navigation by role (visibility only): guest → `Sign in` / `Create account`; `User` → avatar,
  `Dashboard`, `Bookmarks`, `Sign out`; `Developer` → adds `Lab Console`; `DBA` → adds
  `Account administration` (`#/admin`).
- Routes: `#/login`, `#/register`, `#/profile`, `#/bookmarks`, `#/collections`,
  `#/collections/:id`, `#/dashboard`, `#/admin`.
- Visiting a protected route while signed out redirects to
  `#/login?next=<the page you wanted>` and returns there after signing in.
- The bookmark control appears on every component card and on the component page. Signed out, it
  opens a dialog with the reason and the sign-in link that returns you to the same page (the dialog
  does not navigate away first, so the context is never lost).
- Forms validate on the client for speed and on the server for truth; server errors are shown in
  the form, associated with `role="alert"`.
- The "Save" control is a `<button>` sibling of the card link, not a button inside a link, so the
  markup is valid and keyboard-usable. It reports state with `aria-pressed`.

## 8. Preview server

`npm run preview` serves the real frontend and mounts the **real** account routers on top of the
in-memory store, so the pages work without MySQL. It seeds three accounts (password
`Electrodb#2025`):

| Email | Role |
| --- | --- |
| `dba@preview.local` | `DBA` |
| `developer@preview.local` | `Developer` |
| `user@preview.local` | `User` |

The sign-in page lists these three accounts with a one-click fill, served by
`GET /api/preview/demo-accounts` — an endpoint that exists **only** in the preview server.

These exist only in the preview process and prove nothing about the MySQL bootstrap. The preview
keeps its in-memory state in `.preview-state.json` (gitignored), so a restart keeps accounts,
bookmarks, collections **and live sessions** instead of silently signing every reviewer out.
Delete that file to get a clean slate. The `/api/lab/*` routes in the preview
are still the original read-only mocks from before this feature and are not part of the
authorization story.

## 9. Testing report

Honest summary of what was and was not verified in this environment.

**Automated, passing**

- `npm run test:personal` — **55 tests** against the real Express app (routers, middleware,
  services, error handler) with the in-memory store: registration and role force-fitting, duplicate
  email/username, weak and mismatched passwords, SQL/markup in a username, cross-origin rejection,
  generic invalid-credential responses, session rotation on login, forged/expired/revoked cookies,
  disabled accounts losing live sessions, rate limiting, profile mass-assignment attempts,
  bookmark add/remove idempotency and ownership isolation, collections CRUD, cross-account
  `404`s, recently-viewed de-duplication and ordering, dashboard counts, password change revoking
  other sessions, role enforcement for every route group, self-role-change and self-deactivation
  refusals, last-DBA protection, and the stored hash format.
- `npm run test:offline` — **66/66**: the 34 original checks (shell assets, cache headers, content constraints), 8 account-security checks (cookie flags, token digests, role mapping, hash format, no client-side token storage, script order) and 24 regression checks for session recovery, cookie policy, cross-site behaviour, preview
  credentials and the component-page layout.
- `css-tree` parse of `styles.css`: **0 errors**, brace depth 0.
- End-to-end UI drive with jsdom against the preview server: guest nav, guest bookmark → sign-in
  dialog, protected-route redirect with `next`, login, dashboard counts, bookmark toggle (and the
  card leaving the bookmarks list), save state on a component page, collection creation, add to
  collection through the dialog, profile update, `#/admin` refused to a `User`, DBA seeing three
  accounts, and sign-out returning to the guest nav.

- Cross-site-safe cookies: `SameSite=None; Secure` over HTTPS with `SESSION_COOKIE_SAMESITE=auto`,
  `Lax` over plain HTTP, and a proxied `Host` no longer breaking the origin check.
- Sign-in then reload with the same cookie, in both direct and proxied modes; saving a component and
  adding it to a collection both work after the reload.

- Session recovery after the server-side session dies: the header corrects itself, the guest prompt
  is not shown, and the dialog offers a link back to the same component
  (`#/login?next=%23%2Fcomponents%2Fand-gate`).
- Layout order on a component page: breadcrumb → back link → hero, and name → tags → description →
  actions, with the two personal actions at the smaller size (`btn-compact`, 0.72rem).

**Not verified here — and why**

- **No MySQL or MariaDB binary exists in this environment**, so `npm test` (`api.test.js`), the two
  migrations, the stored procedures and the triggers were **not executed**. The SQL is written
  against the column types in `01_schema.sql` and reviewed by hand; it needs one run on a real
  server before it can be called proven. In particular the `DATETIME(6)` column, the
  `information_schema` guards in the email migration, and the `JSON_OBJECT` audit triggers should be
  exercised by running the two files top to bottom on both MySQL 8 and MariaDB 10.4.
- The in-memory store follows the same interface as the MySQL store, but it is a second
  implementation: a passing test against it proves the *service logic*, not the SQL. Anything
  SQL-specific (duplicate-key races, cascade behaviour, `ON DUPLICATE KEY UPDATE`) is unproven until
  the database run.
- The preview server's demo accounts are seeded in memory and are **not** evidence that the MySQL
  bootstrap script works.
- No browser automation was available (no Chromium libraries in the sandbox), so layout, focus
  rings and hover states were inspected as CSS and DOM, not in a rendered page.

## 10. Out of scope / deliberately not done

- No email verification, password-reset-by-email, "remember me", 2FA, OAuth or account deletion.
  Password reset needs an outbound mail channel that this project does not have; a DBA can reset a
  password by re-running the bootstrap script for that account.
- No refresh tokens, JWT, or client-side token storage — the session is a server-side row behind an
  HttpOnly cookie.
- No per-component permissions, sharing, publishing workflow or moderation queue.
- Rate limiting is per-process memory, not shared across instances.
- No admin UI for deleting accounts (the API has no delete either): deactivation is the supported
  operation, and the existing `sp_delete_app_user` remains available to DBAs in the Lab Console.
