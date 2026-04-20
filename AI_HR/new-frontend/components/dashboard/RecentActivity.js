import { Card, Badge } from 'react-bootstrap'
import { formatDateTime } from '../../utils/formatters'

export default function RecentActivity({ activities = [], maxItems = 10 }) {
  const displayActivities = activities.slice(0, maxItems)

  const getActivityIcon = (type) => {
    switch (type) {
      case 'job_created': return 'bi-robot'
      case 'interview_completed': return 'bi-camera-video'
      case 'interview_started': return 'bi-play-circle'
      case 'candidate_invited': return 'bi-send'
      case 'ai_analysis': return 'bi-brain'
      default: return 'bi-activity'
    }
  }

  const getActivityColor = (type, metadata = {}) => {
    switch (type) {
      case 'job_created': return 'primary'
      case 'interview_completed': 
        return metadata.recommendation === 'hire' ? 'success' : 'secondary'
      case 'interview_started': return 'info'
      case 'candidate_invited': return 'warning'
      case 'ai_analysis': return 'primary'
      default: return 'secondary'
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-0">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📋 Recent Activity</h5>
          {activities.length > maxItems && (
            <small className="text-muted">
              Showing {maxItems} of {activities.length}
            </small>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {displayActivities.length > 0 ? (
          <div className="activity-feed" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {displayActivities.map((activity, index) => {
              const color = getActivityColor(activity.type, activity.metadata)
              const icon = getActivityIcon(activity.type)

              return (
                <div key={activity.id || index} className="activity-item p-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className={`activity-icon bg-${color}-subtle text-${color} rounded-circle p-2 me-3`}>
                      <i className={`${icon} small`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold small mb-1">{activity.title}</div>
                          <p className="mb-2 text-muted small">{activity.description}</p>
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
                                bg={activity.metadata.recommendation === 'hire' ? 'success' : 'secondary'} 
                                size="sm"
                              >
                                {activity.metadata.recommendation.replace('_', ' ').toUpperCase()}
                              </Badge>
                            )}

                            {activity.metadata?.department && (
                              <Badge bg="info-subtle" text="info" size="sm">
                                {activity.metadata.department}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-activity display-4 text-muted mb-3"></i>
            <h6 className="text-muted">No Recent Activity</h6>
            <p className="text-muted small">
              Activity will appear here when you start creating jobs and conducting interviews.
            </p>
          </div>
        )}
      </Card.Body>

      <style jsx>{`
        .activity-item {
          transition: background-color 0.2s ease;
        }

        .activity-item:hover {
          background-color: #f8f9fa;
        }

        .activity-item:last-child {
          border-bottom: none !important;
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bg-primary-subtle { background-color: rgba(59, 130, 246, 0.1) !important; }
        .bg-success-subtle { background-color: rgba(31, 162, 166, 0.1) !important; }
        .bg-warning-subtle { background-color: rgba(245, 158, 11, 0.1) !important; }
        .bg-info-subtle { background-color: rgba(56, 189, 248, 0.1) !important; }
        .bg-secondary-subtle { background-color: rgba(107, 114, 128, 0.1) !important; }

        .text-primary { color: #3b82f6 !important; }
        .text-success { color: #1fa2a6 !important; }
        .text-warning { color: #f59e0b !important; }
        .text-info { color: #38bdf8 !important; }
        .text-secondary { color: #6b7280 !important; }
      `}</style>
    </Card>
  )
}