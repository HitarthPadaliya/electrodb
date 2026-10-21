const mysql = require('mysql2/promise');
const { database } = require('../config/env');

let pool;
function configured() {
  return Boolean(database.host && database.name && database.user && database.password);
}
function getPool() {
  if (!configured()) throw Object.assign(new Error('Database connection is not configured. Copy .env.example to .env and set the MySQL connection values.'), { code: 'DB_NOT_CONFIGURED' });
  if (!pool) {
    pool = mysql.createPool({
      host: database.host, port: database.port, database: database.name,
      user: database.user, password: database.password,
      waitForConnections: true, connectionLimit: database.connectionLimit,
      queueLimit: 0, charset: 'utf8mb4', enableKeepAlive: true,
      decimalNumbers: true, namedPlaceholders: true
    });
  }
  return pool;
}
async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}
async function closePool() {
  if (pool) { const current = pool; pool = undefined; await current.end(); }
}
module.exports = { configured, getPool, query, closePool };
