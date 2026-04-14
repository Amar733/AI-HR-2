const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const tmpUpload = multer({ dest: path.join(__dirname, "../uploads/") });

const {
  createInterview,
  uploadChunks,
  getInterviewSession,
  getJobSessions,
  setSessionRedflags,
  saveTranscript,
  exportAnalysisPDF,
} = require("../controllers/interviewSessionController");
const { protect, optionalAuth } = require("../middleware/auth");
const { validate, validationRules } = require("../middleware/validation");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Rate limiting for public interview endpoints
const interviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many interview attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
router.post("/transcription/bulk", saveTranscript);
router.post("/export-analysis-pdf", exportAnalysisPDF);
// Public interview routes (no auth required)
router.post(
  "/open-interviwe/create-interview",
  interviewLimiter,
  validationRules.startInterview,
  validate,
  createInterview
);

router.post(
  "/interview/upload/:sessionId/chunks",
  validationRules.submitResponse,
  validate,
  uploadChunks
);

router.get("/interview/session/:sessionId", getInterviewSession);

router.post("/upload-chunk", tmpUpload.single("chunk"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const { interviewId, sessionId } = req.body;
    const uploadDir = path.join(__dirname, "../uploads", sessionId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const dest = path.join(
      uploadDir,
      req.file.originalname || req.file.filename
    );
    // move the file from multer temp to final location
    fs.renameSync(req.file.path, dest);

    res.json({ success: true, file: `${sessionId}/${path.basename(dest)}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

setSessionRedflags;
router.post("/mood-and-redflags", setSessionRedflags);

// Protected routes for employers
router.use(protect);

router.get(
  "/jobs/:id/sessions",
  validationRules.mongoId,
  validate,
  getJobSessions
);

module.exports = router;
