// Updated InterviewSessionList with Analysis Modal integration

import { useState, useEffect } from "react";
import {
  Table,
  Badge,
  Dropdown,
  Button,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  formatDate,
  formatDateTime,
  getStatusColor,
} from "../../utils/formatters";
import { jobAPI, analysisAPI } from "../../services/aiInterviewAPI";
import { toast } from "react-toastify";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import ModernAnalysisModal from "../analysis/AnalysisModal";

export default function InterviewSessionList({
  jobId,
  sessions: initialSessions,
  onRefresh,
}) {
  const [sessions, setSessions] = useState(initialSessions || []);
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchSessions();
  }, [filters, jobId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getSessions(jobId, filters);
      setSessions(response.sessions || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load interview sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = async (session) => {
    try {
      setLoading(true);

      setSelectedSession(session);
      setAnalysisData(session.analysis);
      setShowAnalysis(true);
    } catch (error) {
      toast.error("Failed to load analysis");
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    if (score >= 4) return "info";
    return "danger";
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case "hire":
        return "success";
      case "maybe":
        return "warning";
      case "further_evaluation":
        return "info";
      case "no_hire":
        return "danger";
      default:
        return "secondary";
    }
  };

  const handleExportReport = async (session) => {
    try {
      // Implement export functionality
      toast.info("Export functionality coming soon!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary mb-3" />
        <p>Loading interview sessions...</p>
      </div>
    );
  }

  return (
    <div className="interview-session-list">
      {/* Filters */}
      <div className="d-flex gap-3 mb-4">
        <div className="flex-grow-1">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search by candidate name or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
          </InputGroup>
        </div>
        <Form.Select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="">All Status</option>
          <option value="started">Started</option>
          <option value="completed">Completed</option>
        </Form.Select>
      </div>

      {/* Sessions Table */}
      {sessions.length > 0 ? (
        <>
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Candidate</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Recommendation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id}>
                    <td>{formatDate(session.createdAt)}</td>
                    <td>
                      <div>
                        <h6 className="mb-1">{session.candidateInfo?.name}</h6>
                        <small className="text-muted">
                          {session.candidateInfo?.email}
                        </small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={getStatusColor(session.status)}>
                        {session.status?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </td>

                    <td>
                      {session.analysis?.overallScore ? (
                        <Badge
                          bg={getScoreColor(session.analysis.overallScore)}
                          className="px-3 py-2"
                        >
                          {session.analysis.overallScore.toFixed(1)}/10
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {session.analysis?.recommendation?.decision ? (
                        <Badge
                          bg={getRecommendationColor(
                            session.analysis.recommendation.decision
                          )}
                        >
                          {session.analysis.recommendation.decision
                            .replace("_", " ")
                            .toUpperCase()}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {session.status?.replace("_", " ").toUpperCase() ==
                        "COMPLETED" && (
                        <Button onClick={() => handleViewAnalysis(session)}>
                          <i className="bi bi-graph-up me-2"></i>
                          Analysis
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="bi-camera-video"
          title="No interview sessions yet"
          description="When candidates complete their interviews, they will appear here with detailed AI analysis."
          actionText="Invite Candidates"
          onAction={() => {
            /* This would trigger the invite modal */
          }}
        />
      )}

      {/* Analysis Modal */}
      <ModernAnalysisModal
        show={showAnalysis}
        onHide={() => setShowAnalysis(false)}
        sessionData={selectedSession} // Your session data structure
        analysisData={analysisData}
      />
    </div>
  );
}
