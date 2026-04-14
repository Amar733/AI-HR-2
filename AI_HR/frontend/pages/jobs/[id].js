import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Tab,
  Tabs,
  Modal,
  Table,
  Form,
  Alert,
} from "react-bootstrap";
import Layout from "../../components/layout/Layout";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import CandidateInviteModal from "../../components/jobs/CandidateInviteModal";
import InterviewSessionList from "../../components/jobs/InterviewSessionList";
import InterviewCandidatesList from "../../components/jobs/InterviewCandidatesList";
import JobStatisticsDetail from "../../components/jobs/JobStatisticsDetail";
import JobForm from "../../components/jobs/JobForm"; // Import the JobForm component
import Toast from "../../components/ui/Toast";
import { jobAPI } from "../../services/aiInterviewAPI";
import { formatDate, formatNumber } from "../../utils/formatters";
import withAuth from "../../hoc/withAuth";
import { APP_NAME } from "../../utils/constants";

function JobDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Edit Job Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(false);

  // Custom Questions Management States
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    question: "",
    type: "general",
    expectedAnswer: "",
    keywords: "",
    difficulty: "medium",
  });
  const [questionFormErrors, setQuestionFormErrors] = useState({});
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // New state for deleting AI questions
  const [deletingAIQuestionIndex, setDeletingAIQuestionIndex] = useState(null);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      fetchJobStatistics();
      fetchJobSessions();
      fetchCandidates();
    }
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const fetchJobDetails = async () => {
    try {
      const response = await jobAPI.getById(id);
      setJob(response.job);
    } catch (error) {
      showToast("Failed to load job details", "error");
      router.push("/jobs");
    }
  };

  const fetchJobStatistics = async () => {
    try {
      const response = await jobAPI.getStatistics(id);
      setStatistics(response.statistics);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  const fetchJobSessions = async () => {
    try {
      const response = await jobAPI.getSessions(id, { limit: 10 });
      setSessions(response.sessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCandidates = async () => {
    try {
      const response = await jobAPI.getCandidates(id, { limit: 10 });
      setCandidates(response);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const interviewUrl = `${window.location.origin}/interview/${job.interviewLink}`;
    navigator.clipboard.writeText(interviewUrl);
    showToast("Interview link copied to clipboard!");
  };

  const handleGenerateQuestions = async () => {
    try {
      setGeneratingQuestions(true);
      await jobAPI.generateQuestions(id);
      showToast("AI questions regenerated successfully!");
      fetchJobDetails();
    } catch (error) {
      showToast("Failed to generate questions", "error");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Edit Job Functions
  const handleEditJob = () => {
    setShowEditModal(true);
  };

  const handleEditJobSubmit = async (jobData) => {
    try {
      setEditingJob(true);
      await jobAPI.update(id, jobData);
      showToast("Job updated successfully!");
      setShowEditModal(false);
      fetchJobDetails(); // Refresh job data
      fetchJobStatistics(); // Refresh statistics
    } catch (error) {
      throw new Error(error.message || "Failed to update job");
    } finally {
      setEditingJob(false);
    }
  };

  const handleCloseEditModal = () => {
    if (editingJob) return; // Prevent closing while saving
    setShowEditModal(false);
  };

  const handleExportResults = async () => {
    try {
      const response = await jobAPI.exportResults(id);
      const blob = new Blob([JSON.stringify(response.data)], {
        type: "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Results exported successfully!");
    } catch (error) {
      showToast("Failed to export results", "error");
    }
  };

  // Custom Questions Management Functions
  const resetQuestionForm = () => {
    setQuestionFormData({
      question: "",
      type: "general",
      expectedAnswer: "",
      keywords: "",
      difficulty: "medium",
    });
    setQuestionFormErrors({});
    setEditingQuestion(null);
  };

  const handleAddQuestion = () => {
    resetQuestionForm();
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion(index);
    setQuestionFormData({
      question: question.question,
      type: question.type,
      expectedAnswer: question.expectedAnswer || "",
      keywords: question.keywords ? question.keywords.join(", ") : "",
      difficulty: question.difficulty,
    });
    setQuestionFormErrors({});
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (index) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await jobAPI.deleteCustomQuestion(id, index);
        showToast("Question deleted successfully!");
        fetchJobDetails();
      } catch (error) {
        showToast("Failed to delete question", "error");
      }
    }
  };

  // New: Delete AI-generated question
  const handleDeleteAIQuestion = async (index) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this AI-generated question?"
      )
    )
      return;

    try {
      setDeletingAIQuestionIndex(index);
      // jobAPI.deleteAIQuestion should be implemented on the API client/backend
      await jobAPI.deleteAIQuestion(id, index);
      showToast("AI question deleted successfully!");
      fetchJobDetails();
    } catch (error) {
      console.error("Failed to delete AI question:", error);
      showToast("Failed to delete AI question", "error");
    } finally {
      setDeletingAIQuestionIndex(null);
    }
  };

  const validateQuestionForm = () => {
    const errors = {};

    if (!questionFormData.question.trim()) {
      errors.question = "Question is required";
    } else if (questionFormData.question.length > 1000) {
      errors.question = "Question cannot exceed 1000 characters";
    }

    if (
      questionFormData.expectedAnswer &&
      questionFormData.expectedAnswer.length > 2000
    ) {
      errors.expectedAnswer = "Expected answer cannot exceed 2000 characters";
    }

    setQuestionFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setQuestionFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (questionFormErrors[name]) {
      setQuestionFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();

    if (!validateQuestionForm()) {
      return;
    }

    try {
      setSavingQuestion(true);

      const questionData = {
        question: questionFormData.question.trim(),
        type: questionFormData.type,
        expectedAnswer: questionFormData.expectedAnswer.trim(),
        keywords: questionFormData.keywords
          ? questionFormData.keywords
              .split(",")
              .map((k) => k.trim())
              .filter((k) => k)
          : [],
        difficulty: questionFormData.difficulty,
      };

      if (editingQuestion !== null) {
        // Update existing question
        await jobAPI.updateCustomQuestion(id, editingQuestion, questionData);
        showToast("Question updated successfully!");
      } else {
        // Add new question
        await jobAPI.addCustomQuestion(id, questionData);
        showToast("Question added successfully!");
      }

      setShowQuestionModal(false);
      resetQuestionForm();
      fetchJobDetails();
    } catch (error) {
      showToast("Failed to save question", "error");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleCloseQuestionModal = () => {
    if (savingQuestion) return;
    setShowQuestionModal(false);
    resetQuestionForm();
  };

  if (loading || !job) {
    return (
      <Layout>
        <LoadingSpinner text="Loading job details..." />
      </Layout>
    );
  }

  const interviewUrl = `${window.location.origin}/interview/${job.interviewLink}`;

  return (
    <Layout>
      <Head>
        <title>{`${job.title} - ${APP_NAME}`}</title>
      </Head>

      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => router.back()}
              className="mb-3"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Jobs
            </Button>

            <div className="d-flex align-items-center gap-3 mb-2">
              <h2 className="mb-0">{job.title}</h2>
              <Badge bg={job.isActive ? "success" : "secondary"}>
                {job.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge bg="info">{job.interviewMode}</Badge>
              <Badge bg={job.difficulty === "expert" ? "dark" : "warning"}>
                {job.difficulty}
              </Badge>
            </div>

            <p className="text-muted mb-0">
              {job.department} • {job.position}
              {job.location && ` • ${job.location}`}
            </p>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={() => setShowInviteModal(true)}
            >
              <i className="bi bi-person-plus me-2"></i>
              Upload Candidates
            </Button>
            <Button variant="outline-warning" onClick={handleCopyLink}>
              <i className="bi bi-link me-2"></i>
              Copy Link
            </Button>
            <Button variant="outline-success" onClick={handleEditJob}>
              <i className="bi bi-pencil me-2"></i>
              Edit Job
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <JobStatisticsDetail statistics={statistics} />

        {/* Tabs */}
        <Card>
          <Card.Header>
            <Tabs
              activeKey={activeTab}
              onSelect={setActiveTab}
              className="card-header-tabs"
            >
              <Tab eventKey="overview" title="Overview" />
              <Tab
                eventKey="questions"
                title={`Questions (${
                  (job.customQuestions?.length || 0) +
                  (job.aiQuestions?.length || 0)
                })`}
              />
              <Tab
                eventKey="candidates"
                title={`Candidates (${candidates.total || 0})`}
              />
              <Tab
                eventKey="sessions"
                title={`Interviews (${statistics.total || 0})`}
              />
            </Tabs>
          </Card.Header>

          <Card.Body>
            {activeTab === "overview" && (
              <div>
                <Row>
                  <Col lg={8}>
                    <div className="mb-4">
                      <h5>Job Description</h5>
                      <p>{job.description}</p>
                    </div>

                    <div className="mb-4">
                      <h5>Required Skills</h5>
                      <div className="d-flex flex-wrap gap-2">
                        {job.requiredSkills?.map((skill, index) => (
                          <Badge
                            key={index}
                            bg={skill.mandatory ? "primary" : "secondary"}
                            className="p-2"
                          >
                            {skill.skill} ({skill.level})
                            {skill.mandatory && (
                              <i className="bi bi-exclamation-circle ms-1"></i>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {job.salary && (job.salary.min || job.salary.max) && (
                      <div className="mb-4">
                        <h5>Salary Range</h5>
                        <p>
                          {job.salary.currency} {formatNumber(job.salary.min)} -{" "}
                          {formatNumber(job.salary.max)} / {job.salary.period}
                        </p>
                      </div>
                    )}
                  </Col>

                  <Col lg={4}>
                    <Card className="bg-light">
                      <Card.Header>
                        <h6 className="mb-0">Interview Information</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <strong>Duration:</strong> {job.duration} minutes
                        </div>
                        <div className="mb-3">
                          <strong>Questions:</strong> {job.totalQuestions}
                        </div>
                        <div className="mb-3">
                          <strong>Language:</strong> {job.interviewLanguage}
                        </div>
                        <div className="mb-3">
                          <strong>Created:</strong> {formatDate(job.createdAt)}
                        </div>
                        {job.expiresAt && (
                          <div className="mb-3">
                            <strong>Expires:</strong>{" "}
                            {formatDate(job.expiresAt)}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {activeTab === "questions" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Interview Questions</h5>
                  <div className="d-flex gap-2">
                    <Button variant="success" onClick={handleAddQuestion}>
                      <i className="bi bi-plus-circle me-2"></i>
                      Add Custom Question
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={handleGenerateQuestions}
                      disabled={generatingQuestions}
                    >
                      {generatingQuestions ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-robot me-2"></i>
                          Regenerate AI Questions
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Custom Questions Section */}
                {job.customQuestions && job.customQuestions.length > 0 && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-primary mb-0">
                        Custom Questions ({job.customQuestions.length})
                      </h6>
                    </div>

                    <div className="row">
                      {job.customQuestions.map((question, index) => (
                        <div key={index} className="col-12 mb-3">
                          <Card className="h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center gap-2 mb-2">
                                    <Badge bg="primary" className="me-2">
                                      #{index + 1}
                                    </Badge>
                                    <Badge bg="info">{question.type}</Badge>
                                    <Badge
                                      bg={
                                        question.difficulty === "hard"
                                          ? "danger"
                                          : question.difficulty === "medium"
                                          ? "warning"
                                          : "success"
                                      }
                                    >
                                      {question.difficulty}
                                    </Badge>
                                  </div>
                                  <h6 className="mb-2">{question.question}</h6>

                                  {question.expectedAnswer && (
                                    <div className="mb-2">
                                      <small className="text-muted">
                                        <strong>Expected Answer:</strong>{" "}
                                        {question.expectedAnswer}
                                      </small>
                                    </div>
                                  )}

                                  {question.keywords &&
                                    question.keywords.length > 0 && (
                                      <div className="mb-2">
                                        <small className="text-muted">
                                          <strong>Keywords:</strong>{" "}
                                          {question.keywords.join(", ")}
                                        </small>
                                      </div>
                                    )}
                                </div>

                                <div className="d-flex gap-1 ms-3">
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() =>
                                      handleEditQuestion(question, index)
                                    }
                                    title="Edit Question"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteQuestion(index)}
                                    title="Delete Question"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State for Custom Questions */}
                {(!job.customQuestions || job.customQuestions.length === 0) && (
                  <div className="mb-4">
                    <Alert variant="info" className="text-center">
                      <i className="bi bi-info-circle me-2"></i>
                      No custom questions added yet. Click "Add Custom Question"
                      to create your first question.
                    </Alert>
                  </div>
                )}

                {/* AI Generated Questions Section */}
                {job.aiQuestions && job.aiQuestions.length > 0 && (
                  <div>
                    <h6 className="text-success mb-3">
                      AI-Generated Questions ({job.aiQuestions.length})
                    </h6>
                    {job.aiQuestions.map((question, index) => (
                      <Card key={index} className="mb-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <Badge bg="success">AI #{index + 1}</Badge>
                                <Badge bg="success">{question.type}</Badge>
                                <Badge bg="warning">
                                  {question.difficulty}
                                </Badge>
                              </div>
                              <h6>{question.question}</h6>
                              <div className="small text-muted">
                                {question.expectedKeywords &&
                                  question.expectedKeywords.length > 0 && (
                                    <div className="mt-2">
                                      <strong>Keywords:</strong>{" "}
                                      {question.expectedKeywords.join(", ")}
                                    </div>
                                  )}
                                <div>
                                  <strong>Scoring Criteria:</strong>{" "}
                                  {question.scoringCriteria}
                                </div>
                              </div>
                            </div>

                            {/* Delete button for AI question */}
                            <div className="ms-3 d-flex align-items-start">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteAIQuestion(index)}
                                disabled={deletingAIQuestionIndex === index}
                                title="Delete AI Question"
                              >
                                {deletingAIQuestionIndex === index ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                ) : (
                                  <i className="bi bi-trash"></i>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "sessions" && (
              <InterviewSessionList
                jobId={id}
                sessions={sessions}
                onRefresh={fetchJobSessions}
              />
            )}

            {activeTab === "candidates" && (
              <InterviewCandidatesList
                jobId={id}
                sessions={sessions}
                onRefresh={fetchCandidates}
              />
            )}
          </Card.Body>
        </Card>

        {/* Edit Job Modal */}
        <Modal
          show={showEditModal}
          onHide={handleCloseEditModal}
          size="xl"
          centered
          backdrop="static"
          keyboard={!editingJob}
        >
          <Modal.Header closeButton={!editingJob}>
            <Modal.Title>
              <i className="bi bi-pencil me-2"></i>
              Edit Interview Job
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <div className="p-4">
              <Alert variant="info" className="mb-4">
                <Alert.Heading>📝 Update Job Information</Alert.Heading>
                <p className="mb-0">
                  Modify your interview job details. Changes will be applied
                  immediately and existing interview sessions will continue to
                  work with the current settings.
                </p>
              </Alert>

              {job && (
                <JobForm
                  job={job}
                  onSubmit={handleEditJobSubmit}
                  onCancel={handleCloseEditModal}
                  submitButtonText={
                    editingJob ? "Updating Job..." : "Update Job"
                  }
                  isSubmitting={editingJob}
                />
              )}
            </div>
          </Modal.Body>
        </Modal>

        {/* Custom Question Modal */}
        <Modal
          show={showQuestionModal}
          onHide={handleCloseQuestionModal}
          size="lg"
          backdrop={savingQuestion ? "static" : true}
          keyboard={!savingQuestion}
        >
          <Modal.Header closeButton={!savingQuestion}>
            <Modal.Title>
              {editingQuestion !== null
                ? "Edit Custom Question"
                : "Add Custom Question"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveQuestion}>
            <Modal.Body>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Question <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="question"
                      value={questionFormData.question}
                      onChange={handleQuestionFormChange}
                      placeholder="Enter your interview question..."
                      maxLength={1000}
                      isInvalid={!!questionFormErrors.question}
                      disabled={savingQuestion}
                    />
                    <Form.Control.Feedback type="invalid">
                      {questionFormErrors.question}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      {questionFormData.question.length}/1000 characters
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Question Type</Form.Label>
                    <Form.Select
                      name="type"
                      value={questionFormData.type}
                      onChange={handleQuestionFormChange}
                      disabled={savingQuestion}
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="situational">Situational</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Difficulty Level</Form.Label>
                    <Form.Select
                      name="difficulty"
                      value={questionFormData.difficulty}
                      onChange={handleQuestionFormChange}
                      disabled={savingQuestion}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Expected Answer (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="expectedAnswer"
                  value={questionFormData.expectedAnswer}
                  onChange={handleQuestionFormChange}
                  placeholder="Provide guidance on what you're looking for in the answer..."
                  maxLength={2000}
                  isInvalid={!!questionFormErrors.expectedAnswer}
                  disabled={savingQuestion}
                />
                <Form.Control.Feedback type="invalid">
                  {questionFormErrors.expectedAnswer}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  {questionFormData.expectedAnswer.length}/2000 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Keywords (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="keywords"
                  value={questionFormData.keywords}
                  onChange={handleQuestionFormChange}
                  placeholder="Enter keywords separated by commas (e.g., leadership, teamwork, problem-solving)"
                  disabled={savingQuestion}
                />
                <Form.Text className="text-muted">
                  Separate multiple keywords with commas
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={handleCloseQuestionModal}
                disabled={savingQuestion}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingQuestion}>
                {savingQuestion ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {editingQuestion !== null ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingQuestion !== null
                      ? "Update Question"
                      : "Add Question"}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Invite Modal */}
        <CandidateInviteModal
          show={showInviteModal}
          onHide={() => setShowInviteModal(false)}
          jobId={id}
          jobTitle={job.title}
          onInviteComplete={fetchCandidates}
        />

        {/* Toast */}
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

export default withAuth(JobDetailsPage);
