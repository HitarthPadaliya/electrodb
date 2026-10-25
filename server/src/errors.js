/**
 * Application errors carry the HTTP status and a stable machine code, so
 * controllers can stay thin and the error handler can answer consistently:
 *
 *   { "error": { "code": "FORBIDDEN", "message": "..." } }
 */
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

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict, tooManyRequests };
