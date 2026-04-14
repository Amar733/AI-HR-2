const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error for debugging
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with ID: ${err.value}`
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    let message = 'Duplicate field value entered'

    // Extract field name from error
    const field = Object.keys(err.keyValue)[0]
    const value = err.keyValue[field]

    if (field === 'email') {
      message = `User with email '${value}' already exists`
    } else {
      message = `${field} '${value}' already exists`
    }

    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired'
    error = { message, statusCode: 401 }
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError') {
    const message = 'Database connection error'
    error = { message, statusCode: 500 }
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large'
    error = { message, statusCode: 400 }
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field'
    error = { message, statusCode: 400 }
  }

  // Express validator errors
  if (err.array && typeof err.array === 'function') {
    const message = err.array().map(e => e.msg).join(', ')
    error = { message, statusCode: 400 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  })
}

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFound
}