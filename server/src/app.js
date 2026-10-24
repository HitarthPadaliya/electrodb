const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const catalogueRoutes = require('./routes/catalogueRoutes');
const labRoutes = require('./routes/labRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');
const { attachUser } = require('./middleware/auth');

const app = express();

// Behind a reverse proxy the client address lives in X-Forwarded-For; only
// trust it when the deployment says so (rate limiting keys on req.ip).
if (config.trustProxy) app.set('trust proxy', 1);

// Security middleware with relaxed CSP for local development and KaTeX CDN
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
// A JSON body larger than this is not a legitimate request to this API.
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// Serve frontend static assets from public/
const publicDir = path.resolve(__dirname, '../../public');
app.use(express.static(publicDir));

// Resolve the session once per API request. Public routes simply carry a null
// user when no valid cookie is present.
app.use('/api', attachUser);

// Account, personalization and administration routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Public catalogue routes, then the guarded content-management routes
app.use('/api', catalogueRoutes);
app.use('/api', contentRoutes);

if (config.enableLabConsole) {
  app.use('/api/lab', labRoutes);
}

// 404 handler for unknown API routes
app.use('/api/*', (req, res, next) => {
  const error = new Error(`API endpoint not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Fallback to index.html for client-side navigation (SPA)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
