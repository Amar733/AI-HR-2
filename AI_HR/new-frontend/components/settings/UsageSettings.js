import { Card, ProgressBar, Badge, Row, Col } from 'react-bootstrap'
import { formatNumber } from '../../utils/formatters'

export default function UsageSettings({ settings }) {
  const subscription = settings?.subscription || {}
  const usage = settings?.usage || {}

  const getLimits = (plan) => {
    const limits = {
      starter: { interviews: 50, storage: 1000, apiCalls: 1000 },
      professional: { interviews: 200, storage: 5000, apiCalls: 5000 },
      enterprise: { interviews: -1, storage: -1, apiCalls: -1 }
    }
    return limits[plan] || limits.starter
  }

  const limits = getLimits(subscription.plan)

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  const getVariant = (percentage) => {
    if (percentage >= 90) return 'danger'
    if (percentage >= 75) return 'warning'
    return 'primary'
  }

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Current Plan</h5>
            <Badge bg="primary" className="text-uppercase">
              {subscription.plan || 'Starter'}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="text-center">
              <div className="plan-feature">
                <i className="bi bi-calendar-check display-6 text-primary mb-2"></i>
                <h6>Interviews</h6>
                <div className="feature-limit">
                  {limits.interviews === -1 ? 'Unlimited' : `${limits.interviews}/month`}
                </div>
              </div>
            </Col>
            <Col md={4} className="text-center">
              <div className="plan-feature">
                <i className="bi bi-hdd display-6 text-success mb-2"></i>
                <h6>Storage</h6>
                <div className="feature-limit">
                  {limits.storage === -1 ? 'Unlimited' : `${limits.storage} MB`}
                </div>
              </div>
            </Col>
            <Col md={4} className="text-center">
              <div className="plan-feature">
                <i className="bi bi-graph-up display-6 text-info mb-2"></i>
                <h6>API Calls</h6>
                <div className="feature-limit">
                  {limits.apiCalls === -1 ? 'Unlimited' : `${limits.apiCalls}/month`}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Usage This Month</h5>
        </Card.Header>
        <Card.Body>
          <div className="usage-item mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">Interviews</span>
              <span>
                {formatNumber(usage.interviewsThisMonth || 0)} 
                {limits.interviews !== -1 && ` / ${formatNumber(limits.interviews)}`}
              </span>
            </div>
            {limits.interviews !== -1 && (
              <ProgressBar 
                now={getUsagePercentage(usage.interviewsThisMonth || 0, limits.interviews)}
                variant={getVariant(getUsagePercentage(usage.interviewsThisMonth || 0, limits.interviews))}
              />
            )}
          </div>

          <div className="usage-item mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">Storage Used</span>
              <span>
                {formatNumber(usage.storageUsed || 0)} MB
                {limits.storage !== -1 && ` / ${formatNumber(limits.storage)} MB`}
              </span>
            </div>
            {limits.storage !== -1 && (
              <ProgressBar 
                now={getUsagePercentage(usage.storageUsed || 0, limits.storage)}
                variant={getVariant(getUsagePercentage(usage.storageUsed || 0, limits.storage))}
              />
            )}
          </div>

          <div className="usage-item">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">API Calls</span>
              <span>
                {formatNumber(usage.apiCallsThisMonth || 0)}
                {limits.apiCalls !== -1 && ` / ${formatNumber(limits.apiCalls)}`}
              </span>
            </div>
            {limits.apiCalls !== -1 && (
              <ProgressBar 
                now={getUsagePercentage(usage.apiCallsThisMonth || 0, limits.apiCalls)}
                variant={getVariant(getUsagePercentage(usage.apiCallsThisMonth || 0, limits.apiCalls))}
              />
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}