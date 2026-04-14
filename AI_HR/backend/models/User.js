const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password by default in queries
    },
    role: {
      type: String,
      enum: ["admin", "hr_manager", "interviewer", "user"],
      default: "user",
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String, // URL to avatar image
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    // SaaS-specific fields
    subscription: {
      plan: {
        type: String,
        enum: ["starter", "professional", "enterprise"],
        default: "starter",
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "past_due", "trial"],
        default: "trial",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: Date,
      trialEndDate: {
        type: Date,
        default: function () {
          return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
        },
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },

    usage: {
      interviewsThisMonth: {
        type: Number,
        default: 0,
      },
      interviewsTotal: {
        type: Number,
        default: 0,
      },
      storageUsed: {
        type: Number,
        default: 0, // in MB
      },
      apiCallsThisMonth: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
    wallet: {
      minutesBalance: {
        type: Number,
        default: 30, // REQUIREMENT: Default 30 min on register
        min: 0,
      },
      totalMinutesPurchased: {
        type: Number,
        default: 0,
      },
      totalMinutesUsed: {
        type: Number,
        default: 0,
      },
    },
    // Preferences
    preferences: {
      timezone: {
        type: String,
        default: "UTC",
      },
      dateFormat: {
        type: String,
        default: "MM/DD/YYYY",
      },
      timeFormat: {
        type: String,
        default: "12h",
      },
      language: {
        type: String,
        default: "en",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      }, // NEW: Wallet System replaces Subscription
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.hasSufficientMinutes = function (requiredMinutes) {
  return this.wallet.minutesBalance >= requiredMinutes;
};

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ company: 1 });
userSchema.index({ "subscription.plan": 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to reset monthly usage
userSchema.pre("save", function (next) {
  const now = new Date();
  const lastReset = this.usage.lastResetDate;

  // Reset monthly counters if it's a new month
  if (lastReset && now.getMonth() !== lastReset.getMonth()) {
    this.usage.interviewsThisMonth = 0;
    this.usage.apiCallsThisMonth = 0;
    this.usage.lastResetDate = now;
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpire;
  return user;
};

// Method to generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Set expire time (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Method to check subscription limits
userSchema.methods.canPerformAction = function (action) {
  const limits = {
    starter: {
      interviews: 50,
      storage: 1000, // MB
      apiCalls: 1000,
    },
    professional: {
      interviews: 200,
      storage: 5000,
      apiCalls: 5000,
    },
    enterprise: {
      interviews: -1, // unlimited
      storage: -1,
      apiCalls: -1,
    },
  };

  const userLimits = limits[this.subscription.plan] || limits.starter;

  switch (action) {
    case "interview":
      return (
        userLimits.interviews === -1 ||
        this.usage.interviewsThisMonth < userLimits.interviews
      );
    case "storage":
      return (
        userLimits.storage === -1 || this.usage.storageUsed < userLimits.storage
      );
    case "apiCall":
      return (
        userLimits.apiCalls === -1 ||
        this.usage.apiCallsThisMonth < userLimits.apiCalls
      );
    default:
      return true;
  }
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: "$subscription.plan",
        count: { $sum: 1 },
        totalInterviews: { $sum: "$usage.interviewsTotal" },
      },
    },
  ]);
};

// Static method to cleanup expired tokens
userSchema.statics.cleanupExpiredTokens = async function () {
  const now = new Date();

  await this.updateMany(
    {
      $or: [
        { resetPasswordExpire: { $lt: now } },
        { emailVerificationExpire: { $lt: now } },
      ],
    },
    {
      $unset: {
        resetPasswordToken: 1,
        resetPasswordExpire: 1,
        emailVerificationToken: 1,
        emailVerificationExpire: 1,
      },
    }
  );
};

module.exports = mongoose.model("User", userSchema);
