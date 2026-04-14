const { body, param, query, validationResult } = require("express-validator");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

// Common validation rules
const validationRules = {
  // Existing validation rules
  mongoId: [param("id").isMongoId().withMessage("Invalid ID format")],

  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],

  userRegistration: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("company")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Company name must be between 2 and 100 characters"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
  ],

  userLogin: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],

  userUpdate: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("company")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Company name must be between 2 and 100 characters"),
    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],

  passwordChange: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
  ],

  // Job validation rules
  jobCreate: [
    body("title")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Job title must be between 2 and 200 characters"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Job description must be between 10 and 5000 characters"),
    body("department")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Department must be between 2 and 100 characters"),
    body("position")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Position must be between 2 and 100 characters"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Location must not exceed 200 characters"),

    // Salary validation
    body("salary.min")
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage("Minimum salary must be a positive number"),
    body("salary.max")
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage("Maximum salary must be a positive number"),
    body("salary.currency")
      .optional()
      .isIn(["USD", "EUR", "GBP", "INR", "CAD", "AUD"])
      .withMessage("Invalid currency"),
    body("salary.period")
      .optional()
      .isIn(["hourly", "daily", "monthly", "yearly"])
      .withMessage("Invalid salary period"),

    // Interview settings
    body("interviewLanguage")
      .isIn([
        "english",
        "spanish",
        "french",
        "german",
        "chinese",
        "japanese",
        "hindi",
        "arabic",
      ])
      .withMessage("Invalid interview language"),
    body("interviewMode")
      .isIn(["mock", "real"])
      .withMessage("Interview mode must be either mock or real"),
    body("difficulty")
      .isIn(["easy", "medium", "hard", "expert"])
      .withMessage("Invalid difficulty level"),
    body("duration")
      .isInt({ min: 5, max: 180 })
      .withMessage("Duration must be between 5 and 180 minutes"),
    body("totalQuestions")
      .isInt({ min: 5, max: 50 })
      .withMessage("Total questions must be between 5 and 50"),

    // Question types
    body("questionTypes.technical")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Technical questions must be a non-negative integer"),
    body("questionTypes.behavioral")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Behavioral questions must be a non-negative integer"),
    body("questionTypes.situational")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Situational questions must be a non-negative integer"),
    body("questionTypes.caseStudy")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Case study questions must be a non-negative integer"),

    // Skills validation
    body("requiredSkills")
      .isArray({ min: 1 })
      .withMessage("At least one required skill must be specified"),
    body("requiredSkills.*.skill")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Skill name must be between 1 and 100 characters"),
    body("requiredSkills.*.level")
      .optional()
      .isIn(["beginner", "intermediate", "advanced", "expert"])
      .withMessage("Invalid skill level"),
    body("requiredSkills.*.mandatory")
      .optional()
      .isBoolean()
      .withMessage("Mandatory must be a boolean value"),

    // Experience validation
    body("experience.min")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Minimum experience must be a non-negative integer"),
    body("experience.max")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Maximum experience must be a non-negative integer"),

    // Custom questions validation
    body("customQuestions")
      .optional()
      .isArray()
      .withMessage("Custom questions must be an array"),
    body("customQuestions.*.question")
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Question must be between 10 and 1000 characters"),
    body("customQuestions.*.type")
      .optional()
      .isIn(["technical", "behavioral", "situational", "general"])
      .withMessage("Invalid question type"),
    body("customQuestions.*.expectedAnswer")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Expected answer must not exceed 2000 characters"),
    body("customQuestions.*.timeLimit")
      .optional()
      .isInt({ min: 30, max: 600 })
      .withMessage("Time limit must be between 30 and 600 seconds"),

    // Settings validation
    body("settings.recordVideo")
      .optional()
      .isBoolean()
      .withMessage("Record video must be a boolean"),
    body("settings.recordAudio")
      .optional()
      .isBoolean()
      .withMessage("Record audio must be a boolean"),
    body("settings.showTimer")
      .optional()
      .isBoolean()
      .withMessage("Show timer must be a boolean"),
    body("settings.randomizeQuestions")
      .optional()
      .isBoolean()
      .withMessage("Randomize questions must be a boolean"),
    body("settings.antiCheat")
      .optional()
      .isBoolean()
      .withMessage("Anti-cheat must be a boolean"),

    // Expiry date validation
    body("expiresAt")
      .optional()
      .isISO8601()
      .withMessage("Expiry date must be a valid date")
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error("Expiry date must be in the future");
        }
        return true;
      }),
  ],

  jobUpdate: [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Job title must be between 2 and 200 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Job description must be between 10 and 5000 characters"),
    body("department")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Department must be between 2 and 100 characters"),
    body("position")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Position must be between 2 and 100 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
    body("duration")
      .optional()
      .isInt({ min: 10, max: 180 })
      .withMessage("Duration must be between 10 and 180 minutes"),
    body("totalQuestions")
      .optional()
      .isInt({ min: 5, max: 50 })
      .withMessage("Total questions must be between 5 and 50"),
  ],

  // Custom Questions validation rules (NEW)
  customQuestion: [
    body("question")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Question must be between 10 and 1000 characters"),
    body("type")
      .isIn(["general", "technical", "behavioral", "situational"])
      .withMessage(
        "Question type must be one of: general, technical, behavioral, situational"
      ),
    body("expectedAnswer")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Expected answer must not exceed 2000 characters"),
    body("keywords")
      .optional()
      .isArray()
      .withMessage("Keywords must be an array")
      .custom((keywords) => {
        if (keywords && keywords.length > 0) {
          if (keywords.length > 20) {
            throw new Error("Cannot have more than 20 keywords");
          }
          for (const keyword of keywords) {
            if (typeof keyword !== "string" || keyword.trim().length === 0) {
              throw new Error("Each keyword must be a non-empty string");
            }
            if (keyword.length > 50) {
              throw new Error("Each keyword cannot exceed 50 characters");
            }
          }
        }
        return true;
      }),
    body("difficulty")
      .isIn(["easy", "medium", "hard"])
      .withMessage("Difficulty must be one of: easy, medium, hard"),
  ],

  // Question index validation for URL parameters (NEW)
  questionIndex: [
    param("questionIndex")
      .isInt({ min: 0 })
      .withMessage("Question index must be a non-negative integer")
      .custom((value) => {
        if (value > 100) {
          // reasonable upper limit
          throw new Error("Question index too large");
        }
        return true;
      }),
  ],

  // Reorder questions validation (NEW)
  reorderQuestions: [
    body("questionIds")
      .isArray({ min: 1 })
      .withMessage("Question IDs must be a non-empty array")
      .custom((questionIds) => {
        // Check if all elements are integers
        if (!questionIds.every((id) => Number.isInteger(id) && id >= 0)) {
          throw new Error("All question IDs must be non-negative integers");
        }
        // Check for duplicates
        const uniqueIds = [...new Set(questionIds)];
        if (uniqueIds.length !== questionIds.length) {
          throw new Error("Duplicate question IDs are not allowed");
        }
        // Check reasonable limit
        if (questionIds.length > 50) {
          throw new Error("Too many questions to reorder");
        }
        return true;
      }),
  ],

  // Bulk question operations (NEW)
  bulkQuestionOperations: [
    body("operations")
      .isArray({ min: 1 })
      .withMessage("Operations must be a non-empty array"),
    body("operations.*.action")
      .isIn(["add", "update", "delete", "reorder"])
      .withMessage("Invalid operation action"),
    body("operations.*.questionIndex")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Question index must be a non-negative integer"),
    body("operations.*.questionData")
      .optional()
      .isObject()
      .withMessage("Question data must be an object"),
  ],

  // Interview session validation rules (EXISTING)
  startInterview: [
    body("interviewId")
      .isLength({ min: 1 })
      .withMessage("interview Id is required"),
    body("email")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Candidate name must be between 2 and 100 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
  ],

  submitResponse: [
    param("sessionId")
      .isLength({ min: 1 })
      .withMessage("Session ID is required"),
    body("questionId")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Question ID is required"),
    body("response.question")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Question text is required"),
    body("response.questionType")
      .isIn(["technical", "behavioral", "situational", "general"])
      .withMessage("Invalid question type"),
    body("response.textResponse")
      .optional()
      .isLength({ max: 5000 })
      .withMessage("Text response must not exceed 5000 characters"),
    body("response.timeSpent")
      .isInt({ min: 0 })
      .withMessage("Time spent must be a non-negative integer"),
    body("response.startTime")
      .isISO8601()
      .withMessage("Start time must be a valid date"),
    body("response.endTime")
      .isISO8601()
      .withMessage("End time must be a valid date"),
  ],

  completeInterview: [
    param("sessionId")
      .isLength({ min: 1 })
      .withMessage("Session ID is required"),
    body("candidateRating.experienceRating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Experience rating must be between 1 and 5"),
    body("candidateRating.difficultyRating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Difficulty rating must be between 1 and 5"),
    body("candidateRating.fairnessRating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Fairness rating must be between 1 and 5"),
    body("candidateRating.feedback")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Feedback must not exceed 1000 characters"),
  ],

  // Invitation validation
  inviteCandidates: [
    body("candidates")
      .isArray({ min: 1 })
      .withMessage("At least one candidate must be provided"),
    body("candidates.*.name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Candidate name must be between 2 and 100 characters"),
    body("candidates.*.email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
  ],

  // Interview validation (existing)
  interviewCreate: [
    body("candidateName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Candidate name must be between 2 and 100 characters"),
    body("candidateEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("position")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Position must be between 2 and 100 characters"),
    body("interviewer")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Interviewer name must be between 2 and 100 characters"),
    body("datetime")
      .isISO8601()
      .withMessage("Please provide a valid date and time")
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error("Interview date must be in the future");
        }
        return true;
      }),
    body("duration")
      .isInt({ min: 15, max: 480 })
      .withMessage("Duration must be between 15 and 480 minutes"),
    body("type")
      .isIn(["video", "phone", "in-person", "panel"])
      .withMessage("Invalid interview type"),
  ],

  interviewUpdate: [
    body("candidateName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Candidate name must be between 2 and 100 characters"),
    body("candidateEmail")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("position")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Position must be between 2 and 100 characters"),
    body("interviewer")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Interviewer name must be between 2 and 100 characters"),
    body("datetime")
      .optional()
      .isISO8601()
      .withMessage("Please provide a valid date and time"),
    body("duration")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("Duration must be between 15 and 480 minutes"),
    body("type")
      .optional()
      .isIn(["video", "phone", "in-person", "panel"])
      .withMessage("Invalid interview type"),
    body("status")
      .optional()
      .isIn(["scheduled", "completed", "cancelled", "no-show", "rescheduled"])
      .withMessage("Invalid status"),
  ],

  // Result validation
  resultCreate: [
    body("candidateName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Candidate name must be between 2 and 100 characters"),
    body("candidateEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("position")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Position must be between 2 and 100 characters"),
    body("interviewer")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Interviewer name must be between 2 and 100 characters"),
    body("interviewDate")
      .isISO8601()
      .withMessage("Please provide a valid interview date"),
    body("overallScore")
      .isFloat({ min: 0, max: 10 })
      .withMessage("Overall score must be between 0 and 10"),
    body("status")
      .isIn(["passed", "failed", "pending", "on-hold"])
      .withMessage("Invalid result status"),
    body("recommendation")
      .isIn(["hire", "reject", "maybe", "next_round"])
      .withMessage("Invalid recommendation"),
    body("notes")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Notes must not exceed 2000 characters"),
    body("feedback")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Feedback must not exceed 2000 characters"),
  ],
};

// Custom validation middleware for file uploads
const validateFileUpload = (req, res, next) => {
  if (req.files) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "text/csv",
      "video/mp4",
      "video/webm",
      "audio/wav",
      "audio/mp3",
      "audio/webm",
    ];
    const maxSize = 100 * 1024 * 1024; // 100MB for video files

    for (const [fieldName, file] of Object.entries(req.files)) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type for ${fieldName}. Allowed types: ${allowedTypes.join(
            ", "
          )}`,
        });
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${fieldName} is too large. Maximum size is ${
            maxSize / (1024 * 1024)
          }MB`,
        });
      }
    }
  }
  next();
};

module.exports = {
  validate,
  validationRules,
  validateFileUpload,
};
