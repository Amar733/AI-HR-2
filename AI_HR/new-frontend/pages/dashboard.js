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
            "#89f5e7", // Easy
            "#0c9488", // Medium
            "#515f74", // Hard
            "#000000", // Expert
          ],
          hoverBackgroundColor: [
            "#aefaf1",
            "#0ea396",
            "#64748b",
            "#1a1a1a",
          ],
          borderWidth: 0,
          spacing: 2,
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
          backgroundColor: "#0c9488",
          borderRadius: 8,
          maxBarThickness: 50,
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div className="text-nowrap">
            <h2 className="mb-1 d-flex align-items-center fw-bold">
              <i className="bi bi-grid-fill me-2 text-primary"></i>
              Dashboard Overview
            </h2>
            <p className="text-muted mb-0 small">
              Welcome back, <span className="text-dark fw-bold">{user?.name}</span>.
            </p>
          </div>
          <div className="d-flex gap-2 w-100 w-md-auto justify-content-between justify-content-md-end align-items-center">
            <Dropdown className="flex-grow-1 flex-md-grow-0">
              <Dropdown.Toggle 
                variant="outline-secondary" 
                className="w-100 fw-semibold d-flex align-items-center justify-content-center"
                style={{ borderRadius: '10px', height: '44px', padding: '0 20px', fontSize: '14px' }}
              >
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
            <Link href="/jobs" className="flex-grow-1 flex-md-grow-0">
              <Button 
                variant="dark" 
                className="w-100 d-flex align-items-center justify-content-center shadow-sm fw-bold border-0" 
                style={{ borderRadius: '10px', height: '44px', padding: '0 24px', fontSize: '14px' }}
              >
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
                      <h6 className="mb-0 d-flex align-items-center">
                        <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
                        Interview Completion Trend
                      </h6>
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
                            backgroundColor: "#000000",
                            borderColor: "#000000",
                            borderWidth: 0,
                            borderRadius: 6,
                            barThickness: "flex",
                            maxBarThickness: 40,
                            hoverBackgroundColor: "#333333",
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
                      <h6 className="mb-0 d-flex align-items-center fw-bold">
                        <i className="bi bi-pie-chart me-2 text-primary"></i>
                        Job Difficulty
                      </h6>
                      <Badge className="bg-light text-muted border fw-normal" style={{ fontSize: '10px' }}>DISTRIBUTION</Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="position-relative" style={{ height: "250px" }}>
                      <Doughnut
                        data={analytics.difficultyDistribution}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '75%',
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: { 
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 12, weight: '600', family: 'Inter' },
                                color: '#64748b'
                              },
                            },
                            tooltip: {
                              backgroundColor: '#000000',
                              padding: 12,
                              titleFont: { size: 13, weight: 'bold' },
                              bodyFont: { size: 12 },
                              cornerRadius: 8,
                              displayColors: false,
                            },
                            datalabels: {
                              display: false // Hide datalabels for cleaner doughnut
                            }
                          },
                        }}
                      />
                      <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ marginTop: '-20px' }}>
                        <div className="fw-bold h4 mb-0" style={{ color: '#0f172a' }}>{dashboardData.stats.totalJobs || 0}</div>
                        <div className="text-muted fw-bold" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>TOTAL JOBS</div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Department Performance */}
              <Col lg={12} className="mb-4">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h6 className="mb-0 d-flex align-items-center">
                      <i className="bi bi-building me-2 text-primary"></i>
                      Department Interview Volume
                    </h6>
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
                            datalabels: { display: false },
                            tooltip: {
                              backgroundColor: '#000000',
                              padding: 12,
                              cornerRadius: 8,
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              border: { display: false },
                              grid: { 
                                color: "#f1f3f4",
                                drawTicks: false 
                              },
                              ticks: {
                                color: '#94a3b8',
                                font: { size: 11 }
                              }
                            },
                            x: {
                              grid: { display: false },
                              ticks: {
                                color: '#64748b',
                                font: { size: 12, weight: '600' }
                              }
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
                  <h6 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-robot me-2 text-primary"></i>
                    Recent AI Jobs
                  </h6>
                  <Link href="/jobs">
                    <Button variant="link" size="sm" className="view-all-link">
                      View All <i className="bi bi-chevron-right ms-1"></i>
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
                <h6 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-list-check me-2 text-primary"></i>
                  Recent Activity
                </h6>
              </Card.Header>
              <Card.Body
                className="p-0"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                {activities.length > 0 ? (
                  <div className="activity-feed-container px-3 pt-3">
                    {activities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={`activity-item-new ${index === activities.length - 1 ? 'last' : ''}`}
                      >
                        <div className="activity-line"></div>
                        <div className="activity-dot shadow-sm" style={{ backgroundColor: `var(--bs-${activity.color})` }}>
                          <i className={`${activity.icon} text-white`}></i>
                        </div>
                        <div className="activity-content-new pb-4 ps-4">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="activity-title-new mb-0">{activity.title}</h6>
                            <span className="activity-time-new">{formatDateTime(activity.time)}</span>
                          </div>
                          <p className="activity-desc-new mb-2 text-muted">{activity.description}</p>
                          <div className="d-flex align-items-center gap-2">
                            {activity.metadata?.score && (
                              <Badge className="bg-light text-dark border fw-bold px-2 py-1">
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
                                className="px-2 py-1 text-capitalize"
                              >
                                {activity.metadata.recommendation.replace('_', ' ')}
                              </Badge>
                            )}
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
                  <h6 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-camera-video-fill me-2 text-primary"></i>
                    Recent Sessions
                  </h6>
                  <Link href="/interviews">
                    <Button variant="link" size="sm" className="view-all-link">
                      View All <i className="bi bi-chevron-right ms-1"></i>
                    </Button>
                  </Link>
                </div>
              </Card.Header>
              <Card.Body
                className="p-0"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                {recentSessions.length > 0 ? (
                  <div className="sessions-list">
                    {recentSessions.map((session) => (
                      <div
                        key={session._id}
                        className="session-row p-3 border-bottom d-flex align-items-center hover-bg"
                      >
                        <div className="session-avatar me-3 shadow-sm">
                          {session.candidateInfo?.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="session-name mb-0">{session.candidateInfo?.name || "Anonymous"}</h6>
                          <div className="session-job-info d-flex align-items-center gap-2">
                             <span className="text-muted small">{session.jobTitle}</span>
                             <span className="dot-separator"></span>
                             <span className="text-muted small">{formatDate(session.completedAt || session.createdAt)}</span>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-2">
                           <div className="d-flex align-items-center gap-2">
                              <Badge
                                bg={
                                  session.status === "completed"
                                    ? "success"
                                    : session.status === "in_progress"
                                    ? "primary"
                                    : "secondary"
                                }
                                className="session-status-badge"
                              >
                                {session.status?.replace("_", " ")}
                              </Badge>
                              {session.totalDuration && (
                                <Badge bg="light" text="dark" className="border fw-normal">
                                  <i className="bi bi-clock me-1"></i>
                                  {Math.round(session.totalDuration / 60)}m
                                </Badge>
                              )}
                           </div>
                           {session.analysis?.overallScore && (
                              <div className="score-pill">
                                <span className="score-label">Score</span>
                                <span className="score-value">{session.analysis.overallScore.toFixed(1)}</span>
                              </div>
                           )}
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
          background: linear-gradient(135deg, #000000, #333333);
        }
        .stat-card-success .stat-card-bg {
          background: linear-gradient(135deg, #0c9488, #1fa2a6);
        }
        .stat-card-warning .stat-card-bg {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .stat-card-info .stat-card-bg {
          background: linear-gradient(135deg, #515f74, #334155);
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

        .gradient-btn {
          background: #000000;
          color: #ffffff;
          border: none;
          font-weight: 600;
          letter-spacing: 0.02em;
          border-radius: 8px;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .gradient-btn:hover {
          background: #1a1a1a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          color: #ffffff;
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

        .activity-feed-container {
          position: relative;
        }

        .activity-item-new {
          position: relative;
          padding-left: 20px;
        }

        .activity-line {
          position: absolute;
          left: 17px;
          top: 36px;
          bottom: 0;
          width: 2px;
          background-color: #e2e8f0;
          z-index: 1;
        }

        .activity-item-new.last .activity-line {
          display: none;
        }

        .activity-dot {
          position: absolute;
          left: 0;
          top: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .activity-dot i {
          font-size: 14px;
        }

        .activity-title-new {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
        }

        .activity-time-new {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .activity-desc-new {
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .session-row {
          transition: background-color 0.2s ease;
        }

        .session-row:hover {
          background-color: #f8fafc;
        }

        .session-avatar {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #f1f5f9;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
        }

        .session-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .dot-separator {
          width: 4px;
          height: 4px;
          background-color: #cbd5e1;
          border-radius: 50%;
        }

        .session-status-badge {
          text-transform: capitalize;
          padding: 5px 10px;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.02em;
        }

        .score-pill {
          display: flex;
          align-items: center;
          background: #000000;
          border-radius: 20px;
          padding: 2px 2px 2px 10px;
          color: white;
        }

        .score-label {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-right: 8px;
          opacity: 0.8;
        }

        .score-value {
          background: #ffffff;
          color: #000000;
          width: 32px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          font-weight: 800;
          font-size: 12px;
        }

        .view-all-link {
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }

        .view-all-link:hover {
          color: #000000;
          background-color: #f1f5f9;
          text-decoration: none;
        }

        .view-all-link i {
          transition: transform 0.2s ease;
        }

        .view-all-link:hover i {
          transform: translateX(3px);
        }

        .text-primary {
          color: #000000 !important;
        }
        .text-success {
          color: #0c9488 !important;
        }
        .text-warning {
          color: #f59e0b !important;
        }
        .text-info {
          color: #515f74 !important;
        }
      `}</style>
    </Layout>
  );
}

export default withAuth(Dashboard);
