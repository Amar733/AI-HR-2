# AI Interview - API Documentation

## Overview

AI Interview is a comprehensive SaaS platform for AI-powered interviews. This API provides endpoints for job creation, interview management, AI analysis, and more.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Job Management

### Create Job

**POST** `/jobs`

Create a new AI-powered interview job.

**Request Body:**

```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced software engineer...",
  "department": "Engineering",
  "position": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "salary": {
    "min": 120000,
    "max": 160000,
    "currency": "USD",
    "period": "yearly"
  },
  "interviewLanguage": "english",
  "requiredSkills": [
    {
      "skill": "JavaScript",
      "level": "advanced",
      "mandatory": true
    }
  ],
  "interviewMode": "real",
  "difficulty": "hard",
  "duration": 90,
  "totalQuestions": 15,
  "questionTypes": {
    "technical": 8,
    "behavioral": 4,
    "situational": 3
  },
  "customQuestions": [
    {
      "question": "Explain async/await in JavaScript",
      "type": "technical",
      "timeLimit": 180
    }
  ],
  "generateQuestions": true
}
```

### Get Jobs

**GET** `/jobs`

Retrieve user's jobs with pagination and filtering.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in title, position, department
- `status` (string): Filter by active/inactive status

### Get Single Job

**GET** `/jobs/:id`

Get detailed job information including statistics.

### Generate AI Questions

**POST** `/jobs/:id/generate-questions`

Generate AI-powered interview questions for a job.

### Invite Candidates

**POST** `/jobs/:id/invite`

Send interview invitations to candidates.

**Request Body:**

```json
{
  "candidates": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### Bulk Invite from CSV

**POST** `/jobs/:id/bulk-invite`

Upload CSV file to invite multiple candidates.

**Form Data:**

- `csvFile`: CSV file with columns: name, email, phone (optional)

## Interview Sessions (Public Endpoints)

### Start Interview

**POST** `/interview/:jobLink/start`

Start an interview session (public endpoint).

**Request Body:**

```json
{
  "candidateInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "consentRecording": true,
    "consentDataProcessing": true,
    "consentAIAnalysis": true
  },
  "accessCode": "ABC123"
}
```

### Submit Response

**POST** `/interview/session/:sessionId/response`

Submit answer to an interview question.

**Request Body:**

```json
{
  "questionId": "q1",
  "response": {
    "question": "Tell me about yourself",
    "questionType": "behavioral",
    "textResponse": "I am a software engineer...",
    "timeSpent": 120,
    "startTime": "2025-09-02T10:00:00Z",
    "endTime": "2025-09-02T10:02:00Z"
  }
}
```

**Form Data (for media):**

- `video`: Video file (optional)
- `audio`: Audio file (optional)

### Complete Interview

**POST** `/interview/session/:sessionId/complete`

Complete an interview session and trigger AI analysis.

**Request Body:**

```json
{
  "candidateRating": {
    "experienceRating": 4,
    "difficultyRating": 3,
    "fairnessRating": 5,
    "feedback": "Great interview experience"
  }
}
```

### Get Interview Session

**GET** `/interview/session/:sessionId`

Get interview session details (public endpoint).

## Interview Session Management (Protected)

### Get Job Sessions

**GET** `/jobs/:id/sessions`

Get all interview sessions for a job.

**Query Parameters:**

- `page`, `limit`: Pagination
- `status`: Filter by session status
- `search`: Search candidates by name/email

### Get Session Analysis

**GET** `/sessions/:sessionId/analysis`

Get detailed AI analysis for an interview session.

**Response:**

```json
{
  "success": true,
  "analysis": {
    "candidate": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "session": {
      "duration": "45:30",
      "completedAt": "2025-09-02T11:00:00Z",
      "status": "completed"
    },
    "scores": {
      "overallScore": 8.5,
      "technicalScore": 9.0,
      "communicationScore": 8.0,
      "behavioralScore": 8.5,
      "recommendation": {
        "decision": "hire",
        "confidence": 85,
        "reasoning": "Strong technical skills..."
      }
    }
  }
}
```

## Statistics and Analytics

### Get Job Statistics

**GET** `/jobs/:id/statistics`

Get comprehensive statistics for a job.

### Export Job Results

**GET** `/jobs/:id/export`

Export interview results as CSV.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Interview endpoints: 10 requests per 15 minutes per IP
- File uploads: 5 requests per minute per IP

## File Upload Limits

- Video files: 100MB max
- Audio files: 50MB max
- CSV files: 10MB max
- Resume/documents: 10MB max

## Webhook Events (Future)

The API will support webhooks for:

- Interview completed
- Analysis completed
- Candidate invitation sent
- Session expired

## SDK and Libraries

Official SDKs available for:

- JavaScript/Node.js
- Python
- PHP
- Java (coming soon)

## Support

For API support, contact: api-support@interviewpro.com
Documentation: https://docs.interviewpro.com
