import { Row, Col } from 'react-bootstrap'
import DashboardCard from '../dashboard/DashboardCard'
import { formatNumber } from '../../utils/formatters'

export default function JobStatistics({ statistics }) {
  return (
    <Row className="g-4 mb-4">
      <Col lg={3} md={6}>
        <DashboardCard
          title="Total AI Jobs"
          value={formatNumber(statistics.totalJobs || 0)}
          icon="bi-robot"
          color="primary"
        />
      </Col>
      <Col lg={3} md={6}>
        <DashboardCard
          title="Active Jobs"
          value={formatNumber(statistics.activeJobs || 0)}
          icon="bi-play-circle-fill"
          color="success"
        />
      </Col>
      <Col lg={3} md={6}>
        <DashboardCard
          title="Total Interviews"
          value={formatNumber(statistics.totalInterviews || 0)}
          icon="bi-camera-video-fill"
          color="info"
        />
      </Col>
      <Col lg={3} md={6}>
        <DashboardCard
          title="Average Score"
          value={statistics.avgScore ? `${statistics.avgScore.toFixed(1)}/10` : '0.0/10'}
          icon="bi-star-fill"
          color="warning"
        />
      </Col>
    </Row>
  )
}