const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const InterviewSession = require("../models/InterviewSession");
const User = require("../models/User"); // Adjust path
const Transaction = require("../models/Transaction"); // Adjust path
const Job = require("../models/Job");
const { asyncHandler } = require("../middleware/errorHandler");
const { OpenAI } = require("openai");
const mongoose = require("mongoose");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // set API key here
});
const executeFFmpeg = (args, operation) => {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    // Capture stdout (usually empty for FFmpeg)
    ffmpegProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Capture stderr (FFmpeg outputs progress and info here)
    ffmpegProcess.stderr.on("data", (data) => {
      const output = data.toString();
      stderr += output;

      // Log progress if available
      if (
        output.includes("frame=") ||
        output.includes("time=") ||
        output.includes("size=")
      ) {
        // Extract time information for progress
        const timeMatch = output.match(/time=([0-9:.]+)/);
        const frameMatch = output.match(/frame=\s*(\d+)/);
        const sizeMatch = output.match(/size=\s*([0-9]+kB|[0-9]+MB)/);

        if (timeMatch || frameMatch) {
          let progressInfo = `${operation} progress:`;
          if (timeMatch) progressInfo += ` time=${timeMatch[1]}`;
          if (frameMatch) progressInfo += ` frame=${frameMatch[1]}`;
          if (sizeMatch) progressInfo += ` size=${sizeMatch[1]}`;
        }
      }
    });

    // Handle process completion
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve({
          success: true,
          stdout,
          stderr,
          exitCode: code,
        });
      } else {
        console.error(`${operation} failed with exit code ${code}`);
        console.error("FFmpeg stderr output:", stderr);
        reject(
          new Error(`FFmpeg process exited with code ${code}. Error: ${stderr}`)
        );
      }
    });

    // Handle process errors (e.g., ffmpeg not found)
    ffmpegProcess.on("error", (err) => {
      console.error(`${operation} process error:`, err);

      if (err.code === "ENOENT") {
        reject(
          new Error(
            "FFmpeg is not installed or not found in PATH. Please install FFmpeg first."
          )
        );
      } else {
        reject(new Error(`FFmpeg process error: ${err.message}`));
      }
    });

    // Set timeout (5 minutes default, configurable)
    const timeoutMs = process.env.FFMPEG_TIMEOUT || 5 * 60 * 1000; // 5 minutes
    const timeout = setTimeout(() => {
      console.error(`${operation} timed out after ${timeoutMs / 1000} seconds`);
      ffmpegProcess.kill("SIGTERM"); // Graceful termination first

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!ffmpegProcess.killed) {
          console.error(`Force killing ${operation} process`);
          ffmpegProcess.kill("SIGKILL");
        }
      }, 5000);

      reject(
        new Error(`${operation} timed out after ${timeoutMs / 1000} seconds`)
      );
    }, timeoutMs);

    // Clear timeout on completion
    ffmpegProcess.on("close", () => {
      clearTimeout(timeout);
    });

    // Handle process termination signals
    process.on("SIGTERM", () => {
      if (!ffmpegProcess.killed) {
        ffmpegProcess.kill("SIGTERM");
      }
    });

    process.on("SIGINT", () => {
      if (!ffmpegProcess.killed) {
        ffmpegProcess.kill("SIGTERM");
      }
    });
  });
};

const processVideoAsync = async (interviewId, uploadsDir) => {
  // This runs asynchronously after response is sent
  setTimeout(async () => {
    try {
      const finalVideoPath = path.join(uploadsDir, "interview-recording.webm");
      const chunkFiles = fs
        .readdirSync(uploadsDir)
        .filter((file) => file.startsWith("chunk-") && file.endsWith(".webm"))
        .sort((a, b) => {
          const aNum = parseInt(a.match(/chunk-(\d+)/)?.[1] || "0");
          const bNum = parseInt(b.match(/chunk-(\d+)/)?.[1] || "0");
          return aNum - bNum;
        });

      if (chunkFiles.length > 0) {
        let videoProcessingSuccess = false;

        if (chunkFiles.length === 1) {
          // Single chunk - just copy/rename (no processing needed)
          const singleChunkPath = path.join(uploadsDir, chunkFiles[0]);

          try {
            fs.copyFileSync(singleChunkPath, finalVideoPath);

            videoProcessingSuccess = true;
          } catch (copyError) {
            console.error(
              `❌ Failed to copy single chunk for ${interviewId}:`,
              copyError
            );
            throw copyError;
          }
        } else {
          const concatListPath = path.join(uploadsDir, "concat-list.txt");
          const concatContent = chunkFiles
            .map((file) => {
              const fullPath = path.resolve(uploadsDir, file);
              const normalizedPath = fullPath.replace(/\\/g, "/");
              return `file '${normalizedPath}'`;
            })
            .join("\n");

          fs.writeFileSync(concatListPath, concatContent);

          const joinCmd = [
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            concatListPath,
            "-c",
            "copy",
            "-y",
            finalVideoPath,
          ];

          try {
            await executeFFmpeg(joinCmd, `Background join ${interviewId}`);
            videoProcessingSuccess = true;
          } catch (ffmpegError) {
            console.error(
              `❌ FFmpeg joining failed for ${interviewId}:`,
              ffmpegError
            );
            throw ffmpegError;
          }

          // Clean up concat list file
          try {
            fs.unlinkSync(concatListPath);
          } catch (cleanupError) {}
        }

        // Verify the output file exists and has content
        if (fs.existsSync(finalVideoPath)) {
          const stats = fs.statSync(finalVideoPath);
          if (stats.size > 0) {
            // Update session with video info
            const session = await InterviewSession.findOne({
              sessionId: interviewId,
            });
            if (session) {
              session.videoPath = `uploads/${interviewId}/interview-recording.webm`;
              session.hasVideo = true;
              session.videoSize = stats.size;
              await session.save();
            }

            // AUTOMATIC CHUNK CLEANUP - Always remove chunks after successful video creation
            if (videoProcessingSuccess) {
              let deletedCount = 0;
              let totalSize = 0;

              chunkFiles.forEach((chunkFile) => {
                try {
                  const chunkPath = path.join(uploadsDir, chunkFile);
                  const chunkStats = fs.statSync(chunkPath);
                  totalSize += chunkStats.size;

                  fs.unlinkSync(chunkPath);
                  deletedCount++;
                } catch (deleteErr) {
                  console.warn(
                    `   ⚠️  Failed to delete chunk ${chunkFile}:`,
                    deleteErr
                  );
                }
              });
            }
          } else {
            console.error(`❌ Output video file is empty for: ${interviewId}`);
          }
        } else {
          console.error(`❌ Output video file not created for: ${interviewId}`);
        }
      }
    } catch (error) {
      console.error(
        `❌ Background video joining failed for ${interviewId}:`,
        error.message
      );
      console.error(`🔍 Full error:`, error);
    }
  }, 1000);
};

// @desc    Start interview session
// @route   POST /api/interview/:jobLink/start
// @access  Public
// @desc    Start interview session
// @route   POST /api/interview/:jobLink/start
// @access  Public
const createInterview = asyncHandler(async (req, res) => {
  const { interviewId, name, email } = req.body;

  // 1. Find job by interview link
  const job = await Job.findOne({
    interviewLink: interviewId,
    isActive: true,
  });

  if (!job) {
    return res.json({
      success: false,
      message: "Interview not found or inactive",
    });
  }

  // 2. Check if interview has expired
  if (job.expiresAt && new Date() > job.expiresAt) {
    return res.status(403).json({
      success: false,
      message: "Interview has expired",
    });
  }

  // ============================================================
  // NEW: THE GATEKEEPER (Wallet Check)
  // ============================================================

  // We need to find the OWNER of this job to check their balance
  // We assume your Job model has a 'createdBy' field pointing to the User
  const jobOwner = await User.findById(job.userId);

  if (!jobOwner) {
    return res.status(500).json({
      success: false,
      message: "Job configuration error (Owner missing)",
    });
  }

  // Check Balance
  const MINIMUM_MINUTES = 5; // Configurable threshold

  if (jobOwner.wallet.minutesBalance < MINIMUM_MINUTES) {
    // CRITICAL: Do NOT tell the candidate "The recruiter has no money."
    // Give a generic "unavailable" message.
    console.log(
      `Blocked interview for Job ${job._id}: Owner ${jobOwner._id} has insufficient funds (${jobOwner.wallet.minutesBalance} mins).`
    );

    return res.status(503).json({
      success: false,
      message:
        "This interview is currently unavailable. Please contact the hiring team.",
      code: "QUOTA_EXCEEDED", // Internal code frontend might use
    });
  }

  // ============================================================
  // END GATEKEEPER
  // ============================================================

  // 3. Create new interview session
  const sessionId = generateSessionId();

  const interviewSession = await InterviewSession.create({
    jobId: job._id,
    candidateInfo: {
      name: name,
      email: email,
    },
    sessionId,
    status: "started",
    startedAt: new Date(),

    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      browser: getBrowserInfo(req.headers["user-agent"]),
      device: getDeviceInfo(req.headers["user-agent"]),
    },
  });

  // Prepare questions (combine custom and AI-generated)
  const allQuestions = [
    ...job.customQuestions.map((q) => ({
      id: q._id.toString(),
      question: q.question,
      type: q.type,
      timeLimit: q.timeLimit,
      expectedKeywords: q.keywords,
    })),
    ...job.aiQuestions.map((q) => ({
      id: Math.random().toString(36).substring(7),
      question: q.question,
      type: q.type,
      timeLimit: q.timeLimit,
      expectedKeywords: q.expectedKeywords,
    })),
  ];

  // Randomize questions if enabled
  if (job.settings.randomizeQuestions) {
    allQuestions.sort(() => Math.random() - 0.5);
  }

  // Limit to specified number of questions
  const selectedQuestions = allQuestions.slice(0, job.totalQuestions);

  const systemPrompt = `You are an HR interviewer conducting a ${
    job.interviewMode != "real" ? "mock practice" : "real"
  } interview.

CONTEXT
- Interview Language: ${job.interviewLanguage}
- Interview Time: ${job.duration} minutes.
- Total Question: ${job.totalQuestions}
- Position: ${job.position}
- Job Title: ${job.title}
- Job Department: ${job.department}
- Difficulty: ${job.difficulty}
- Job Description: ${job.description}
- Salary: ${job.salary.min} - ${job.salary.max} (${job.salary.currency} - ${
    job.salary.period
  }) 
- Location: ${job.location}
- Skill: ${JSON.stringify(job.requiredSkills)}
- Mode: ${job.interviewMode}
- Candidate: ${name}
- Custom QAs:  ${
    job.interviewMode != "real" ? "" : JSON.stringify(selectedQuestions)
  }

GENERAL RULES
- Must use local ${job.location} style ${
    job.interviewLanguage
  } language. It must be speaking type.
- Start Address first name from ${name}. Name should be called only in initial, middle and end of session.
- Keep responses short, natural, spoken-style. No code, special characters, or overly formal tone.
- End every message with exactly one tag: [QUESTION], [DISCUSSION], or [INTERVIEW_END].
- Track: questionCount (only real questions), lastQuestion, usedCustomQAs.
- Mix match questions, do not ask in sequence.
- No off-platform contact: never ask the candidate to reach you by email/phone/LinkedIn, never share contact details, never say “you can email me.”
- If the transcript is blank, contains noise, or is unclear (e.g. [BLANK_AUDIO], [INAUDIBLE], [NOISE], [MUSIC]), do not try to answer. Instead, respond with: "Sorry, I couldn’t hear that properly. Could you please repeat?"


CRITICAL INSTRUCTION - TAGS ARE SILENT MARKERS ONLY
- **Tags [QUESTION], [DISCUSSION], and [INTERVIEW_END] are SILENT metadata markers**
- **NEVER speak these tags out loud to the candidate**
- Add tags at the very end of your complete response, after all spoken content
- Tags are for system processing only, not for verbal communication
- Example: "Tell me about your experience with React. [QUESTION]" (candidate only hears "Tell me about your experience with React.")


QUESTION FLOW
- Use CustomQAs first; otherwise ask only technical, skill-based questions from Topic or JD and follow bellow.
- Adjust difficulty: simplify if they struggle; expand with examples if requested; advance if they do well.
- Use this approximate distribution of total real questions:
   ${JSON.stringify(job.questionTypes)}

- Always begin with “Tell me about yourself” → counts as HR.
- Ensure you don’t repeat the same type until at least one from other categories is asked.
- If customQAs exist, inject them while maintaining this ratio.

MODE RULES:

${
  job.interviewMode != "real"
    ? `
    *Mock Mode*
- Correct → brief acknowledgment, then next with [QUESTION].
- Wrong → simple explanation (no code) with [DISCUSSION], then ask if they want the next question or clarification.
- If they ask about a previous question → explain briefly with [DISCUSSION].
- After each answer, rate: Weak / Moderate / Strong with one-line coaching.

*FEEDBACK (mock mode only)*
- Evaluate answer on 3 factors:
  1) Correctness (accuracy of info)
  2) Clarity (structured, easy to follow)
  3) Confidence (tone, completeness)
- Weak → major errors OR very unclear/confused.
- Moderate → partially correct OR missing depth.
- Strong → correct, clear, confident.
- Output: One of [Weak / Moderate / Strong] + one coaching sentence.

`
    : `*Real Mode*
- Correct → next with [QUESTION]; no feedback.
- Wrong → next; do not explain.
- If they ask a technical question → “I cannot provide answers in this interview.” [DISCUSSION]
- If they ask about JD/company/salary → answer briefly [DISCUSSION], then repeat the previous question.
- If they ask about a past question → politely decline and move on [DISCUSSION]. Do not revel answer
- Never reveal solutions or hints.
`
}

OFF-TOPIC
- Politely redirect to the last unanswered question [DISCUSSION].

ENDING TRIGGERS
- When you receive "TIME_LIMIT_REACHED" or "MAX_QUESTIONS_REACHED", immediately start the ending flow.
- Do not ask additional questions after receiving these triggers.
- Begin with: "Thank you, [name]. We've reached our time limit / completed all questions. Let's wrap up."


ENDING FLOW (STRICTLY IN-CHAT, NO EMAIL)
- If Closing = yes, strictly follow the ending flow sequence:

  1) Ask about salary expectations → [DISCUSSION]
  2) Ask if they have questions → [DISCUSSION]
  3) In mock mode → ask if they need more help → [DISCUSSION]
  4) Only when all answered → close politely → [INTERVIEW_END]
  5) Then ask: “Do you have any questions or anything you’d like to discuss now?” [DISCUSSION] (Must follow from JD/SKILL/COMPANY DATA. If OFFTOPIC YOU MUST NOT ANSWER. DO NOT TELL THE INTERVIEW RESULT)
  6) In mock mode → before closing, explicitly ask: “Do you need more help with explanations or practice?” [DISCUSSION] (Must follow from JD/SKILL/COMPANY DATA. If OFFTOPIC YOU MUST NOT ANSWER. DO NOT TELL THE INTERVIEW RESULT)
  7) Only when they have no further questions (and in mock mode, no more help) → close with a neutral line without contact info, e.g., “Thanks for your time today.” [INTERVIEW_END]

  REMEMBER: Tags are NEVER spoken TTS - they are silent system markers only!

  `;

  // Start Open Ai session
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-realtime-preview",
      voice: "alloy",
      instructions: systemPrompt,
      input_audio_transcription: { model: "whisper-1" },
    }),
  });
  const data = await response.json();
  if (!data.client_secret?.value) {
    return res.json({ success: false, message: "No client_secret returned" });
  }

  await InterviewSession.updateOne(
    { sessionId: interviewSession.sessionId },
    { $set: { ephemeralKey: data.client_secret.value } }
  );

  // Aggregate to count sessions by status
  const stats = await InterviewSession.aggregate([
    { $match: { jobId: job._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
  ]);

  if (stats.length > 0) {
    const { total, completed } = stats[0];
    job.totalInterviews = total;
    job.completedInterviews = completed;
    await job.save();
  } else {
    // No sessions found → reset to zero
    job.totalInterviews = 0;
    job.completedInterviews = 0;
    await job.save();
  }

  res.json({
    success: true,
    message: "Interview session started successfully",
    ephemeralKey: data.client_secret.value,
    sessionId: interviewSession.sessionId,
    jobTitle: job.title,
    duration: job.duration,
    totalQuestions: job.totalQuestions,
  });
});
// @desc    Upload video recording chunks
// @route   POST /interview/upload/:sessionId/chunks
// @access  Public
const uploadChunks = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { interviewId, chunkIndex } = req.body;

  const session = await InterviewSession.findOne({ sessionId });

  if (!session) {
    return res.json({
      ok: false,
    });
  }
  const interview = await Interview.findById(interviewId);
  interview.chunks.push(req.file.filename);
  await interview.save();
  res.json({ ok: true });
});

// @desc    Get interview session
// @route   GET /api/interview/session/:sessionId
// @access  Public
const getInterviewSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await InterviewSession.findOne({ sessionId }).populate(
    "jobId",
    "title description settings"
  );

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Interview session not found",
    });
  }

  res.json({
    success: true,
    session,
  });
});

// @desc    Get job sessions (for employer)
// @route   GET /api/jobs/:id/sessions
// @access  Private
const getJobSessions = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { jobId: job._id };

  // Add filters
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.search) {
    query.$or = [
      { "candidateInfo.name": { $regex: req.query.search, $options: "i" } },
      { "candidateInfo.email": { $regex: req.query.search, $options: "i" } },
    ];
  }

  const sessions = await InterviewSession.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "candidateInfo status analysis completedAt totalDuration sessionId metadata fullTranscription redFlags createdAt videoPath"
    );

  const total = await InterviewSession.countDocuments(query);

  res.json({
    success: true,
    count: sessions.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    sessions,
  });
});

// @desc    Get detailed session analysis
// @route   GET /api/sessions/:sessionId/analysis
// @access  Private
const setSessionRedflags = asyncHandler(async (req, res) => {
  try {
    const { interviewId, redFlags = [] } = req.body;

    const normalizedRedFlags = redFlags.map((f) => ({
      type: f.type,
      description: f.description,
      severity: f.severity,
      timestamp: Number(f.timestamp) || Date.now(), // force number
      eventTime: Number(f.eventTime) || null,
    }));
    if (!redFlags.length) {
      return res.json({ success: true, message: "No red flags to save" });
    }

    var result = await InterviewSession.updateOne(
      { sessionId: interviewId },
      { $push: { redFlags: { $each: normalizedRedFlags } } }
    );

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to save red flags" });
  }
});

const saveTranscript = asyncHandler(async (req, res) => {
  try {
    const { interviewId, transcripts, finalSubmission } = req.body;

    if (!interviewId || !Array.isArray(transcripts)) {
      return res.status(400).json({
        success: false,
        message: "Missing fields: interviewId or transcripts",
      });
    }

    let session = await InterviewSession.findOne({ sessionId: interviewId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: `Interview session not found for sessionId=${interviewId}`,
      });
    }

    // Fetch Job (needed for stats AND to find the owner for billing)
    const job = await Job.findOne({
      _id: session.jobId,
      isActive: true,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // --- Update Job Stats (Existing Logic) ---
    // (Optimization: You could move this into the final transaction block if strict accuracy is needed,
    // but keeping it here is fine for general counters)
    const stats = await InterviewSession.aggregate([
      { $match: { jobId: job._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    if (stats.length > 0) {
      const { total, completed } = stats[0];
      await Job.updateOne(
        { _id: session.jobId },
        { $set: { totalInterviews: total, completedInterviews: completed } }
      );
    }

    // --- Final Submission Logic ---
    if (finalSubmission) {
      const fullText = transcripts
        .map(
          (t) =>
            (t.speaker === "ai" ? "Ai said: " : "candidate said: ") + t.text
        )
        .join(" ");

      const segments = transcripts.map((t) => ({
        start: null,
        end: null,
        text: t.text,
        confidence: typeof t.confidence === "number" ? t.confidence : undefined,
        speaker: t.speaker,
      }));

      const wordCount = fullText.trim().split(/\s+/).length;

      // Update session data in memory (not saved yet)
      session.fullTranscription = {
        text: fullText,
        segments,
        wordCount,
      };

      // --- OPENAI ANALYSIS ---
      try {
        const analysisPrompt = `
          You are an expert AI interview assessor.
          Given the following transcript of an AI interview, analyze the candidate in detail...
          (truncated for brevity - keep your existing prompt here)
          Transcript:
          ${fullText}
        `;

        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are an AI interview analyst. Return ONLY valid JSON.",
            },
            { role: "user", content: analysisPrompt },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        });

        const raw = openaiResponse.choices[0]?.message?.content || "";
        let analysisData;

        try {
          analysisData = JSON.parse(raw).analysis || null;
        } catch (e) {
          console.error("Parse failed:", e, raw);
          analysisData = null;
        }

        if (analysisData) {
          // --- WALLET TRANSACTION START ---
          const dbSession = await mongoose.startSession();
          dbSession.startTransaction();

          try {
            // 1. Calculate Cost
            // Ensure we have a valid completion time and duration
            const completionTime = new Date();
            let durationSeconds = session.totalDuration || 0;

            // If duration is 0 (frontend didn't track it), calculate from start time
            if (durationSeconds === 0 && session.startedAt) {
              durationSeconds = (completionTime - session.startedAt) / 1000;
            }

            // Minimum 1 minute charge, round up
            const durationMinutes = Math.max(
              1,
              Math.ceil(durationSeconds / 60)
            );

            // 2. Update the User's Wallet (Deduct Minutes)
            // Note: We allow negative balance here to prevent data loss after a successful interview.
            // You can add a check 'if (user.wallet.minutesBalance < durationMinutes)' earlier if you prefer strict blocking.
            const userUpdate = await User.findByIdAndUpdate(
              job.createdBy, // The recruiter who owns the job
              {
                $inc: {
                  "wallet.minutesBalance": -durationMinutes,
                  "wallet.totalMinutesUsed": durationMinutes,
                },
              },
              { session: dbSession, new: true }
            );

            // 3. Create Ledger Entry
            await Transaction.create(
              [
                {
                  userId: job.createdBy,
                  type: "usage",
                  amount: -durationMinutes, // Negative for usage
                  balanceAfter: userUpdate.wallet.minutesBalance,
                  description: `Interview Analysis: ${session.candidateInfo.name}`,
                  referenceId: session._id,
                  referenceModel: "InterviewSession",
                },
              ],
              { session: dbSession }
            );

            // 4. Update and Save Session
            session.analysis = analysisData;
            session.status = "completed";
            session.completedAt = completionTime;
            // Ensure accurate duration is saved
            session.totalDuration = durationSeconds;

            await session.save({ session: dbSession });

            await dbSession.commitTransaction();

            // Trigger background video processing (outside transaction)
            processVideoAsync(interviewId, `uploads/${interviewId}`);

            return res.json({
              success: true,
              message:
                "Transcription saved, analysis generated, and minutes deducted.",
              analysis: session.analysis,
              minutesDeducted: durationMinutes,
              remainingBalance: userUpdate.wallet.minutesBalance,
            });
          } catch (transactionError) {
            await dbSession.abortTransaction();
            console.error("Transaction failed:", transactionError);
            throw transactionError; // Re-throw to be caught by outer catch
          } finally {
            dbSession.endSession();
          }
          // --- WALLET TRANSACTION END ---
        } else {
          return res.status(500).json({
            success: true,
            message: "Failed to parse analysis data",
          });
        }
      } catch (openaiErr) {
        // On OpenAI error, we SAVE the transcript but do NOT complete the session or charge the user
        // This allows them to 'Retry' analysis later without losing data
        await session.save();
        console.error("OpenAI Error:", openaiErr);
        return res.status(500).json({
          success: true,
          message: "Analysis error: " + openaiErr.message,
        });
      }
    } else {
      // Just saving partial transcripts (auto-save during interview)
      await session.save();
      return res.json({ success: true, message: "Transcripts saved" });
    }
  } catch (err) {
    console.error("Bulk transcript error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while saving transcripts",
    });
  }
});

// Helper functions
function generateSessionId() {
  return (
    "session_" +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

function getBrowserInfo(userAgent) {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown";
}

function getDeviceInfo(userAgent) {
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";
  return "Desktop";
}

const exportAnalysisPDF = asyncHandler(async (req, res) => {
  try {
    const { sessionData = {}, analysisData = {}, analytics = {} } = req.body;
    if (!sessionData || !analysisData) {
      return res
        .status(400)
        .json({ success: false, message: "Session and analysis required" });
    }

    // Render EJS to HTML
    const html = await ejs.renderFile(
      path.join(__dirname, "../views/report.ejs"),
      {
        sessionData,
        analysis: analysisData,
        analytics,
        redFlags: sessionData.redFlags,
        fullTranscription: sessionData.fullTranscription,
      },
      { async: true }
    );

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "40px", bottom: "60px", left: "40px", right: "40px" },
    });
    const fs = require("fs");
    fs.writeFileSync("debug.pdf", pdfBuffer);
    // Close page and browser
    await page.close();
    await browser.close();

    // Respond with PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Interview_Analysis_${(
        sessionData.candidateInfo?.name || "candidate"
      ).replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // ✅ safer than res.send(pdfBuffer)
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
});

module.exports = {
  createInterview,
  uploadChunks,
  getInterviewSession,
  getJobSessions,
  setSessionRedflags,
  saveTranscript,
  exportAnalysisPDF,
};
