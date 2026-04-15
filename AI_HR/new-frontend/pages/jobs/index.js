import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
  Dropdown,
  Alert,
} from "react-bootstrap";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/layout/Layout";
import JobForm from "../../components/jobs/JobForm";
import JobList from "../../components/jobs/JobList";
import JobStatistics from "../../components/jobs/JobStatistics";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Toast from "../../components/ui/Toast";
import { jobAPI } from "../../services/aiInterviewAPI";
import withAuth from "../../hoc/withAuth";
import { APP_NAME } from "../../utils/constants";

function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statistics, setStatistics] = useState({});

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll(filters);
      setJobs(response.jobs);
      setPagination(response.pagination);

      // Calculate basic statistics
      const stats = {
        totalJobs: response.total,
        activeJobs: response.jobs.filter((job) => job.isActive).length,
        totalInterviews: response.jobs.reduce(
          (sum, job) => sum + (job.totalInterviews || 0),
          0
        ),
        avgScore:
          response.jobs.reduce((sum, job) => sum + (job.averageScore || 0), 0) /
          (response.jobs.length || 1),
      };
      setStatistics(stats);
    } catch (error) {
      showToast("Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const handleCreateJob = async (jobData) => {
    try {
      const response = await jobAPI.create(jobData);
      showToast(
        "Job created successfully! AI questions are being generated..."
      );
      setShowCreateModal(false);
      fetchJobs();
      setLoading(true);
      // Redirect to job details if needed
      if (response.job?._id) {
        setTimeout(() => {
          router.push(`/jobs/${response.job._id}`);
        }, 2000);
      }
    } catch (error) {
      throw new Error(error.message || "Failed to create job");
    }
  };

  const handleEditJob = async (jobData) => {
    try {
      await jobAPI.update(selectedJob._id, jobData);
      showToast("Job updated successfully!");
      setShowEditModal(false);
      setSelectedJob(null);
      fetchJobs();
      setLoading(true);
    } catch (error) {
      throw new Error(error.message || "Failed to update job");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await jobAPI.delete(jobId);
      showToast("Job deleted successfully!");
      fetchJobs();
      setLoading(true);
    } catch (error) {
      showToast(error.message || "Failed to delete job", "error");
    }
  };

  const handleViewJob = (jobId) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleEditClick = (job) => {
    setSelectedJob(job);
    setShowEditModal(true);
  };

  const handleGenerateQuestions = async (jobId) => {
    try {
      await jobAPI.generateQuestions(jobId);
      showToast("AI questions generated successfully!");
      fetchJobs();
      setLoading(true);
    } catch (error) {
      showToast(error.message || "Failed to generate questions", "error");
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (loading && jobs.length === 0) {
    return (
      <Layout>
        <LoadingSpinner text="Loading AI interview jobs..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{`AI Interview Jobs - ${APP_NAME}`}</title>
      </Head>

      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">🤖 AI Interview Jobs</h2>
            <p className="text-muted mb-0">
              Create and manage AI-powered interview jobs
            </p>
          </div>
          <Button
            variant="primary"
            className="gradient-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Create AI Job
          </Button>
        </div>

        {/* Statistics Cards */}
        <JobStatistics statistics={statistics} />

        {/* Jobs List */}
        <Card>
          <Card.Body>
            <JobList
              jobs={jobs}
              onView={handleViewJob}
              onEdit={handleEditClick}
              onDelete={handleDeleteJob}
              onGenerateQuestions={handleGenerateQuestions}
              pagination={pagination}
              onPageChange={handlePageChange}
              filters={filters}
              onFilterChange={handleFilterChange}
              onCreateJob={() => setShowCreateModal(true)}
            />
          </Card.Body>
        </Card>

        {/* Create Job Modal */}
        <Modal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          size="xl"
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-robot me-2"></i>
              Create AI Interview Job
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <div className="p-4">
              <Alert variant="info" className="mb-4">
                <Alert.Heading>🧠 AI-Powered Interview Creation</Alert.Heading>
                <p className="mb-0">
                  Create comprehensive interview jobs with AI-generated
                  questions, automated analysis, and intelligent candidate
                  scoring. Our AI will help you assess technical skills,
                  communication, and cultural fit.
                </p>
              </Alert>

              <JobForm
                onSubmit={handleCreateJob}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </Modal.Body>
        </Modal>

        {/* Edit Job Modal */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          size="xl"
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-pencil me-2"></i>
              Edit Interview Job
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <div className="p-4">
              {selectedJob && (
                <JobForm
                  job={selectedJob}
                  onSubmit={handleEditJob}
                  onCancel={() => {
                    setShowEditModal(false);
                    setSelectedJob(null);
                  }}
                />
              )}
            </div>
          </Modal.Body>
        </Modal>

        {/* Toast Notifications */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </Container>
    </Layout>
  );
}

export default withAuth(JobsPage);
