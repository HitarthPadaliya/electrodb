const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: config.db.waitForConnections,
      connectionLimit: config.db.connectionLimit,
      queueLimit: config.db.queueLimit,
      charset: config.db.charset,
      multipleStatements: false,
      dateStrings: true
    });
  }
  return pool;
}

/**
 * Execute parameterized SQL query
 */
async function query(sql, params = []) {
  const connection = await getPool().getConnection();
  try {
    const [rows, fields] = await connection.query(sql, params);
    return [rows, fields];
  } finally {
    connection.release();
  }
}

/**
 * Call a stored procedure with parameters
 */
async function executeProcedure(procName, params = []) {
  const placeholders = params.map(() => '?').join(',');
  const sql = `CALL ${procName}(${placeholders})`;
  const connection = await getPool().getConnection();
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

/**
 * Health check query (SELECT 1)
 */
async function checkHealth() {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query('SELECT 1 AS healthy, CURRENT_TIMESTAMP AS server_time, VERSION() AS db_version');
    return rows[0];
  } finally {
    connection.release();
  }
}

/**
 * Close connection pool on application shutdown
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  executeProcedure,
  checkHealth,
  closePool
};
