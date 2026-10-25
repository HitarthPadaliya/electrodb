const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { config } = require('./config');
const { errorHandler } = require('./errors');
const { pool } = require('./db');

const {
  authRouter,
  userRouter,
  adminRouter,
  catalogueRouter,
  contentRouter,
  labRouter,
  attachUser
} = require('./routes');

const app = express();

if (config.trustProxy) app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

app.use('/api', attachUser);

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

app.use('/api', catalogueRouter);
app.use('/api', contentRouter);

if (config.enableLabConsole) {
  app.use('/api/lab', labRouter);
}

app.use('/api/*', (req, res, next) => {
  const error = new Error(`API endpoint not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(errorHandler);

function start() {
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

  const gracefulShutdown = signal => {
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
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  return server;
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
