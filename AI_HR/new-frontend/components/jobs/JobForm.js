import { useState } from "react";
import { Form, Button, Row, Col, Card, Badge, Alert } from "react-bootstrap";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import { jobAPI } from "../../services/aiInterviewAPI";
import { toast } from "react-toastify";

const jobValidationSchema = Yup.object({
  title: Yup.string().required("Job title is required").max(200),
  description: Yup.string().required("Job description is required").max(5000),
  department: Yup.string().required("Department is required").max(100),
  position: Yup.string().required("Position is required").max(100),
  interviewLanguage: Yup.string().required("Interview language is required"),
  interviewMode: Yup.string().required("Interview mode is required"),
  difficulty: Yup.string().required("Difficulty level is required"),
  duration: Yup.number().min(5).max(180).required("Duration is required"),
  totalQuestions: Yup.number()
    .min(5)
    .max(50)
    .required("Total questions is required"),
  requiredSkills: Yup.array().min(
    1,
    "At least one required skill must be added"
  ),
});

export default function JobForm({ job, onSubmit, onCancel, loading = false }) {
  const [generateQuestions, setGenerateQuestions] = useState(true);

  const initialValues = {
    title: job?.title || "",
    description: job?.description || "",
    department: job?.department || "",
    position: job?.position || "",
    location: job?.location || "",

    // Salary
    salary: {
      min: job?.salary?.min || "",
      max: job?.salary?.max || "",
      currency: job?.salary?.currency || "USD",
      period: job?.salary?.period || "yearly",
    },

    // Interview Settings
    interviewLanguage: job?.interviewLanguage || "english",
    interviewMode: job?.interviewMode || "real",
    difficulty: job?.difficulty || "medium",
    duration: job?.duration || 60,
    totalQuestions: job?.totalQuestions || 10,

    // Question Types
    questionTypes: {
      technical: job?.questionTypes?.technical || 5,
      behavioral: job?.questionTypes?.behavioral || 3,
      situational: job?.questionTypes?.situational || 2,
      caseStudy: job?.questionTypes?.caseStudy || 0,
    },

    // Skills
    requiredSkills: job?.requiredSkills || [
      { skill: "", level: "intermediate", mandatory: true },
    ],
    optionalSkills: job?.optionalSkills || [],

    // Experience
    experience: {
      min: job?.experience?.min || 0,
      max: job?.experience?.max || 10,
    },

    // Education
    education: {
      degree: job?.education?.degree || "",
      field: job?.education?.field || "",
      required: job?.education?.required || false,
    },

    // Custom Questions
    customQuestions: job?.customQuestions || [],

    // Settings
    settings: {
      recordVideo: job?.settings?.recordVideo ?? true,
      recordAudio: job?.settings?.recordAudio ?? true,
      showTimer: job?.settings?.showTimer ?? true,
      randomizeQuestions: job?.settings?.randomizeQuestions ?? true,
      antiCheat: job?.settings?.antiCheat ?? true,
      allowResume: job?.settings?.allowResume ?? false,
      allowNotes: job?.settings?.allowNotes ?? false,
    },
  };

  const languageOptions = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "hindi", label: "Hindi" },
    { value: "telegu", label: "Telegu (Under testing)" },
    { value: "bengali", label: "Bengali (Under testing)" },
  ];

  const skillLevels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" },
  ];

  const degreeOptions = [
    { value: "high_school", label: "High School" },
    { value: "associate", label: "Associate Degree" },
    { value: "bachelor", label: "Bachelors Degree" },
    { value: "master", label: "Masters Degree" },
    { value: "phd", label: "PhD" },
    { value: "certification", label: "Professional Certification" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const jobData = {
        ...values,
        generateQuestions,
      };
      await onSubmit(jobData);
    } catch (error) {
      toast.error(error.message || "Failed to save job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="job-form">
      <Formik
        initialValues={initialValues}
        validationSchema={jobValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
          setFieldValue,
          isSubmitting,
        }) => (
          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">📋 Basic Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Job Title *</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        isInvalid={touched.title && errors.title}
                        placeholder="e.g., Senior Software Engineer"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.title}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Position *</Form.Label>
                      <Form.Control
                        type="text"
                        name="position"
                        value={values.position}
                        onChange={handleChange}
                        isInvalid={touched.position && errors.position}
                        placeholder="e.g., Senior Software Engineer"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.position}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Department *</Form.Label>
                      <Form.Control
                        type="text"
                        name="department"
                        value={values.department}
                        onChange={handleChange}
                        isInvalid={touched.department && errors.department}
                        placeholder="e.g., Engineering"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.department}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={values.location}
                        onChange={handleChange}
                        placeholder="e.g., San Francisco, CA / Remote"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Job Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    isInvalid={touched.description && errors.description}
                    placeholder="Provide a detailed job description, responsibilities, and requirements..."
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    This description will be used by AI to generate relevant
                    interview questions.
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Salary Information */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">💰 Salary Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Min Salary</Form.Label>
                      <Form.Control
                        type="number"
                        name="salary.min"
                        value={values.salary.min}
                        onChange={handleChange}
                        placeholder="50000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Salary</Form.Label>
                      <Form.Control
                        type="number"
                        name="salary.max"
                        value={values.salary.max}
                        onChange={handleChange}
                        placeholder="100000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Currency</Form.Label>
                      <Form.Select
                        name="salary.currency"
                        value={values.salary.currency}
                        onChange={handleChange}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Period</Form.Label>
                      <Form.Select
                        name="salary.period"
                        value={values.salary.period}
                        onChange={handleChange}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Interview Configuration */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">🎯 Interview Configuration</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Interview Language *</Form.Label>
                      <Form.Select
                        name="interviewLanguage"
                        value={values.interviewLanguage}
                        onChange={handleChange}
                        isInvalid={
                          touched.interviewLanguage && errors.interviewLanguage
                        }
                      >
                        {languageOptions.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.interviewLanguage}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Interview Mode *</Form.Label>
                      <Form.Select
                        name="interviewMode"
                        value={values.interviewMode}
                        onChange={handleChange}
                        isInvalid={
                          touched.interviewMode && errors.interviewMode
                        }
                      >
                        <option value="real">Real Interview</option>
                        <option value="mock">Mock Interview</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.interviewMode}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Mock interviews are for practice; Real interviews count
                        toward hiring decisions.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Difficulty Level *</Form.Label>
                      <Form.Select
                        name="difficulty"
                        value={values.difficulty}
                        onChange={handleChange}
                        isInvalid={touched.difficulty && errors.difficulty}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="expert">Expert</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.difficulty}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (minutes) *</Form.Label>
                      <Form.Select
                        name="duration"
                        value={values.duration}
                        onChange={handleChange}
                        isInvalid={touched.duration && !!errors.duration}
                      >
                        <option value="">Select duration</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.duration}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Questions *</Form.Label>
                      <Form.Control
                        type="number"
                        name="totalQuestions"
                        value={values.totalQuestions}
                        onChange={handleChange}
                        min="5"
                        max="50"
                        isInvalid={
                          touched.totalQuestions && errors.totalQuestions
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.totalQuestions}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Question Distribution */}
                <div className="mb-3">
                  <Form.Label>Question Distribution</Form.Label>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Technical</Form.Label>
                        <Form.Control
                          type="number"
                          name="questionTypes.technical"
                          value={values.questionTypes.technical}
                          onChange={handleChange}
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Behavioral</Form.Label>
                        <Form.Control
                          type="number"
                          name="questionTypes.behavioral"
                          value={values.questionTypes.behavioral}
                          onChange={handleChange}
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Situational</Form.Label>
                        <Form.Control
                          type="number"
                          name="questionTypes.situational"
                          value={values.questionTypes.situational}
                          onChange={handleChange}
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Case Study</Form.Label>
                        <Form.Control
                          type="number"
                          name="questionTypes.caseStudy"
                          value={values.questionTypes.caseStudy}
                          onChange={handleChange}
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <small className="text-muted">
                    Total:{" "}
                    {Object.values(values.questionTypes).reduce(
                      (a, b) => (parseInt(a) || 0) + (parseInt(b) || 0),
                      0
                    )}{" "}
                    questions
                  </small>
                </div>
              </Card.Body>
            </Card>

            {/* Required Skills */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">🛠️ Required Skills</h5>
              </Card.Header>
              <Card.Body>
                <FieldArray name="requiredSkills">
                  {({ push, remove }) => (
                    <div>
                      {values.requiredSkills.map((skill, index) => (
                        <Row key={index} className="align-items-end mb-3">
                          <Col md={4}>
                            <Form.Group>
                              {index === 0 && (
                                <Form.Label>Skill Name *</Form.Label>
                              )}
                              <Form.Control
                                type="text"
                                name={`requiredSkills.${index}.skill`}
                                value={skill.skill}
                                onChange={handleChange}
                                placeholder="e.g., JavaScript, Project Management"
                                isInvalid={
                                  touched.requiredSkills?.[index]?.skill &&
                                  errors.requiredSkills?.[index]?.skill
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group>
                              {index === 0 && <Form.Label>Level</Form.Label>}
                              <Form.Select
                                name={`requiredSkills.${index}.level`}
                                value={skill.level}
                                onChange={handleChange}
                              >
                                {skillLevels.map((level) => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group>
                              {index === 0 && (
                                <Form.Label>Mandatory</Form.Label>
                              )}
                              <Form.Check
                                type="switch"
                                name={`requiredSkills.${index}.mandatory`}
                                checked={skill.mandatory}
                                onChange={handleChange}
                                label="Required"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2}>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={values.requiredSkills.length === 1}
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() =>
                          push({
                            skill: "",
                            level: "intermediate",
                            mandatory: true,
                          })
                        }
                      >
                        + Add Required Skill
                      </Button>
                    </div>
                  )}
                </FieldArray>
              </Card.Body>
            </Card>

            {/* AI Question Generation */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">🤖 AI Question Generation</h5>
              </Card.Header>
              <Card.Body>
                <Form.Check
                  type="switch"
                  checked={generateQuestions}
                  onChange={(e) => setGenerateQuestions(e.target.checked)}
                  label="Generate AI-powered questions based on job requirements"
                  className="mb-3"
                />

                {generateQuestions && (
                  <Alert variant="info">
                    <Alert.Heading>🧠 AI Question Generation</Alert.Heading>
                    <p>
                      Our AI will analyze your job requirements and
                      automatically generate relevant interview questions based
                      on:
                    </p>
                    <ul className="mb-0">
                      <li>Required skills and proficiency levels</li>
                      <li>Job description and responsibilities</li>
                      <li>Experience requirements</li>
                      <li>Difficulty level and question distribution</li>
                    </ul>
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {/* Form Actions */}
            <div className="d-flex justify-content-between">
              <Button
                variant="outline-secondary"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || loading}
                className="gradient-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Job...
                  </>
                ) : job ? (
                  "Update Job"
                ) : (
                  "Create AI Interview Job"
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
