import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  console.error('🔥 [Server Error]', err);

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      error: errorMessages,
      details: err.errors,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
