const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const catalogueRoutes = require('./routes/catalogueRoutes');
const labRoutes = require('./routes/labRoutes');

const app = express();

// Security middleware with relaxed CSP for local development and KaTeX CDN
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from public/
const publicDir = path.resolve(__dirname, '../../public');
app.use(express.static(publicDir));

// Mount API routes
app.use('/api', catalogueRoutes);

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
