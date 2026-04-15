import { Row, Col } from "react-bootstrap";
import DashboardCard from "../dashboard/DashboardCard";
import { formatNumber } from "../../utils/formatters";

export default function JobStatisticsDetail({ statistics }) {
  const passRate = statistics.passRate || 0;
  const avgScore = statistics.averageScore || 0;

  return (
    <Row className="mb-4">
      <Col lg={3} md={3} sm={6} className="mb-3">
        <DashboardCard
          title="Total Interviews"
          value={formatNumber(statistics.total || 0)}
          icon="bi-people"
          color="primary"
        />
      </Col>
      <Col lg={3} md={3} sm={6} className="mb-3">
        <DashboardCard
          title="Completed"
          value={formatNumber(statistics.completed || 0)}
          icon="bi-check-circle"
          color="success"
        />
      </Col>

      <Col lg={3} md={3} sm={6} className="mb-3">
        <DashboardCard
          title="Average Score"
          value={avgScore > 0 ? `${avgScore.toFixed(1)}/10` : "0.0/10"}
          icon="bi-star"
          color="info"
        />
      </Col>
      <Col lg={3} md={3} sm={6} className="mb-3">
        <DashboardCard
          title="Pass Rate"
          value={passRate > 0 ? `${passRate.toFixed(0)}%` : "0%"}
          icon="bi-trophy"
          color={
            passRate >= 70 ? "success" : passRate >= 50 ? "warning" : "danger"
          }
        />
      </Col>
    </Row>
  );
}
