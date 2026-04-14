import { Card, Badge, ProgressBar } from 'react-bootstrap'

export default function DashboardCard({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend = null, 
  progress = null,
  badge = null,
  onClick = null 
}) {
  return (
    <Card 
      className={`stat-card border-0 shadow-sm h-100 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className={`stat-icon bg-${color}-subtle text-${color} rounded-circle p-3 me-3`}>
            <i className={`bi ${icon} fs-4`}></i>
          </div>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <div className="stat-value h3 mb-0">{value}</div>
              {badge && (
                <Badge bg={badge.color || 'secondary'} size="sm">
                  {badge.text}
                </Badge>
              )}
            </div>
            <div className="stat-label text-muted small">{title}</div>

            {trend && (
              <div className="stat-trend mt-1">
                <small className={trend.positive ? 'text-success' : 'text-danger'}>
                  <i className={`bi ${trend.positive ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
                  {trend.text}
                </small>
              </div>
            )}

            {progress !== null && (
              <div className="stat-progress mt-2">
                <ProgressBar 
                  now={progress} 
                  variant={color} 
                  style={{height: '4px'}}
                  className="rounded"
                />
              </div>
            )}
          </div>
        </div>
      </Card.Body>

      <style jsx>{`
        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }

        .cursor-pointer {
          cursor: pointer;
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

        .bg-primary-subtle { background-color: rgba(59, 130, 246, 0.1) !important; }
        .bg-success-subtle { background-color: rgba(31, 162, 166, 0.1) !important; }
        .bg-warning-subtle { background-color: rgba(245, 158, 11, 0.1) !important; }
        .bg-info-subtle { background-color: rgba(56, 189, 248, 0.1) !important; }
        .bg-danger-subtle { background-color: rgba(239, 68, 68, 0.1) !important; }

        .text-primary { color: #3b82f6 !important; }
        .text-success { color: #1fa2a6 !important; }
        .text-warning { color: #f59e0b !important; }
        .text-info { color: #38bdf8 !important; }
        .text-danger { color: #ef4444 !important; }
      `}</style>
    </Card>
  )
}