const mongoose = require("mongoose");
const aiQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, required: true },
  difficulty: { type: String, required: true },
  expectedKeywords: { type: [String], default: [] },
  scoringCriteria: { type: String, required: true },
});
const jobSchema = new mongoose.Schema(
  {
    // Basic Job Information
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxLength: [200, "Job title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxLength: [5000, "Job description cannot exceed 5000 characters"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxLength: [100, "Department cannot exceed 100 characters"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxLength: [100, "Position cannot exceed 100 characters"],
    },
    location: {
      type: String,
      trim: true,
      maxLength: [200, "Location cannot exceed 200 characters"],
    },
    salary: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD"],
      },
      period: {
        type: String,
        enum: ["hourly", "daily", "monthly", "yearly"],
        default: "yearly",
      },
    },

    // Interview Configuration
    interviewLanguage: {
      type: String,
      required: [true, "Interview language is required"],
      enum: [
        "english",
        "spanish",
        "french",
        "german",
        "chinese",
        "japanese",
        "hindi",
        "bengali",
        "telegu",
      ],
      default: "english",
    },

    // Skills and Requirements
    requiredSkills: [
      {
        skill: {
          type: String,
          required: true,
          trim: true,
        },
        level: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "intermediate",
        },
        mandatory: {
          type: Boolean,
          default: false,
        },
      },
    ],

    optionalSkills: [
      {
        skill: {
          type: String,
          required: true,
          trim: true,
        },
        level: String,
      },
    ],

    experience: {
      min: {
        type: Number,
        min: 0,
        default: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
    },

    education: {
      degree: {
        type: String,
        // enum: [
        //   "high_school",
        //   "associate",
        //   "bachelor",
        //   "master",
        //   "phd",
        //   "certification",
        //   "other",
        // ],
      },
      field: String,
      required: {
        type: Boolean,
        default: false,
      },
    },

    // Interview Settings
    interviewMode: {
      type: String,
      enum: ["mock", "real"],
      required: [true, "Interview mode is required"],
      default: "real",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      required: [true, "Interview difficulty is required"],
      default: "medium",
    },

    duration: {
      type: Number,
      required: [true, "Interview duration is required"],
      min: [5, "Interview must be at least 5 minutes"],
      max: [180, "Interview cannot exceed 3 hours"],
      default: 60,
    },

    // Questions Configuration
    totalQuestions: {
      type: Number,
      min: 0,
      max: 50,
      default: 10,
    },

    questionTypes: {
      technical: {
        type: Number,
        min: 0,
        default: 5,
      },
      behavioral: {
        type: Number,
        min: 0,
        default: 3,
      },
      situational: {
        type: Number,
        min: 0,
        default: 2,
      },
      caseStudy: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    // Custom Questions (User Input)
    customQuestions: [
      {
        question: {
          type: String,
          required: true,
          maxLength: [1000, "Question cannot exceed 1000 characters"],
        },
        type: {
          type: String,
          enum: ["technical", "behavioral", "situational", "general"],
          default: "general",
        },
        expectedAnswer: {
          type: String,
          maxLength: [2000, "Expected answer cannot exceed 2000 characters"],
        },
        keywords: [String],
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
      },
    ],

    // AI Generated Questions
    aiQuestions: { type: [aiQuestionSchema], default: [] },

    // Interview Link and Access
    interviewLink: {
      type: String,
      unique: true,
      //required: true
    },

    accessCode: {
      type: String,
      //required: true
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      validate: {
        validator: function (date) {
          return !date || date > new Date();
        },
        message: "Expiry date must be in the future",
      },
    },

    // Analytics and Tracking
    totalInterviews: {
      type: Number,
      default: 0,
    },

    completedInterviews: {
      type: Number,
      default: 0,
    },

    averageScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    passRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Owner Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    createdBy: {
      name: String,
      email: String,
    },

    // Additional Settings
    settings: {
      allowResume: {
        type: Boolean,
        default: false,
      },
      recordVideo: {
        type: Boolean,
        default: true,
      },
      recordAudio: {
        type: Boolean,
        default: true,
      },
      allowNotes: {
        type: Boolean,
        default: false,
      },
      showTimer: {
        type: Boolean,
        default: true,
      },
      randomizeQuestions: {
        type: Boolean,
        default: true,
      },
      antiCheat: {
        type: Boolean,
        default: true,
      },
      notifications: {
        onStart: Boolean,
        onComplete: Boolean,
        dailyReport: Boolean,
      },
    },

    // Invitation Management
    invitations: [
      {
        email: {
          type: String,
          required: true,
        },
        name: String,
        sentAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["sent", "opened", "started", "completed"],
          default: "sent",
        },
        interviewId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InterviewSession",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ interviewLink: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({
  "requiredSkills.skill": "text",
  title: "text",
  description: "text",
});

// Pre-save middleware to generate interview link
jobSchema.pre("save", function (next) {
  if (this.isNew && !this.interviewLink) {
    this.interviewLink = generateInterviewLink();
    this.accessCode = generateAccessCode();
  }
  next();
});

// Helper functions
function generateInterviewLink() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function generateAccessCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Static methods
jobSchema.statics.getActiveJobs = function (userId) {
  return this.find({
    userId: userId,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Job", jobSchema);
