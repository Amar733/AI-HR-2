import api from "./api";

// Job Management API
export const jobAPI = {
  // Get all jobs with pagination and filters
  getAll: (params = {}) => api.get("/jobs", { params }),

  // Get single job with statistics
  getById: (id) => api.get(`/jobs/${id}`),

  // Create new AI interview job
  create: (jobData) => api.post("/jobs", jobData),

  // Update job
  update: (id, jobData) => api.put(`/jobs/${id}`, jobData),

  // Delete job
  delete: (id) => api.delete(`/jobs/${id}`),

  // Generate AI questions for job
  generateQuestions: (id) => api.post(`/jobs/${id}/generate-questions`),

  // Invite candidates
  inviteCandidates: (id, candidates) =>
    api.post(`/jobs/${id}/invite`, { candidates }),

  // Bulk invite from CSV
  bulkInvite: (id, csvFile) => {
    const formData = new FormData();
    formData.append("csvFile", csvFile);
    return api.post(`/jobs/${id}/bulk-invite`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Get job statistics
  getStatistics: (id) => api.get(`/jobs/${id}/statistics`),

  // Export job results
  exportResults: (id) => api.get(`/jobs/${id}/export`),

  // Get job sessions (interviews)
  getSessions: (id, params = {}) => api.get(`/jobs/${id}/sessions`, { params }),

  // Get job sessions (interviews)
  getCandidates: (id, params = {}) =>
    api.get(`/jobs/${id}/candidates`, { params }),

  // ===== CUSTOM QUESTIONS API METHODS =====

  // Get all questions for a job (both custom and AI)
  getJobQuestions: (id) => api.get(`/jobs/${id}/questions`),

  // Add a new custom question to a job
  addCustomQuestion: (id, questionData) =>
    api.post(`/jobs/${id}/questions`, questionData),

  // Update an existing custom question
  updateCustomQuestion: (id, questionIndex, questionData) =>
    api.put(`/jobs/${id}/questions/${questionIndex}`, questionData),

  // Delete a custom question
  deleteCustomQuestion: (id, questionIndex) =>
    api.delete(`/jobs/${id}/questions/${questionIndex}`),

  // Delete a custom question
  deleteAIQuestion: (id, questionIndex) =>
    api.delete(`/jobs/${id}/ai-questions/${questionIndex}`),

  // Reorder custom questions
  reorderCustomQuestions: (id, questionIds) =>
    api.put(`/jobs/${id}/questions/reorder`, { questionIds }),

  // Get question statistics for a job
  getQuestionStats: (id) => api.get(`/jobs/${id}/questions/stats`),

  // Bulk operations on custom questions
  bulkQuestionOperations: (id, operations) =>
    api.post(`/jobs/${id}/questions/bulk`, { operations }),
};

// Interview Session API (Public endpoints for candidates)
export const interviewSessionAPI = {
  // Start interview session
  startInterview: (jobLink, candidateData) =>
    api.post(`/interview/${jobLink}/start`, candidateData),

  // Submit response with media files
  submitResponse: (sessionId, responseData, files = {}) => {
    const formData = new FormData();
    formData.append("questionId", responseData.questionId);
    formData.append("response", JSON.stringify(responseData.response));

    if (files.video) formData.append("video", files.video);
    if (files.audio) formData.append("audio", files.audio);

    return api.post(`/interview/session/${sessionId}/response`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Complete interview session
  completeInterview: (sessionId, candidateRating = {}) =>
    api.post(`/interview/session/${sessionId}/complete`, { candidateRating }),

  // Get session info
  getSession: (sessionId) => api.get(`/interview/session/${sessionId}`),
};

// Analysis API (Protected endpoints for employers)
export const analysisAPI = {
  // Get detailed session analysis
  getSessionAnalysis: (sessionId) =>
    api.get(`/jobs/sessions/${sessionId}/analysis`),

  // Get all sessions for a job
  getJobSessions: (jobId, params = {}) =>
    api.get(`/jobs/${jobId}/sessions`, { params }),
};

export default {
  jobAPI,
  interviewSessionAPI,
  analysisAPI,
};
