const mongoose = require("mongoose");
const redFlagSchema = new mongoose.Schema(
  {
    type: { type: String },
    description: { type: String },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
    },
    timestamp: Number,
    eventTime: Number,
  },
  { _id: false } // no need for separate _id for each redFlag
);
const interviewSessionSchema = new mongoose.Schema(
  {
    // Basic Information
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    candidateInfo: {
      name: {
        type: String,
        required: [true, "Candidate name is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Candidate email is required"],
        lowercase: true,
      },
      phone: String,
      resume: {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
      linkedin: String,
      portfolio: String,
    },

    // Session Management
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    ephemeralKey: {
      type: String,
      unique: true,
    },

    status: {
      type: String,
      enum: ["invited", "started", "completed", "abandoned", "disqualified"],
      default: "invited",
      index: true,
    },

    // Timing
    startedAt: Date,
    completedAt: Date,
    totalDuration: {
      type: Number, // in seconds
      default: 0,
    },

    // Interview Data
    responses: [
      {
        questionId: String,
        question: String,
        questionType: String,

        // Response Data
        textResponse: String,

        // Media Files
        videoUrl: String,
        audioUrl: String,

        // Timing
        timeSpent: Number, // in seconds
        startTime: Date,
        endTime: Date,

        // Analysis
        transcription: String,
        keywords: [String],
        sentiment: {
          score: Number,
          label: String,
        },
        confidence: Number,

        // Scoring
        score: {
          type: Number,
          min: 0,
          max: 10,
        },

        feedback: String,
      },
    ],

    // Red Flags
    redFlags: [redFlagSchema],

    // Comprehensive Analysis
    analysis: {
      // Overall Scoring
      overallScore: { type: Number, min: 0, max: 10 },

      // Category Scores
      technicalScore: Number,
      communicationScore: Number,
      behavioralScore: Number,
      culturalFitScore: Number,
      salary: String,

      // Language Analysis
      grammar: {
        score: Number,
        errors: [
          {
            type: String,
            description: String,
            severity: String,
            suggestion: String,
          },
        ],
      },

      vocabulary: {
        score: Number,
        level: String,
        complexWords: [String], // changed from Number → Array of strings
        uniqueWords: [String], // changed from Number → Array of strings
      },

      fluency: {
        score: Number,
        wordsPerMinute: Number,
        pauseAnalysis: {
          totalPauses: Number,
          averagePauseLength: Number,
          longPauses: Number,
        },
      },

      // Content Analysis
      relevance: {
        score: Number,
        keywordMatches: [String], // changed from Number → Array of strings
        topicCoverage: [String],
      },

      completeness: {
        score: Number,
        answeredQuestions: Number,
        totalQuestions: Number,
        avgResponseLength: Number,
      },

      // Personality Insights
      personality: {
        confidence: Number,
        enthusiasm: Number,
        professionalism: Number,
        creativity: Number,
        leadership: Number,
        teamwork: Number,
      },

      // Strengths and Weaknesses
      strengths: [
        {
          category: String,
          description: String,
          evidence: String,
          score: Number,
        },
      ],

      weaknesses: [
        {
          category: String,
          description: String,
          suggestion: String,
          severity: String,
        },
      ],

      // AI Recommendations
      recommendation: {
        decision: {
          type: String,
          enum: ["hire", "maybe", "no_hire", "further_evaluation"],
        },
        confidence: { type: Number, min: 0, max: 100 },
        reasoning: String,
        nextSteps: [String],
      },

      // Detailed Feedback
      feedback: {
        positive: [String],
        improvements: [String],
        overall: String,
      },
    },
    // Technical Metadata
    metadata: {
      ipAddress: String,
      userAgent: String,
      browser: String,
      device: String,
    },

    videoPath: String,

    // Full Transcription
    fullTranscription: {
      text: String,
      segments: [
        {
          start: Number,
          end: Number,
          text: String,
          confidence: Number,
          speaker: String,
        },
      ],
      wordCount: Number,
      readingLevel: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
interviewSessionSchema.index({ jobId: 1, status: 1 });
interviewSessionSchema.index({ "candidateInfo.email": 1 });
interviewSessionSchema.index({ sessionId: 1 });
interviewSessionSchema.index({ createdAt: -1 });
interviewSessionSchema.index({ "analysis.overallScore": -1 });

// Virtual for formatted duration
interviewSessionSchema.virtual("formattedDuration").get(function () {
  if (!this.totalDuration) return "0:00";
  const minutes = Math.floor(this.totalDuration / 60);
  const seconds = this.totalDuration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

// Methods
interviewSessionSchema.methods.calculateScore = function () {
  if (!this.responses || this.responses.length === 0) return 0;

  const totalScore = this.responses.reduce((sum, response) => {
    return sum + (response.score || 0);
  }, 0);

  return Math.round((totalScore / this.responses.length) * 10) / 10;
};

interviewSessionSchema.methods.generateReport = async function () {
  // Generate comprehensive interview report
  const report = {
    candidate: this.candidateInfo,
    job: await mongoose.model("Job").findById(this.jobId),
    session: {
      duration: this.formattedDuration,
      completedAt: this.completedAt,
      status: this.status,
    },
    scores: this.analysis,
    responses: this.responses.length,
    recommendation: this.analysis?.recommendation,
  };

  return report;
};

// Static methods
interviewSessionSchema.statics.getSessionStats = async function (jobId) {
  return await this.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgScore: { $avg: "$analysis.overallScore" },
      },
    },
  ]);
};

interviewSessionSchema.statics.getTopCandidates = async function (
  jobId,
  limit = 10
) {
  return await this.find({
    jobId: jobId,
    status: "completed",
    "analysis.overallScore": { $exists: true },
  })
    .sort({ "analysis.overallScore": -1 })
    .limit(limit)
    .select(
      "candidateInfo analysis.overallScore analysis.recommendation completedAt"
    );
};

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
