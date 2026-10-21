const app = require('./app');
const { port } = require('./config/env');
const { closePool, configured, getPool } = require('./db/pool');
if (configured()) getPool();
const server = app.listen(port, '0.0.0.0', () => console.log(`ElectroDB listening on http://0.0.0.0:${port}`));
let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`${signal}: shutting down ElectroDB`);
  server.close(async () => { await closePool(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
