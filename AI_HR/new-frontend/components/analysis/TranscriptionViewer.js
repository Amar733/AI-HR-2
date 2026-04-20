// components/TranscriptionViewer.js - Modern Transcription Display with Narrower Bubbles
import { useState, useRef, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Form,
  InputGroup,
  ListGroup,
  ButtonGroup,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

const TranscriptionViewer = ({
  segments = [],
  candidateName = "Candidate",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpeaker, setFilterSpeaker] = useState("all");
  const [viewMode, setViewMode] = useState("conversation"); // conversation, compact, timeline
  const transcriptionRef = useRef(null);

  // Process segments into conversation format
  const processedSegments = segments.map((segment, index) => ({
    ...segment,
    id: segment._id?.$oid || index,
    speaker: segment.speaker === "ai" ? "AI Interviewer" : candidateName,
    isAI: segment.speaker === "ai",
    isSystemMessage:
      segment.text.includes("[QUESTION]") ||
      segment.text.includes("[INTERVIEW_END]"),
  }));

  // Filter segments
  const filteredSegments = processedSegments.filter((segment) => {
    const matchesSearch = segment.text
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSpeaker =
      filterSpeaker === "all" ||
      (filterSpeaker === "ai" && segment.isAI) ||
      (filterSpeaker === "candidate" && !segment.isAI);
    return matchesSearch && matchesSpeaker && !segment.isSystemMessage;
  });

  // Group consecutive messages from same speaker
  const groupedSegments = [];
  let currentGroup = null;

  filteredSegments.forEach((segment) => {
    if (!currentGroup || currentGroup.isAI !== segment.isAI) {
      if (currentGroup) groupedSegments.push(currentGroup);
      currentGroup = {
        speaker: segment.speaker,
        isAI: segment.isAI,
        messages: [segment.text],
        timestamp: segment.start,
      };
    } else {
      currentGroup.messages.push(segment.text);
    }
  });

  if (currentGroup) groupedSegments.push(currentGroup);

  // Export transcription
  const exportTranscription = () => {
    const fullText = processedSegments
      .filter((s) => !s.isSystemMessage)
      .map((s) => `${s.speaker}: ${s.text}`)
      .join("\n");

    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Interview_Transcription_${candidateName.replace(
      /\s+/g,
      "_"
    )}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scroll to search result
  const scrollToMatch = (text) => {
    const element = document.querySelector(`[data-text*="${text}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.style.backgroundColor = "#fff3cd";
      setTimeout(() => {
        element.style.backgroundColor = "";
      }, 2000);
    }
  };

  return (
    <>
      <style jsx>{`
        .transcription-container {
          max-height: 600px;
          overflow-y: auto;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          padding: 20px;
        }

        .message-bubble {
          max-width: 45%; /* Reduced from 70% to 45% for narrower bubbles */
          margin-bottom: 16px;
          animation: fadeIn 0.3s ease-in;
        }

        .ai-message {
          margin-left: auto;
          text-align: right;
        }

        .candidate-message {
          margin-right: auto;
          text-align: left;
        }

        .bubble-content {
          padding: 10px 14px; /* Slightly reduced padding */
          border-radius: 16px; /* Slightly smaller border radius */
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          word-wrap: break-word; /* Ensure text wraps properly in narrow bubbles */
          min-width: fit-content; /* Allow bubbles to shrink to content size */
        }

        .bubble-content:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .ai-bubble {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          border-bottom-right-radius: 4px; /* Smaller tail radius */
        }

        .candidate-bubble {
          background: linear-gradient(135deg, #28a745, #1e7e34);
          color: white;
          border-bottom-left-radius: 4px; /* Smaller tail radius */
        }

        .speaker-avatar {
          width: 32px; /* Slightly smaller avatar */
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.7rem; /* Smaller font in avatar */
          margin: 0 8px;
        }

        .ai-avatar {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
        }

        .candidate-avatar {
          background: linear-gradient(135deg, #28a745, #1e7e34);
          color: white;
        }

        .compact-message {
          padding: 8px 12px;
          margin-bottom: 4px;
          border-radius: 8px;
          border-left: 4px solid;
          background: white;
          transition: all 0.2s ease;
        }

        .compact-message:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .compact-ai {
          border-left-color: #007bff;
          margin-left: 20px;
        }

        .compact-candidate {
          border-left-color: #28a745;
          margin-right: 20px;
        }

        .search-highlight {
          background: #fff3cd;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 500;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stats-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        /* Responsive adjustments for narrow bubbles */
        @media (max-width: 768px) {
          .message-bubble {
            max-width: 75%; /* Slightly wider on mobile for readability */
          }

          .bubble-content {
            padding: 8px 12px;
            font-size: 0.9rem;
          }

          .speaker-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.65rem;
          }
        }

        @media (max-width: 480px) {
          .message-bubble {
            max-width: 85%; /* Even wider on very small screens */
          }
        }

        /* Ensure very short messages don't look too wide */
        .bubble-content {
          display: inline-block;
          text-align: left;
        }

        .candidate-message .bubble-content {
          text-align: left;
        }
      `}</style>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-primary bg-gradient text-white border-0">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-chat-text fs-4"></i>
              <div>
                <h5 className="mb-0 fw-bold">Interview Transcription</h5>
                <small className="opacity-90">
                  Complete conversation between AI and {candidateName}
                </small>
              </div>
            </div>

            <ButtonGroup size="sm">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Export as text file</Tooltip>}
              >
                <Button variant="light" onClick={exportTranscription}>
                  <i className="bi bi-download me-1"></i>Export
                </Button>
              </OverlayTrigger>
            </ButtonGroup>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Controls */}
          <div className="p-3 bg-light border-bottom">
            <Row className="align-items-center g-3">
              <Col md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search in transcription..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                    >
                      <i className="bi bi-x"></i>
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col md={3}>
                <Form.Select
                  size="sm"
                  value={filterSpeaker}
                  onChange={(e) => setFilterSpeaker(e.target.value)}
                >
                  <option value="all">All Speakers</option>
                  <option value="ai">AI Interviewer</option>
                  <option value="candidate">{candidateName}</option>
                </Form.Select>
              </Col>

              <Col md={3}>
                <ButtonGroup size="sm" className="w-100">
                  <Button
                    variant={
                      viewMode === "conversation"
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => setViewMode("conversation")}
                  >
                    <i className="bi bi-chat-dots me-1"></i>Chat
                  </Button>
                  <Button
                    variant={
                      viewMode === "compact" ? "primary" : "outline-primary"
                    }
                    onClick={() => setViewMode("compact")}
                  >
                    <i className="bi bi-list me-1"></i>List
                  </Button>
                </ButtonGroup>
              </Col>
            </Row>
          </div>

          {/* Stats */}
          <div className="p-3 bg-light border-bottom">
            <Row className="g-3">
              <Col sm={3}>
                <div className="stats-card text-center p-2">
                  <div className="h5 text-primary mb-0">
                    {processedSegments.length}
                  </div>
                  <small className="text-muted">Total Messages</small>
                </div>
              </Col>
              <Col sm={3}>
                <div className="stats-card text-center p-2">
                  <div className="h5 text-success mb-0">
                    {processedSegments.filter((s) => s.isAI).length}
                  </div>
                  <small className="text-muted">AI Messages</small>
                </div>
              </Col>
              <Col sm={3}>
                <div className="stats-card text-center p-2">
                  <div className="h5 text-info mb-0">
                    {
                      processedSegments.filter(
                        (s) => !s.isAI && !s.isSystemMessage
                      ).length
                    }
                  </div>
                  <small className="text-muted">Candidate Messages</small>
                </div>
              </Col>
              <Col sm={3}>
                <div className="stats-card text-center p-2">
                  <div className="h5 text-warning mb-0">
                    {filteredSegments.length}
                  </div>
                  <small className="text-muted">Filtered Results</small>
                </div>
              </Col>
            </Row>
          </div>

          {/* Transcription Content */}
          <div className="transcription-container" ref={transcriptionRef}>
            {viewMode === "conversation" ? (
              // Conversation View (Chat Bubbles)
              <div className="p-3">
                {groupedSegments.length > 0 ? (
                  groupedSegments.map((group, groupIndex) => (
                    <div
                      key={groupIndex}
                      className={`d-flex align-items-start mb-3 ${
                        group.isAI
                          ? "justify-content-end"
                          : "justify-content-start"
                      }`}
                    >
                      {!group.isAI && (
                        <div className="speaker-avatar candidate-avatar me-2">
                          {candidateName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div
                        className={`message-bubble ${
                          group.isAI ? "ai-message" : "candidate-message"
                        }`}
                      >
                        <div className="mb-1">
                          <Badge
                            bg={group.isAI ? "primary" : "success"}
                            className="px-2 py-1 small"
                          >
                            {group.speaker}
                          </Badge>
                        </div>

                        <div
                          className={`bubble-content ${
                            group.isAI ? "ai-bubble" : "candidate-bubble"
                          }`}
                        >
                          {group.messages.map((message, msgIndex) => (
                            <div
                              key={msgIndex}
                              className={msgIndex > 0 ? "mt-2" : ""}
                              data-text={message}
                            >
                              {searchTerm &&
                              message
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: message.replace(
                                      new RegExp(`(${searchTerm})`, "gi"),
                                      '<span class="search-highlight">$1</span>'
                                    ),
                                  }}
                                />
                              ) : (
                                message
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {group.isAI && (
                        <div className="speaker-avatar ai-avatar ms-2">AI</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <i
                      className="bi bi-chat-text text-muted"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <h6 className="text-muted mt-3">
                      No matching messages found
                    </h6>
                    <p className="text-muted small">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Compact View (List Format)
              <div className="p-3">
                {filteredSegments.length > 0 ? (
                  filteredSegments.map((segment, index) => (
                    <div
                      key={segment.id}
                      className={`compact-message ${
                        segment.isAI ? "compact-ai" : "compact-candidate"
                      }`}
                      data-text={segment.text}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          <Badge
                            bg={segment.isAI ? "primary" : "success"}
                            className="px-2 py-1 small"
                          >
                            {segment.isAI ? "AI" : "YOU"}
                          </Badge>
                          <small className="text-muted">#{index + 1}</small>
                        </div>

                        <div className="flex-grow-1">
                          {searchTerm &&
                          segment.text
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: segment.text.replace(
                                  new RegExp(`(${searchTerm})`, "gi"),
                                  '<span class="search-highlight">$1</span>'
                                ),
                              }}
                            />
                          ) : (
                            segment.text
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <i
                      className="bi bi-list-ul text-muted"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <h6 className="text-muted mt-3">No messages to display</h6>
                    <p className="text-muted small">
                      Check your search and filter settings
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card.Body>

        <Card.Footer className="bg-light border-0">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {filteredSegments.length} of{" "}
              {processedSegments.filter((s) => !s.isSystemMessage).length}{" "}
              messages
            </small>
            <div className="d-flex gap-2">
              {searchTerm && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => scrollToMatch(searchTerm)}
                >
                  <i className="bi bi-arrow-down me-1"></i>
                  Find Next
                </Button>
              )}
            </div>
          </div>
        </Card.Footer>
      </Card>
    </>
  );
};

export default TranscriptionViewer;
