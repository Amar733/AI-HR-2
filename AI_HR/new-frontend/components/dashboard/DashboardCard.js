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
      className={`stat-card border-0 h-100 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <Card.Body className="p-4">
        <div className="d-flex flex-column h-100">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className={`stat-icon bg-${color}-subtle text-${color}`}>
              <i className={`bi ${icon}`}></i>
            </div>
            {badge && (
              <Badge bg={badge.color || 'secondary'} pill className="px-2">
                {badge.text}
              </Badge>
            )}
          </div>
          
          <div className="mt-auto">
            <div className="stat-label text-muted mb-2">{title}</div>
            <div className="d-flex align-items-end justify-content-between">
              <div className="stat-value">{value}</div>
              {trend && (
                <div className={`trend-badge ${trend.positive ? 'trend-up' : 'trend-down'}`}>
                  <i className={`bi ${trend.positive ? 'bi-arrow-up' : 'bi-arrow-down'}`}></i>
                  <span>{trend.text}</span>
                </div>
              )}
            </div>
            
            {progress !== null && (
              <div className="stat-progress mt-3">
                <ProgressBar 
                  now={progress} 
                  variant={color} 
                  style={{height: '6px'}}
                  className="rounded-pill"
                />
              </div>
            )}
          </div>
        </div>
      </Card.Body>

      <style jsx>{`
        .stat-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.05) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.06);
          border-color: rgba(0,0,0,0.1) !important;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 20px;
          transition: transform 0.2s ease;
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #64748b;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
        }

        .bg-primary-subtle { background: #f1f5f9; }
        .bg-success-subtle { background: #ecfdf5; }
        .bg-warning-subtle { background: #fffbeb; }
        .bg-info-subtle { background: #f0f9ff; }

        .text-primary { color: #000000 !important; }
        .text-success { color: #0c9488 !important; }
        .text-warning { color: #f59e0b !important; }
        .text-info { color: #515f74 !important; }
      `}</style>
    </Card>
  )
}