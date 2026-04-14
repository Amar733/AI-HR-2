const express = require("express");
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  generateQuestions,
  inviteCandidates,

  getJobStatistics,
  exportJobResults,
  // Add these new controller imports
  addCustomQuestion,
  updateCustomQuestion,
  deleteCustomQuestion,
  deleteAIQuestion,
  getJobQuestions,
  reorderCustomQuestions,
  getQuestionStats,
  bulkQuestionOperations,
  bulkResumeUpload,
  getSessionAnalysis,
  getJobCandidates,
} = require("../controllers/jobController");
const { protect } = require("../middleware/auth");
const { validate, validationRules } = require("../middleware/validation");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads/resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only .pdf, .doc, .docx files are allowed"));
    }
    cb(null, true);
  },
});

router.post("/bulk-upload-files", upload.array("files"), bulkResumeUpload);

// All routes are protected
router.use(protect);

// Job CRUD routes
router
  .route("/")
  .get(validationRules.pagination, validate, getJobs)
  .post(validationRules.jobCreate, validate, createJob);

router
  .route("/:id")
  .get(validationRules.mongoId, validate, getJob)
  .put(validationRules.mongoId, validationRules.jobUpdate, validate, updateJob)
  .delete(validationRules.mongoId, validate, deleteJob);

// AI and invitation routes
router.post(
  "/:id/generate-questions",
  validationRules.mongoId,
  validate,
  generateQuestions
);
router.post("/:id/invite", validate, inviteCandidates);

// Custom Questions routes (ADD THESE NEW ROUTES)
router
  .route("/:id/questions")
  .get(validationRules.mongoId, validate, getJobQuestions)
  .post(
    validationRules.mongoId,
    validationRules.customQuestion,
    validate,
    addCustomQuestion
  );

router
  .route("/:id/questions/:questionIndex")
  .put(
    validationRules.mongoId,
    validationRules.questionIndex,
    validationRules.customQuestion,
    validate,
    updateCustomQuestion
  )
  .delete(
    validationRules.mongoId,
    validationRules.questionIndex,
    validate,
    deleteCustomQuestion
  );

router
  .route("/:id/ai-questions/:questionIndex")
  .delete(
    validationRules.mongoId,
    validationRules.questionIndex,
    validate,
    deleteAIQuestion
  );

router.put(
  "/:id/questions/reorder",
  validationRules.mongoId,
  validationRules.reorderQuestions,
  validate,
  reorderCustomQuestions
);

// Additional question routes (OPTIONAL)
router.get(
  "/:id/questions/stats",
  validationRules.mongoId,
  validate,
  getQuestionStats
);
router.post(
  "/:id/questions/bulk",
  validationRules.mongoId,
  validationRules.bulkQuestionOperations,
  validate,
  bulkQuestionOperations
);

// Analytics routes
router.get(
  "/:id/statistics",
  validationRules.mongoId,
  validate,
  getJobStatistics
);

router.get(
  "/sessions/:sessionId/analysis",
  validationRules.mongoId,
  //validate,
  getSessionAnalysis
);

router.get(
  "/:id/candidates",
  validationRules.mongoId,
  validate,
  getJobCandidates
);

router.get("/:id/export", validationRules.mongoId, validate, exportJobResults);

module.exports = router;
