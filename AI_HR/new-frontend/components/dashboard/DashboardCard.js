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
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          position: relative;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, 
            var(--card-gradient-start, #3b82f6), 
            var(--card-gradient-end, #8b5cf6));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          font-size: 24px;
          transition: transform 0.3s ease;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          color: #1e293b;
        }

        .trend-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .trend-up {
          background-color: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .trend-down {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .bg-primary-subtle { background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); }
        .bg-success-subtle { background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(31, 162, 166, 0.1)); }
        .bg-warning-subtle { background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1)); }
        .bg-info-subtle { background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(14, 165, 233, 0.1)); }
        .bg-danger-subtle { background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1)); }

        .text-primary { color: #3b82f6 !important; }
        .text-success { color: #1fa2a6 !important; }
        .text-warning { color: #f59e0b !important; }
        .text-info { color: #38bdf8 !important; }
        .text-danger { color: #ef4444 !important; }
      `}</style>
    </Card>
  )
}