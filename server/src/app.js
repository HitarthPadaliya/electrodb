const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const api = require('./routes/api');
const { configured } = require('./db/pool');
const { labEnabled } = require('./config/env');
const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:'], 'connect-src': ["'self'"]
} } }));
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
app.get('/api/status', (_req, res) => res.json({ data: { databaseConfigured: configured(), labEnabled } }));
app.use('/api', api);
app.use('/vendor/katex', express.static(path.resolve(__dirname, '../../node_modules/katex/dist'), { fallthrough: false, maxAge: '1d' }));
app.use(express.static(path.resolve(__dirname, '../../public'), { extensions: ['html'], maxAge: '1h' }));
app.get('/lab', (_req, res) => res.sendFile(path.resolve(__dirname, '../../public/index.html')));
app.use('/api', (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } }));
app.use((error, _req, res, _next) => {
  const status = error.status || (error.code === 'DB_NOT_CONFIGURED' ? 503 :
    error.code === 'ER_DUP_ENTRY' ? 409 :
    error.code === 'ER_NO_REFERENCED_ROW_2' ? 422 :
    error.code === 'ER_SIGNAL_EXCEPTION' ? 422 : 500);
  const message = [400, 409, 422, 503].includes(status)
    ? error.message : 'The request could not be completed. Check the server configuration and try again.';
  if (status === 500) console.error('API error:', error.code || error.name, error.message);
  res.status(status).json({ error: { code: status === 503 ? 'DATABASE_UNAVAILABLE' : status === 409 ? 'CONFLICT' : [400,422].includes(status) ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message } });
});
module.exports = app;
