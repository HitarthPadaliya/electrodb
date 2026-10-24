/**
 * Account, authorization and personalization tests.
 *
 * These drive the real Express app - the same routers, middleware, services and
 * error handler that run in production - against the in-memory store. That
 * proves the request-level behaviour (cookies, status codes, ownership checks,
 * role guards) without needing MySQL. The SQL itself is exercised separately by
 * `api.test.js` on a machine with a database; see the testing report for what
 * that means for coverage.
 */
process.env.NODE_ENV = 'test';
process.env.PERSONAL_STORE = 'memory';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const app = require('../src/app');
const { getStore } = require('../src/db/personalStore');
const { resetRateLimits } = require('../src/middleware/auth');
const passwords = require('../src/security/passwords');
const roles = require('../src/security/roles');
const tokenHelpers = require('../src/security/tokens');

let server;
let baseUrl;
let store;

const PASSWORD = 'Correct1-Horse';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.cookie) headers.Cookie = options.cookie;

    const req = http.request(url, { method: options.method || 'GET', headers }, res => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        let json = null;
        if ((res.headers['content-type'] || '').includes('application/json')) {
          try {
            json = JSON.parse(raw);
          } catch (err) {
            json = null;
          }
        }
        resolve({ status: res.statusCode, headers: res.headers, json, raw });
      });
    });
    req.on('error', reject);
    if (options.body !== undefined) req.write(JSON.stringify(options.body));
    req.end();
  });
}

/** Extract the session cookie value from a Set-Cookie header. */
function sessionCookie(response) {
  const header = response.headers['set-cookie'];
  if (!header) return null;
  const cookie = Array.isArray(header) ? header[0] : header;
  const match = /^electrodb_sid=([^;]*)/.exec(cookie);
  if (!match || match[1] === '') return null;
  return `electrodb_sid=${match[1]}`;
}

async function registerUser(overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const body = {
    username: `tester-${unique}`,
    email: `tester-${unique}@example.test`,
    password: PASSWORD,
    confirmPassword: PASSWORD,
    ...overrides
  };
  const response = await request('/api/auth/register', { method: 'POST', body });
  const data = (response.json && response.json.data) || {};
  return { response, body, cookie: sessionCookie(response), user: data.user };
}

/** Create an account with a role, as the bootstrap script would. */
async function seedAccount({ username, email, role = 'User', active = true }) {
  const user = await store.users.create({
    username,
    email,
    passwordHash: await passwords.hashPassword(PASSWORD),
    roleCode: roles.toRoleCode(role)
  });
  if (!active) await store.users.setRoleAndStatus(user.userId, { isActive: false });
  return user;
}

async function loginAs(email) {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD }
  });
  const data = (response.json && response.json.data) || {};
  return { response, cookie: sessionCookie(response), user: data.user };
}

before(async () => {
  store = getStore();
  assert.strictEqual(store.kind, 'memory');
  store.components.seed([
    { component_id: 1, name: 'AND Gate', slug: 'and-gate', category_id: 2, category_name: 'Logic Gates' },
    { component_id: 2, name: 'NAND Gate', slug: 'nand-gate', category_id: 2, category_name: 'Logic Gates' },
    { component_id: 3, name: 'Half Adder', slug: 'half-adder', category_id: 5, category_name: 'Combinational' }
  ]);

  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

beforeEach(() => {
  resetRateLimits();
});

// ------------------------------------------------------------------- register
describe('POST /api/auth/register', () => {
  it('creates an ordinary user and starts a session', async () => {
    const { response, cookie, user } = await registerUser();
    assert.strictEqual(response.status, 201);
    assert.strictEqual(user.role, 'User');
    assert.strictEqual(user.roleCode, 'NAIVE_USER');
    assert.ok(cookie, 'a session cookie should be issued');
    assert.match(String(response.headers['set-cookie']), /HttpOnly/i);
    assert.match(String(response.headers['set-cookie']), /SameSite=Lax/i);
    assert.strictEqual(response.json.data.user.email.startsWith('tester-'), true);
  });

  it('ignores a role supplied by the client', async () => {
    const { response, user } = await registerUser({ role: 'DBA', roleCode: 'DBA', isActive: false });
    assert.strictEqual(response.status, 201);
    assert.strictEqual(user.role, 'User');
    assert.strictEqual(user.roleCode, 'NAIVE_USER');
    assert.strictEqual(user.isActive, true);
  });

  it('rejects a duplicate email address with 409', async () => {
    const first = await registerUser();
    const second = await registerUser({ email: first.body.email });
    assert.strictEqual(second.response.status, 409);
    assert.strictEqual(second.response.json.error.code, 'EMAIL_TAKEN');
  });

  it('rejects a duplicate username with 409', async () => {
    const first = await registerUser();
    const second = await registerUser({ username: first.body.username });
    assert.strictEqual(second.response.status, 409);
    assert.strictEqual(second.response.json.error.code, 'USERNAME_TAKEN');
  });

  it('rejects a weak password with 400 and a field error', async () => {
    const { response } = await registerUser({ password: 'short', confirmPassword: 'short' });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.json.error.code, 'VALIDATION_FAILED');
    assert.ok(response.json.error.details, 'the failing field should be named');
  });

  it('rejects mismatched confirmation', async () => {
    const { response } = await registerUser({ confirmPassword: 'Different1-Pass' });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.json.error.code, 'VALIDATION_FAILED');
  });

  it('rejects a username containing SQL or markup', async () => {
    for (const username of ["' OR 1=1 --", '<script>x</script>', 'has space']) {
      const { response } = await registerUser({ username });
      assert.strictEqual(response.status, 400, `expected rejection for ${username}`);
    }
  });

  it('rejects a cross-site request', async () => {
    const response = await request('/api/auth/register', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
      body: {
        username: 'crosssite-user',
        email: 'crosssite@example.test',
        password: PASSWORD,
        confirmPassword: PASSWORD
      }
    });
    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.json.error.code, 'CSRF_BLOCKED');
  });
});

// ---------------------------------------------------------------------- login
describe('POST /api/auth/login', () => {
  it('signs in and returns the account', async () => {
    const created = await registerUser();
    const { response, cookie, user } = await loginAs(created.body.email);
    assert.strictEqual(response.status, 200);
    assert.ok(cookie);
    assert.strictEqual(user.userId, created.user.userId);
    assert.ok(user.lastLoginAt, 'last login should be recorded');
  });

  it('never says whether the address or the password was wrong', async () => {
    const created = await registerUser();
    const wrongPassword = await request('/api/auth/login', {
      method: 'POST',
      body: { email: created.body.email, password: 'Wrong1-Password' }
    });
    const unknownEmail = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'nobody@example.test', password: 'Wrong1-Password' }
    });

    assert.strictEqual(wrongPassword.status, 401);
    assert.strictEqual(unknownEmail.status, 401);
    assert.deepStrictEqual(wrongPassword.json, unknownEmail.json);
    assert.strictEqual(wrongPassword.json.error.code, 'INVALID_CREDENTIALS');
  });

  it('issues a new cookie on each login (session fixation is impossible)', async () => {
    const created = await registerUser();
    const first = await loginAs(created.body.email);
    const second = await loginAs(created.body.email);
    assert.notStrictEqual(first.cookie, second.cookie);
  });

  it('refuses a disabled account', async () => {
    await seedAccount({ username: 'disabled-user', email: 'disabled@example.test', active: false });
    const { response } = await loginAs('disabled@example.test');
    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.json.error.code, 'ACCOUNT_DISABLED');
  });

  it('rate limits repeated failures', async () => {
    const created = await registerUser();
    let last;
    for (let i = 0; i < 12; i += 1) {
      last = await request('/api/auth/login', {
        method: 'POST',
        body: { email: created.body.email, password: 'Wrong1-Password' }
      });
    }
    assert.strictEqual(last.status, 429);
    assert.strictEqual(last.json.error.code, 'RATE_LIMITED');
  });
});

// ------------------------------------------------------------------ session / me
describe('session handling', () => {
  it('reports no user to an anonymous visitor', async () => {
    const response = await request('/api/auth/me');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.json.data.user, null);
    assert.deepStrictEqual(response.json.data.bookmarkIds, []);
  });

  it('resolves the signed-in user from the cookie', async () => {
    const created = await registerUser();
    const response = await request('/api/auth/me', { cookie: created.cookie });
    assert.strictEqual(response.json.data.user.userId, created.user.userId);
    assert.strictEqual(response.json.data.user.email, created.body.email);
  });

  it('rejects a forged cookie', async () => {
    const response = await request('/api/auth/me', { cookie: 'electrodb_sid=not-a-real-token' });
    assert.strictEqual(response.json.data.user, null);
  });

  it('logout clears the cookie and kills the token', async () => {
    const created = await registerUser();
    const out = await request('/api/auth/logout', { method: 'POST', cookie: created.cookie });
    assert.strictEqual(out.status, 200);
    assert.match(String(out.headers['set-cookie']), /electrodb_sid=;/);

    const afterwards = await request('/api/auth/me', { cookie: created.cookie });
    assert.strictEqual(afterwards.json.data.user, null);
  });

  it('a revoked session stops working immediately', async () => {
    const created = await registerUser();
    await store.sessions.deleteForUser(created.user.userId);
    const afterwards = await request('/api/auth/me', { cookie: created.cookie });
    assert.strictEqual(afterwards.json.data.user, null);
  });

  it('a disabled account loses its live session', async () => {
    const created = await registerUser();
    await store.users.setRoleAndStatus(created.user.userId, { isActive: false });
    const afterwards = await request('/api/auth/me', { cookie: created.cookie });
    assert.strictEqual(afterwards.json.data.user, null);

    const bookmarks = await request('/api/users/me/bookmarks', { cookie: created.cookie });
    assert.strictEqual(bookmarks.status, 401);
  });

  it('expired sessions are rejected and deleted', async () => {
    const created = await registerUser();
    const rawToken = created.cookie.replace('electrodb_sid=', '');
    const record = await store.sessions.findWithUser(tokenHelpers.hashToken(rawToken));
    assert.ok(record, 'the session should exist while it is valid');

    await store.sessions.touch(record.session.sessionId, { expiresAt: '2000-01-01 00:00:00' });

    const afterwards = await request('/api/auth/me', { cookie: created.cookie });
    assert.strictEqual(afterwards.json.data.user, null, 'an expired session must not authenticate');
  });
});

// ----------------------------------------------------------------- profile
describe('/api/users/me', () => {
  it('requires authentication', async () => {
    const response = await request('/api/users/me');
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.json.error.code, 'AUTH_REQUIRED');
  });

  it('updates the username and email', async () => {
    const created = await registerUser();
    const response = await request('/api/users/me', {
      method: 'PATCH',
      cookie: created.cookie,
      body: { username: 'renamed-user', email: 'renamed@example.test' }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.json.data.user.username, 'renamed-user');
    assert.strictEqual(response.json.data.user.email, 'renamed@example.test');
  });

  it('cannot be used to grant a role or reactivate an account', async () => {
    const created = await registerUser();
    const response = await request('/api/users/me', {
      method: 'PATCH',
      cookie: created.cookie,
      body: { username: 'still-me', roleCode: 'DBA', role: 'DBA', isActive: true, passwordHash: 'x' }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.json.data.user.role, 'User');
    assert.strictEqual(response.json.data.user.roleCode, 'NAIVE_USER');
  });

  it('rejects an email address already used by another account', async () => {
    const first = await registerUser();
    const second = await registerUser();
    const response = await request('/api/users/me', {
      method: 'PATCH',
      cookie: second.cookie,
      body: { email: first.body.email }
    });
    assert.strictEqual(response.status, 409);
  });
});

// ----------------------------------------------------------------- bookmarks
describe('bookmarks', () => {
  it('requires authentication for every bookmark endpoint', async () => {
    const list = await request('/api/users/me/bookmarks');
    const create = await request('/api/users/me/bookmarks', { method: 'POST', body: { componentId: 1 } });
    const remove = await request('/api/users/me/bookmarks/1', { method: 'DELETE' });
    for (const response of [list, create, remove]) {
      assert.strictEqual(response.status, 401);
    }
  });

  it('adds, lists and removes a bookmark', async () => {
    const created = await registerUser();

    const add = await request('/api/users/me/bookmarks', {
      method: 'POST',
      cookie: created.cookie,
      body: { componentId: 1 }
    });
    assert.strictEqual(add.status, 201);
    assert.deepStrictEqual(add.json.data, { componentId: 1, bookmarked: true, created: true });

    const list = await request('/api/users/me/bookmarks', { cookie: created.cookie });
    assert.strictEqual(list.status, 200);
    assert.strictEqual(list.json.data.items.length, 1);
    assert.strictEqual(list.json.data.items[0].name, 'AND Gate');
    assert.strictEqual(list.json.data.pagination.total, 1);

    const remove = await request('/api/users/me/bookmarks/1', { method: 'DELETE', cookie: created.cookie });
    assert.strictEqual(remove.status, 200);
    assert.strictEqual(remove.json.data.removed, true);

    const after = await request('/api/users/me/bookmarks', { cookie: created.cookie });
    assert.strictEqual(after.json.data.items.length, 0);
  });

  it('is idempotent on add and remove', async () => {
    const created = await registerUser();

    const first = await request('/api/users/me/bookmarks', { method: 'POST', cookie: created.cookie, body: { componentId: 2 } });
    const second = await request('/api/users/me/bookmarks', { method: 'POST', cookie: created.cookie, body: { componentId: 2 } });
    assert.strictEqual(first.status, 201);
    assert.strictEqual(second.status, 200);
    assert.strictEqual(second.json.data.created, false);

    const removeOnce = await request('/api/users/me/bookmarks/2', { method: 'DELETE', cookie: created.cookie });
    const removeTwice = await request('/api/users/me/bookmarks/2', { method: 'DELETE', cookie: created.cookie });
    assert.strictEqual(removeOnce.json.data.removed, true);
    assert.strictEqual(removeTwice.status, 200);
    assert.strictEqual(removeTwice.json.data.removed, false);
  });

  it('rejects a component that does not exist', async () => {
    const created = await registerUser();
    const response = await request('/api/users/me/bookmarks', {
      method: 'POST',
      cookie: created.cookie,
      body: { componentId: 987654 }
    });
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.json.error.code, 'NOT_FOUND');
  });

  it('rejects an invalid component id', async () => {
    const created = await registerUser();
    const response = await request('/api/users/me/bookmarks', {
      method: 'POST',
      cookie: created.cookie,
      body: { componentId: '1 OR 1=1' }
    });
    assert.strictEqual(response.status, 400);
  });

  it('keeps one account\u2019s bookmarks out of another\u2019s list', async () => {
    const alice = await registerUser();
    const bob = await registerUser();

    await request('/api/users/me/bookmarks', { method: 'POST', cookie: alice.cookie, body: { componentId: 1 } });
    const bobList = await request('/api/users/me/bookmarks', { cookie: bob.cookie });
    assert.strictEqual(bobList.json.data.items.length, 0);

    // Bob deleting "his" bookmark 1 must not touch Alice's row.
    await request('/api/users/me/bookmarks/1', { method: 'DELETE', cookie: bob.cookie });
    const aliceList = await request('/api/users/me/bookmarks', { cookie: alice.cookie });
    assert.strictEqual(aliceList.json.data.items.length, 1);
  });

  it('exposes bookmark ids on the session endpoint for card state', async () => {
    const created = await registerUser();
    await request('/api/users/me/bookmarks', { method: 'POST', cookie: created.cookie, body: { componentId: 3 } });
    const me = await request('/api/auth/me', { cookie: created.cookie });
    assert.deepStrictEqual(me.json.data.bookmarkIds, [3]);
  });
});

// --------------------------------------------------------------- collections
describe('collections', () => {
  it('creates, renames and deletes a collection', async () => {
    const created = await registerUser();

    const create = await request('/api/users/me/collections', {
      method: 'POST',
      cookie: created.cookie,
      body: { name: 'Exam revision', description: 'Gates and adders' }
    });
    assert.strictEqual(create.status, 201);
    const collectionId = create.json.data.collectionId;
    assert.ok(collectionId);

    const duplicate = await request('/api/users/me/collections', {
      method: 'POST',
      cookie: created.cookie,
      body: { name: 'exam revision' }
    });
    assert.strictEqual(duplicate.status, 409);

    const rename = await request(`/api/users/me/collections/${collectionId}`, {
      method: 'PATCH',
      cookie: created.cookie,
      body: { name: 'Final revision' }
    });
    assert.strictEqual(rename.status, 200);
    assert.strictEqual(rename.json.data.name, 'Final revision');

    const remove = await request(`/api/users/me/collections/${collectionId}`, {
      method: 'DELETE',
      cookie: created.cookie
    });
    assert.strictEqual(remove.status, 200);

    const list = await request('/api/users/me/collections', { cookie: created.cookie });
    assert.strictEqual(list.json.data.items.length, 0);
  });

  it('adds and removes components, idempotently', async () => {
    const created = await registerUser();
    const create = await request('/api/users/me/collections', {
      method: 'POST',
      cookie: created.cookie,
      body: { name: 'Favourites' }
    });
    const id = create.json.data.collectionId;

    const add = await request(`/api/users/me/collections/${id}/components`, {
      method: 'POST',
      cookie: created.cookie,
      body: { componentId: 1 }
    });
    assert.strictEqual(add.status, 201);

    const again = await request(`/api/users/me/collections/${id}/components`, {
      method: 'POST',
      cookie: created.cookie,
      body: { componentId: 1 }
    });
    assert.strictEqual(again.status, 200);
    assert.strictEqual(again.json.data.created, false);

    const detail = await request(`/api/users/me/collections/${id}`, { cookie: created.cookie });
    assert.strictEqual(detail.json.data.items.length, 1);
    assert.strictEqual(detail.json.data.itemCount, 1);

    const remove = await request(`/api/users/me/collections/${id}/components/1`, {
      method: 'DELETE',
      cookie: created.cookie
    });
    assert.strictEqual(remove.json.data.removed, true);
  });

  it('rejects an empty collection name', async () => {
    const created = await registerUser();
    const response = await request('/api/users/me/collections', {
      method: 'POST',
      cookie: created.cookie,
      body: { name: '   ' }
    });
    assert.strictEqual(response.status, 400);
  });

  it('returns 404 for another account\u2019s collection', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const create = await request('/api/users/me/collections', {
      method: 'POST',
      cookie: alice.cookie,
      body: { name: 'Private' }
    });
    const id = create.json.data.collectionId;

    const read = await request(`/api/users/me/collections/${id}`, { cookie: bob.cookie });
    assert.strictEqual(read.status, 404);

    const write = await request(`/api/users/me/collections/${id}/components`, {
      method: 'POST',
      cookie: bob.cookie,
      body: { componentId: 1 }
    });
    assert.strictEqual(write.status, 404);

    const remove = await request(`/api/users/me/collections/${id}`, { method: 'DELETE', cookie: bob.cookie });
    assert.strictEqual(remove.status, 404);

    // Alice's collection is untouched.
    const stillThere = await request(`/api/users/me/collections/${id}`, { cookie: alice.cookie });
    assert.strictEqual(stillThere.status, 200);
  });
});

// ------------------------------------------------------------ recently viewed
describe('recently viewed', () => {
  it('records a view once per component and keeps the newest first', async () => {
    const created = await registerUser();

    await request('/api/users/me/recently-viewed', { method: 'POST', cookie: created.cookie, body: { componentId: 1 } });
    await new Promise(resolve => setTimeout(resolve, 5));
    await request('/api/users/me/recently-viewed', { method: 'POST', cookie: created.cookie, body: { componentId: 2 } });
    await new Promise(resolve => setTimeout(resolve, 5));
    await request('/api/users/me/recently-viewed', { method: 'POST', cookie: created.cookie, body: { componentId: 1 } });

    const list = await request('/api/users/me/recently-viewed', { cookie: created.cookie });
    assert.strictEqual(list.status, 200);
    assert.strictEqual(list.json.data.items.length, 2, 'a repeat view must not duplicate the row');
    assert.strictEqual(list.json.data.items[0].componentId, 1);

    const cleared = await request('/api/users/me/recently-viewed', { method: 'DELETE', cookie: created.cookie });
    assert.strictEqual(cleared.status, 200);

    const after = await request('/api/users/me/recently-viewed', { cookie: created.cookie });
    assert.strictEqual(after.json.data.items.length, 0);
  });

  it('rejects an unknown component', async () => {
    const created = await registerUser();
    const response = await request('/api/users/me/recently-viewed', {
      method: 'POST',
      cookie: created.cookie,
      body: { componentId: 424242 }
    });
    assert.strictEqual(response.status, 404);
  });
});

// ------------------------------------------------------------------ dashboard
describe('dashboard', () => {
  it('reports counts from the database, including empty states', async () => {
    const created = await registerUser();

    const empty = await request('/api/users/me/dashboard', { cookie: created.cookie });
    assert.strictEqual(empty.status, 200);
    assert.deepStrictEqual(empty.json.data.counts, { bookmarks: 0, collections: 0, recentlyViewed: 0 });
    assert.deepStrictEqual(empty.json.data.collections, []);

    await request('/api/users/me/bookmarks', { method: 'POST', cookie: created.cookie, body: { componentId: 1 } });
    await request('/api/users/me/collections', { method: 'POST', cookie: created.cookie, body: { name: 'One' } });
    await request('/api/users/me/recently-viewed', { method: 'POST', cookie: created.cookie, body: { componentId: 2 } });

    const filled = await request('/api/users/me/dashboard', { cookie: created.cookie });
    assert.deepStrictEqual(filled.json.data.counts, { bookmarks: 1, collections: 1, recentlyViewed: 1 });
    assert.strictEqual(filled.json.data.collections[0].name, 'One');
    assert.strictEqual(filled.json.data.recent[0].componentId, 2);
  });
});

// ---------------------------------------------------------------- password
describe('POST /api/auth/change-password', () => {
  it('requires the current password', async () => {
    const created = await registerUser();
    const response = await request('/api/auth/change-password', {
      method: 'POST',
      cookie: created.cookie,
      body: { currentPassword: 'Not1-TheRight' + 'X', newPassword: 'Another1-Pass', confirmPassword: 'Another1-Pass' }
    });
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.json.error.code, 'INVALID_CREDENTIALS');
  });

  it('changes the password, keeps the current session and revokes the others', async () => {
    const created = await registerUser();
    const other = await loginAs(created.body.email);

    const response = await request('/api/auth/change-password', {
      method: 'POST',
      cookie: created.cookie,
      body: { currentPassword: PASSWORD, newPassword: 'Another1-Pass', confirmPassword: 'Another1-Pass' }
    });
    assert.strictEqual(response.status, 200);

    const current = await request('/api/auth/me', { cookie: created.cookie });
    assert.ok(current.json.data.user, 'the session that made the change stays valid');

    const revoked = await request('/api/auth/me', { cookie: other.cookie });
    assert.strictEqual(revoked.json.data.user, null, 'other sessions are signed out');

    const oldPassword = await request('/api/auth/login', {
      method: 'POST',
      body: { email: created.body.email, password: PASSWORD }
    });
    assert.strictEqual(oldPassword.status, 401);

    const newPassword = await request('/api/auth/login', {
      method: 'POST',
      body: { email: created.body.email, password: 'Another1-Pass' }
    });
    assert.strictEqual(newPassword.status, 200);
  });
});

// -------------------------------------------------------------------- roles
describe('role enforcement', () => {
  it('rejects anonymous access to administration', async () => {
    const response = await request('/api/admin/users');
    assert.strictEqual(response.status, 401);
  });

  it('rejects an ordinary user with 403', async () => {
    const created = await registerUser();
    const list = await request('/api/admin/users', { cookie: created.cookie });
    assert.strictEqual(list.status, 403);
    assert.strictEqual(list.json.error.code, 'ROLE_REQUIRED');

    const patch = await request('/api/admin/users/1', {
      method: 'PATCH',
      cookie: created.cookie,
      body: { role: 'DBA' }
    });
    assert.strictEqual(patch.status, 403);
  });

  it('rejects a Developer from DBA-only operations', async () => {
    await seedAccount({ username: 'developer-one', email: 'dev@example.test', role: 'Developer' });
    const { cookie } = await loginAs('dev@example.test');

    const accounts = await request('/api/admin/users', { cookie });
    assert.strictEqual(accounts.status, 403);

    const category = await request('/api/categories', {
      method: 'POST',
      cookie,
      body: { name: 'Sneaky category' }
    });
    assert.strictEqual(category.status, 403);
  });

  it('lets a DBA list accounts', async () => {
    await seedAccount({ username: 'dba-one', email: 'dba@example.test', role: 'DBA' });
    const { cookie } = await loginAs('dba@example.test');

    const response = await request('/api/admin/users', { cookie });
    assert.strictEqual(response.status, 200);
    assert.ok(response.json.data.items.length >= 1);
    assert.ok(response.json.data.items.some(user => user.role === 'DBA'));
  });

  it('lets a Developer past the DBA gate, but not through it', async () => {
    await seedAccount({ username: 'developer-two', email: 'dev2@example.test', role: 'Developer' });
    const { cookie } = await loginAs('dev2@example.test');

    // Content management writes need a database; with the in-memory store there
    // is none, so a Developer reaches the service and gets a 500 rather than the
    // 403 a role failure would produce. The role gate itself is what is asserted.
    const category = await request('/api/categories', { method: 'POST', cookie, body: { name: 'Nope' } });
    assert.strictEqual(category.status, 403);
    assert.strictEqual(category.json.error.code, 'ROLE_REQUIRED');

    const accounts = await request('/api/admin/users', { cookie });
    assert.strictEqual(accounts.status, 403);
  });
});

// --------------------------------------------------------- administration
describe('PATCH /api/admin/users/:id', () => {
  async function dbaSession() {
    await seedAccount({ username: 'admin-user', email: 'admin@example.test', role: 'DBA' });
    const { cookie, user } = await loginAs('admin@example.test');
    return { cookie, user };
  }

  it('promotes a user to Developer and revokes their old sessions', async () => {
    const admin = await dbaSession();
    const target = await registerUser();

    const before = await request('/api/auth/me', { cookie: target.cookie });
    assert.strictEqual(before.json.data.user.role, 'User');

    const response = await request(`/api/admin/users/${target.user.userId}`, {
      method: 'PATCH',
      cookie: admin.cookie,
      body: { role: 'Developer' }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.json.data.role, 'Developer');
    assert.strictEqual(response.json.data.roleCode, 'APP_DEVELOPER');

    const after = await request('/api/auth/me', { cookie: target.cookie });
    assert.strictEqual(after.json.data.user, null, 'privilege changes end existing sessions');
  });

  it('disables an account and ends its session', async () => {
    const admin = await dbaSession();
    const target = await registerUser();

    const response = await request(`/api/admin/users/${target.user.userId}`, {
      method: 'PATCH',
      cookie: admin.cookie,
      body: { isActive: false }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.json.data.isActive, false);

    const after = await request('/api/auth/me', { cookie: target.cookie });
    assert.strictEqual(after.json.data.user, null);
  });

  it('rejects an unknown role', async () => {
    const admin = await dbaSession();
    const target = await registerUser();
    const response = await request(`/api/admin/users/${target.user.userId}`, {
      method: 'PATCH',
      cookie: admin.cookie,
      body: { role: 'SuperAdmin' }
    });
    assert.strictEqual(response.status, 409);
    assert.strictEqual(response.json.error.code, 'INVALID_ROLE');
  });

  it('refuses to let a DBA change their own role or disable themselves', async () => {
    const admin = await dbaSession();

    const role = await request(`/api/admin/users/${admin.user.userId}`, {
      method: 'PATCH',
      cookie: admin.cookie,
      body: { role: 'User' }
    });
    assert.strictEqual(role.status, 403);
    assert.strictEqual(role.json.error.code, 'SELF_ROLE_CHANGE');

    const status = await request(`/api/admin/users/${admin.user.userId}`, {
      method: 'PATCH',
      cookie: admin.cookie,
      body: { isActive: false }
    });
    assert.strictEqual(status.status, 403);
    assert.strictEqual(status.json.error.code, 'SELF_DEACTIVATION');
  });

  it('protects the last active DBA', async () => {
    const first = await seedAccount({ username: 'dba-first', email: 'first@example.test', role: 'DBA' });
    const second = await seedAccount({ username: 'dba-second', email: 'second@example.test', role: 'DBA' });
    const secondLogin = await loginAs('second@example.test');

    // Two active DBAs: demoting one is allowed.
    const demoteFirst = await request(`/api/admin/users/${first.userId}`, {
      method: 'PATCH',
      cookie: secondLogin.cookie,
      body: { role: 'Developer' }
    });
    assert.strictEqual(demoteFirst.status, 200);

    // `second` is now the only active DBA and cannot be the last one standing
    // without a successor: a different DBA has to do it, so promote a third.
    const third = await seedAccount({ username: 'dba-third', email: 'third@example.test', role: 'DBA' });
    const thirdLogin = await loginAs('third@example.test');

    // With two active DBAs again, `third` may demote `second`.
    const demoteSecond = await request(`/api/admin/users/${second.userId}`, {
      method: 'PATCH',
      cookie: thirdLogin.cookie,
      body: { role: 'User' }
    });
    assert.strictEqual(demoteSecond.status, 200);

    // The last-DBA rule itself, checked against an isolated store so the
    // accounts created by other suites cannot mask it.
    const { createMemoryStore } = require('../src/db/personalMemoryStore');
    const { setStore } = require('../src/db/personalStore');
    const isolated = createMemoryStore();
    const onlyDba = await isolated.users.create({
      username: 'only-dba',
      email: 'only@example.test',
      passwordHash: 'hash',
      roleCode: roles.ROLE_TO_CODE.DBA
    });

    const previous = store;
    setStore(isolated);
    try {
      const adminService = require('../src/services/adminService');
      await assert.rejects(
        () => adminService.updateAccount({ userId: 0 }, onlyDba.userId, { role: 'Developer' }),
        err => err.code === 'LAST_DBA' && err.statusCode === 409
      );
      const stillThere = await isolated.users.findById(onlyDba.userId);
      assert.strictEqual(stillThere.roleCode, roles.ROLE_TO_CODE.DBA, 'the last DBA keeps its role');
    } finally {
      setStore(previous);
    }
  });

  it('refuses an empty patch', async () => {
    const admin = await dbaSession();
    const target = await registerUser();
    const response = await request(`/api/admin/users/${target.user.userId}`, {
      method: 'PATCH',
      cookie: admin.cookie,
      body: {}
    });
    assert.strictEqual(response.status, 409);
    assert.strictEqual(response.json.error.code, 'NOTHING_TO_UPDATE');
  });

  it('returns 404 for an account that does not exist', async () => {
    const admin = await dbaSession();
    const response = await request('/api/admin/users/999999', {
      method: 'PATCH',
      cookie: admin.cookie,
      body: { role: 'User' }
    });
    assert.strictEqual(response.status, 404);
  });
});

// ------------------------------------------------------------------ password hashing
describe('password storage', () => {
  it('never stores the plaintext password', async () => {
    const created = await registerUser();
    const hash = await store.users.passwordHash(created.user.userId);
    assert.ok(hash);
    assert.ok(!hash.includes(PASSWORD), 'the stored value must not contain the password');
    assert.match(hash, /^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  });

  it('produces a different hash for the same password (unique salt)', async () => {
    const a = await registerUser();
    const b = await registerUser();
    assert.notStrictEqual(
      await store.users.passwordHash(a.user.userId),
      await store.users.passwordHash(b.user.userId)
    );
  });

  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await passwords.hashPassword(PASSWORD);
    assert.strictEqual(await passwords.verifyPassword(PASSWORD, hash), true);
    assert.strictEqual(await passwords.verifyPassword(`${PASSWORD}x`, hash), false);
    assert.strictEqual(await passwords.verifyPassword(PASSWORD, 'garbage'), false);
  });
});
