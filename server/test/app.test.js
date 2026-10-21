const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const app = require('../src/app');
const { closePool } = require('../src/db/pool');

test('lab console defaults off in production', () => {
  const env = { ...process.env, NODE_ENV: 'production' };
  delete env.ENABLE_LAB_CONSOLE;
  const configPath = path.resolve(__dirname, '../src/config/env');
  const result = spawnSync(process.execPath, ['-e', `process.stdout.write(String(require(${JSON.stringify(configPath)}).labEnabled))`], { cwd: os.tmpdir(), env, encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'false');
});

let server;
let base;
test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await closePool();
});

test('serves the public application shell', async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /ElectroDB/);
});

test('search rejects invalid pagination before attempting a database query', async () => {
  const response = await fetch(`${base}/api/search?page=0`);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('health endpoint reports configuration failure without leaking internals', async () => {
  const response = await fetch(`${base}/api/health`);
  const body = await response.json();
  if (response.status === 503) {
    assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
    assert.doesNotMatch(JSON.stringify(body), /password|stack|ECONNREFUSED/i);
  } else {
    assert.equal(response.status, 200);
    assert.equal(body.data.status, 'ok');
  }
});
