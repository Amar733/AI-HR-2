// components/analysis/ModernAnalysisModal.js - Updated with Complete Analysis Data
import { useState, useRef, useEffect } from "react";
import {
  Modal,
  Row,
  Col,
  Badge,
  Card,
  Button,
  Nav,
  Tab,
  ProgressBar,
  ListGroup,
  ButtonGroup,
  Spinner,
  Tooltip,
  OverlayTrigger,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import TranscriptionViewer from "./TranscriptionViewer";

const ModernAnalysisModal = ({ show, onHide, sessionData, analysisData }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [exportingPDF, setExportingPDF] = useState(false);
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoUrl = process.env.NEXT_PUBLIC_VIDEO_URL + sessionData?.videoPath;
  // Extract data from the new structure
  const redFlags = sessionData?.redFlags || [];
  const candidateInfo =
    sessionData?.candidateInfo || analysisData?.candidateInfo || {};
  const metadata = sessionData?.data?.metadata || {};
  const analysis =
    sessionData?.analysis || analysisData?.analysis || analysisData || {};

  // Calculate session start time for relative timestamps
  const sessionStartTime =
    redFlags.length > 0
      ? Math.min(...redFlags.map((f) => f.timestamp))
      : Date.now();

  // Process red flags for video seeking
  const processedFlags = redFlags.map((flag, index) => ({
    ...flag,
    id: index,
    relativeTime: Math.max(
      0,
      Math.floor((flag.timestamp - sessionStartTime) / 1000)
    ),
    category: categorizeFlag(flag.type),
    icon: getFlagIcon(flag.type),
    colorScheme: getSeverityColor(flag.severity),
  }));

  // Analytics calculation
  const analytics = {
    total: redFlags.length,
    high: redFlags.filter((f) => f.severity === "high").length,
    medium: redFlags.filter((f) => f.severity === "medium").length,
    low: redFlags.filter((f) => f.severity === "low").length,
    riskScore: calculateRiskScore(redFlags),
  };

  // Helper functions (keep existing ones)
  function categorizeFlag(type) {
    const categories = {
      dev_tools_open: "Security",
      dev_tools_closed: "Security",
      window_focus: "Attention",
      window_blur: "Attention",
      tab_hidden: "Navigation",
      tab_visible: "Navigation",
      mouse_leave: "Interaction",
      window_resize: "Interaction",
    };
    return categories[type] || "Other";
  }

  function getFlagIcon(type) {
    const icons = {
      dev_tools_open: "bi-code-square",
      dev_tools_closed: "bi-shield-check",
      window_focus: "bi-eye",
      window_blur: "bi-eye-slash",
      tab_hidden: "bi-window-dash",
      tab_visible: "bi-window",
      mouse_leave: "bi-cursor",
      window_resize: "bi-arrows-move",
    };
    return icons[type] || "bi-exclamation-triangle";
  }

  function getSeverityColor(severity) {
    const colors = {
      high: {
        bg: "danger",
        color: "#dc3545",
        gradient: "linear-gradient(135deg, #dc3545, #b02a37)",
      },
      medium: {
        bg: "warning",
        color: "#ffc107",
        gradient: "linear-gradient(135deg, #ffc107, #e0a800)",
      },
      low: {
        bg: "info",
        color: "#17a2b8",
        gradient: "linear-gradient(135deg, #17a2b8, #138496)",
      },
    };
    return colors[severity] || colors["low"];
  }

  function calculateRiskScore(flags) {
    if (!flags.length) return 0;
    const totalWeight = flags.reduce((sum, flag) => {
      const weights = { high: 3, medium: 2, low: 1 };
      return sum + (weights[flag.severity] || 1);
    }, 0);
    return Math.min(100, Math.round((totalWeight / flags.length) * 25));
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function getScoreColor(score) {
    if (score >= 8) return "success";
    if (score >= 6) return "info";
    if (score >= 4) return "warning";
    return "danger";
  }

  function getScoreGradient(score) {
    if (score >= 8) return "linear-gradient(135deg, #28a745, #20c997)";
    if (score >= 6) return "linear-gradient(135deg, #17a2b8, #138496)";
    if (score >= 4) return "linear-gradient(135deg, #ffc107, #e0a800)";
    return "linear-gradient(135deg, #dc3545, #b02a37)";
  }

  // Video seeking function
  function seekToTimestamp(timestamp) {
    if (videoRef.current && videoDuration > 0) {
      const seekTime = Math.min(timestamp, videoDuration);
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      setActiveTab("video");

      toast.success(`Jumped to ${formatTime(seekTime)}`, {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  }

  // Server-side PDF export
  const exportToPDF = async () => {
    try {
      setExportingPDF(true);

      const response = await fetch("/api/export-analysis-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionData: sessionData,
          analysisData: analysis,
          analytics: analytics,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Interview_Analysis_${candidateInfo.name?.replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF report");
    } finally {
      setExportingPDF(false);
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setVideoDuration(video.duration);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoUrl]);

  return (
    <>
      <style jsx>{`
        .modern-modal .modal-content {
          border-radius: 20px;
          border: none;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }

        .compact-card {
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .compact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .score-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
          color: white;
        }

        .flag-item {
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .flag-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .mini-video {
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 16/9;
        }

        .nav-pills-modern .nav-link {
          border-radius: 10px;
          padding: 8px 16px;
          margin: 0 4px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-pills-modern .nav-link.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .risk-indicator {
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
          position: relative;
        }

        .risk-pointer {
          position: absolute;
          top: -4px;
          width: 16px;
          height: 16px;
          background: white;
          border: 2px solid #495057;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: left 0.3s ease;
        }

        .personality-bar {
          height: 12px;
          border-radius: 6px;
          background: #e9ecef;
          overflow: hidden;
        }

        .personality-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .powered-by {
          position: absolute;
          bottom: 10px;
          right: 15px;
          font-size: 0.75rem;
          color: #6c757d;
          opacity: 0.7;
        }

        .nav-pills .nav-link.active,
        .nav-pills .show > .nav-link {
          background-color: #1c4445 !important;
        }

        @media (max-width: 768px) {
          .modal-xl {
            max-width: 95vw;
          }
          .compact-card {
            margin-bottom: 12px;
          }
          .score-circle {
            width: 50px;
            height: 50px;
            font-size: 0.9rem;
          }
          .flag-item {
            padding: 12px;
          }
        }
      `}</style>

      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        backdrop="static"
        className="modern-modal"
      >
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title className="w-100">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                  }}
                >
                  <i className="bi bi-graph-up text-white fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Interview Analysis</h5>
                  <div
                    className="d-flex align-items-center gap-2 mt-1"
                    style={{ fontSize: 12 }}
                  >
                    {candidateInfo.name} -{" "}
                    <small className="text-muted">{candidateInfo.email}</small>
                  </div>
                </div>
              </div>

              <Button
                variant="outline-primary"
                size="sm"
                onClick={exportToPDF}
                disabled={exportingPDF}
              >
                {exportingPDF ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-2"></i>
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3">
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            {/* Enhanced Navigation */}
            <Nav
              variant="pills"
              className="nav-pills-modern mb-3 justify-content-center "
            >
              <Nav.Item>
                <Nav.Link eventKey="overview">
                  <i className="bi bi-speedometer2 me-1"></i>Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="communication">
                  <i className="bi bi-chat-square-text me-1"></i>Communication
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="personality">
                  <i className="bi bi-person-badge me-1"></i>Personality
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="video">
                  <i className="bi bi-play-circle me-1"></i>Video
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="transcription">
                  <i className="bi bi-chat-text me-1"></i>Transcription
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Overview Tab */}
              <Tab.Pane eventKey="overview">
                <Row className="g-3 mb-4">
                  {/* Main Scores */}
                  <Col md={6} lg={3}>
                    <Card className="compact-card text-center">
                      <Card.Body className="p-3">
                        <div
                          className="score-circle mx-auto mb-2"
                          style={{
                            background: getScoreGradient(
                              analysis.overallScore || 0
                            ),
                          }}
                        >
                          {analysis.overallScore || 0}
                        </div>
                        <h6 className="mb-0">Overall</h6>
                        <small className="text-muted">Performance</small>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={3}>
                    <Card className="compact-card text-center">
                      <Card.Body className="p-3">
                        <div
                          className="score-circle mx-auto mb-2"
                          style={{
                            background: getScoreGradient(
                              analysis.communicationScore || 0
                            ),
                          }}
                        >
                          {analysis.communicationScore || 0}
                        </div>
                        <h6 className="mb-0">Communication</h6>
                        <small className="text-muted">Skills</small>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={3}>
                    <Card className="compact-card text-center">
                      <Card.Body className="p-3">
                        <div
                          className="score-circle mx-auto mb-2"
                          style={{
                            background: getScoreGradient(
                              analysis.technicalScore || 0
                            ),
                          }}
                        >
                          {analysis.technicalScore || 0}
                        </div>
                        <h6 className="mb-0">Technical</h6>
                        <small className="text-muted">Expertise</small>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={3}>
                    <Card className="compact-card text-center">
                      <Card.Body className="p-3">
                        <div
                          className="score-circle mx-auto mb-2"
                          style={{
                            background: getScoreGradient(
                              analysis.behavioralScore || 0
                            ),
                          }}
                        >
                          {analysis.behavioralScore || 0}
                        </div>
                        <h6 className="mb-0">Behavioral</h6>
                        <small className="text-muted">Assessment</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* AI Recommendation */}
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <Badge
                      bg={
                        analysis.recommendation?.decision === "hire"
                          ? "success"
                          : analysis.recommendation?.decision === "no_hire"
                          ? "danger"
                          : "warning"
                      }
                      className="px-3 py-2 fs-6"
                    >
                      {analysis.recommendation?.decision
                        ?.replace("_", " ")
                        .toUpperCase() || "PENDING"}
                    </Badge>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Confidence</small>
                        <span className="fw-bold">
                          {analysis.recommendation?.confidence ?? 0}%
                        </span>
                      </div>
                      <ProgressBar
                        now={analysis.recommendation?.confidence ?? 0}
                        style={{ height: "6px" }}
                        variant={
                          analysis.recommendation?.decision === "hire"
                            ? "success"
                            : analysis.recommendation?.decision === "no_hire"
                            ? "danger"
                            : "warning"
                        }
                      />
                    </div>
                  </div>

                  <p className="mb-2 small">
                    <strong>Reasoning:</strong>{" "}
                    {analysis.recommendation?.reasoning ||
                      "Analysis in progress..."}
                  </p>

                  {analysis.recommendation?.nextSteps?.length > 0 && (
                    <div>
                      <strong className="small">Next Steps:</strong>
                      <ul className="small mb-0 mt-1">
                        {analysis.recommendation.nextSteps.map(
                          (step, index) => (
                            <li key={index}>{step}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* SALARY AREA */}
                  <hr className="my-3" />

                  <div>
                    <strong className="small">Salary:</strong>

                    {analysis.salary && analysis.salary != "" ? (
                      <div className="d-flex justify-content-between align-items-center">
                        <div>{analysis.salary}</div>
                      </div>
                    ) : (
                      <div className="small text-muted">
                        Salary data not available
                      </div>
                    )}
                  </div>
                </Card.Body>

                {/* Strengths and Weaknesses */}
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="compact-card h-100">
                      <Card.Header className="bg-success bg-opacity-10 border-0 py-2">
                        <h6 className="mb-0 fw-bold text-success">
                          <i className="bi bi-star-fill me-2"></i>Key Strengths
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-3">
                        {analysis.strengths?.length > 0 ? (
                          analysis.strengths.map((strength, index) => (
                            <div
                              key={index}
                              className="mb-3 pb-2 border-bottom border-light"
                            >
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <h6 className="mb-0 text-capitalize text-success">
                                  {strength.category}
                                </h6>
                                <Badge bg="success" className="px-2 py-1 small">
                                  {strength.score}/5
                                </Badge>
                              </div>
                              <p className="mb-1 small text-dark">
                                {strength.description}
                              </p>
                              {strength.evidence && (
                                <small className="text-muted fst-italic">
                                  "{strength.evidence}"
                                </small>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-3">
                            <i className="bi bi-info-circle text-muted fs-1"></i>
                            <p className="text-muted small mb-0 mt-2">
                              No specific strengths identified
                            </p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card className="compact-card h-100">
                      <Card.Header className="bg-warning bg-opacity-10 border-0 py-2">
                        <h6 className="mb-0 fw-bold text-warning">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Areas for Improvement
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-3">
                        {analysis.weaknesses?.length > 0 ? (
                          analysis.weaknesses.map((weakness, index) => (
                            <div
                              key={index}
                              className="mb-3 pb-2 border-bottom border-light"
                            >
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <h6 className="mb-0 text-capitalize text-warning">
                                  {weakness.category}
                                </h6>
                                <Badge bg="warning" className="px-2 py-1 small">
                                  Level {weakness.severity}
                                </Badge>
                              </div>
                              <p className="mb-1 small text-dark">
                                {weakness.description}
                              </p>
                              {weakness.suggestion && (
                                <small className="text-muted">
                                  <strong>Suggestion:</strong>{" "}
                                  {weakness.suggestion}
                                </small>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-3">
                            <i className="bi bi-check-circle text-success fs-1"></i>
                            <p className="text-muted small mb-0 mt-2">
                              No major issues identified
                            </p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Communication Analysis Tab */}
              <Tab.Pane eventKey="communication">
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="compact-card">
                      <Card.Header className="bg-info bg-opacity-10 border-0 py-2">
                        <h6 className="mb-0 fw-bold text-info">
                          <i className="bi bi-chat-text me-2"></i>Communication
                          Metrics
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-3">
                        <Table size="sm" className="mb-0">
                          <tbody>
                            <tr>
                              <td>
                                <strong>Grammar Score</strong>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Badge
                                    bg={getScoreColor(
                                      analysis.grammar?.score || 0
                                    )}
                                  >
                                    {analysis.grammar?.score || 0}/5
                                  </Badge>
                                  <small className="text-muted">
                                    {analysis.grammar?.errors?.length || 0}{" "}
                                    errors detected
                                  </small>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Vocabulary Level</strong>
                              </td>
                              <td>
                                <Badge
                                  bg={getScoreColor(
                                    analysis.vocabulary?.score || 0
                                  )}
                                  className="me-2"
                                >
                                  {analysis.vocabulary?.score || 0}/5
                                </Badge>
                                <Badge bg="light" text="dark">
                                  {analysis.vocabulary?.level || "basic"}
                                </Badge>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Fluency</strong>
                              </td>
                              <td>
                                <Badge
                                  bg={getScoreColor(
                                    analysis.fluency?.score || 0
                                  )}
                                  className="me-2"
                                >
                                  {analysis.fluency?.score || 0}/5
                                </Badge>
                                <small className="text-muted">
                                  {analysis.fluency?.wordsPerMinute || 0} WPM
                                </small>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Relevance</strong>
                              </td>
                              <td>
                                <Badge
                                  bg={getScoreColor(
                                    analysis.relevance?.score || 0
                                  )}
                                  className="me-2"
                                >
                                  {analysis.relevance?.score || 0}/5
                                </Badge>
                                <small className="text-muted">
                                  {analysis.relevance?.topicCoverage || 0}%
                                  coverage
                                </small>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Completeness</strong>
                              </td>
                              <td>
                                <Badge
                                  bg={getScoreColor(
                                    analysis.completeness?.score || 0
                                  )}
                                >
                                  {analysis.completeness?.score || 0}/5
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card className="compact-card">
                      <Card.Header className="bg-warning bg-opacity-10 border-0 py-2">
                        <h6 className="mb-0 fw-bold text-warning">
                          <i className="bi bi-mic me-2"></i>Speech Analysis
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-3">
                        {analysis.fluency?.pauseAnalysis && (
                          <div className="mb-3">
                            <h6 className="small fw-bold text-muted mb-2">
                              PAUSE ANALYSIS
                            </h6>
                            <Row className="g-2 text-center">
                              <Col sm={4}>
                                <div className="bg-light rounded p-2">
                                  <div className="h5 mb-0">
                                    {analysis.fluency.pauseAnalysis.totalPauses}
                                  </div>
                                  <small className="text-muted">
                                    Total Pauses
                                  </small>
                                </div>
                              </Col>
                              <Col sm={4}>
                                <div className="bg-light rounded p-2">
                                  <div className="h5 mb-0">
                                    {
                                      analysis.fluency.pauseAnalysis
                                        .averagePauseLength
                                    }
                                    s
                                  </div>
                                  <small className="text-muted">
                                    Avg Length
                                  </small>
                                </div>
                              </Col>
                              <Col sm={4}>
                                <div className="bg-light rounded p-2">
                                  <div className="h5 mb-0">
                                    {analysis.fluency.pauseAnalysis.longPauses}
                                  </div>
                                  <small className="text-muted">
                                    Long Pauses
                                  </small>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        )}

                        <div>
                          <h6 className="small fw-bold text-muted mb-2">
                            VOCABULARY INSIGHTS
                          </h6>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small">Complex Words Used:</span>
                            <Badge bg="info">
                              {analysis.vocabulary?.complexWords?.[0] || 0}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small">Unique Words:</span>
                            <Badge bg="success">
                              {analysis.vocabulary?.uniqueWords?.[0] || 0}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small">Keyword Matches:</span>
                            <Badge bg="primary">
                              {analysis.relevance?.keywordMatches?.[0] || 0}
                            </Badge>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Card className="compact-card mt-3">
                  <Card.Header className="bg-light border-0 py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="bi bi-chat-square-quote me-2"></i>
                      Communication Feedback
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-3">
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="bg-success bg-opacity-10 rounded p-3">
                          <h6 className="text-success mb-2">
                            <i className="bi bi-check-circle me-1"></i>Positive
                            Points
                          </h6>
                          {analysis.feedback?.positive?.length > 0 ? (
                            <ul className="mb-0 small">
                              {analysis.feedback.positive.map(
                                (point, index) => (
                                  <li key={index}>{point}</li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p className="small text-muted mb-0">
                              No specific positive points noted
                            </p>
                          )}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="bg-warning bg-opacity-10 rounded p-3">
                          <h6 className="text-warning mb-2">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Improvement Areas
                          </h6>
                          {analysis.feedback?.improvements?.length > 0 ? (
                            <ul className="mb-0 small">
                              {analysis.feedback.improvements.map(
                                (point, index) => (
                                  <li key={index}>{point}</li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p className="small text-muted mb-0">
                              No specific improvements suggested
                            </p>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Personality Assessment Tab */}
              <Tab.Pane eventKey="personality">
                <Card className="compact-card">
                  <Card.Header
                    className="bg-purple bg-opacity-10 border-0 py-2"
                    style={{ backgroundColor: "rgba(108, 99, 255, 0.1)" }}
                  >
                    <h6 className="mb-0 fw-bold" style={{ color: "#6c63ff" }}>
                      <i className="bi bi-person-badge me-2"></i>Personality
                      Profile
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-3">
                    {analysis.personality ? (
                      <Row className="g-3">
                        {Object.entries(analysis.personality).map(
                          ([trait, score]) => (
                            <Col md={6} key={trait}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-medium text-capitalize">
                                  {trait}
                                </span>
                                <Badge
                                  bg={getScoreColor(score)}
                                  className="px-2 py-1"
                                >
                                  {score}/5
                                </Badge>
                              </div>
                              <div className="personality-bar mb-3">
                                <div
                                  className="personality-fill"
                                  style={{
                                    width: `${(score / 5) * 100}%`,
                                    background: getScoreGradient(score),
                                  }}
                                />
                              </div>
                            </Col>
                          )
                        )}
                      </Row>
                    ) : (
                      <div className="text-center py-4">
                        <i
                          className="bi bi-person text-muted"
                          style={{ fontSize: "3rem" }}
                        ></i>
                        <h6 className="text-muted mt-2">
                          Personality Analysis Unavailable
                        </h6>
                        <p className="text-muted small mb-0">
                          Personality assessment data is not available for this
                          session
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {analysis.feedback?.overall && (
                  <Card className="compact-card mt-3">
                    <Card.Header className="bg-light border-0 py-2">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-lightbulb me-2"></i>Overall
                        Assessment
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-3">
                      <div className="bg-light bg-opacity-50 rounded p-3">
                        <p className="mb-0 fst-italic">
                          "{analysis.feedback.overall}"
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Tab.Pane>

              {/* Video Tab - Keep existing implementation */}
              <Tab.Pane eventKey="video">
                <Card className="compact-card">
                  <Card.Header className="bg-warning bg-opacity-10 border-0 py-2">
                    <h6 className="mb-0 fw-bold text-warning">
                      <i className="bi bi-shield-exclamation me-2"></i>
                      Security Risk Assessment
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">Overall Risk Level</span>
                      <span className="fw-bold">{analytics.riskScore}/100</span>
                    </div>
                    <div className="risk-indicator mb-3">
                      <div
                        className="risk-pointer"
                        style={{
                          left: `calc(${analytics.riskScore}% - 8px)`,
                        }}
                      />
                    </div>
                    <Row className="g-2 text-center">
                      <Col sm={4}>
                        <div className="bg-danger bg-opacity-10 rounded p-2">
                          <div className="h5 text-danger mb-0">
                            {analytics.high}
                          </div>
                          <small className="text-muted">High</small>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="bg-warning bg-opacity-10 rounded p-2">
                          <div className="h5 text-warning mb-0">
                            {analytics.medium}
                          </div>
                          <small className="text-muted">Medium</small>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="bg-info bg-opacity-10 rounded p-2">
                          <div className="h5 text-info mb-0">
                            {analytics.low}
                          </div>
                          <small className="text-muted">Low</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Row className="g-3 mt-1">
                  <Col lg={7}>
                    <Card className="compact-card">
                      <Card.Body className="p-2">
                        {videoUrl ? (
                          <div className="mini-video">
                            <video
                              ref={videoRef}
                              src={videoUrl}
                              controls
                              className="w-100 h-100"
                              style={{ objectFit: "cover" }}
                            >
                              Your browser does not support video playback.
                            </video>
                          </div>
                        ) : (
                          <div className="mini-video d-flex align-items-center justify-content-center bg-light">
                            <div className="text-center">
                              <i
                                className="bi bi-camera-video text-muted"
                                style={{ fontSize: "3rem" }}
                              ></i>
                              <h6 className="text-muted mt-2">
                                No Video Available
                              </h6>
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={5}>
                    <Card className="compact-card">
                      <Card.Header className="bg-light border-0 py-2">
                        <h6 className="mb-0 fw-bold">
                          Security Events Timeline
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-2">
                        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                          {processedFlags.length > 0 ? (
                            <ListGroup variant="flush">
                              {processedFlags.map((flag) => (
                                <ListGroup.Item
                                  key={flag.id}
                                  className="flag-item border-0 p-2 mb-1"
                                  onClick={() =>
                                    seekToTimestamp(flag.relativeTime)
                                  }
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      className="d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{
                                        background:
                                          flag.colorScheme.color + "20",
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        border: `1px solid ${flag.colorScheme.color}40`,
                                      }}
                                    >
                                      <i
                                        className={`bi ${flag.icon}`}
                                        style={{
                                          color: flag.colorScheme.color,
                                          fontSize: "0.9rem",
                                        }}
                                      ></i>
                                    </div>

                                    <div className="flex-grow-1 min-w-0">
                                      <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="fw-medium small text-capitalize">
                                          {flag.type.replace("_", " ")}
                                        </span>
                                        <Badge
                                          bg={flag.colorScheme.bg}
                                          className="px-2 py-1 small"
                                        >
                                          {flag.severity}
                                        </Badge>
                                      </div>
                                      <p className="mb-0 text-muted small text-truncate">
                                        {flag.description}
                                      </p>
                                    </div>

                                    <div className="text-end flex-shrink-0">
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={
                                          <Tooltip>
                                            Jump to video at this time
                                          </Tooltip>
                                        }
                                      >
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-1"
                                        >
                                          <i className="bi bi-play-circle"></i>
                                        </Button>
                                      </OverlayTrigger>
                                      <div className="small text-muted fw-medium">
                                        {formatTime(flag.relativeTime)}
                                      </div>
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          ) : (
                            <div className="text-center py-4">
                              <i
                                className="bi bi-shield-check text-success"
                                style={{ fontSize: "2rem" }}
                              ></i>
                              <h6 className="text-success mt-2">
                                No Security Issues
                              </h6>
                              <p className="text-muted small mb-0">
                                Clean interview session detected
                              </p>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              <Tab.Pane eventKey="transcription">
                <TranscriptionViewer
                  segments={sessionData?.fullTranscription?.segments}
                  candidateName={candidateInfo.name}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ModernAnalysisModal;
