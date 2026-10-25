class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = status;
    this.code = code;
    this.details = details;
    this.expose = status < 500;
  }
}

const badRequest = (message, details) => new AppError(message, { status: 400, code: 'BAD_REQUEST', details });
const unauthorized = (message = 'Authentication required.', code = 'UNAUTHENTICATED') =>
  new AppError(message, { status: 401, code });
const forbidden = (message = 'You do not have permission to do that.', code = 'FORBIDDEN') =>
  new AppError(message, { status: 403, code });
const notFound = (message = 'Resource not found.', code = 'NOT_FOUND') =>
  new AppError(message, { status: 404, code });
const conflict = (message, code = 'CONFLICT') => new AppError(message, { status: 409, code });
const tooManyRequests = (message = 'Too many attempts. Try again shortly.', retryAfterSeconds = 60) => {
  const error = new AppError(message, { status: 429, code: 'RATE_LIMITED' });
  error.retryAfterSeconds = retryAfterSeconds;
  return error;
};

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

    const status = Number(err.statusCode) || (err.name === 'ValidationError' ? 400 : 500);
  if (status >= 400 && status < 500) {
    if (status === 429 && err.retryAfterSeconds) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
    }
    return send(status, err.code, err.message, err.details);
  }

    send(500, 'INTERNAL_SERVER_ERROR', 'An unexpected database or server error occurred.');
}

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  errorHandler
};
