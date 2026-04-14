const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { asyncHandler } = require('./errorHandler')

// Protect routes - require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        })
      }

      if (!req.user.isActive) {
        return res.status(401).json({ 
          success: false,
          message: 'Account has been deactivated' 
        })
      }

      // Update last login time
      req.user.lastLogin = new Date()
      await req.user.save({ validateBeforeSave: false })

      next()
    } catch (error) {
      console.error('Token verification error:', error)
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, token failed' 
      })
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token provided' 
    })
  }
})

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource` 
      })
    }

    next()
  }
}

// Check subscription limits
const checkSubscriptionLimits = (feature) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user

    // Get subscription limits based on plan
    const limits = {
      starter: {
        interviews: 50,
        storage: 1000, // MB
        apiCalls: 1000
      },
      professional: {
        interviews: 200,
        storage: 5000,
        apiCalls: 5000
      },
      enterprise: {
        interviews: -1, // unlimited
        storage: -1,
        apiCalls: -1
      }
    }

    const userLimits = limits[user.subscription.plan] || limits.starter

    // Check trial period
    if (user.subscription.status === 'trial' && new Date() > user.subscription.trialEndDate) {
      return res.status(403).json({
        success: false,
        message: 'Trial period has expired. Please upgrade your subscription.',
        code: 'TRIAL_EXPIRED'
      })
    }

    // Check subscription status
    if (user.subscription.status !== 'active' && user.subscription.status !== 'trial') {
      return res.status(403).json({
        success: false,
        message: 'Subscription is not active. Please update your payment method.',
        code: 'SUBSCRIPTION_INACTIVE'
      })
    }

    // Check feature limits
    if (feature === 'interviews') {
      if (userLimits.interviews !== -1 && user.usage.interviewsThisMonth >= userLimits.interviews) {
        return res.status(403).json({
          success: false,
          message: `Interview limit exceeded for your ${user.subscription.plan} plan`,
          limit: userLimits.interviews,
          current: user.usage.interviewsThisMonth,
          code: 'INTERVIEW_LIMIT_EXCEEDED'
        })
      }
    }

    if (feature === 'storage') {
      if (userLimits.storage !== -1 && user.usage.storageUsed >= userLimits.storage) {
        return res.status(403).json({
          success: false,
          message: `Storage limit exceeded for your ${user.subscription.plan} plan`,
          limit: userLimits.storage,
          current: user.usage.storageUsed,
          code: 'STORAGE_LIMIT_EXCEEDED'
        })
      }
    }

    if (feature === 'apiCalls') {
      if (userLimits.apiCalls !== -1 && user.usage.apiCallsThisMonth >= userLimits.apiCalls) {
        return res.status(403).json({
          success: false,
          message: `API call limit exceeded for your ${user.subscription.plan} plan`,
          limit: userLimits.apiCalls,
          current: user.usage.apiCallsThisMonth,
          code: 'API_LIMIT_EXCEEDED'
        })
      }

      // Increment API call counter
      await User.findByIdAndUpdate(user._id, {
        $inc: { 'usage.apiCallsThisMonth': 1 }
      })
    }

    next()
  })
}

// Optional auth - doesn't require authentication but adds user if authenticated
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    } catch (error) {
      // Continue without user if token is invalid
      console.log('Optional auth failed:', error.message)
    }
  }

  next()
})

module.exports = {
  protect,
  authorize,
  checkSubscriptionLimits,
  optionalAuth
}