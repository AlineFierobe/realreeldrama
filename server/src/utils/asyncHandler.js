// Express 4 doesn't catch errors thrown by async functions.
// This small helper forwards them to the error handler defined in index.js.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
