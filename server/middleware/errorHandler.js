// Global error handler
const { error } = require('../utils/apiResponse');

const fs = require('fs');

const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error caught by middleware:', err.stack);
  fs.appendFileSync('error_debug.log', new Date().toISOString() + ' - ' + err.stack + '\n');

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return error(res, `Validation Error: ${messages.join(', ')}`, 400);
  }

  if (err.code === 11000) {
    return error(res, `Duplicate field value entered. Please use another value.`, 400);
  }

  if (err.name === 'CastError') {
    return error(res, `Invalid ID format for ${err.path}`, 400);
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return error(res, 'Authorization token is invalid or has expired', 401);
  }

  return error(res, err.message || 'Internal Server Error', err.statusCode || 500);
};

module.exports = errorHandler;
