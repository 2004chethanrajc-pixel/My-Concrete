import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // If it's not an ApiError, mask the error details in production
  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development mode
  if (config.env === 'development') {
    response.stack = err.stack;
  }

  // Log error details
  console.error({
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    stack: err.stack,
  });

  res.status(statusCode).json(response);
};
