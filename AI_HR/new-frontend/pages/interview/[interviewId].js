import { useState, useRef, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Modal,
  Alert,
  Badge,
} from "react-bootstrap";
import Head from "next/head";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { APP_NAME } from "../../utils/constants";

export default function Home() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [systemStatus, setSystemStatus] = useState("checking");
  const [error, setError] = useState("");
  const [duration, setDuration] = useState("00:00");
  const [aiConnected, setAiConnected] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [aiTalking, setAiTalking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [interviewSessionId, setSessionId] = useState("");
  const startTimeRef = useRef(null);

  // Interview progress tracking
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [interviewPhase, setInterviewPhase] = useState("starting");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // ENHANCED: Store all transcripts locally until the end
  const allTranscripts = useRef([]);
  const aiTranscriptBuffer = useRef("");
  const candidateTranscriptBuffer = useRef("");
  const lastAiSave = useRef(Date.now());
  const lastCandidateSave = useRef(Date.now());

  // Red flags
  const redFlagsRef = useRef([]);

  // Use ref for interviewId so it persists across renders
  const interviewIdRef = useRef(null);

  // Red flag detection functions
  const addRedFlag = (type, description, severity = "medium") => {
    const redFlag = {
      type,
      description,
      severity, // low, medium, high
      timestamp: getCurrentTimestamp(),
      eventTime: Date.now(),
    };

    redFlagsRef.current = [...redFlagsRef.current, redFlag];
  };

  // Enhanced mood detection loop with red flags (every 10 seconds)
  const detectAndRedFlags = () => {
    setInterval(async () => {
      const currentRedFlags = [...redFlagsRef.current];
      redFlagsRef.current = [];
      if (currentRedFlags.length > 0) {
        try {
          await fetch(API_BASE_URL + "/mood-and-redflags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interviewId: interviewIdRef.current,
              interviewSessionId,
              timestamp: getCurrentTimestamp(),
              eventTime: Date.now(),
              redFlags: currentRedFlags,
              totalRedFlags: currentRedFlags.length,
              highSeverityFlags: currentRedFlags.filter(
                (f) => f.severity === "high"
              ).length,
            }),
          });
        } catch (err) {
          console.error("Failed to upload red flags:", err);
        }
      }
    }, 10000);
  };

  // Red flag event listeners setup
  const setupRedFlagDetection = () => {
    // Right click detection
    document.addEventListener("contextmenu", (e) => {
      addRedFlag("right_click", "Right click detected", "medium");
    });

    // Copy/Cut/Paste detection
    document.addEventListener("copy", (e) => {
      addRedFlag("copy", "Copy action detected", "high");
    });

    document.addEventListener("cut", (e) => {
      addRedFlag("cut", "Cut action detected", "high");
    });

    document.addEventListener("paste", (e) => {
      addRedFlag("paste", "Paste action detected", "high");
    });

    // Key combinations for developer tools
    document.addEventListener("keydown", (e) => {
      // F12 key
      if (e.key === "F12") {
        addRedFlag(
          "dev_tools",
          "F12 pressed - Developer tools attempt",
          "high"
        );
        e.preventDefault();
      }

      // Ctrl+Shift+I (Chrome DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        addRedFlag(
          "dev_tools",
          "Ctrl+Shift+I pressed - Developer tools attempt",
          "high"
        );
        e.preventDefault();
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        addRedFlag(
          "dev_tools",
          "Ctrl+Shift+J pressed - Console attempt",
          "high"
        );
        e.preventDefault();
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        addRedFlag(
          "view_source",
          "Ctrl+U pressed - View source attempt",
          "medium"
        );
        e.preventDefault();
      }

      // Ctrl+A (Select All)
      if (e.ctrlKey && e.key === "a") {
        addRedFlag("select_all", "Ctrl+A pressed - Select all attempt", "low");
      }

      // Alt+Tab (Task switching)
      if (e.altKey && e.key === "Tab") {
        addRedFlag(
          "task_switch",
          "Alt+Tab pressed - Task switching attempt",
          "high"
        );
      }

      // Ctrl+Tab (Browser tab switching)
      if (e.ctrlKey && e.key === "Tab") {
        addRedFlag(
          "tab_switch",
          "Ctrl+Tab pressed - Tab switching attempt",
          "high"
        );
        e.preventDefault();
      }

      // Print Screen
      if (e.key === "PrintScreen") {
        addRedFlag(
          "screenshot",
          "Print Screen pressed - Screenshot attempt",
          "high"
        );
      }

      // Windows key
      if (e.key === "Meta" || e.key === "OS") {
        addRedFlag(
          "windows_key",
          "Windows key pressed - System menu access",
          "medium"
        );
      }
    });

    // Tab visibility change (tab switching, minimizing)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        addRedFlag(
          "tab_hidden",
          "Tab became hidden - User switched away",
          "high"
        );
      } else {
        addRedFlag("tab_visible", "Tab became visible - User returned", "low");
      }
    });

    // Window focus/blur events
    window.addEventListener("blur", () => {
      addRedFlag(
        "window_blur",
        "Window lost focus - User switched applications",
        "high"
      );
    });

    window.addEventListener("focus", () => {
      addRedFlag("window_focus", "Window gained focus - User returned", "low");
    });

    // Mouse leave detection (cursor left the window)
    document.addEventListener("mouseleave", () => {
      addRedFlag("mouse_leave", "Mouse cursor left the window", "medium");
    });

    // Resize detection (could indicate switching to smaller window)
    window.addEventListener("resize", () => {
      addRedFlag("window_resize", "Window was resized", "low");
    });

    // Detect if developer tools are open (heuristic)
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    const detectDevTools = () => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          addRedFlag(
            "dev_tools_open",
            "Developer tools appear to be open",
            "high"
          );
        }
      } else {
        if (devtools.open) {
          devtools.open = false;
          addRedFlag(
            "dev_tools_closed",
            "Developer tools appear to be closed",
            "medium"
          );
        }
      }
    };

    // Check for dev tools every 2 seconds
    setInterval(detectDevTools, 2000);

    // Detect multiple rapid clicks (could indicate frustration or cheating attempts)
    let clickCount = 0;
    let clickTimer = null;

    document.addEventListener("click", () => {
      clickCount++;

      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      clickTimer = setTimeout(() => {
        if (clickCount > 10) {
          // More than 10 clicks in 3 seconds
          addRedFlag(
            "rapid_clicking",
            `Rapid clicking detected: ${clickCount} clicks in 3 seconds`,
            "medium"
          );
        }
        clickCount = 0;
      }, 3000);
    });

    // Detect text selection (could indicate copying)
    document.addEventListener("selectstart", () => {
      addRedFlag("text_selection", "Text selection started", "low");
    });

    // Detect drag and drop
    document.addEventListener("dragstart", (e) => {
      addRedFlag("drag_start", "Drag operation started", "medium");
    });

    // Network detection (online/offline)
    window.addEventListener("offline", () => {
      addRedFlag("network_offline", "Network connection lost", "high");
    });

    window.addEventListener("online", () => {
      addRedFlag("network_online", "Network connection restored", "medium");
    });
  };

  const candidateVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const previewVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const aiAnalyserRef = useRef(null);

  const [interviewDuration, setInterviewDuration] = useState(0);
  const [interviewQuestionCount, setInterviewQuestionCount] = useState(0);

  // Global variables (kept as lets where appropriate)
  let pc, localStream;
  let started = false;
  let aiAudioStream = null;
  let chunkIndex = 0;
  let recording = true;
  let clientDataChannel = null;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Helper function to get current timestamp
  const getCurrentTimestamp = () => {
    if (!startTimeRef.current) return "00:00";
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // ENHANCED: Parse AI responses with better tag handling
  const parseAIResponse = (message) => {
    if (!message) return;

    // Extract tag and clean content more carefully
    const tagPattern = /\s*\[(QUESTION|DISCUSSION|INTERVIEW_END)\]\s*$/;
    const tagMatch = message.match(tagPattern);

    if (tagMatch) {
      const tag = tagMatch[1];
      // Remove the tag completely from spoken content
      const spokenContent = message.replace(tagPattern, "").trim();

      // Process tag for system logic
      if (tag === "QUESTION" && spokenContent) {
        setCurrentQuestion(spokenContent);
        const newQuestionNumber = currentQuestionNumber + 1;
        setCurrentQuestionNumber(newQuestionNumber);
        setInterviewPhase("questioning");

        // Check max questions
        if (
          newQuestionNumber >= totalQuestions &&
          interviewPhase !== "ending" &&
          interviewPhase !== "completed"
        ) {
          requestGracefulEnd("max_questions");
          return;
        }
      } else if (tag === "DISCUSSION") {
        setInterviewPhase("questioning");
      } else if (tag === "INTERVIEW_END") {
        setInterviewPhase("completed");
        setCurrentQuestion("Interview completed");

        setTimeout(() => {
          stopRecording();
        }, 2000); // Give more time for final processing
        return;
      }
    }
  };

  // ENHANCED: Function to check if text looks like a complete sentence
  const isCompleteSentence = (text) => {
    const trimmed = text.trim();
    if (trimmed.length < 3) return false;

    // Check for sentence endings
    const sentenceEnders = [".", "!", "?", ":", ";"];
    const endsWithPunctuation = sentenceEnders.some((punct) =>
      trimmed.endsWith(punct)
    );

    // Check for natural pauses (common phrases that indicate completion)
    const naturalEnders = [
      "thank you",
      "that's right",
      "exactly",
      "yes",
      "no",
      "okay",
      "alright",
      "I see",
      "understood",
      "great",
      "perfect",
      "good",
      "sure",
      "absolutely",
    ];
    const endsNaturally = naturalEnders.some((phrase) =>
      trimmed.toLowerCase().endsWith(phrase.toLowerCase())
    );

    return endsWithPunctuation || endsNaturally || trimmed.length > 50;
  };

  // ENHANCED: Store transcripts locally - NO API calls during interview
  const storeTranscript = (text, speaker = "system") => {
    if (!text || !text.trim() || text.trim().length < 2) {
      return;
    }

    // Prevent duplicate saves (check if last transcript is the same)
    const lastTranscript =
      allTranscripts.current[allTranscripts.current.length - 1];
    if (
      lastTranscript &&
      lastTranscript.text === text.trim() &&
      lastTranscript.speaker === speaker
    ) {
      return;
    }

    // Add to local storage array
    const transcriptItem = {
      text: text.trim(),
      speaker,
      timestamp: getCurrentTimestamp(),
      eventTime: Date.now(),
      id: Date.now() + Math.random(),
    };

    allTranscripts.current.push(transcriptItem);
  };

  // ENHANCED: Request graceful end from AI instead of force ending
  const requestGracefulEnd = async (reason = "time_limit") => {
    setInterviewPhase("ending");
    setCurrentQuestion("Wrapping up the interview...");

    if (clientDataChannel && clientDataChannel.readyState === "open") {
      const endInstruction = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [
            {
              type: "text",
              text: `The interview should now be concluded gracefully. Please:
              1. Thank the candidate for their time
              2. Provide brief closing remarks 
              3. Let them know next steps (if applicable)
              4. End with [INTERVIEW_END] tag
              
              Keep it professional and positive. Do not ask more questions.`,
            },
          ],
        },
      };

      try {
        clientDataChannel.send(JSON.stringify(endInstruction));
      } catch (err) {
        console.warn("Failed to send graceful end instruction:", err);
      }
    }
  };

  // CSS Styles (keeping original styles)
  const styles = {
    body: {
      margin: 0,
      padding: 0,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background:
        "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
      color: "#ffffff",
      minHeight: "100vh",
    },
    navbar: {
      background: "rgba(0, 0, 0, 0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(31, 162, 166, 0.2)",
      padding: "1rem 0",
    },
    brandContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    logo: {
      width: "40px",
      height: "40px",
      background: "linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      boxShadow: "0 0 20px rgba(31, 162, 166, 0.3)",
    },
    companyName: {
      fontSize: "1.25rem",
      fontWeight: "700",
      background: "linear-gradient(135deg, #ffffff 0%, #1fa2a6 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    mainContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      padding: "2rem 1rem",
    },
    setupCard: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "20px",
      backdropFilter: "blur(20px)",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
      overflow: "hidden",
      position: "relative",
    },
    cardGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        "linear-gradient(135deg, rgba(31, 162, 166, 0.1) 0%, transparent 50%)",
      opacity: 0,
      transition: "opacity 0.3s ease",
      pointerEvents: "none",
    },
    heroSection: {
      textAlign: "center",
      padding: "2rem",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    heroTitle: {
      fontSize: "2.5rem",
      fontWeight: "700",
      marginBottom: "1rem",
      background: "linear-gradient(135deg, #ffffff 0%, #1fa2a6 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    heroSubtitle: {
      fontSize: "1.125rem",
      color: "#b0b0b0",
      marginBottom: "0",
    },
    audioBar: {
      width: "4px",
      background: "linear-gradient(to top, #1fa2a6, #0f4c81)",
      margin: "0 1px",
      borderRadius: "2px",
      transition: "height 0.1s ease",
    },
    formSection: {
      padding: "2rem",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "#ffffff",
      marginBottom: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "1rem",
      background: "rgba(0, 0, 0, 0.4)",
      border: "2px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "10px",
      color: "#ffffff",
      fontSize: "1rem",
      outline: "none",
      transition: "all 0.3s ease",
    },
    button: {
      width: "100%",
      padding: "1rem 2rem",
      background: "linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%)",
      border: "none",
      borderRadius: "10px",
      color: "#000000",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 8px 25px rgba(31, 162, 166, 0.3)",
    },
    statusGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1rem",
      padding: "1.5rem",
      background: "rgba(0, 0, 0, 0.2)",
    },
    statusItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    statusDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: "#666",
    },
    statusReady: {
      background: "#1fa2a6",
      boxShadow: "0 0 10px rgba(31, 162, 166, 0.5)",
    },
    // MEETING UI STYLES
    meetingContainer: {
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      background:
        "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
      overflow: "hidden",
    },
    meetingNavbar: {
      background: "rgba(0, 0, 0, 0.9)",
      backdropFilter: "blur(20px)",
      padding: "0.75rem 0",
      borderBottom: "1px solid rgba(31, 162, 166, 0.2)",
      flexShrink: 0,
    },
    meetingContent: {
      flex: 1,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "1rem",
      padding: "1rem",
      height: isMobile ? "auto" : "calc(100vh - 70px)",
      overflow: "hidden",
    },
    candidateSection: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      minHeight: 0,
    },
    candidateVideo: {
      background: "rgba(0, 0, 0, 0.8)",
      borderRadius: "15px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      overflow: "hidden",
      position: "relative",
      flex: 1,
      minHeight: isMobile ? "300px" : "0",
      maxHeight: isMobile ? "400px" : "none",
    },
    hrSection: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      minHeight: 0,
    },
    hrContainer: {
      background: "rgba(0, 0, 0, 0.8)",
      borderRadius: "20px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      flex: 1,
      textAlign: "center",
    },
    hrAvatar: {
      width: isMobile ? "120px" : "150px",
      height: isMobile ? "120px" : "150px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isMobile ? "3rem" : "4rem",
      position: "relative",
      marginBottom: "1.5rem",
      boxShadow: "0 0 30px rgba(31, 162, 166, 0.3)",
    },
    audioRing: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: isMobile ? "160px" : "200px",
      height: isMobile ? "160px" : "200px",
      border: "3px solid rgba(31, 162, 166, 0.3)",
      borderRadius: "50%",
      animation: aiTalking ? "pulse-ring 1.5s ease-in-out infinite" : "none",
    },
    audioRing2: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: isMobile ? "180px" : "230px",
      height: isMobile ? "180px" : "230px",
      border: "2px solid rgba(31, 162, 166, 0.2)",
      borderRadius: "50%",
      animation: aiTalking
        ? "pulse-ring 1.5s ease-in-out infinite 0.5s"
        : "none",
    },
    hrInfo: {
      marginBottom: "1.5rem",
    },
    hrTitle: {
      fontSize: isMobile ? "1.25rem" : "1.5rem",
      fontWeight: "700",
      color: "#1fa2a6",
      marginBottom: "0.5rem",
    },
    hrSubtitle: {
      fontSize: isMobile ? "0.9rem" : "1rem",
      color: "#b0b0b0",
      marginBottom: "1rem",
    },
    statsRow: {
      display: "flex",
      justifyContent: "center",
      gap: isMobile ? "0.5rem" : "1rem",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
    },
    statBadge: {
      background: "rgba(31, 162, 166, 0.1)",
      border: "1px solid rgba(31, 162, 166, 0.3)",
      borderRadius: "15px",
      padding: "0.4rem 0.8rem",
      fontSize: "0.75rem",
      color: "#1fa2a6",
      textAlign: "center",
      minWidth: isMobile ? "70px" : "80px",
    },
    endButtonCenter: {
      background: "linear-gradient(135deg, #ff9500 0%, #ff7b00 100%)",
      border: "none",
      borderRadius: "12px",
      color: "#ffffff",
      padding: isMobile ? "1rem 2rem" : "1.25rem 3rem",
      fontSize: isMobile ? "1rem" : "1.125rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 8px 25px rgba(255, 149, 0, 0.3)",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    videoContainer: {
      position: "relative",
      width: "100%",
      height: "100%",
    },
    video: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    videoOverlay: {
      position: "absolute",
      bottom: "15px",
      left: "15px",
      right: "15px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "end",
      flexWrap: "wrap",
      gap: "0.5rem",
    },
    videoInfo: {
      background: "rgba(0, 0, 0, 0.8)",
      padding: "0.75rem",
      borderRadius: "8px",
      backdropFilter: "blur(10px)",
    },
    talkingIndicator: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      background: "rgba(0, 0, 0, 0.8)",
      padding: "0.5rem 0.75rem",
      borderRadius: "20px",
      border: "1px solid rgba(31, 162, 166, 0.3)",
    },
    talkingDots: {
      display: "flex",
      gap: "3px",
    },
    talkingDot: {
      width: "5px",
      height: "5px",
      borderRadius: "50%",
      background: "#1fa2a6",
    },
    audioVisualizer: {
      width: "100%",
      height: isMobile ? "50px" : "60px",
      background: "#1a1a1a",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    phaseIndicator: {
      position: "absolute",
      top: "15px",
      left: "15px",
      borderRadius: "12px",
      padding: "0.3rem 0.8rem",
      fontSize: "0.7rem",
      textTransform: "uppercase",
      fontWeight: "600",
    },
    finalizingOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(10px)",
    },
    finalizingCard: {
      background: "rgba(0, 0, 0, 0.9)",
      border: "1px solid rgba(31, 162, 166, 0.3)",
      borderRadius: "20px",
      padding: "3rem",
      textAlign: "center",
      maxWidth: "400px",
      width: "90%",
    },
  };

  useEffect(() => {
    checkSystemReadiness();
    startPreview();

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ENHANCED: Timer with incremental time display and graceful ending
  useEffect(() => {
    let interval = null;
    if (isRecording && startTimeRef.current) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60)
          .toString()
          .padStart(2, "0");
        const seconds = (elapsed % 60).toString().padStart(2, "0");
        setDuration(`${minutes}:${seconds}`);

        // 2-minute warning
        if (
          totalDurationMinutes > 0 &&
          elapsed >= (totalDurationMinutes - 2) * 60 &&
          elapsed < (totalDurationMinutes - 1.8) * 60 && // Prevent multiple triggers
          interviewPhase === "questioning"
        ) {
          setCurrentQuestion("⚠️ 2 minutes remaining in your interview");
        }

        // 30 second warning - request graceful end
        if (
          totalDurationMinutes > 0 &&
          elapsed >= (totalDurationMinutes - 0.5) * 60 &&
          interviewPhase !== "ending" &&
          interviewPhase !== "completed"
        ) {
          requestGracefulEnd("time_warning");
        }

        // HARD LIMIT: 1 minute overtime (only if AI hasn't ended gracefully)
        if (
          totalDurationMinutes > 0 &&
          elapsed >= totalDurationMinutes * 60 + 60 && // 1 minute overtime
          interviewPhase !== "completed"
        ) {
          setInterviewPhase("completed");
          setCurrentQuestion("Interview time exceeded");
          setTimeout(() => {
            stopRecording();
          }, 1000);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, startTimeRef, totalDurationMinutes, interviewPhase]);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });
      setPreviewStream(stream);

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }

      // Setup audio analysis for visualization
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start audio visualization
      const updateAudioLevel = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average);
        setIsTalking(average > 20);

        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
    } catch (err) {
      console.error("Preview failed:", err);
    }
  };

  const checkSystemReadiness = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());

      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing not supported");
      }

      setSystemStatus("ready");
    } catch (err) {
      setSystemStatus("error");
      setError("Camera and microphone access required.");
    }
  };

  // UPDATED: Better connection handling in startInterview
  const startInterview = async (interview) => {
    setSessionId(interview.sessionId);
    interviewIdRef.current = interview.sessionId; // persist id here

    if (started) return;
    started = true;

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Better connection state monitoring
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setAiConnected(true);
        } else if (pc.connectionState === "disconnected") {
          setAiConnected(false);
        } else if (pc.connectionState === "failed") {
          setAiConnected(false);
        }
      };

      clientDataChannel = pc.createDataChannel("oai-events");

      // ENHANCED: Sentence-based transcript message handling - STORE LOCALLY ONLY
      clientDataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            // ✅ AI partial transcript - ACCUMULATE, DON'T SEND YET
            case "response.audio_transcript.delta":
              if (data.delta) {
                // Remove tags before adding to buffer
                const cleanDelta = data.delta.replace(
                  /\s*\[(QUESTION|DISCUSSION|INTERVIEW_END)\]\s*/g,
                  ""
                );

                // Add to buffer instead of sending immediately
                if (cleanDelta.trim()) {
                  aiTranscriptBuffer.current += cleanDelta;

                  // Store if it's a complete sentence OR every 5 seconds
                  const timeSinceLastSave = Date.now() - lastAiSave.current;

                  if (
                    isCompleteSentence(aiTranscriptBuffer.current) ||
                    timeSinceLastSave > 5000
                  ) {
                    if (aiTranscriptBuffer.current.trim().length > 2) {
                      storeTranscript(aiTranscriptBuffer.current.trim(), "ai");
                      aiTranscriptBuffer.current = "";
                      lastAiSave.current = Date.now();
                    }
                  }
                }

                // Still process the full message for system logic (tags)
                parseAIResponse(data.delta);
              }
              break;

            // ✅ AI completed transcript - STORE FINAL BUFFER
            case "response.audio_transcript.done":
              // Store whatever is left in the buffer
              if (aiTranscriptBuffer.current.trim()) {
                storeTranscript(aiTranscriptBuffer.current.trim(), "ai");

                // Process for system logic if it has tags
                parseAIResponse(aiTranscriptBuffer.current);
              }

              // Clear the buffer for next transcript
              aiTranscriptBuffer.current = "";
              break;

            // ✅ Candidate partial transcript - ACCUMULATE, DON'T SEND YET
            case "conversation.item.input_audio_transcription.delta":
              if (data.delta && data.delta.trim()) {
                // Add to buffer instead of sending immediately
                candidateTranscriptBuffer.current += data.delta;

                // Store if it's a complete sentence OR every 3 seconds
                const timeSinceLastSave =
                  Date.now() - lastCandidateSave.current;

                if (
                  isCompleteSentence(candidateTranscriptBuffer.current) ||
                  timeSinceLastSave > 3000
                ) {
                  if (candidateTranscriptBuffer.current.trim().length > 2) {
                    storeTranscript(
                      candidateTranscriptBuffer.current.trim(),
                      "candidate"
                    );
                    candidateTranscriptBuffer.current = "";
                    lastCandidateSave.current = Date.now();
                  }
                }
              }
              break;

            // ✅ Candidate final transcript - STORE FINAL BUFFER
            case "conversation.item.input_audio_transcription.completed":
              // Store whatever is left in the buffer
              if (candidateTranscriptBuffer.current.trim()) {
                storeTranscript(
                  candidateTranscriptBuffer.current.trim(),
                  "candidate"
                );
              }

              // Clear the buffer for next transcript
              candidateTranscriptBuffer.current = "";
              break;

            // ✅ Fallback: Complete conversation items (already complete sentences)
            case "conversation.item.created":
              const message = data.item?.content?.find(
                (c) => c.type === "text"
              )?.text;

              if (message && message.trim()) {
                const speaker = data.item.role === "user" ? "candidate" : "ai";

                if (speaker === "ai") {
                  // Clean and store (remove tags)
                  const cleanMessage = message.replace(
                    /\s*\[(QUESTION|DISCUSSION|INTERVIEW_END)\]\s*/g,
                    ""
                  );

                  if (cleanMessage.trim()) {
                    storeTranscript(cleanMessage, speaker);
                  }

                  // Process for system logic
                  parseAIResponse(message);
                } else {
                  // Candidate messages don't have tags

                  storeTranscript(message, speaker);
                }
              }
              break;

            // Other message types we want to acknowledge but not process
            case "session.created":
            case "input_audio_buffer.speech_started":
            case "input_audio_buffer.speech_stopped":
            case "input_audio_buffer.committed":
            case "response.created":
            case "response.output_item.added":
            case "response.content_part.added":
            case "response.audio.done":
            case "response.content_part.done":
            case "response.output_item.done":
            case "response.done":
            case "rate_limits.updated":
            case "output_audio_buffer.stopped":
            case "output_audio_buffer.cleared":
            case "conversation.item.truncated":
              break;

            default:
              break;
          }
        } catch (err) {
          console.error("❌ Message parsing error:", err);
          console.error("❌ Raw message that failed:", event.data);
        }
      };

      // FIXED: Enhanced AI audio handling with proper talking detection
      pc.ontrack = (ev) => {
        if (ev.track.kind === "audio") {
          aiAudioStream = new MediaStream([ev.track]);
          const remoteAudioEl = remoteAudioRef.current;
          if (remoteAudioEl) {
            remoteAudioEl.srcObject = aiAudioStream;
            remoteAudioEl.play().catch((err) => {
              console.error("Autoplay failed:", err);
            });

            setAiConnected(true);

            // Setup AI talking detection
            const audioContext = new (window.AudioContext ||
              window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(aiAudioStream);

            analyser.fftSize = 256;
            source.connect(analyser);

            aiAnalyserRef.current = analyser;

            const detectAiTalking = () => {
              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(dataArray);

              const average =
                dataArray.reduce((sum, value) => sum + value, 0) /
                dataArray.length;
              setAiTalking(average > 10);

              requestAnimationFrame(detectAiTalking);
            };
            detectAiTalking();
          }
        }
      };

      // Candidate mic with noise suppression
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${interview.ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      const answerSdp = await sdpResp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Send system instruction after connection
      setTimeout(() => {
        createConversationWithInstructions();
      }, 3000);
    } catch (error) {
      setError("Failed to establish connection. Please try again.");
      console.error("startInterview error:", error);
    }
  };

  // ENHANCED: System instruction to prevent tag vocalization
  const createConversationWithInstructions = () => {
    if (clientDataChannel && clientDataChannel.readyState === "open") {
      const systemInstruction = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [
            {
              type: "text",
              text: `CRITICAL INSTRUCTION - NEVER VOCALIZE TAGS:
            
            You are an AI interviewer. When responding:
            1. NEVER speak tags like [QUESTION], [DISCUSSION], [INTERVIEW_END] out loud
            2. These tags are SILENT metadata for system processing only  
            3. The candidate must NEVER hear these tags in your speech
            4. Add tags ONLY at the very end after your complete spoken response
            5. Example: "That's a great answer. Let's move to the next question. [QUESTION]"
            
            WRONG: "Let's start with a question [QUESTION] about your experience"
            CORRECT: "Let's start with a question about your experience [QUESTION]"
            
            When ending the interview, say your goodbye naturally, then add [INTERVIEW_END]:
            "Thank you for your time today. We'll be in touch soon. [INTERVIEW_END]"
            
            Remember: Tags are metadata markers that should NEVER be spoken aloud to the candidate.`,
            },
          ],
        },
      };

      try {
        clientDataChannel.send(JSON.stringify(systemInstruction));
      } catch (err) {
        console.warn("Failed to send system instruction:", err);
      }
    }
  };

  // Video stream merging
  const mergeVideoStreams = (camStream, screenStream) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");

    const camVideo = document.createElement("video");
    camVideo.srcObject = camStream;
    camVideo.muted = true;
    camVideo.play();

    const screenVideo = document.createElement("video");
    screenVideo.srcObject = screenStream;
    screenVideo.muted = true;
    screenVideo.play();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      const camWidth = 320;
      const camHeight = 200;
      const camX = canvas.width - camWidth - 30;
      const camY = canvas.height - camHeight - 30;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;

      ctx.beginPath();
      ctx.moveTo(camX + 15, camY);
      ctx.lineTo(camX + camWidth - 15, camY);
      ctx.quadraticCurveTo(camX + camWidth, camY, camX + camWidth, camY + 15);
      ctx.lineTo(camX + camWidth, camY + camHeight - 15);
      ctx.quadraticCurveTo(
        camX + camWidth,
        camY + camHeight,
        camX + camWidth - 15,
        camY + camHeight
      );
      ctx.lineTo(camX + 15, camY + camHeight);
      ctx.quadraticCurveTo(camX, camY + camHeight, camX, camY + camHeight - 15);
      ctx.lineTo(camX, camY + 15);
      ctx.quadraticCurveTo(camX, camY, camX + 15, camY);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(camVideo, camX, camY, camWidth, camHeight);
      ctx.restore();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 3;
      ctx.stroke();

      if (recording) requestAnimationFrame(draw);
    }

    draw();
    return canvas.captureStream(30);
  };

  const startRecording = async (interview, pcArg) => {
    try {
      // Get screen + cam streams (video only for cam)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const camStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // show camera preview
      if (candidateVideoRef.current) {
        candidateVideoRef.current.srcObject = camStream;
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.style.display = "none";
      }

      // Canvas-based merged video stream (video only)
      const combinedVideoStream = mergeVideoStreams(camStream, screenStream);

      // Start audio mixing
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();

      // Helper to connect a MediaStream into audioContext safely
      const connectStreamToDestination = (ms) => {
        try {
          if (!ms) return null;
          // Some browsers throw if stream has no audio tracks; guard it.
          if (!ms.getAudioTracks || ms.getAudioTracks().length === 0)
            return null;
          const src = audioContext.createMediaStreamSource(ms);
          src.connect(destination);
          return src;
        } catch (err) {
          console.warn("Audio connect failed:", err);
          return null;
        }
      };

      // Connect local mic (the one created in startInterview and stored in `localStream`)
      let micSource = null;
      if (localStream && localStream.getAudioTracks().length > 0) {
        micSource = connectStreamToDestination(localStream);
      } else {
        // as fallback, try to request mic if localStream is not present (optional)
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          micSource = connectStreamToDestination(fallbackStream);
          // keep fallbackStream around so it doesn't get GC'd prematurely
          // (not stored globally here but will be collected when recording stops)
        } catch (err) {
          console.warn("No mic available for mixing:", err);
        }
      }

      // If AI audio is already available (pc.ontrack), connect it
      let aiSource = null;
      if (aiAudioStream && aiAudioStream.getAudioTracks().length > 0) {
        aiSource = connectStreamToDestination(aiAudioStream);
      }

      // If aiAudioStream appears later, listen and connect to destination (best-effort)
      // This ensures we capture remote AI audio if it arrives after recorder started.
      const onAiStreamAvailable = () => {
        if (!aiAudioStream) return;
        if (!aiSource && aiAudioStream.getAudioTracks().length > 0) {
          aiSource = connectStreamToDestination(aiAudioStream);
          console.log("AI audio connected for recording");
        }
      };
      // Monitor global aiAudioStream variable (simple interval check)
      const aiWatchInterval = setInterval(onAiStreamAvailable, 500);

      // Build final combined MediaStream (video tracks + mixed audio track)
      const mixedAudioTrack = destination.stream.getAudioTracks()[0];
      const combinedStream = new MediaStream();

      // add video tracks
      combinedVideoStream
        .getVideoTracks()
        .forEach((t) => combinedStream.addTrack(t));

      // add audio track if present
      if (mixedAudioTrack) {
        combinedStream.addTrack(mixedAudioTrack);
      } else {
        console.warn(
          "No mixed audio track available at start - recorder will be video-only until audio connects"
        );
      }

      // Debug logs
      console.log("Combined stream tracks:", combinedStream.getTracks());
      console.log(
        "Video tracks:",
        combinedStream.getVideoTracks().length,
        "Audio tracks:",
        combinedStream.getAudioTracks().length
      );

      // MediaRecorder loop: record 10s chunks and upload
      async function recordChunk() {
        if (!recording) return;

        // If an audio track appears later, ensure recorder uses it for subsequent chunks:
        // (We re-create MediaRecorder for each chunk, so if destination gained an audio track,
        // it will be included next time we build combinedStream.)
        const recorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm; codecs=vp8",
          bitsPerSecond: 1_500_000, // lowered bitrate for smaller uploads
        });

        recorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            const fd = new FormData();
            fd.append("chunk", e.data, `chunk-${chunkIndex}.webm`);
            // use interviewIdRef for persistent id
            fd.append("sessionId", interviewIdRef.current);
            fd.append("chunkIndex", chunkIndex);
            fd.append("timestamp", getCurrentTimestamp());

            try {
              await fetch(API_BASE_URL + "/upload-chunk", {
                method: "POST",
                body: fd,
              });
            } catch (err) {
              console.error("Chunk upload failed:", err);
            }
            chunkIndex++;
          }
        };

        recorder.start();
        // stop after 10 seconds per your original
        setTimeout(() => recorder.stop(), 10_000);
        await new Promise((resolve) => (recorder.onstop = resolve));
        if (recording) await recordChunk();
      }

      recordChunk();

      // cleanup hook to cancel the aiWatchInterval when recording stops
      const cleanupWatcher = () => clearInterval(aiWatchInterval);

      // Save cleanup function so stopRecording can call it (attach to window scope var or closure)
      window.__ai_interview_audio_cleanup = () => {
        cleanupWatcher();
        try {
          if (audioContext && audioContext.state !== "closed")
            audioContext.close();
        } catch (err) {}
      };
    } catch (err) {
      console.error("startRecording error:", err);
    }
  };

  // ENHANCED: Stop recording with all transcripts sent at the end
  const stopRecording = async () => {
    recording = false;
    setIsRecording(false);
    setInterviewPhase("finalizing");
    setCurrentQuestion("Finalizing interview - sending transcripts...");

    // Clean up all streams & connections
    try {
      if (localStream) localStream.getTracks().forEach((track) => track.stop());
    } catch (err) {}
    try {
      if (aiAudioStream)
        aiAudioStream.getTracks().forEach((track) => track.stop());
    } catch (err) {}
    try {
      if (pc) pc.close();
    } catch (err) {}

    // STEP 1: Save any remaining buffered transcripts

    if (aiTranscriptBuffer.current.trim()) {
      storeTranscript(aiTranscriptBuffer.current.trim(), "ai");
      aiTranscriptBuffer.current = "";
    }

    if (candidateTranscriptBuffer.current.trim()) {
      storeTranscript(candidateTranscriptBuffer.current.trim(), "candidate");
      candidateTranscriptBuffer.current = "";
    }

    // STEP 2: Send ALL transcripts at once
    const totalTranscripts = allTranscripts.current.length;

    if (totalTranscripts > 0) {
      try {
        const response = await fetch(API_BASE_URL + "/transcription/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            interviewId: interviewIdRef.current,
            interviewSessionId,
            transcripts: allTranscripts.current,
            totalCount: totalTranscripts,
            finalSubmission: true,
          }),
        });

        if (response.ok) {
          setCurrentQuestion(
            `✅ Sent ${totalTranscripts} transcripts successfully`
          );

          setCurrentQuestion("✅ Interview completed successfully");

          // small cleanup if audio cleanup exists
          try {
            if (window.__ai_interview_audio_cleanup)
              window.__ai_interview_audio_cleanup();
          } catch (err) {}

          // navigate to end
          window.location.href = `/interview/end`;
        } else {
          const errorText = await response.text();
          console.error(
            "❌ Failed to send transcripts:",
            response.status,
            errorText
          );
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (err) {
        console.error("Error sending transcripts:", err);
        setCurrentQuestion("❌ Failed to send transcripts");
      }
    } else {
      setCurrentQuestion("⚠️ No transcripts recorded");
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReadyCheck = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    setShowReadyModal(true);
  };

  // // Update your handleStartInterview function
  // const handleStartInterview = async () => {
  //   try {
  //     setShowReadyModal(false);
  //     setIsReady(true);

  //     const urlInterviewId = params.interviewId;
  //     const name = formData.name;
  //     const email = formData.email;

  //     const res = await fetch(
  //       API_BASE_URL + "/open-interviwe/create-interview",
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           name,
  //           email,
  //           interviewId: urlInterviewId,
  //         }),
  //       }
  //     );

  //     const interview = await res.json();

  //     if (!interview.success) {
  //       return toast.error(interview.message);
  //     }

  //     // Persist id reliably
  //     interviewIdRef.current =
  //       interview.sessionId || interview.interviewId || urlInterviewId;
  //     setSessionId(
  //       interview.sessionId || interview.interviewId || urlInterviewId
  //     );

  //     // Set interview tracking data
  //     setInterviewDuration(interview.duration);
  //     setInterviewQuestionCount(interview.totalQuestions);
  //     setTotalQuestions(interview.totalQuestions || 10);
  //     setTotalDurationMinutes(interview.duration || 30);
  //     setCurrentQuestionNumber(0);
  //     setInterviewPhase("starting");
  //     setCurrentQuestion("Interview starting...");

  //     await startInterview(interview);
  //     await startRecording(interview, pc);

  //     // Setup red flag detection
  //     startTimeRef.current = Date.now();
  //     setupRedFlagDetection();

  //     // Start combined mood and red flag detection
  //     detectAndRedFlags();

  //     setIsRecording(true);
  //   } catch (err) {
  //     setError("Failed to start interview. Please try again.");
  //     console.error("Interview start error:", err);
  //   }
  // };

  const handleStartInterview = async () => {
    try {
      // 1. Clear previous errors but DO NOT switch views yet
      setError("");

      const urlInterviewId = params.interviewId;
      const name = formData.name;
      const email = formData.email;

      const res = await fetch(
        API_BASE_URL + "/open-interviwe/create-interview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            interviewId: urlInterviewId,
          }),
        }
      );

      const interview = await res.json();

      // 2. CHECK SUCCESS FIRST
      if (!interview.success) {
        // Display the error from backend (e.g., "This interview is currently unavailable...")
        setError(interview.message);
        toast.error(interview.message);

        // Close the modal so they can see the error on the form
        setShowReadyModal(false);

        // STOP EXECUTION HERE - Do not set isReady(true)
        return;
      }

      // 3. API was successful - NOW switch the UI
      setShowReadyModal(false);
      setIsReady(true); // Persist id reliably

      interviewIdRef.current =
        interview.sessionId || interview.interviewId || urlInterviewId;
      setSessionId(
        interview.sessionId || interview.interviewId || urlInterviewId
      ); // Set interview tracking data

      setInterviewDuration(interview.duration);
      setInterviewQuestionCount(interview.totalQuestions);
      setTotalQuestions(interview.totalQuestions || 10);
      setTotalDurationMinutes(interview.duration || 30);
      setCurrentQuestionNumber(0);
      setInterviewPhase("starting");
      setCurrentQuestion("Interview starting...");

      await startInterview(interview);
      await startRecording(interview, pc); // Setup red flag detection

      startTimeRef.current = Date.now();
      setupRedFlagDetection(); // Start combined mood and red flag detection

      detectAndRedFlags();

      setIsRecording(true);
    } catch (err) {
      setShowReadyModal(false);
      setError("Failed to start interview. Please try again.");
      console.error("Interview start error:", err);
    }
  };

  const AudioVisualizer = () => {
    const bars = Array.from({ length: isMobile ? 15 : 20 }, (_, i) => {
      const height = Math.max(
        2,
        (audioLevel / 255) * 50 + Math.sin(Date.now() * 0.01 + i) * 5
      );
      return (
        <div
          key={i}
          style={{
            ...styles.audioBar,
            height: `${height}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      );
    });
    return <div style={styles.audioVisualizer}>{bars}</div>;
  };

  const TalkingAnimation = ({ isActive }) => {
    const dots = [0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          ...styles.talkingDot,
          animation: isActive
            ? `pulse 1.4s ease-in-out ${i * 0.2}s infinite`
            : "none",
          opacity: isActive ? 1 : 0.3,
        }}
      />
    ));
    return <div style={styles.talkingDots}>{dots}</div>;
  };

  const FinalizingOverlay = () => {
    if (interviewPhase !== "finalizing") return null;

    return (
      <div style={styles.finalizingOverlay}>
        <div style={styles.finalizingCard}>
          <h2 style={{ color: "#1fa2a6", marginBottom: "1.5rem" }}>
            🔄 Finalizing Interview
          </h2>
          <p
            style={{
              color: "#fff",
              marginBottom: "1.5rem",
              fontSize: "1.1rem",
            }}
          >
            Sending all transcripts to server...
          </p>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "3px",
              overflow: "hidden",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, #9966ff, #1fa2a6)",
                borderRadius: "3px",
                animation: "progress-bar 3s ease-in-out infinite",
              }}
            ></div>
          </div>
          <p
            style={{
              color: "#ccc",
              fontSize: "0.9rem",
              marginBottom: "0",
              lineHeight: "1.4",
            }}
          >
            {currentQuestion}
          </p>
        </div>
      </div>
    );
  };

  // At the very top of your component’s return (before your !isReady check)
  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background:
            "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
          color: "#fff",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h2 style={{ color: "#ff6b6b", marginBottom: "1rem" }}>
            📱 Not Supported on Mobile/Tablet
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#ccc" }}>
            Please use a <strong>desktop or laptop</strong> device to start your
            interview. Mobile and tablet devices are not supported for security
            and performance reasons.
          </p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <>
        <Head>
          <title>{`${APP_NAME} - AI-Powered Interview Platform`}</title>
        </Head>

        <div style={styles.navbar}>
          <Container>
            <div style={styles.brandContainer}>
              <div style={styles.companyName}>
                <img src="/logo_white.png" style={{ height: 40 }} />
              </div>
            </div>
          </Container>
        </div>

        <Container style={styles.mainContainer}>
          <Row className="justify-content-center w-100">
            <Col lg={8} md={10}>
              <div
                style={styles.setupCard}
                onMouseEnter={(e) => {
                  const glow = e.currentTarget.querySelector(".card-glow");
                  if (glow) glow.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const glow = e.currentTarget.querySelector(".card-glow");
                  if (glow) glow.style.opacity = "0";
                }}
              >
                <div className="card-glow" style={styles.cardGlow}></div>

                {/* Preview Section - Mobile Friendly */}
                <div
                  style={{
                    padding: isMobile ? "1.5rem" : "2rem",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? "1.5rem" : "1rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: isMobile ? "1.5rem" : "1rem",
                      textAlign: "center",
                    }}
                  >
                    <h6
                      style={{
                        marginBottom: "1rem",
                        color: "#1fa2a6",
                        fontSize: isMobile ? "1.1rem" : "0.875rem",
                      }}
                    >
                      📹 Video Preview
                    </h6>
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      muted
                      style={{
                        width: "100%",
                        height: isMobile ? "220px" : "120px",
                        background: "#1a1a1a",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                    <p
                      style={{
                        fontSize: isMobile ? "1rem" : "0.8rem",
                        color: "#888",
                        marginTop: "1rem",
                        marginBottom: "0",
                      }}
                    >
                      {systemStatus === "ready"
                        ? "✅ Camera Ready"
                        : "⏳ Checking..."}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: isMobile ? "1.5rem" : "1rem",
                      textAlign: "center",
                    }}
                  >
                    <h6
                      style={{
                        marginBottom: "1rem",
                        color: "#1fa2a6",
                        fontSize: isMobile ? "1.1rem" : "0.875rem",
                      }}
                    >
                      🎤 Audio Preview
                    </h6>
                    <div
                      style={{
                        width: "100%",
                        height: isMobile ? "120px" : "60px",
                        background: "#1a1a1a",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <AudioVisualizer />
                    </div>
                    <p
                      style={{
                        fontSize: isMobile ? "1rem" : "0.8rem",
                        color: "#888",
                        marginTop: "1rem",
                        marginBottom: "0",
                      }}
                    >
                      {isTalking
                        ? "🗣️ Speaking Detected"
                        : "🔇 Speak to test audio"}
                    </p>
                  </div>
                </div>

                {/* Form Section */}
                <div style={styles.formSection}>
                  {error && (
                    <Alert
                      variant="danger"
                      style={{
                        background: "rgb(180, 9, 18)",
                        border: "1px solid rgba(220, 53, 69, 0.3)",
                        borderRadius: "10px",
                        marginBottom: "1.5rem",
                        color: "#FFF",
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <Form>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>👤 Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Enter your full name"
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#1fa2a6")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor =
                            "rgba(255, 255, 255, 0.1)")
                        }
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>📧 Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Enter your email address"
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#1fa2a6")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor =
                            "rgba(255, 255, 255, 0.1)")
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleReadyCheck}
                      disabled={systemStatus !== "ready"}
                      style={{
                        ...styles.button,
                        opacity: systemStatus !== "ready" ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (systemStatus === "ready") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 12px 35px rgba(31, 162, 166, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow =
                          "0 8px 25px rgba(31, 162, 166, 0.3)";
                      }}
                    >
                      🚀 Start AI Interview
                    </button>
                  </Form>
                </div>

                {/* System Status */}
                <div style={styles.statusGrid}>
                  <div style={styles.statusItem}>
                    <div
                      style={{
                        ...styles.statusDot,
                        ...(systemStatus === "ready" ? styles.statusReady : {}),
                      }}
                    ></div>
                    <span style={{ fontSize: "0.9rem" }}>Camera & Audio</span>
                  </div>
                  <div style={styles.statusItem}>
                    <div
                      style={{
                        ...styles.statusDot,
                        ...(systemStatus === "ready" ? styles.statusReady : {}),
                      }}
                    ></div>
                    <span style={{ fontSize: "0.9rem" }}>Screen Sharing</span>
                  </div>
                  <div style={styles.statusItem}>
                    <div
                      style={{ ...styles.statusDot, ...styles.statusReady }}
                    ></div>
                    <span style={{ fontSize: "0.9rem" }}>AI Engine</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        <Modal
          show={showReadyModal}
          onHide={() => setShowReadyModal(false)}
          centered
          size="lg"
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.9)",
              border: "1px solid rgba(31, 162, 166, 0.3)",
              borderRadius: "20px",
              backdropFilter: "blur(20px)",
            }}
          >
            <Modal.Header
              closeButton
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Modal.Title style={{ color: "#fff" }}>
                🚀 Ready to Begin?
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ color: "#fff", padding: "2rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h5 style={{ color: "#1fa2a6", marginBottom: "1rem" }}>
                  Interview Details
                </h5>
                <p>
                  <strong>Name:</strong> {formData.name}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email}
                </p>
              </div>

              <Alert
                variant="info"
                style={{
                  background: "rgba(0, 123, 255, 0.1)",
                  border: "1px solid rgba(0, 123, 255, 0.3)",
                  borderRadius: "10px",
                }}
              >
                🤖 The AI will conduct a live interview with real-time analysis
                and feedback.
              </Alert>
            </Modal.Body>
            <Modal.Footer
              style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
            >
              <Button
                variant="outline-secondary"
                onClick={() => setShowReadyModal(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#fff",
                }}
              >
                Go Back
              </Button>
              <Button
                onClick={handleStartInterview}
                style={{
                  background:
                    "linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%)",
                  border: "none",
                  color: "#000",
                  fontWeight: "600",
                }}
              >
                🎯 Start Interview
              </Button>
            </Modal.Footer>
          </div>
        </Modal>
      </>
    );
  }

  // ENHANCED MEETING INTERFACE
  return (
    <>
      <Head>
        <title>{`${APP_NAME} - Live Interview`}</title>
        <style jsx global>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }
          @keyframes recording-pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
          @keyframes pulse-ring {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 0.8;
            }
            100% {
              transform: translate(-50%, -50%) scale(1.2);
              opacity: 0;
            }
          }
          @keyframes progress-bar {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif !important;
            background: linear-gradient(
              135deg,
              #0c0c0c 0%,
              #1a1a2e 50%,
              #16213e 100%
            ) !important;
            color: #ffffff !important;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
      </Head>

      <div style={styles.meetingContainer}>
        {/* Finalizing Overlay */}
        <FinalizingOverlay />

        {/* Meeting Navbar */}
        <div style={styles.meetingNavbar}>
          <Container fluid>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={styles.brandContainer}>
                <div style={styles.logo}>🎯</div>
                <div style={styles.companyName}>{`${APP_NAME} - Live`}</div>
              </div>

              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <Badge
                  bg="danger"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    animation: "recording-pulse 2s infinite",
                  }}
                >
                  🔴 Recording
                </Badge>
                <Badge
                  bg={aiConnected ? "success" : "warning"}
                  style={{ padding: "0.5rem 1rem", borderRadius: "20px" }}
                >
                  🤖 {aiConnected ? "AI Connected" : "Connecting..."}
                </Badge>
                <span
                  style={{
                    color: "#1fa2a6",
                    fontWeight: "600",
                    fontSize: "1.1rem",
                  }}
                >
                  {duration}
                </span>
              </div>
            </div>
          </Container>
        </div>

        {/* ENHANCED MEETING CONTENT */}
        <div style={styles.meetingContent}>
          {/* LEFT SIDE - CANDIDATE VIDEO */}
          <div style={styles.candidateSection}>
            <div style={styles.candidateVideo}>
              <div style={styles.videoContainer}>
                <video
                  ref={candidateVideoRef}
                  autoPlay
                  muted
                  style={styles.video}
                />

                <div style={styles.videoOverlay}>
                  <div style={styles.videoInfo}>
                    <h6
                      style={{
                        margin: 0,
                        color: "#1fa2a6",
                        fontSize: "0.9rem",
                      }}
                    >
                      👤 Candidate
                    </h6>
                    <p
                      style={{ margin: 0, fontSize: "0.75rem", color: "#ccc" }}
                    >
                      {formData.name}
                    </p>
                  </div>

                  {isTalking && (
                    <div style={styles.talkingIndicator}>
                      <TalkingAnimation isActive={isTalking} />
                      <span style={{ fontSize: "0.8rem", color: "#1fa2a6" }}>
                        Speaking
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - ENHANCED HR GRID */}
          <div style={styles.hrSection}>
            <div style={styles.hrContainer}>
              {/* HR Avatar with Audio Animation */}
              <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                <div style={styles.audioRing2}></div>
                <div style={styles.audioRing}></div>
                <div style={styles.hrAvatar}>👩‍💼</div>
              </div>

              {/* HR Info */}
              <div style={styles.hrInfo}>
                <h3 style={styles.hrTitle}>AI Interviewer</h3>
                <p style={styles.hrSubtitle}>
                  {aiTalking ? "Speaking..." : "Listening..."}
                </p>
              </div>

              {/* Enhanced Stats Row */}
              <div style={styles.statsRow}>
                <div style={styles.statBadge}>
                  {aiConnected ? "🟢 Live" : "🟡 Connecting"}
                </div>
              </div>

              {/* Request Graceful End Button */}
              <button
                onClick={() => stopRecording("user_request")}
                style={styles.endButtonCenter}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-3px)";
                  e.target.style.boxShadow =
                    "0 12px 35px rgba(255, 149, 0, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 8px 25px rgba(255, 149, 0, 0.3)";
                }}
              >
                ⏰ Request End
              </button>
            </div>
          </div>
        </div>

        {/* Hidden screen video for recording */}
        <video ref={screenVideoRef} autoPlay style={{ display: "none" }} />

        {/* Remote Audio Element (AI voice) */}
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </>
  );
}
