#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });
require('dotenv').config();

const { pool } = require('../src/db');
const { passwords } = require('../src/security');

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? null : process.argv[index + 1];
}

async function main() {
  const username = arg('username') || process.env.BOOTSTRAP_DBA_USERNAME;
  const email = (arg('email') || process.env.BOOTSTRAP_DBA_EMAIL || '').trim().toLowerCase();
  const password = arg('password') || process.env.BOOTSTRAP_DBA_PASSWORD;

  if (!username || !email || !password) {
    console.error(
      'Missing details. Set BOOTSTRAP_DBA_USERNAME, BOOTSTRAP_DBA_EMAIL and\n' +
        'BOOTSTRAP_DBA_PASSWORD (or pass --username --email --password).'
    );
    process.exit(1);
  }

  const strength = passwords.validatePasswordStrength(password);
  if (!strength.ok) {
    console.error(`Refusing to use that password: ${strength.message}`);
    process.exit(1);
  }

  const passwordHash = await passwords.hashPassword(password);

  let existing;
  try {
    [existing] = await pool.query(
      'SELECT user_id, role_code, email FROM app_users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      console.error(
        'The app_users table has no `email` column yet.\n' +
          'Run the migration first: mysql -u <dba> -p electrodb < database/11_auth_and_personalization.sql'
      );
      process.exit(1);
    }
    throw err;
  }

  if (existing.length) {
    await pool.query(
      `UPDATE app_users
          SET username = ?, email = ?, password_hash = ?, role_code = 'DBA', is_active = 1
        WHERE user_id = ?`,
      [username, email, passwordHash, existing[0].user_id]
    );
    console.log(`Updated existing account #${existing[0].user_id} and ensured the DBA role.`);
  } else {
    const result = await pool.query(
      `INSERT INTO app_users (username, email, password_hash, role_code, is_active)
       VALUES (?, ?, ?, 'DBA', 1)`,
      [username, email, passwordHash]
    );
    console.log(`Created DBA account #${result.insertId}.`);
  }

  console.log(`  username: ${username}`);
  console.log(`  email:    ${email}`);
  console.log('\nSign in at /#/login, then remove the BOOTSTRAP_DBA_* values from the environment.');
}

main()
  .catch(err => {
    console.error('Bootstrap failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.closePool();
    } catch (err) {
          }
  });
