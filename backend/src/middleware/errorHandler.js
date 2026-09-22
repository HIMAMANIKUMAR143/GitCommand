export function errorHandler(err, req, res, next) {
  console.error('API Error:', err.message, err.stack);

  const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal error occurred',
    timestamp: new Date().toISOString()
  });
}
