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
  formatNumber,
  getStatusColor,
} from "../../utils/formatters";
import Pagination from "../ui/Pagination";
import EmptyState from "../../components/ui/EmptyState";
export default function JobList({
  jobs,
  onView,
  onEdit,
  onDelete,
  onGenerateQuestions,
  pagination,
  onPageChange,
  filters,
  onFilterChange,
  onCreateJob,
}) {
  const handleFilterChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "danger";
      case "expert":
        return "dark";
      default:
        return "secondary";
    }
  };

  const getModeIcon = (mode) => {
    return mode === "real" ? "bi-briefcase" : "bi-mortarboard";
  };

  return (
    <div className="job-list">
      {/* Filters */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        <div className="flex-grow-1 position-relative">
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ zIndex: 10 }}></i>
          <Form.Control
            type="text"
            className="ps-5 border-0 shadow-sm w-100"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            style={{ 
              borderRadius: '12px', 
              paddingTop: '12px', 
              paddingBottom: '12px',
              fontSize: '14px',
              backgroundColor: '#ffffff'
            }}
          />
        </div>
        <Form.Select
          className="border-0 shadow-sm w-100 w-md-auto"
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          style={{ 
            borderRadius: '12px', 
            padding: '10px 40px 10px 15px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
      </div>

      {/* Jobs Table */}
      <div className="table-responsive">
        <Table hover className="align-middle" responsive="sm">
          <thead className="table-light">
            <tr>
              <th style={{ width: '35%' }}>Job Details</th>
              <th style={{ width: '20%' }}>Configuration</th>
              <th style={{ width: '15%' }}>Statistics</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Created</th>
              <th style={{ width: '5%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id}>
                <td>
                  <div className="d-flex align-items-center mb-1">
                    <h6 className="mb-0 fw-bold text-dark me-2">{job.title}</h6>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '12px' }}>
                    <i className="bi bi-building me-1"></i> {job.department}
                    <span className="mx-2 opacity-25">|</span>
                    <i className="bi bi-person me-1"></i> {job.position}
                  </div>
                  {job.location && (
                    <div className="text-muted small mb-2">
                       <i className="bi bi-geo-alt me-1"></i> {job.location}
                    </div>
                  )}
                  <div className="d-flex gap-1 overflow-auto no-scrollbar pt-1">
                    <Badge className="bg-light text-dark border fw-normal" style={{ fontSize: '10px' }}>
                      <i className={`bi ${getModeIcon(job.interviewMode)} me-1 opacity-75`}></i>
                      {job.interviewMode.toUpperCase()}
                    </Badge>
                    <Badge className={`bg-${getDifficultyColor(job.difficulty)}-subtle text-${getDifficultyColor(job.difficulty)} border-0 fw-bold`} style={{ fontSize: '10px' }}>
                      {job.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                </td>
                <td>
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-clock text-muted small"></i>
                      <span className="small text-dark fw-semibold">{job.duration} min</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-patch-question text-muted small"></i>
                      <span className="small text-dark fw-semibold">{job.totalQuestions} Questions</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-translate text-muted small"></i>
                      <span className="small text-muted">{job.interviewLanguage}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="stats-container p-2 rounded bg-light border-0">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted x-small">Interviews</span>
                      <span className="fw-bold small">{formatNumber(job.totalInterviews || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted x-small">Avg Score</span>
                      <span className="fw-bold small text-primary">{job.averageScore > 0 ? job.averageScore.toFixed(1) : '—'}</span>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <Badge bg={job.isActive ? "success-subtle" : "secondary-subtle"} className={`text-${job.isActive ? 'success' : 'secondary'} border-0 px-2 fw-bold`} style={{ fontSize: '10px' }}>
                    {job.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </td>
                <td className="text-center">
                   <div style={{ minWidth: '80px' }}>
                    <div className="small fw-bold text-dark">{formatDate(job.createdAt)}</div>
                    <div className="text-muted x-small">by {job.createdBy?.name || 'Admin'}</div>
                   </div>
                </td>
                <td>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant="link" 
                      className="p-1 text-muted hover-primary"
                      onClick={() => onView(job._id)}
                    >
                      <i className="bi bi-eye"></i>
                    </Button>
                    <Dropdown align="end">
                      <Dropdown.Toggle variant="link" className="p-1 text-muted no-caret hide-toggle-icon">
                        <i className="bi bi-three-dots-vertical"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="shadow-sm border-0 mt-2">
                        <Dropdown.Item onClick={() => onEdit(job)}>
                          <i className="bi bi-pencil me-2"></i> Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `${window.location.origin}/interview/${job.interviewLink}`
                            )
                          }
                        >
                          <i className="bi bi-link-45deg me-2"></i> Copy Link
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          onClick={() => onDelete(job._id)}
                          className="text-danger"
                        >
                           <i className="bi bi-trash me-2"></i> Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {jobs.length == 0 && (
          <EmptyState
            icon="bi-robot"
            title="No AI interview jobs found"
            description="Create your first AI-powered interview job to get started with intelligent candidate assessment."
            actionText="Create Your First AI Job"
            onAction={onCreateJob}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      <style jsx>{`
        .job-list :global(.table) {
          border-collapse: separate;
          border-spacing: 0 12px;
        }

        .job-list :global(.table thead th) {
          background: transparent;
          border-bottom: none;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0 1rem;
        }

        .job-list :global(.table tbody tr) {
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .job-list :global(.table tbody tr:hover) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04);
          background: #ffffff;
        }

        .job-list :global(.table tbody td) {
          padding: 1.25rem 1rem;
          border: none;
          background: #ffffff;
        }

        .job-list :global(.table tbody td:first-child) {
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
          border-left: 1px solid rgba(0,0,0,0.04);
        }

        .job-list :global(.table tbody td:last-child) {
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
          border-right: 1px solid rgba(0,0,0,0.04);
        }

        .stats-container {
          min-width: 140px;
        }

        .x-small {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hover-primary:hover {
          color: #000000 !important;
          background: #f1f5f9 !important;
          border-radius: 6px;
        }

        :global(.hide-toggle-icon::after) {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
