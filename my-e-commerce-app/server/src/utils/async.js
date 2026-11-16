/**
 * Wrap an async Express handler so rejected promises reach the error middleware.
 * Without this, an async route that throws would hang the request.
 */
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export default asyncHandler;
