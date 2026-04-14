const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
      maxLength: [100, "Candidate name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Candidate email is required"],
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please provide a valid candidate email address",
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    resumePath: {
      type: String, // URL or file path
    },
    matchScore: {
      type: Number, // URL or file path
    },
    matchedSkills: {
      type: [String], // URL or file path
    },
    // Associated user (company/HR)
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
interviewSchema.index({ matchScore: 1 });
interviewSchema.index({ jobId: 1 });

module.exports = mongoose.model("Resumes", interviewSchema);
