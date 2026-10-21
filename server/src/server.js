const app = require('./app');
const config = require('./config');
const pool = require('./db/pool');

const server = app.listen(config.port, async () => {
  console.log(`====================================================`);
  console.log(` ElectroDB Backend API Server`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Listening on: http://localhost:${config.port}`);
  console.log(` Lab Console : ${config.enableLabConsole ? 'Enabled (/api/lab)' : 'Disabled'}`);
  console.log(`====================================================`);

  try {
    const health = await pool.checkHealth();
    console.log(`[DB] Connected to MySQL/MariaDB database: ${config.db.database}`);
    console.log(`[DB] Server Version: ${health.db_version}`);
  } catch (err) {
    console.error(`[DB Error] Unable to connect to MySQL database at ${config.db.host}:${config.db.port}`);
    console.error(`[DB Error] ${err.message}`);
    console.error(`[DB Note] Verify that MySQL/MariaDB is running and credentials in .env are correct.`);
  }
});

async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.closePool();
      console.log('Database connection pool closed.');
    } catch (err) {
      console.error('Error closing database pool:', err.message);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = server;
