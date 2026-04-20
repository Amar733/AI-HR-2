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
      <div className="d-flex gap-3 mb-4">
        <div className="flex-grow-1">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search jobs by title, position, or department..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
      </div>

      {/* Jobs Table */}
      <div className="table-responsive">
        <Table hover className="align-middle" responsive="sm">
          <thead className="table-light">
            <tr>
              <th>Job Details</th>
              <th>Configuration</th>
              <th>Statistics</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id}>
                <td>
                  <div>
                    <h6 className="mb-1 fw-bold">{job.title}</h6>
                    <div className="text-muted small">
                      {job.department} • {job.position}
                    </div>
                    {job.location && (
                      <div className="text-muted small">
                        <i className="bi bi-geo-alt me-1"></i>
                        {job.location}
                      </div>
                    )}
                    <div className="mt-1">
                      <Badge className="me-1">
                        <i
                          className={`bi ${getModeIcon(
                            job.interviewMode
                          )} me-1`}
                        ></i>
                        {job.interviewMode}
                      </Badge>
                      <Badge bg={getDifficultyColor(job.difficulty)}>
                        {job.difficulty}
                      </Badge>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="small">
                    <div>
                      <strong>{job.duration} min</strong> duration
                    </div>
                    <div>
                      <strong>{job.totalQuestions}</strong> questions
                    </div>
                    <div>
                      <strong>{job.requiredSkills?.length || 0}</strong> skills
                    </div>
                    <div className="text-muted">
                      {job.interviewLanguage} • {job.aiQuestions?.length || 0}{" "}
                      AI questions
                    </div>
                  </div>
                </td>
                <td>
                  <div className="small">
                    <div>
                      <strong>{formatNumber(job.totalInterviews || 0)}</strong>{" "}
                      interviews
                    </div>
                    <div>
                      <strong>
                        {formatNumber(job.completedInterviews || 0)}
                      </strong>{" "}
                      completed
                    </div>
                    {job.averageScore > 0 && (
                      <div>
                        Avg: <strong>{job.averageScore.toFixed(1)}/10</strong>
                      </div>
                    )}
                    {job.passRate > 0 && (
                      <div className="text-success">
                        {job.passRate.toFixed(0)}% pass rate
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <Badge bg={job.isActive ? "success" : "secondary"}>
                    {job.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {job.expiresAt && new Date(job.expiresAt) < new Date() && (
                    <div>
                      <Badge bg="warning" className="mt-1">
                        Expired
                      </Badge>
                    </div>
                  )}
                </td>
                <td>
                  <div className="small">
                    <div>{formatDate(job.createdAt)}</div>
                    <div className="text-muted">by {job.createdBy?.name}</div>
                  </div>
                </td>
                <td>
                  <Dropdown align="end" drop="down">
                    <Dropdown.Toggle variant="outline-secondary" size="sm">
                      <i className="bi bi-three-dots"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => onView(job._id)}>
                        <i className="bi bi-eye me-2"></i>
                        View Details
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => onEdit(job)}>
                        <i className="bi bi-pencil me-2"></i>
                        Edit Job
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${window.location.origin}/interview/${job.interviewLink}`
                          )
                        }
                      >
                        <i className="bi bi-link me-2"></i>
                        Copy Interview Link
                      </Dropdown.Item>

                      <Dropdown.Divider />
                      <Dropdown.Item
                        onClick={() => onDelete(job._id)}
                        className="text-danger"
                      >
                        <i className="bi bi-trash me-2"></i>
                        Delete Job
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
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
    </div>
  );
}
