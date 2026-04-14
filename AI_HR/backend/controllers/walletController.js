const { asyncHandler } = require("../middleware/errorHandler");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// @desc    Get current user wallet balance and history
// @route   GET /api/wallet/my-wallet
// @access  Private
const getMyWallet = asyncHandler(async (req, res) => {
  // Defensive check: Ensure user is authenticated
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, user data missing");
  }

  // 1. Get fresh user data (for balance)
  // We use req.user.id to be consistent with your settingsController
  const user = await User.findById(req.user.id).select("wallet");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 2. Get transaction history
  const transactions = await Transaction.find({ userId: req.user.id })
    .sort({ createdAt: -1 }) // Newest first
    .limit(50); // Limit to last 50 for performance

  res.json({
    success: true,
    data: {
      minutesBalance: user.wallet?.minutesBalance || 0,
      totalUsed: user.wallet?.totalMinutesUsed || 0,
      transactions: transactions || [],
    },
  });
});

module.exports = { getMyWallet };
