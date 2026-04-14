const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const sendEmail = require("../utils/sendEmail");
const moment = require("moment");

// @desc    Get all interviews for user
// @route   GET /api/interviews
// @access  Private
const getInterviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = { userId: req.user.id };

  // Add filters
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.type) {
    query.type = req.query.type;
  }

  if (req.query.interviewer) {
    query.interviewer = { $regex: req.query.interviewer, $options: "i" };
  }

  if (req.query.dateFrom || req.query.dateTo) {
    query.datetime = {};
    if (req.query.dateFrom) {
      query.datetime.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      query.datetime.$lte = new Date(req.query.dateTo);
    }
  }

  if (req.query.search) {
    query.$or = [
      { candidateName: { $regex: req.query.search, $options: "i" } },
      { position: { $regex: req.query.search, $options: "i" } },
      { candidateEmail: { $regex: req.query.search, $options: "i" } },
    ];
  }

  // Sort options
  let sortOptions = { datetime: 1 };
  if (req.query.sortBy) {
    const sortField = req.query.sortBy;
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    sortOptions = { [sortField]: sortOrder };
  }

  const interviews = await Interview.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .select("-attachments -schedulingHistory");

  const total = await Interview.countDocuments(query);

  res.json({
    success: true,
    count: interviews.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    interviews,
  });
});

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.id,
    userId: req.user.id,
  }).populate("userId", "name company");

  if (!interview) {
    return res.status(404).json({
      success: false,
      message: "Interview not found",
    });
  }

  res.json({
    success: true,
    interview,
  });
});

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.userId = req.user.id;

  // Validate future date
  const interviewDate = new Date(req.body.datetime);
  if (interviewDate <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "Interview date must be in the future",
    });
  }

  // Check for conflicts
  const conflictingInterview = await Interview.findOne({
    userId: req.user.id,
    interviewer: req.body.interviewer,
    datetime: {
      $gte: new Date(interviewDate.getTime() - 30 * 60000), // 30 min before
      $lte: new Date(
        interviewDate.getTime() + (req.body.duration || 60) * 60000
      ), // duration after
    },
    status: { $in: ["scheduled", "rescheduled"] },
  });

  if (conflictingInterview) {
    return res.status(409).json({
      success: false,
      message: "Interviewer has a conflicting appointment at this time",
    });
  }

  const interview = await Interview.create(req.body);

  // Update user's interview count
  await User.findByIdAndUpdate(req.user.id, {
    $inc: {
      "usage.interviewsThisMonth": 1,
      "usage.interviewsTotal": 1,
    },
  });

  // Send invitation email to candidate
  try {
    await sendInterviewInvitation(interview, req.user);
  } catch (error) {
    console.error("Failed to send invitation email:", error);
  }

  // Send notification to interviewer if different email
  if (
    interview.interviewerEmail &&
    interview.interviewerEmail !== req.user.email
  ) {
    try {
      await sendInterviewerNotification(interview, req.user);
    } catch (error) {
      console.error("Failed to send interviewer notification:", error);
    }
  }

  res.status(201).json({
    success: true,
    message: "Interview scheduled successfully",
    interview,
  });
});

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterview = asyncHandler(async (req, res) => {
  let interview = await Interview.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!interview) {
    return res.status(404).json({
      success: false,
      message: "Interview not found",
    });
  }

  // Store original datetime for comparison
  const originalDatetime = interview.datetime;

  interview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // If datetime changed, send rescheduling emails
  if (
    req.body.datetime &&
    new Date(req.body.datetime).getTime() !== originalDatetime.getTime()
  ) {
    try {
      await sendRescheduleNotification(interview, req.user);
    } catch (error) {
      console.error("Failed to send reschedule notification:", error);
    }
  }

  res.json({
    success: true,
    message: "Interview updated successfully",
    interview,
  });
});

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private
const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!interview) {
    return res.status(404).json({
      success: false,
      message: "Interview not found",
    });
  }

  // Send cancellation email
  try {
    await sendCancellationNotification(interview, req.user);
  } catch (error) {
    console.error("Failed to send cancellation notification:", error);
  }

  await interview.deleteOne();

  // Update user's interview count
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { "usage.interviewsThisMonth": -1 },
  });

  res.json({
    success: true,
    message: "Interview cancelled successfully",
  });
});

// @desc    Bulk create interviews from CSV
// @route   POST /api/interviews/bulk
// @access  Private
const bulkCreateInterviews = asyncHandler(async (req, res) => {
  const { candidates, interviewTemplate } = req.body;

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No candidates provided",
    });
  }

  if (!interviewTemplate) {
    return res.status(400).json({
      success: false,
      message: "Interview template is required",
    });
  }

  // Check subscription limits
  if (
    !req.user.canPerformAction("interview") &&
    req.user.usage.interviewsThisMonth + candidates.length > 50
  ) {
    return res.status(403).json({
      success: false,
      message: "Bulk upload would exceed your interview limit",
    });
  }

  const interviews = [];
  const errors = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    try {
      // Calculate interview datetime (schedule them with intervals)
      const baseDate = new Date(
        interviewTemplate.datetime || Date.now() + 24 * 60 * 60 * 1000
      );
      const interviewDate = new Date(
        baseDate.getTime() +
          i * (interviewTemplate.intervalMinutes || 60) * 60 * 1000
      );

      const interviewData = {
        candidateName: candidate.name || candidate.candidateName,
        candidateEmail: candidate.email || candidate.candidateEmail,
        candidatePhone: candidate.phone || candidate.candidatePhone,
        position: candidate.position || interviewTemplate.position,
        department: candidate.department || interviewTemplate.department,
        interviewer: interviewTemplate.interviewer || "TBD",
        interviewerEmail: interviewTemplate.interviewerEmail,
        datetime: interviewDate,
        duration: interviewTemplate.duration || 60,
        type: interviewTemplate.type || "video",
        stage: interviewTemplate.stage || "screening",
        notes: interviewTemplate.notes || `Bulk imported candidate`,
        userId: req.user.id,
      };

      interviews.push(interviewData);
    } catch (error) {
      errors.push({
        candidate: candidate.name || candidate.email,
        error: error.message,
      });
    }
  }

  if (interviews.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid interviews could be created",
      errors,
    });
  }

  const createdInterviews = await Interview.insertMany(interviews);

  // Update user's interview count
  await User.findByIdAndUpdate(req.user.id, {
    $inc: {
      "usage.interviewsThisMonth": createdInterviews.length,
      "usage.interviewsTotal": createdInterviews.length,
    },
  });

  // Send bulk invitation emails (limit to prevent spam)
  const maxEmails = 20;
  const emailPromises = createdInterviews
    .slice(0, maxEmails)
    .map(async (interview) => {
      try {
        await sendInterviewInvitation(interview, req.user);
      } catch (error) {
        console.error(
          `Failed to send invitation to ${interview.candidateEmail}:`,
          error
        );
      }
    });

  await Promise.allSettled(emailPromises);

  res.status(201).json({
    success: true,
    message: `${createdInterviews.length} interviews created successfully`,
    count: createdInterviews.length,
    interviews: createdInterviews,
    errors: errors.length > 0 ? errors : undefined,
    emailsSent: Math.min(createdInterviews.length, maxEmails),
  });
});

// @desc    Get interview statistics
// @route   GET /api/interviews/stats
// @access  Private
const getInterviewStats = asyncHandler(async (req, res) => {
  const stats = await Interview.getStats(req.user.id);
  const monthlyTrends = await Interview.getMonthlyTrends(req.user.id);

  // Calculate success rate
  const successRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Format monthly trends for charts
  const chartData = monthlyTrends.map((trend) => ({
    month: moment()
      .year(trend._id.year)
      .month(trend._id.month - 1)
      .format("MMM YYYY"),
    interviews: trend.total,
    completed: trend.completed,
  }));

  // Get upcoming interviews
  const upcomingInterviews = await Interview.getUpcoming(req.user.id, 5);

  res.json({
    success: true,
    totalInterviews: stats.total,
    activeCandidates: stats.scheduled,
    completedThisMonth: stats.completed,
    successRate,
    averageRating: Math.round(stats.avgRating * 10) / 10,
    chartData,
    upcomingInterviews,
    monthlyTrends,
  });
});

// @desc    Get recent interviews
// @route   GET /api/interviews/recent
// @access  Private
const getRecentInterviews = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("candidateName position datetime status type interviewer");

  const chartData = [
    { month: "Jan", interviews: 20 },
    { month: "Feb", interviews: 32 },
    { month: "Mar", interviews: 28 },
    { month: "Apr", interviews: 45 },
    { month: "May", interviews: 38 },
    { month: "Jun", interviews: 52 },
  ];

  res.json({
    success: true,
    interviews: interviews.map((interview) => ({
      id: interview._id,
      candidate: interview.candidateName,
      position: interview.position,
      date: moment(interview.datetime).format("YYYY-MM-DD"),
      time: moment(interview.datetime).format("hh:mm A"),
      status: interview.status,
      type: interview.type,
      interviewer: interview.interviewer,
    })),
    chartData,
  });
});

// @desc    Get calendar data
// @route   GET /api/interviews/calendar
// @access  Private
const getCalendarData = asyncHandler(async (req, res) => {
  const { start, end } = req.query;

  let query = { userId: req.user.id };

  if (start && end) {
    query.datetime = {
      $gte: new Date(start),
      $lte: new Date(end),
    };
  }

  const interviews = await Interview.find(query)
    .select(
      "candidateName position datetime endDateTime type status interviewer location meetingLink"
    )
    .sort({ datetime: 1 });

  const events = interviews.map((interview) => ({
    id: interview._id,
    title: `${interview.candidateName} - ${interview.position}`,
    start: interview.datetime,
    end:
      interview.endDateTime ||
      new Date(interview.datetime.getTime() + 60 * 60 * 1000),
    type: interview.type,
    status: interview.status,
    interviewer: interview.interviewer,
    location: interview.location,
    meetingLink: interview.meetingLink,
  }));

  res.json({
    success: true,
    events,
  });
});

// Helper functions for email notifications
const sendInterviewInvitation = async (interview, user) => {
  const interviewDate = moment(interview.datetime);

  const message = `
    Dear ${interview.candidateName},

    You have been invited to an interview for the position of ${
      interview.position
    } at ${user.company}.

    Interview Details:
    📅 Date: ${interviewDate.format("MMMM DD, YYYY")}
    ⏰ Time: ${interviewDate.format("hh:mm A")}
    ⏱️ Duration: ${interview.duration} minutes
    🎥 Type: ${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
    👨‍💼 Interviewer: ${interview.interviewer}

    ${
      interview.type === "video" && interview.meetingLink
        ? `🔗 Meeting Link: ${interview.meetingLink}
      🆔 Meeting ID: ${interview.meetingId}
      🔐 Password: ${interview.meetingPassword}`
        : ""
    }

    ${
      interview.type === "in-person" && interview.location
        ? `📍 Location: ${interview.location.address || "Office location"}`
        : ""
    }

    ${interview.notes ? `📝 Additional Notes: ${interview.notes}` : ""}

    Please confirm your attendance by replying to this email or contacting us directly.

    We look forward to speaking with you!

    Best regards,
    ${user.name}
    ${user.company}
  `;

  await sendEmail({
    email: interview.candidateEmail,
    subject: `Interview Invitation - ${interview.position} at ${user.company}`,
    message,
  });
};

const sendInterviewerNotification = async (interview, user) => {
  const interviewDate = moment(interview.datetime);

  const message = `
    Hi ${interview.interviewer},

    You have been assigned to conduct an interview:

    Candidate: ${interview.candidateName}
    Position: ${interview.position}
    Date: ${interviewDate.format("MMMM DD, YYYY")}
    Time: ${interviewDate.format("hh:mm A")}
    Duration: ${interview.duration} minutes
    Type: ${interview.type}

    Candidate Email: ${interview.candidateEmail}
    ${interview.candidatePhone ? `Phone: ${interview.candidatePhone}` : ""}

    ${
      interview.type === "video" && interview.meetingLink
        ? `Meeting Link: ${interview.meetingLink}`
        : ""
    }

    Please review the candidate's information and prepare accordingly.

    Best regards,
    ${user.name}
  `;

  await sendEmail({
    email: interview.interviewerEmail,
    subject: `New Interview Assignment - ${interview.candidateName}`,
    message,
  });
};

const sendRescheduleNotification = async (interview, user) => {
  const newDate = moment(interview.datetime);

  const message = `
    Dear ${interview.candidateName},

    Your interview for the position of ${
      interview.position
    } has been rescheduled.

    New Interview Details:
    📅 Date: ${newDate.format("MMMM DD, YYYY")}
    ⏰ Time: ${newDate.format("hh:mm A")}

    All other details remain the same. We apologize for any inconvenience.

    Best regards,
    ${user.company}
  `;

  await sendEmail({
    email: interview.candidateEmail,
    subject: `Interview Rescheduled - ${interview.position}`,
    message,
  });
};

const sendCancellationNotification = async (interview, user) => {
  const message = `
    Dear ${interview.candidateName},

    We regret to inform you that your interview for the position of ${
      interview.position
    } 
    scheduled for ${moment(interview.datetime).format(
      "MMMM DD, YYYY"
    )} has been cancelled.

    We will be in touch if there are future opportunities that match your profile.

    Thank you for your interest in ${user.company}.

    Best regards,
    ${user.company}
  `;

  await sendEmail({
    email: interview.candidateEmail,
    subject: `Interview Cancelled - ${interview.position}`,
    message,
  });
};

module.exports = {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  bulkCreateInterviews,
  getInterviewStats,
  getRecentInterviews,
  getCalendarData,
};
