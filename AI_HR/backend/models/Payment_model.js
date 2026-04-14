const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    proratedDetails: {
      currentPlanUnused: Number,
      newPlanProrated: Number,
      remainingDays: Number,
      totalDays: Number,
      credit: Number,
    },
    // Payment gateway details
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Invoice details
    invoiceNumber: String,
    invoiceUrl: String,

    // Refund information
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    minutesAmount: {
      type: Number,
      required: true, // e.g., 60, 120, 500
    },
    pricePerMinute: {
      type: Number,
      // e.g., 0.50 (Store historical price at time of purchase)
    },
    description: {
      type: String,
      default: "Minute Top-up",
    },
  },
  {
    timestamps: true,
  }
);

// Hook: When a payment marks 'completed', update User Wallet & Create Transaction
paymentSchema.methods.processSuccessfulPayment = async function () {
  if (this.status !== "completed") return;

  const User = mongoose.model("User");
  const Transaction = mongoose.model("Transaction");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get User
    const user = await User.findById(this.userId).session(session);

    // 2. Update Balance
    user.wallet.minutesBalance += this.minutesAmount;
    user.wallet.totalMinutesPurchased += this.minutesAmount;
    await user.save({ session });

    // 3. Create Ledger Entry
    await Transaction.create(
      [
        {
          userId: user._id,
          type: "purchase",
          amount: this.minutesAmount,
          balanceAfter: user.wallet.minutesBalance,
          description: `Purchased ${this.minutesAmount} minutes`,
          referenceId: this._id,
          referenceModel: "Payment",
        },
      ],
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual("formattedAmount").get(function () {
  return `$${this.amount.toFixed(2)} ${this.currency}`;
});

// Static method to get user payment history
paymentSchema.statics.getUserPaymentHistory = async function (
  userId,
  limit = 10
) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name email company");
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);
};

// Method to mark payment as completed
paymentSchema.methods.markAsCompleted = function (gatewayResponse) {
  this.status = "completed";
  this.gatewayResponse = gatewayResponse;
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function (gatewayResponse) {
  this.status = "failed";
  this.gatewayResponse = gatewayResponse;
  return this.save();
};

module.exports = mongoose.model("Payment", paymentSchema);
