import { HttpError } from '../utils/HttpError.js';

// MySQL errors that mean "the database can't be reached or isn't set up", not "the code is broken".
const MYSQL_UNAVAILABLE = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_NO_SUCH_TABLE',
]);

// Unknown /api/* routes get a JSON 404 instead of an HTML page.
export function apiNotFound(req, res) {
  res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` });
}

// Every error thrown in a route ends up here, so all error responses share one shape:
// { error: "message", details?: { field: "message" } }
export function errorHandler(err, req, res, next) {
  if (MYSQL_UNAVAILABLE.has(err.code)) {
    console.error(`MySQL unavailable: ${err.code}`);
    err = new HttpError(503, 'SQL database is currently unavailable.');
  }

  const status = err.status || 500;
  if (!err.status) console.error(err); // unexpected errors only; expected ones are already explained

  res.status(status).json({
    // Don't leak internal error text (SQL errors, stack traces) to the browser.
    error: err.status ? err.message : 'Something went wrong on our side. Please try again.',
    ...(err.details && { details: err.details }),
  });
}
