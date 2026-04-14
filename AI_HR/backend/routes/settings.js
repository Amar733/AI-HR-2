const express = require('express')
const {
  getSettings,
  updateSettings,
  updateNotifications,
  getUsage,
  resetUsage
} = require('../controllers/settingsController')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// All routes are protected
router.use(protect)

router.route('/').get(getSettings).put(updateSettings)
router.put('/notifications', updateNotifications)
router.get('/usage', getUsage)
router.post('/reset-usage', authorize('admin'), resetUsage)

module.exports = router