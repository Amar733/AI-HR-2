const cron = require('node-cron')
const Job = require('../models/Job')
const InterviewSession = require('../models/InterviewSession')
const User = require('../models/User')
const fs = require('fs')
const path = require('path')

// Clean up expired interview sessions every hour
const cleanupExpiredSessions = cron.schedule('0 * * * *', async () => {
  try {
    console.log('🧹 Running cleanup of expired interview sessions...')

    const expiredSessions = await InterviewSession.find({
      status: { $in: ['started', 'in_progress'] },
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours old
    })

    for (const session of expiredSessions) {
      session.status = 'abandoned'
      await session.save()
    }

    console.log(`✅ Cleaned up ${expiredSessions.length} expired sessions`)
  } catch (error) {
    console.error('❌ Cleanup job failed:', error)
  }
}, {
  scheduled: false
})

// Send daily analytics report to users
const sendDailyReports = cron.schedule('0 9 * * *', async () => {
  try {
    console.log('📊 Sending daily analytics reports...')

    const users = await User.find({
      'preferences.notifications.dailyReport': true,
      role: { $in: ['admin', 'hr_manager'] }
    })

    for (const user of users) {
      // Generate daily report
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const jobs = await Job.find({ userId: user._id })
      const jobIds = jobs.map(job => job._id)

      const dailyStats = await InterviewSession.aggregate([
        {
          $match: {
            jobId: { $in: jobIds },
            createdAt: { $gte: yesterday }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])

      // Send email report (implementation depends on email service)
      console.log(`📧 Daily report generated for ${user.email}`)
    }

  } catch (error) {
    console.error('❌ Daily report job failed:', error)
  }
}, {
  scheduled: false
})

// Clean up old temporary files every day at midnight
const cleanupTempFiles = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🗑️  Cleaning up temporary files...')

    const tempDir = path.join(__dirname, '../temp')
    const uploadsDir = path.join(__dirname, '../uploads/interviews')

    // Clean files older than 7 days
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Clean temp directory
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir)
      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(tempDir, file)
        const stats = fs.statSync(filePath)

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          deletedCount++
        }
      }

      console.log(`🗑️  Deleted ${deletedCount} old temporary files`)
    }

  } catch (error) {
    console.error('❌ File cleanup job failed:', error)
  }
}, {
  scheduled: false
})

// Update job statistics every 6 hours
const updateJobStatistics = cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('📈 Updating job statistics...')

    const jobs = await Job.find({ isActive: true })
    let updatedCount = 0

    for (const job of jobs) {
      await job.updateStatistics()
      updatedCount++
    }

    console.log(`📈 Updated statistics for ${updatedCount} jobs`)
  } catch (error) {
    console.error('❌ Statistics update job failed:', error)
  }
}, {
  scheduled: false
})

// Send interview reminders (for scheduled interviews)
const sendInterviewReminders = cron.schedule('*/30 * * * *', async () => {
  try {
    console.log('⏰ Checking for interview reminders...')

    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    // This would be for traditional scheduled interviews, not AI interviews
    // Implementation depends on your interview scheduling model

    console.log('⏰ Interview reminder check completed')
  } catch (error) {
    console.error('❌ Interview reminder job failed:', error)
  }
}, {
  scheduled: false
})

// Start all scheduled jobs
const startScheduledJobs = () => {
  if (process.env.ENABLE_CRON_JOBS === 'true') {
    console.log('⏰ Starting scheduled jobs...')

    cleanupExpiredSessions.start()
    sendDailyReports.start()
    cleanupTempFiles.start()
    updateJobStatistics.start()
    sendInterviewReminders.start()

    console.log('✅ All scheduled jobs started')
  } else {
    console.log('⏰ Scheduled jobs are disabled')
  }
}

// Stop all scheduled jobs
const stopScheduledJobs = () => {
  console.log('⏸️  Stopping scheduled jobs...')

  cleanupExpiredSessions.stop()
  sendDailyReports.stop()
  cleanupTempFiles.stop()
  updateJobStatistics.stop()
  sendInterviewReminders.stop()

  console.log('✅ All scheduled jobs stopped')
}

module.exports = {
  startScheduledJobs,
  stopScheduledJobs,
  cleanupExpiredSessions,
  sendDailyReports,
  cleanupTempFiles,
  updateJobStatistics
}