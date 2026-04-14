const crypto = require("crypto");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction"); // Adjust path

const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/sendEmail");
const APP_NAME = process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME || "AI Interview";

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, company, phone } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email address",
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    company,
    phone,
  });

  // Generate email verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    await sendEmail({
      email: user.email,
      subject: `Email Verification - ${APP_NAME}`,
      message: `
        Welcome to ${APP_NAME}! Please verify your email address by clicking the link below:

        ${verificationUrl}

        This link will expire in 24 hours.

        If you did not create this account, please ignore this email.
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Continue with registration even if email fails
  }

  // Generate token
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    message:
      "User registered successfully. Please check your email for verification.",
    token,
    user: user.getPublicProfile(),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: "Account has been deactivated. Please contact support.",
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = user.generateAuthToken();

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: user.getPublicProfile(),
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    user: user.getPublicProfile(),
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    company: req.body.company,
    phone: req.body.phone,
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(
    (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: user.getPublicProfile(),
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select("+password");

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No user found with that email address",
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const message = `
    You are receiving this email because you (or someone else) has requested a password reset.

    Please click on the following link to reset your password:

    ${resetUrl}

    This link will expire in 10 minutes.

    If you did not request this, please ignore this email and your password will remain unchanged.
  `;

  const html = `
    You are receiving this email because you (or someone else) has requested a password reset. <br/><br/>
    Please click on the following link to reset your password: <br/><br/>
    ${resetUrl}  <br/><br/>
    This link will expire in 10 minutes.  <br/><br/>
    If you did not request this, please ignore this email and your password will remain unchanged.
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password Reset Request - ${APP_NAME}`,
      message,
      html,
    });

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Email send error:", error.message);
    // user.resetPasswordToken = undefined;
    // user.resetPasswordExpire = undefined;
    // await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: "Email could not be sent",
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    //emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate token
  const token = user.generateAuthToken();

  res.json({
    success: true,
    message: "Password reset successful",
  });
});

// @desc    Verify email
// @route   PUT /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification token",
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Email verified successfully",
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // Here we can add token to blacklist if needed

  res.json({
    success: true,
    message: "Logout successful",
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("name email company wallet createdAt") // Select specific fields
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const adjustUserMinutes = asyncHandler(async (req, res) => {
  const { userId, minutes, reason } = req.body;
  // minutes can be positive (add) or negative (deduct)
  // e.g., { "minutes": 30 } or { "minutes": -10 }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    // Check for negative balance protection
    if (user.wallet.minutesBalance + minutes < 0) {
      throw new Error("Cannot deduct: User has insufficient minutes");
    }

    // 1. Update User Wallet
    user.wallet.minutesBalance += minutes;

    // Track totals purely for analytics
    if (minutes > 0) user.wallet.totalMinutesPurchased += minutes;

    await user.save({ session });

    // 2. Create Transaction Record
    await Transaction.create(
      [
        {
          userId: user._id,
          type: "admin_adjustment",
          amount: minutes,
          balanceAfter: user.wallet.minutesBalance,
          description: reason || "Admin manual adjustment",
          performedBy: req.user._id, // Assuming req.user is the logged-in Admin
          referenceModel: "AdminLog",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: {
        newBalance: user.wallet.minutesBalance,
        message: `Successfully ${minutes > 0 ? "added" : "deducted"} ${Math.abs(
          minutes
        )} minutes.`,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
  getAllUsers,
  adjustUserMinutes,
};
