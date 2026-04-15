import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ProgressBar,
  Dropdown,
} from "react-bootstrap";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/layout/Layout";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Toast from "../components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import { jobAPI, analysisAPI } from "../services/aiInterviewAPI";
import { formatNumber, formatDate, formatDateTime } from "../utils/formatters";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import withAuth from "../hoc/withAuth";
import { APP_NAME } from "../utils/constants";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  ChartDataLabels
);

function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentJobs: [],
    recentSessions: [],
    analytics: {},
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // days
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch jobs data
      const jobsResponse = await jobAPI.getAll({ limit: 10, page: 1 });
      const jobs = jobsResponse.jobs || [];

      // Calculate comprehensive statistics
      const stats = {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((job) => job.isActive).length,
        totalInterviews: jobs.reduce(
          (sum, job) => sum + (job.totalInterviews || 0),
          0
        ),
        completedInterviews: jobs.reduce(
          (sum, job) => sum + (job.completedInterviews || 0),
          0
        ),
        avgAIScore:
          jobs.reduce((sum, job) => sum + (job.averageScore || 0), 0) /
          (jobs.length || 1),
        totalCandidates: jobs.reduce(
          (sum, job) => sum + (job.invitations?.length || 0),
          0
        ),
        passRate: calculateOverallPassRate(jobs),
        topPerformingJob: findTopPerformingJob(jobs),
      };

      // Get recent sessions from multiple jobs
      let allSessions = [];
      for (const job of jobs.slice(0, 5)) {
        try {
          const sessionsResponse = await jobAPI.getSessions(job._id, {
            limit: 3,
          });
          const sessions = sessionsResponse.sessions.map((s) => ({
            ...s,
            jobTitle: job.title,
          }));
          allSessions = [...allSessions, ...sessions];
        } catch (error) {
          console.error(`Failed to fetch sessions for job ${job._id}:`, error);
        }
      }

      // Sort sessions by creation date
      allSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Generate analytics data
      const analytics = generateAnalyticsData(jobs, allSessions);

      // Generate activity feed
      const activities = generateActivityFeed(jobs, allSessions);

      setDashboardData({
        stats,
        recentJobs: jobs.slice(0, 5),
        recentSessions: allSessions.slice(0, 8),
        analytics,
        activities: activities.slice(0, 10),
      });
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallPassRate = (jobs) => {
    const totalCompleted = jobs.reduce(
      (sum, job) => sum + (job.completedInterviews || 0),
      0
    );
    const totalPassed = jobs.reduce((sum, job) => {
      const jobPassed = Math.round(
        ((job.passRate || 0) * (job.completedInterviews || 0)) / 100
      );
      return sum + jobPassed;
    }, 0);
    return totalCompleted > 0 ? (totalPassed / totalCompleted) * 100 : 0;
  };

  const findTopPerformingJob = (jobs) => {
    return jobs.reduce((best, job) => {
      if (!best || (job.averageScore || 0) > (best.averageScore || 0)) {
        return job;
      }
      return best;
    }, null);
  };

  const generateAnalyticsData = (jobs, sessions) => {
    // Interview completion trend (last 30 days)
    const completionTrend = {
      labels: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString("en-US", { weekday: "short" });
      }),
      datasets: [
        {
          label: "Interviews Completed",
          data: [12, 19, 8, 15, 22, 18, 25],
          backgroundColor: "#1a3a52",
          borderColor: "#0f2438",
          borderWidth: 2,
          borderRadius: 4,
          barThickness: "flex",
          maxBarThickness: 50,
        },
      ],
    };

    // Job difficulty distribution
    const difficultyDistribution = {
      labels: ["Easy", "Medium", "Hard", "Expert"],
      datasets: [
        {
          data: [
            jobs.filter((job) => job.difficulty === "easy").length,
            jobs.filter((job) => job.difficulty === "medium").length,
            jobs.filter((job) => job.difficulty === "hard").length,
            jobs.filter((job) => job.difficulty === "expert").length,
          ],
          backgroundColor: [
            "rgba(31, 162, 166, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
        },
      ],
    };

    // Top departments by interview volume
    const departmentStats = jobs.reduce((acc, job) => {
      acc[job.department] =
        (acc[job.department] || 0) + (job.totalInterviews || 0);
      return acc;
    }, {});

    const departmentData = {
      labels: Object.keys(departmentStats).slice(0, 5),
      datasets: [
        {
          label: "Total Interviews",
          data: Object.values(departmentStats).slice(0, 5),
          backgroundColor: "rgba(31, 162, 166, 0.6)",
          borderColor: "rgba(31, 162, 166, 1)",
          borderWidth: 1,
        },
      ],
    };

    return { completionTrend, difficultyDistribution, departmentData };
  };

  const generateActivityFeed = (jobs, sessions) => {
    const activities = [];

    // Recent job activities
    jobs.forEach((job) => {
      activities.push({
        id: `job-${job._id}`,
        type: "job_created",
        title: "AI Job Created",
        description: `${job.title} with ${job.totalQuestions} AI questions`,
        time: job.createdAt,
        icon: "bi-robot",
        color: "primary",
        metadata: { jobId: job._id, department: job.department },
      });
    });

    // Recent interview activities
    sessions.forEach((session) => {
      if (session.status === "completed") {
        activities.push({
          id: `session-${session._id}`,
          type: "interview_completed",
          title: "Interview Completed",
          description: `${session.candidateInfo?.name} completed ${session.jobTitle}`,
          time: session.completedAt || session.createdAt,
          icon: "bi-camera-video",
          color:
            session.analysis?.recommendation?.decision === "hire"
              ? "success"
              : "secondary",
          metadata: {
            score: session.analysis?.overallScore,
            recommendation: session.analysis?.recommendation?.decision,
          },
        });
      } else if (session.status === "in_progress") {
        activities.push({
          id: `session-progress-${session._id}`,
          type: "interview_started",
          title: "Interview Started",
          description: `${session.candidateInfo?.name} started ${session.jobTitle}`,
          time: session.startedAt || session.createdAt,
          icon: "bi-play-circle",
          color: "info",
        });
      }
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading your AI interview dashboard..." />
      </Layout>
    );
  }

  const { stats, recentJobs, recentSessions, analytics, activities } =
    dashboardData;

  return (
    <Layout>
      <Head>
        <title>{`AI Interview Dashboard - ${APP_NAME}`}</title>
      </Head>

      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">🤖 AI Interview Dashboard</h2>
            <p className="text-muted mb-0">
              Welcome back, <strong>{user?.name}</strong>! Here's your interview
              analytics
            </p>
          </div>
          <div className="d-flex gap-2">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                Last {timeRange} days
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setTimeRange("7")}>
                  Last 7 days
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setTimeRange("30")}>
                  Last 30 days
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setTimeRange("90")}>
                  Last 90 days
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Link href="/jobs">
              <Button variant="primary" className="gradient-btn">
                <i className="bi bi-plus-lg me-2"></i>
                New AI Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <Row className="mb-4 g-3">
          <Col xl={3} md={6}>
            <Card className="stat-card stat-card-primary border-0 h-100 overflow-hidden position-relative">
              <div className="stat-card-bg"></div>
              <Card.Body className="position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="stat-icon-modern bg-primary">
                    <i className="bi bi-robot"></i>
                  </div>
                  <Badge bg="primary" className="stat-badge">Jobs</Badge>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value-modern mb-1">{stats.totalJobs}</h2>
                  <p className="stat-label-modern mb-2">AI Interview Jobs</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="stat-trend-modern">
                      <i className="bi bi-arrow-up-short"></i>
                      <span>{stats.activeJobs} active</span>
                    </div>
                    <div className="stat-percentage">+12%</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} md={6}>
            <Card className="stat-card stat-card-success border-0 h-100 overflow-hidden position-relative">
              <div className="stat-card-bg"></div>
              <Card.Body className="position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="stat-icon-modern bg-success">
                    <i className="bi bi-camera-video"></i>
                  </div>
                  <Badge bg="success" className="stat-badge">Interviews</Badge>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value-modern mb-1">{stats.totalInterviews}</h2>
                  <p className="stat-label-modern mb-2">Total Interviews</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="stat-trend-modern">
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{stats.completedInterviews} done</span>
                    </div>
                    <div className="stat-percentage">+{Math.round((stats.completedInterviews / stats.totalInterviews) * 100) || 0}%</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} md={6}>
            <Card className="stat-card stat-card-warning border-0 h-100 overflow-hidden position-relative">
              <div className="stat-card-bg"></div>
              <Card.Body className="position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="stat-icon-modern bg-warning">
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <Badge bg="warning" className="stat-badge">Score</Badge>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value-modern mb-1">{stats.avgAIScore.toFixed(1)}<span className="stat-unit">/10</span></h2>
                  <p className="stat-label-modern mb-2">Average AI Score</p>
                  <div className="stat-progress-modern">
                    <div className="progress-track">
                      <div 
                        className="progress-fill bg-warning" 
                        style={{ width: `${stats.avgAIScore * 10}%` }}
                      ></div>
                    </div>
                    <span className="progress-label">{(stats.avgAIScore * 10).toFixed(0)}%</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} md={6}>
            <Card className="stat-card stat-card-info border-0 h-100 overflow-hidden position-relative">
              <div className="stat-card-bg"></div>
              <Card.Body className="position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="stat-icon-modern bg-info">
                    <i className="bi bi-trophy-fill"></i>
                  </div>
                  <Badge bg="info" className="stat-badge">Success</Badge>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value-modern mb-1">{stats.passRate.toFixed(0)}<span className="stat-unit">%</span></h2>
                  <p className="stat-label-modern mb-2">Success Rate</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className={`stat-trend-modern ${stats.passRate >= 70 ? 'trend-up' : 'trend-neutral'}`}>
                      <i className={`bi ${stats.passRate >= 70 ? 'bi-arrow-up-short' : 'bi-dash'}`}></i>
                      <span>{stats.totalCandidates} candidates</span>
                    </div>
                    <div className="stat-percentage">{stats.passRate >= 70 ? 'High' : 'Med'}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Row */}
        <Row>
          {/* Analytics Charts */}
          <Col xl={8} className="mb-4">
            <Row>
              {/* Interview Completion Trend */}
              <Col lg={8} className="mb-4">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">📈 Interview Completion Trend</h6>
                      <Badge bg="success-subtle" text="success">
                        Last 7 days
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: "250px" }}>
                      <Bar
                        data={{
                          ...analytics.completionTrend,
                          datasets: analytics.completionTrend.datasets.map(dataset => ({
                            ...dataset,
                            backgroundColor: "#1a3a52",
                            borderColor: "#0f2438",
                            borderWidth: 2,
                            borderRadius: 4,
                            barThickness: "flex",
                            maxBarThickness: 50,
                            hoverBackgroundColor: "#2d5a7b",
                            hoverBorderColor: "#1a3a52",
                            hoverBorderWidth: 3,
                          }))
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            datalabels: {
                              color: '#ffffff',
                              font: { size: 14, weight: 'bold' },
                              anchor: 'end',
                              align: 'start',
                              formatter: (value) => value > 0 ? value : ''
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: { color: "#f1f3f4" },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Job Difficulty Distribution */}
              <Col lg={4} className="mb-4">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">🎯 Job Difficulty</h6>
                      <Badge bg="primary-subtle" text="primary">Distribution</Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: "250px" }}>
                      <Doughnut
                        data={analytics.difficultyDistribution}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '65%',
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: { 
                                fontSize: 12,
                                padding: 15,
                                usePointStyle: true,
                                font: { size: 11, weight: '500' }
                              },
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              padding: 12,
                              titleFont: { size: 13, weight: 'bold' },
                              bodyFont: { size: 12 },
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || '';
                                  const value = context.parsed || 0;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${label}: ${value} (${percentage}%)`;
                                }
                              }
                            },
                            datalabels: {
                              color: '#fff',
                              font: { size: 14, weight: 'bold' },
                              formatter: (value, context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return percentage > 5 ? `${percentage}%` : '';
                              }
                            }
                          },
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Department Performance */}
              <Col lg={12} className="mb-4">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h6 className="mb-0">🏢 Department Interview Volume</h6>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: "200px" }}>
                      <Bar
                        data={analytics.departmentData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: { color: "#f1f3f4" },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Sidebar */}
          <Col xl={4}>
            {/* Quick Actions */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                {stats.topPerformingJob && (
                  <div className=" p-3 bg-success-subtle rounded">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-trophy text-success me-2"></i>
                      <div>
                        <div className="fw-semibold small">
                          Top Performing Job
                        </div>
                        <div className="small text-muted">
                          {stats.topPerformingJob.title}
                        </div>
                        <Badge bg="success">
                          {stats.topPerformingJob.averageScore.toFixed(1)}/10
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Recent AI Jobs */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🤖 Recent AI Jobs</h6>
                  <Link href="/jobs">
                    <Button variant="link" size="sm" className="p-0">
                      View All
                    </Button>
                  </Link>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {recentJobs.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {recentJobs.map((job) => (
                      <div
                        key={job._id}
                        className="list-group-item border-0 py-3"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{job.title}</h6>
                            <p className="mb-1 text-muted small">
                              {job.department}
                            </p>
                            <div className="d-flex gap-2">
                              <Badge
                                bg={
                                  job.difficulty === "expert"
                                    ? "danger"
                                    : "secondary"
                                }
                                size="sm"
                              >
                                {job.difficulty}
                              </Badge>
                              <Badge
                                bg="primary-subtle"
                                text="primary"
                                size="sm"
                              >
                                {job.totalQuestions} questions
                              </Badge>
                            </div>
                          </div>
                          <div className="text-end">
                            {job.averageScore > 0 && (
                              <div className="badge bg-success mb-1">
                                {job.averageScore.toFixed(1)}/10
                              </div>
                            )}
                            <div className="small text-muted">
                              {formatDate(job.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-robot display-6 text-muted mb-2"></i>
                    <p className="text-muted small">No AI jobs created yet</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity & Interviews */}
        <Row>
          {/* Recent Activity Feed */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0">
                <h6 className="mb-0">📋 Recent Activity</h6>
              </Card.Header>
              <Card.Body
                className="p-0"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                {activities.length > 0 ? (
                  <div className="activity-feed">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="activity-item p-3 border-bottom"
                      >
                        <div className="d-flex align-items-start">
                          <div
                            className={`activity-icon bg-${activity.color}-subtle text-${activity.color} rounded-circle p-2 me-3`}
                          >
                            <i className={`${activity.icon} small`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold small">
                              {activity.title}
                            </div>
                            <p className="mb-1 text-muted small">
                              {activity.description}
                            </p>
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">
                                {formatDateTime(activity.time)}
                              </small>
                              {activity.metadata?.score && (
                                <Badge bg="success" size="sm">
                                  Score: {activity.metadata.score.toFixed(1)}/10
                                </Badge>
                              )}
                              {activity.metadata?.recommendation && (
                                <Badge
                                  bg={
                                    activity.metadata.recommendation === "hire"
                                      ? "success"
                                      : "secondary"
                                  }
                                  size="sm"
                                >
                                  {activity.metadata.recommendation}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-activity display-6 text-muted mb-2"></i>
                    <p className="text-muted small">No recent activity</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Interview Sessions */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🎥 Recent Interview Sessions</h6>
                  <Link href="/interviews">
                    <Button variant="link" size="sm" className="p-0">
                      View All
                    </Button>
                  </Link>
                </div>
              </Card.Header>
              <Card.Body
                className="p-0"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                {recentSessions.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {recentSessions.map((session) => (
                      <div
                        key={session._id}
                        className="list-group-item border-0 py-3"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {session.candidateInfo?.name || "Anonymous"}
                            </h6>
                            <p className="mb-1 text-muted small">
                              {session.jobTitle}
                            </p>
                            <div className="d-flex gap-2 align-items-center">
                              <Badge
                                bg={
                                  session.status === "completed"
                                    ? "success"
                                    : session.status === "in_progress"
                                    ? "primary"
                                    : session.status === "started"
                                    ? "info"
                                    : "secondary"
                                }
                                size="sm"
                              >
                                {session.status?.replace("_", " ")}
                              </Badge>
                              {session.totalDuration && (
                                <small className="text-muted">
                                  {Math.round(session.totalDuration / 60)} min
                                </small>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            {session.analysis?.overallScore && (
                              <div className="badge bg-warning mb-1">
                                {session.analysis.overallScore.toFixed(1)}/10
                              </div>
                            )}
                            <div className="small text-muted">
                              {formatDate(
                                session.completedAt || session.createdAt
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-camera-video display-6 text-muted mb-2"></i>
                    <p className="text-muted small">
                      No interview sessions yet
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Toast Notification */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </Container>

      <style jsx>{`
        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }

        .stat-card-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          opacity: 0.1;
          transform: translate(30%, -30%);
          transition: all 0.3s ease;
        }

        .stat-card-primary .stat-card-bg {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }
        .stat-card-success .stat-card-bg {
          background: linear-gradient(135deg, #1fa2a6, #0d7377);
        }
        .stat-card-warning .stat-card-bg {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .stat-card-info .stat-card-bg {
          background: linear-gradient(135deg, #38bdf8, #0284c7);
        }

        .stat-card:hover .stat-card-bg {
          transform: translate(20%, -20%) scale(1.2);
          opacity: 0.15;
        }

        .stat-icon-modern {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon-modern {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .stat-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value-modern {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1;
          color: #1e293b;
          margin: 0;
        }

        .stat-unit {
          font-size: 1.2rem;
          font-weight: 600;
          color: #64748b;
          margin-left: 2px;
        }

        .stat-label-modern {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          margin: 0;
        }

        .stat-trend-modern {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.813rem;
          font-weight: 600;
          color: #10b981;
        }

        .stat-trend-modern.trend-neutral {
          color: #f59e0b;
        }

        .stat-trend-modern i {
          font-size: 1.2rem;
        }

        .stat-percentage {
          font-size: 0.75rem;
          font-weight: 700;
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .stat-progress-modern {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .progress-track {
          flex: 1;
          height: 6px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          min-width: 35px;
          text-align: right;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-weight: 700;
          background: linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-btn {
          background: linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%);
          border: none;
          font-weight: 500;
        }

        .gradient-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(31, 162, 166, 0.3);
        }

        .activity-item:hover {
          background-color: #f8f9fa;
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .list-group-item:hover {
          background-color: #f8f9fa;
        }

        .bg-primary-subtle {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .bg-success-subtle {
          background-color: rgba(31, 162, 166, 0.1) !important;
        }
        .bg-warning-subtle {
          background-color: rgba(245, 158, 11, 0.1) !important;
        }
        .bg-info-subtle {
          background-color: rgba(56, 189, 248, 0.1) !important;
        }

        .text-primary {
          color: #3b82f6 !important;
        }
        .text-success {
          color: #1fa2a6 !important;
        }
        .text-warning {
          color: #f59e0b !important;
        }
        .text-info {
          color: #38bdf8 !important;
        }
      `}</style>
    </Layout>
  );
}

export default withAuth(Dashboard);
