const User = require('../models/User')
const { asyncHandler } = require('../middleware/errorHandler')

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('preferences subscription usage')

  res.json({
    success: true,
    settings: {
      preferences: user.preferences,
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        trialEndDate: user.subscription.trialEndDate,
        limits: getLimitsForPlan(user.subscription.plan)
      },
      usage: user.usage
    }
  })
})

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
  const { preferences } = req.body

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { preferences },
    { new: true, runValidators: true }
  ).select('preferences')

  res.json({
    success: true,
    message: 'Settings updated successfully',
    settings: {
      preferences: user.preferences
    }
  })
})

// @desc    Update notification preferences
// @route   PUT /api/settings/notifications
// @access  Private
const updateNotifications = asyncHandler(async (req, res) => {
  const { notifications } = req.body

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { 'preferences.notifications': notifications },
    { new: true }
  ).select('preferences.notifications')

  res.json({
    success: true,
    message: 'Notification preferences updated',
    notifications: user.preferences.notifications
  })
})

// @desc    Get usage statistics
// @route   GET /api/settings/usage
// @access  Private
const getUsage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('subscription usage')
  const limits = getLimitsForPlan(user.subscription.plan)

  const usagePercentages = {
    interviews: limits.interviews > 0 ? Math.round((user.usage.interviewsThisMonth / limits.interviews) * 100) : 0,
    storage: limits.storage > 0 ? Math.round((user.usage.storageUsed / limits.storage) * 100) : 0,
    apiCalls: limits.apiCalls > 0 ? Math.round((user.usage.apiCallsThisMonth / limits.apiCalls) * 100) : 0
  }

  res.json({
    success: true,
    usage: user.usage,
    limits,
    percentages: usagePercentages,
    plan: user.subscription.plan,
    status: user.subscription.status
  })
})

// @desc    Reset API usage (admin only)
// @route   POST /api/settings/reset-usage
// @access  Private/Admin
const resetUsage = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    'usage.interviewsThisMonth': 0,
    'usage.apiCallsThisMonth': 0,
    'usage.lastResetDate': new Date()
  })

  res.json({
    success: true,
    message: 'Usage statistics reset successfully'
  })
})

// Helper function to get limits for a plan
const getLimitsForPlan = (plan) => {
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

  return limits[plan] || limits.starter
}

module.exports = {
  getSettings,
  updateSettings,
  updateNotifications,
  getUsage,
  resetUsage
}