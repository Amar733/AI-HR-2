const express = require("express");
const { body } = require("express-validator");
const {
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
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { validate, validationRules } = require("../middleware/validation");

const router = express.Router();

// Public routes
router.post("/register", validationRules.userRegistration, validate, register);
router.post("/login", validationRules.userLogin, validate, login);
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
  ],
  validate,
  forgotPassword
);
router.put(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  resetPassword
);
router.put("/verify-email/:token", verifyEmail);

// Protected routes
router.use(protect); // All routes below require authentication

router.get("/profile", getProfile);
router.put("/profile", validationRules.userUpdate, validate, updateProfile);
router.put(
  "/change-password",
  validationRules.passwordChange,
  validate,
  changePassword
);
router.post("/logout", logout);

// Admin only routes
router.get("/all-user", authorize("admin"), getAllUsers);
router.post("/adjust-minutes", authorize("admin"), adjustUserMinutes);

module.exports = router;
