/**
 * Centralized error handler middleware.
 *
 * The response shape is always `{ error: { code, message } }`. Internal detail
 * (SQL text, stack traces, driver errors, credentials) never reaches the
 * client - it is logged server-side instead.
 */
const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_FAILED',
  429: 'RATE_LIMITED'
};

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);
  }

  const send = (status, code, message, details) =>
    res.status(status).json({
      error: {
        code: code || DEFAULT_CODES[status] || 'REQUEST_FAILED',
        message,
        ...(details ? { details } : {})
      }
    });

  // Deliberate MySQL/MariaDB SIGNAL SQLSTATE '45000' errors from the stored
  // programs are validation failures, not server faults.
  if (err.sqlState === '45000') {
    return send(422, 'VALIDATION_FAILED', err.sqlMessage || err.message);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return send(409, 'DUPLICATE_ENTRY', 'A record with this identifier or unique value already exists.');
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return send(400, 'FOREIGN_KEY_VIOLATION', 'The referenced parent record does not exist.');
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return send(409, 'REFERENCED_ROW_DEPENDENCY', 'Cannot delete or update row because other records depend on it.');
  }

  // Application errors (AppError, ValidationError) carry their own status.
  const status = Number(err.statusCode) || (err.name === 'ValidationError' ? 400 : 500);
  if (status >= 400 && status < 500) {
    if (status === 429 && err.retryAfterSeconds) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
    }
    return send(status, err.code, err.message, err.details);
  }

  // Anything else is a genuine server fault: log it, say nothing specific.
  send(500, 'INTERNAL_SERVER_ERROR', 'An unexpected database or server error occurred.');
}

module.exports = errorHandler;
