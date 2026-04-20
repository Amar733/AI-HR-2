import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  ProgressBar,
  OverlayTrigger,
  Tooltip,
  Spinner,
} from "react-bootstrap";

import { jobAPI } from "../../services/aiInterviewAPI";
import { toast } from "react-toastify";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";

/**
 * Helper: clamp a number to 0..100 and return integer
 */
const clampPercent = (value) => {
  const n = Number(value) || 0;
  if (!isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
};

/**
 * Map score to bootstrap variant
 */
const getScoreVariant = (score) => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  if (score >= 40) return "info";
  return "danger";
};

/**
 * Small component to show either a single large progress bar
 * or a list of skill mini bars if skillScores exists.
 */
function SkillProgress({ matchScore, skillScores, status }) {
  if (typeof matchScore === "number") {
    const pct = clampPercent(matchScore);
    const variant = getScoreVariant(pct);
    return (
      <div style={{ minWidth: 220 }}>
        <ProgressBar
          now={pct}
          label={`${pct}%`}
          variant={variant}
          animated
          style={{
            height: 15,
            borderRadius: 8,
            fontWeight: 600,
            width: 300,
          }}
        />
      </div>
    );
  }

  // No data
  return <div style={{ minWidth: 220 }}>-</div>;
}

export default function InterviewCandidatesList({
  jobId,
  candidate: initialSessions,
  onRefresh,
}) {
  const [candidate, setSessions] = useState(initialSessions || []);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, jobId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getCandidates(jobId, filters);
      setSessions(response.resumeData || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Failed to fetch candidate:", error);
      toast.error("Failed to load interview candidate");
    } finally {
      setLoading(false);
    }
  };

  // Derived values for selection toolbar
  const visibleIds = useMemo(
    () => (Array.isArray(candidate) ? candidate.map((c) => c._id) : []),
    [candidate]
  );

  const visibleSelectedCount = useMemo(
    () => visibleIds.filter((id) => selectedIds.has(id)).length,
    [visibleIds, selectedIds]
  );

  const totalSelectedCount = selectedIds.size;

  const allVisibleSelected =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (allVisibleSelected) {
        // remove visible
        visibleIds.forEach((id) => copy.delete(id));
      } else {
        // add visible
        visibleIds.forEach((id) => copy.add(id));
      }
      return copy;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  /**
   * Invite flow — compatible with your server API:
   * POST /api/jobs/:id/invite
   * body: { candidates: [{ email, name }, ...] }
   */
  const handleInvite = async () => {
    if (!jobId) {
      toast.error("Missing job id");
      return;
    }

    const ids = Array.from(selectedIds);
    if (!ids.length) {
      toast.info("Select candidates to invite.");
      return;
    }

    // build candidate objects from current page/cache
    const selectedCandidates = ids
      .map((id) => candidate.find((c) => c._id === id))
      .filter(Boolean);

    // separate out those with missing email (API requires email)
    const invalid = selectedCandidates.filter((c) => !c.email);
    const valid = selectedCandidates.filter((c) => c.email);

    if (invalid.length > 0) {
      toast.warn(
        `${invalid.length} candidate(s) skipped because they do not have an email address.`
      );
    }

    if (valid.length === 0) {
      toast.error("No valid candidates to invite (missing emails).");
      return;
    }

    const payload = {
      candidates: valid.map((c) => ({ email: c.email, name: c.name })),
    };

    try {
      setInviting(true);
      const res = await jobAPI.inviteCandidates(jobId, payload);
      // Expected response shape (per your server code):
      // { success: true, message: 'X invitations sent successfully', results, errors }
      if (res && res.success) {
        toast.success(
          res.message ||
            `Invited ${res.results?.length || valid.length} candidate(s).`
        );
        // optionally show errors summary
        if (res.errors && res.errors.length > 0) {
          console.error("Invite errors:", res.errors);
          toast.warn(
            `${res.errors.length} errors occurred — check console for details.`
          );
        }
        // clear selection and refresh list
        clearSelection();
        if (typeof onRefresh === "function") onRefresh();
        fetchSessions();
      } else {
        // if API returns success:false
        const message = (res && res.message) || "Failed to invite candidates";
        toast.error(message);
        console.error("Invite response:", res);
      }
    } catch (err) {
      console.error("Invite error:", err);
      const msg =
        err?.response?.data?.message || err?.message || "Failed to invite.";
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (loading && (!candidate || candidate.length === 0)) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary mb-3" />
        <p>Loading interview candidate...</p>
      </div>
    );
  }

  return (
    <div className="interview-session-list">
      {/* Filters */}
      <div className="d-flex gap-3 mb-3 align-items-center">
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
          style={{ width: "200px" }}
        >
          <option value="">All match</option>
          <option value="top">Top match</option>
          <option value="low">Low match</option>
        </Form.Select>
      </div>

      {/* Selection toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Form.Check
            type="checkbox"
            label={
              visibleIds.length
                ? `Select page (${visibleIds.length})`
                : "Select page"
            }
            checked={allVisibleSelected}
            onChange={toggleSelectAllVisible}
            id="select-all-visible"
          />
        </div>

        <div className="d-flex gap-2 align-items-center">
          {totalSelectedCount > 0 && (
            <div className="me-2 text-muted small">
              {totalSelectedCount} selected
              {visibleSelectedCount > 0 && (
                <span className="ms-2 text-muted">
                  ({visibleSelectedCount} on this page)
                </span>
              )}
            </div>
          )}

          <Button
            variant="outline-secondary"
            size="sm"
            disabled={totalSelectedCount === 0 || inviting}
            onClick={clearSelection}
          >
            Clear
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleInvite}
            disabled={totalSelectedCount === 0 || inviting}
          >
            {inviting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Inviting...
              </>
            ) : (
              <>Invite selected</>
            )}
          </Button>
        </div>
      </div>

      {/* Sessions Table */}
      {candidate && candidate.length > 0 ? (
        <>
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }} />
                  <th>Name</th>
                  <th>Email</th>
                  <th>Skill Match</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidate.map((session) => (
                  <tr key={session._id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedIds.has(session._id)}
                        onChange={() => toggleSelectOne(session._id)}
                        aria-label={`select-${session._id}`}
                      />
                    </td>

                    <td>{session?.name || "—"}</td>
                    <td>{session?.email || "—"}</td>

                    <td>
                      <SkillProgress
                        matchScore={
                          typeof session.matchScore === "number"
                            ? session.matchScore
                            : session?.analysis?.overallScore
                        }
                        skillScores={
                          session.skillScores || session?.analysis?.skillScores
                        }
                        status={session.status}
                      />
                    </td>

                    <td>
                      {String(session.status || "")
                        .replace("_", " ")
                        .toUpperCase() === "COMPLETED" && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            toast.info(
                              "Open analysis modal for " + session.name
                            );
                          }}
                        >
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
          title="No interview candidate yet"
          description="When candidates complete their interviews, they will appear here with detailed AI analysis."
          actionText="Invite Candidates"
          onAction={() => {
            toast.info("Open invite flow");
          }}
        />
      )}
    </div>
  );
}
