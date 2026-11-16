/**
 * Consistent API error handling (prd/agent.md section 14).
 * Operational errors carry an HTTP status; anything else is treated as a
 * server error and its details are not leaked to the client.
 */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorised(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Not authorised') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }
}

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;

  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  // Prisma known request errors -> safe, useful responses.
  if (error?.code === 'P2002') {
    res.status(409).json({ error: 'That record already exists.' });
    return;
  }
  if (error?.code === 'P2025') {
    res.status(404).json({ error: 'Record not found.' });
    return;
  }

  console.error('[api] unhandled error:', error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
