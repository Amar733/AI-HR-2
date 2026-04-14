const express = require('express')
const {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  bulkCreateInterviews,
  getInterviewStats,
  getRecentInterviews,
  getCalendarData
} = require('../controllers/interviewController')
const { protect, checkSubscriptionLimits } = require('../middleware/auth')
const { validate, validationRules } = require('../middleware/validation')

const router = express.Router()

// All routes are protected
router.use(protect)

// Routes
router
  .route('/')
  .get(validationRules.pagination, validate, getInterviews)
  .post(
    checkSubscriptionLimits('interviews'),
    validationRules.interviewCreate,
    validate,
    createInterview
  )

router.post(
  '/bulk',
  checkSubscriptionLimits('interviews'),
  bulkCreateInterviews
)

router.get('/stats', getInterviewStats)
router.get('/recent', getRecentInterviews)
router.get('/calendar', getCalendarData)

router
  .route('/:id')
  .get(validationRules.mongoId, validate, getInterview)
  .put(
    validationRules.mongoId,
    validationRules.interviewUpdate,
    validate,
    updateInterview
  )
  .delete(validationRules.mongoId, validate, deleteInterview)

module.exports = router