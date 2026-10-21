/**
 * Centralized error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log server-side for development diagnostics
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);
  }

  // Handle deliberate MySQL / MariaDB SIGNAL SQLSTATE '45000' errors
  if (err.sqlState === '45000') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: err.sqlMessage || err.message
      }
    });
  }

  // Handle unique constraint violations
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this identifier or unique value already exists.'
      }
    });
  }

  // Handle foreign key constraint violations
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'The referenced parent record does not exist.'
      }
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      error: {
        code: 'REFERENCED_ROW_DEPENDENCY',
        message: 'Cannot delete or update row because other records depend on it.'
      }
    });
  }

  // Handle validation or 400 Bad Request
  if (err.statusCode === 400 || err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: err.message
      }
    });
  }

  // Handle 404 Not Found
  if (err.statusCode === 404) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message || 'Resource not found'
      }
    });
  }

  // Default internal server error (never leak raw SQL or stack traces)
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected database or server error occurred.'
    }
  });
}

module.exports = errorHandler;
