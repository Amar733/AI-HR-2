// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase", "usage", "admin_adjustment", "bonus", "refund"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      // Positive for adding minutes, Negative for using minutes
      // e.g., +60 (Purchase), -15 (Interview), +30 (Sign up bonus)
    },
    balanceAfter: {
      type: Number, // Snapshot of balance after transaction (for audit trails)
      required: true,
    },
    description: String,

    // References to other models to link context
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      // Can link to PaymentID, InterviewSessionID, or null (for manual admin)
    },
    referenceModel: {
      type: String,
      enum: ["Payment", "InterviewSession", "AdminLog", null],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // If admin adjusted it, who was it?
    },
  },
  { timestamps: true }
);

// Index for getting a user's history quickly
transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
