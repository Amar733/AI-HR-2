// controllers/jobController.js

const Job = require("../models/Job");
const InterviewSession = require("../models/InterviewSession");
const { asyncHandler } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/sendEmail");
const AIAnalysisService = require("../services/aiAnalysisService");
const Resumes = require("../models/Resumes");
const fsPromises = require("fs").promises;
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

async function extractTextFromFile(filePath, mimetype, originalName) {
  try {
    const lower = originalName.toLowerCase();
    const buffer = await fsPromises.readFile(filePath);

    if (mimetype === "application/pdf" || lower.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      return data.text || "";
    }

    if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lower.endsWith(".docx")
    ) {
      const res = await mammoth.extractRawText({ buffer });
      return res.value || "";
    }

    // fallback for .doc and other formats using textract
    return await new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, (err, text) => {
        if (err) return reject(err);
        resolve(text || "");
      });
    });
  } catch (err) {
    return "";
  }
}

/** Heuristic extractors **/
function extractEmail(text) {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}
function extractPhone(text) {
  const m = text.match(/(\+?\d[\d\-\s().]{6,}\d)/);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}
function extractName(text) {
  // take first non-empty line that doesn't look like email/phone and is shortish
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 60 &&
      !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line) &&
      !/(\+?\d[\d\-\s().]{6,}\d)/.test(line)
    ) {
      // simple heuristic: if line contains letters and maybe spaces
      if (/[A-Za-z]/.test(line)) return line;
    }
  }
  return null;
}

function matchSkills(text, requiredSkills = []) {
  const found = [];
  if (!text || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return { matched: [], score: 0 };
  }

  const lower = text.toLowerCase();

  for (const s of requiredSkills) {
    if (typeof s.skill !== "string") continue; // skip non-string skills
    const token = s.skill.toLowerCase().trim();
    if (!token) continue;

    // match whole words where possible
    const pattern = new RegExp(`\\b${escapeRegExp(token)}\\b`, "i");
    if (pattern.test(lower)) found.push(s.skill);
    else if (lower.includes(token)) found.push(s.skill); // fallback substring
  }

  const score = requiredSkills.length
    ? Math.round((found.length / requiredSkills.length) * 100)
    : 0;

  return { matched: Array.from(new Set(found)), score };
}

// helper to escape regex characters (for skill tokens)
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Helper: Check job ownership
const checkJobOwnership = async (jobId, userId) => {
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const err = new Error("Job not found");
    err.statusCode = 404;
    throw err;
  }
  return job;
};

// @desc    Get all jobs for user
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { userId: req.user.id };

  if (req.query.status) {
    query.isActive = req.query.status === "active";
  }
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { position: { $regex: req.query.search, $options: "i" } },
      { department: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name company");
  const total = await Job.countDocuments(query);

  res.json({
    success: true,
    count: jobs.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    jobs,
  });
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    userId: req.user.id,
  }).populate("userId", "name company");
  if (!job)
    return res.status(404).json({ success: false, message: "Job not found" });

  const interviewStats = await InterviewSession.getSessionStats(job._id);
  res.json({ success: true, job: { ...job.toObject(), interviewStats } });
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
const createJob = asyncHandler(async (req, res) => {
  req.body.userId = req.user.id;
  req.body.createdBy = { name: req.user.name, email: req.user.email };
  const job = await Job.create(req.body);
  res
    .status(201)
    .json({ success: true, message: "Job created successfully", job });
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findOne({ _id: req.params.id, userId: req.user.id });
  if (!job)
    return res.status(404).json({ success: false, message: "Job not found" });
  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, message: "Job updated successfully", job });
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, userId: req.user.id });
  if (!job)
    return res.status(404).json({ success: false, message: "Job not found" });

  const activeInterviews = await InterviewSession.countDocuments({
    jobId: job._id,
    status: { $in: ["started", "in_progress", "paused"] },
  });
  if (activeInterviews > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete job with active interviews",
    });
  }

  await job.deleteOne();
  res.json({ success: true, message: "Job deleted successfully" });
});

// @desc    Generate AI questions
// @route   POST /api/jobs/:id/generate-questions
// @access  Private
const generateQuestions = asyncHandler(async (req, res) => {
  const job = await checkJobOwnership(req.params.id, req.user.id);
  try {
    const questions = await new AIAnalysisService().generateQuestions(job);
    await Job.updateOne(
      { _id: job._id, userId: req.user.id },
      { $set: { aiQuestions: questions } }
    );
    res.json({
      success: true,
      message: "Questions generated successfully",
      questions,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to generate questions" });
  }
});

// @desc    Invite candidates (batched)
// @route   POST /api/jobs/:id/invite
// @access  Private
const inviteCandidates = asyncHandler(async (req, res) => {
  const job = await checkJobOwnership(req.params.id, req.user.id);

  // Support both shapes:
  // 1) { candidates: { candidates: [...] } }   (your posted shape)
  // 2) { candidates: [...] }                   (convenience)
  const rawCandidates = req.body && req.body.candidates;
  let candidateArray = [];

  if (Array.isArray(rawCandidates)) {
    candidateArray = rawCandidates;
  } else if (rawCandidates && Array.isArray(rawCandidates.candidates)) {
    candidateArray = rawCandidates.candidates;
  }

  if (!Array.isArray(candidateArray) || candidateArray.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No candidates provided" });
  }

  // Batch config (can be tuned via env)
  const BATCH_SIZE = Number(process.env.INVITE_BATCH_SIZE) || 5;
  const BATCH_DELAY_MS = Number(process.env.INVITE_BATCH_DELAY_MS) || 30 * 1000; // 30 seconds

  const results = [];
  const errors = [];

  // helper delay
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // chunk and process
  for (let i = 0; i < candidateArray.length; i += BATCH_SIZE) {
    const batch = candidateArray.slice(i, i + BATCH_SIZE);

    // send all in this batch concurrently (max BATCH_SIZE concurrent)
    const batchPromises = batch.map(async (c) => {
      // basic validation per-candidate
      if (!c || !c.email) {
        // skip and record as error
        return {
          error: `Missing email for candidate`,
          email: c ? c.email : null,
        };
      }

      try {
        // push invitation entry to job (you were doing this before sending)
        job.invitations.push({
          email: c.email,
          name: c.name,
          sentAt: new Date(),
          status: "sent",
        });

        const url = `${process.env.FRONTEND_URL}/interview/${
          job.interviewLink
        }?email=${encodeURIComponent(c.email)}`;

        await sendEmail({
          email: c.email,
          subject: `Interview Invitation - ${job.title}`,
          message: `Dear ${c.name || "Candidate"},
        
You have been invited to take an AI-powered interview for the position of ${
            job.title
          } at ${req.user.company}.

Interview Details:
• Position: ${job.title}
• Department: ${job.department}
• Duration: ${job.duration} minutes
• Mode: ${job.interviewMode}

Click the link below to start your interview:
${url}

Please complete the interview within 7 days of receiving this invitation.

Best regards,
${req.user.name}
${req.user.company}`,
        });

        // successful send
        return { email: c.email, status: "sent", invitationUrl: url };
      } catch (e) {
        // sending failed for this candidate
        return { email: c.email, error: e.message || String(e) };
      }
    });

    // await the whole batch
    const batchResults = await Promise.all(batchPromises);

    // separate successful results and errors, and record
    for (const r of batchResults) {
      if (r && r.error) {
        errors.push({ email: r.email || null, error: r.error });
      } else {
        results.push(r);
      }
    }

    // persist job after each batch so invitations are saved progressively
    try {
      await job.save();
    } catch (saveErr) {
      // if saving fails, include it in errors but continue
      errors.push({
        error: `Failed to save job after batch: ${saveErr.message}`,
      });
      console.error("Failed to save job after batch:", saveErr);
    }

    // if not the last batch, wait
    if (i + BATCH_SIZE < candidateArray.length) {
      // optionally log the pause
      console.info(
        `Processed batch ${
          Math.floor(i / BATCH_SIZE) + 1
        }. Waiting ${BATCH_DELAY_MS}ms before next batch.`
      );
      await wait(BATCH_DELAY_MS);
    }
  }

  // Final save to ensure everything persisted (defensive)
  try {
    await job.save();
  } catch (finalSaveErr) {
    console.error("Final job.save() failed:", finalSaveErr);
    errors.push({ error: `Final save failed: ${finalSaveErr.message}` });
  }

  return res.json({
    success: true,
    message: `${results.length} invitations processed (sent where possible).`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// @desc    Get job statistics
// @route   GET /api/jobs/:id/statistics
// @access  Private
const getJobStatistics = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Get detailed statistics with status breakdown
  const stats = await InterviewSession.aggregate([
    { $match: { jobId: job._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgScore: { $avg: "$analysis.overallScore" },
      },
    },
  ]);

  // Get score distribution for pass rate calculation
  const scoreDistribution = await InterviewSession.aggregate([
    {
      $match: {
        jobId: job._id,
        "analysis.overallScore": { $exists: true },
      },
    },
    {
      $bucket: {
        groupBy: "$analysis.overallScore",
        boundaries: [0, 3, 5, 7, 8, 9, 10],
        default: "other",
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  // Calculate average score from statusBreakdown
  let totalScoreSum = 0;
  let totalScoredInterviews = 0;
  let averageScore = 0;

  stats.forEach((stat) => {
    if (stat.avgScore && !isNaN(stat.avgScore)) {
      totalScoreSum += stat.avgScore * stat.count;
      totalScoredInterviews += stat.count;
    }
  });

  if (totalScoredInterviews > 0) {
    averageScore = Number((totalScoreSum / totalScoredInterviews).toFixed(2));
  }

  // Calculate pass rate from scoreDistribution
  // Assuming pass threshold is 7 or above (you can adjust this)
  const passThreshold = 7;
  let totalInterviewsWithScore = 0;
  let passedInterviews = 0;
  let passRate = 0;

  scoreDistribution.forEach((bucket) => {
    const bucketMin = bucket._id;
    const bucketCount = bucket.count;

    totalInterviewsWithScore += bucketCount;

    // Count as passed if bucket minimum is >= pass threshold
    if (typeof bucketMin === "number" && bucketMin >= passThreshold) {
      passedInterviews += bucketCount;
    }
  });

  if (totalInterviewsWithScore > 0) {
    passRate = Number(
      ((passedInterviews / totalInterviewsWithScore) * 100).toFixed(2)
    );
  }

  // Update job document with calculated values
  try {
    await Job.updateOne(
      { _id: job._id },
      {
        $set: {
          averageScore: averageScore,
          passRate: passRate,
          lastStatsUpdate: new Date(),
        },
      }
    );
  } catch (updateError) {}

  res.json({
    success: true,
    statistics: {
      total: job.totalInterviews,
      completed: job.completedInterviews,
      averageScore: averageScore, // ✅ Calculated from statusBreakdown
      passRate: passRate, // ✅ Calculated from scoreDistribution
      statusBreakdown: stats,
      scoreDistribution,
    },
  });
});

// @desc    Export job results to CSV
// @route   GET /api/jobs/:id/export
// @access  Private
const exportJobResults = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const interviews = await InterviewSession.find({
    jobId: job._id,
    status: "completed",
  }).select("candidateInfo analysis completedAt totalDuration");

  const csvData = interviews.map((interview) => ({
    "Candidate Name": interview.candidateInfo.name,
    Email: interview.candidateInfo.email,
    Phone: interview.candidateInfo.phone || "",
    "Completed At": interview.completedAt?.toISOString().split("T")[0] || "",
    "Duration (minutes)": Math.round((interview.totalDuration || 0) / 60),
    "Overall Score": interview.analysis?.overallScore || 0,
    "Technical Score": interview.analysis?.technicalScore || 0,
    "Behavioral Score": interview.analysis?.behavioralScore || 0,
    "Communication Score": interview.analysis?.communicationScore || 0,
    Recommendation: interview.analysis?.recommendation?.decision || "",
    Confidence: interview.analysis?.recommendation?.confidence || 0,
    "Red Flags": interview.analysis?.redFlags?.length || 0,
  }));

  res.json({
    success: true,
    filename: `${job.title.replace(/\s+/g, "_")}_results_${
      new Date().toISOString().split("T")[0]
    }.csv`,
    data: csvData,
  });
});

// ----- Custom Question Controllers -----

// @desc    Add custom question
// @route   POST /api/jobs/:id/questions
// @access  Private
const addCustomQuestion = asyncHandler(async (req, res) => {
  const { question, type, expectedAnswer, keywords, difficulty } = req.body;
  const job = await checkJobOwnership(req.params.id, req.user.id);

  const maxCustomQuestions = 25;
  if ((job.customQuestions?.length || 0) >= maxCustomQuestions) {
    return res.status(400).json({
      success: false,
      message: `Cannot add more than ${maxCustomQuestions} custom questions per job`,
    });
  }

  const newQuestion = {
    question: question.trim(),
    type,
    expectedAnswer: expectedAnswer?.trim() || "",
    keywords: keywords || [],
    difficulty,
  };

  job.customQuestions = job.customQuestions || [];
  job.customQuestions.push(newQuestion);
  job.totalQuestions =
    job.customQuestions.length + (job.aiQuestions?.length || 0);

  await job.save();

  res.status(201).json({
    success: true,
    message: "Custom question added successfully",
    data: {
      question: newQuestion,
      totalQuestions: job.totalQuestions,
      customQuestions: job.customQuestions,
    },
  });
});

// @desc    Update custom question
// @route   PUT /api/jobs/:id/questions/:questionIndex
// @access  Private
const updateCustomQuestion = asyncHandler(async (req, res) => {
  const { question, type, expectedAnswer, keywords, difficulty } = req.body;
  const questionIndex = parseInt(req.params.questionIndex);
  const job = await checkJobOwnership(req.params.id, req.user.id);

  if (
    !job.customQuestions ||
    questionIndex < 0 ||
    questionIndex >= job.customQuestions.length
  ) {
    return res
      .status(404)
      .json({ success: false, message: "Question not found" });
  }

  job.customQuestions[questionIndex] = {
    question: question.trim(),
    type,
    expectedAnswer: expectedAnswer?.trim() || "",
    keywords: keywords || [],
    difficulty,
  };

  await job.save();

  res.json({
    success: true,
    message: "Custom question updated successfully",
    data: {
      question: job.customQuestions[questionIndex],
      customQuestions: job.customQuestions,
    },
  });
});

// @desc    Delete custom question
// @route   DELETE /api/jobs/:id/questions/:questionIndex
// @access  Private
const deleteCustomQuestion = asyncHandler(async (req, res) => {
  const questionIndex = parseInt(req.params.questionIndex);
  const job = await checkJobOwnership(req.params.id, req.user.id);

  if (
    !job.customQuestions ||
    questionIndex < 0 ||
    questionIndex >= job.customQuestions.length
  ) {
    return res
      .status(404)
      .json({ success: false, message: "Question not found" });
  }

  const deletedQuestion = job.customQuestions.splice(questionIndex, 1)[0];
  job.totalQuestions =
    job.customQuestions.length + (job.aiQuestions?.length || 0);

  await job.save();

  res.json({
    success: true,
    message: "Custom question deleted successfully",
    data: {
      deletedQuestion,
      totalQuestions: job.totalQuestions,
      customQuestions: job.customQuestions,
    },
  });
});

// @desc    Delete custom question
// @route   DELETE /api/jobs/:id/ai-questions/:questionIndex
// @access  Private
const deleteAIQuestion = asyncHandler(async (req, res) => {
  const questionIndex = parseInt(req.params.questionIndex);
  const job = await checkJobOwnership(req.params.id, req.user.id);

  if (
    !job.aiQuestions ||
    questionIndex < 0 ||
    questionIndex >= job.aiQuestions.length
  ) {
    return res
      .status(404)
      .json({ success: false, message: "Question not found" });
  }

  const deletedQuestion = job.aiQuestions.splice(questionIndex, 1)[0];
  job.totalQuestions = job.aiQuestions.length + (job.aiQuestions?.length || 0);

  await job.save();

  res.json({
    success: true,
    message: "Custom question deleted successfully",
    data: {
      deletedQuestion,
      totalQuestions: job.totalQuestions,
      aiQuestions: job.aiQuestions,
    },
  });
});

// @desc    Get all questions for a job
// @route   GET /api/jobs/:id/questions
// @access  Private
const getJobQuestions = asyncHandler(async (req, res) => {
  const job = await checkJobOwnership(req.params.id, req.user.id);

  res.json({
    success: true,
    data: {
      customQuestions: job.customQuestions || [],
      aiQuestions: job.aiQuestions || [],
      totalQuestions: job.totalQuestions || 0,
      questionBreakdown: {
        custom: (job.customQuestions || []).length,
        ai: (job.aiQuestions || []).length,
      },
    },
  });
});

// @desc    Reorder custom questions
// @route   PUT /api/jobs/:id/questions/reorder
// @access  Private
const reorderCustomQuestions = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;
  const job = await checkJobOwnership(req.params.id, req.user.id);

  if (!job.customQuestions || job.customQuestions.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No custom questions to reorder",
    });
  }

  if (questionIds.length !== job.customQuestions.length) {
    return res.status(400).json({
      success: false,
      message: "Question indices length mismatch",
    });
  }

  for (const index of questionIds) {
    if (index >= job.customQuestions.length || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid question index",
      });
    }
  }

  job.customQuestions = questionIds.map((index) => job.customQuestions[index]);
  await job.save();

  res.json({
    success: true,
    message: "Questions reordered successfully",
    data: { customQuestions: job.customQuestions },
  });
});

// @desc    Get question statistics
// @route   GET /api/jobs/:id/questions/stats
// @access  Private
const getQuestionStats = asyncHandler(async (req, res) => {
  const job = await checkJobOwnership(req.params.id, req.user.id);

  const customQuestions = job.customQuestions || [];
  const aiQuestions = job.aiQuestions || [];

  const customTypeCount = customQuestions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  const customDifficultyCount = customQuestions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  const aiTypeCount = aiQuestions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  const aiDifficultyCount = aiQuestions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalQuestions: job.totalQuestions || 0,
      customQuestions: {
        count: customQuestions.length,
        typeDistribution: customTypeCount,
        difficultyDistribution: customDifficultyCount,
      },
      aiQuestions: {
        count: aiQuestions.length,
        typeDistribution: aiTypeCount,
        difficultyDistribution: aiDifficultyCount,
      },
      overallDistribution: {
        byType: {
          technical:
            (customTypeCount.technical || 0) + (aiTypeCount.technical || 0),
          behavioral:
            (customTypeCount.behavioral || 0) + (aiTypeCount.behavioral || 0),
          situational:
            (customTypeCount.situational || 0) + (aiTypeCount.situational || 0),
          general: (customTypeCount.general || 0) + (aiTypeCount.general || 0),
        },
        byDifficulty: {
          easy:
            (customDifficultyCount.easy || 0) + (aiDifficultyCount.easy || 0),
          medium:
            (customDifficultyCount.medium || 0) +
            (aiDifficultyCount.medium || 0),
          hard:
            (customDifficultyCount.hard || 0) + (aiDifficultyCount.hard || 0),
        },
      },
    },
  });
});

// @desc    Bulk operations on custom questions
// @route   POST /api/jobs/:id/questions/bulk
// @access  Private
const bulkQuestionOperations = asyncHandler(async (req, res) => {
  const { operations } = req.body;
  const job = await checkJobOwnership(req.params.id, req.user.id);

  const results = [];
  const errors = [];

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];

    try {
      switch (operation.action) {
        case "add":
          if (!job.customQuestions) {
            job.customQuestions = [];
          }

          const newQuestion = {
            question: operation.questionData.question.trim(),
            type: operation.questionData.type,
            expectedAnswer: operation.questionData.expectedAnswer
              ? operation.questionData.expectedAnswer.trim()
              : "",
            keywords: operation.questionData.keywords || [],
            difficulty: operation.questionData.difficulty,
          };

          job.customQuestions.push(newQuestion);
          results.push({
            operation: i,
            action: "add",
            success: true,
            data: newQuestion,
          });
          break;

        case "update":
          if (
            operation.questionIndex >= 0 &&
            operation.questionIndex < job.customQuestions.length
          ) {
            job.customQuestions[operation.questionIndex] = {
              question: operation.questionData.question.trim(),
              type: operation.questionData.type,
              expectedAnswer: operation.questionData.expectedAnswer
                ? operation.questionData.expectedAnswer.trim()
                : "",
              keywords: operation.questionData.keywords || [],
              difficulty: operation.questionData.difficulty,
            };

            results.push({
              operation: i,
              action: "update",
              success: true,
              data: job.customQuestions[operation.questionIndex],
            });
          } else {
            errors.push({
              operation: i,
              action: "update",
              error: "Invalid question index",
            });
          }
          break;

        case "delete":
          if (
            operation.questionIndex >= 0 &&
            operation.questionIndex < job.customQuestions.length
          ) {
            const deleted = job.customQuestions.splice(
              operation.questionIndex,
              1
            )[0];
            results.push({
              operation: i,
              action: "delete",
              success: true,
              data: deleted,
            });
          } else {
            errors.push({
              operation: i,
              action: "delete",
              error: "Invalid question index",
            });
          }
          break;

        default:
          errors.push({
            operation: i,
            action: operation.action,
            error: "Invalid operation action",
          });
      }
    } catch (error) {
      errors.push({
        operation: i,
        action: operation.action,
        error: error.message,
      });
    }
  }

  // Update totalQuestions count
  const customCount = job.customQuestions ? job.customQuestions.length : 0;
  const aiCount = job.aiQuestions ? job.aiQuestions.length : 0;
  job.totalQuestions = customCount + aiCount;

  await job.save();

  res.json({
    success: errors.length === 0,
    message: `Processed ${operations.length} operations. ${results.length} successful, ${errors.length} failed.`,
    data: {
      results,
      errors: errors.length > 0 ? errors : undefined,
      totalQuestions: job.totalQuestions,
      customQuestions: job.customQuestions,
    },
  });
});

// @desc    Get detailed session analysis
// @route   GET /api/analysis/sessions/:sessionId/analysis
// @access  Private
const getSessionAnalysis = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.sessionId,
  });

  if (!session.analysis || session.status !== "completed") {
    return res.status(400).json({
      success: false,
      message: "Analysis not available for this session",
    });
  }

  res.json({
    success: true,
    data: {
      sessionId: session._id,
      candidateInfo: session.candidateInfo,
      transcription: session.segments,
      metadata: session.metadata,
      redFlags: session.redFlags,
    },
  });
});

// Bulk resume upload (batched)
// Expects: req.body.jobId (or req.body.job) and req.files (multer array - diskStorage with .path & .filename)
// Processes files in batches to avoid spike in CPU / I/O (and to be gentle on OCR/email-extractor, etc.)
// require your models & helpers at top-level where appropriate
// const Job = require("../models/Job");
// const Resumes = require("../models/Resume");
// const { extractTextFromFile, extractEmail, extractPhone, extractName, matchSkills } = require("../utils/yourHelpers");

async function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

const bulkResumeUpload = asyncHandler(async (req, res) => {
  const jobId = req.body.jobId || req.body.job || null;
  if (!jobId) return res.status(400).json({ error: "jobId is required" });

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Batch config (can override with env variables)
    const BATCH_SIZE = Number(process.env.RESUME_BATCH_SIZE) || 10;
    const BATCH_DELAY_MS =
      Number(process.env.RESUME_BATCH_DELAY_MS) || 30 * 1000; // default 30s

    const files = req.files;
    const chunks = await chunkArray(files, BATCH_SIZE);

    const results = [];
    let createdCount = 0;

    // small helper to pause between batches
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let batchIndex = 0; batchIndex < chunks.length; batchIndex++) {
      const batch = chunks[batchIndex];

      // Process batch concurrently (up to BATCH_SIZE promises)
      const batchPromises = batch.map(async (file) => {
        const info = {
          file: file.originalname,
          success: false,
          error: null,
          candidateId: null,
          email: null,
          name: null,
          matchScore: null,
        };

        try {
          // Extract text (PDF / doc / docx / txt handlers inside extractTextFromFile)
          const text = await extractTextFromFile(
            file.path,
            file.mimetype,
            file.originalname
          );

          // Extract metadata
          const email = extractEmail(text);
          const phone = extractPhone(text);
          const name = extractName(text);

          // Skill matching against job.requiredSkills (should return { matched, score })
          const { matched, score } = matchSkills(
            text,
            job.requiredSkills || []
          );

          const candObj = {
            name: name || file.originalname.replace(/\.[^/.]+$/, ""),
            email: email || undefined,
            phone: phone || undefined,
            jobId: job._id,
            resumePath: file.filename, // storing disk filename; adjust if you store full path or URL
            matchedSkills: matched,
            matchScore: score,
          };

          // Create and persist candidate
          const candidate = await Resumes.create(candObj);

          // If your create doesn't automatically persist, ensure save (defensive)
          if (candidate && typeof candidate.save === "function") {
            await candidate.save();
          }

          info.success = true;
          info.candidateId = candidate._id;
          info.email = email || null;
          info.name = candObj.name;
          info.matchScore = score;

          createdCount++;
        } catch (fileErr) {
          // capture the error message, but continue processing other files
          info.error =
            fileErr && fileErr.message ? fileErr.message : String(fileErr);
        } finally {
          // Optionally cleanup temp file here:
          // await fsPromises.unlink(file.path).catch(() => {});
          return info;
        }
      });

      // Wait for the batch to finish
      const batchResults = await Promise.all(batchPromises);

      // Append to global results
      results.push(...batchResults);

      // If not the last batch, wait before next batch
      if (batchIndex < chunks.length - 1) {
        // Log progress server-side (helps debugging/monitoring)
        console.info(
          `Processed batch ${batchIndex + 1}/${chunks.length} (${
            batch.length
          } files). Waiting ${BATCH_DELAY_MS}ms before next batch.`
        );
        await wait(BATCH_DELAY_MS);
      }
    }

    return res.json({
      message: "Bulk upload processed (batched)",
      created: createdCount,
      results,
    });
  } catch (err) {
    console.error("bulkResumeUpload error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

module.exports = { bulkResumeUpload };

// @desc    Get job candidates (for employer)
// @route   GET /api/jobs/:id/candidates
// @access  Private
const getJobCandidates = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { jobId: job._id };
  let sort = {};
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }
  // Add filters
  if (req.query.status == "top") {
    sort = {
      matchScore: -1,
    };
  }
  if (req.query.status == "low") {
    sort = {
      matchScore: 1,
    };
  }

  const resumeData = await Resumes.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
  const total = await Resumes.countDocuments(query);

  res.json({
    success: true,
    count: resumeData.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    resumeData,
  });
});

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  generateQuestions,
  inviteCandidates,

  getJobStatistics,
  exportJobResults,

  // Custom question exports
  addCustomQuestion,
  updateCustomQuestion,
  deleteCustomQuestion,
  deleteAIQuestion,
  getJobQuestions,
  reorderCustomQuestions,
  getQuestionStats,
  bulkQuestionOperations,
  bulkResumeUpload,
  getSessionAnalysis,
  getJobCandidates,
};
