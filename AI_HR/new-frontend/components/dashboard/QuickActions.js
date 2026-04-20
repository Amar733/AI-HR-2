import { Card, Button, Row, Col, Badge } from 'react-bootstrap'
import Link from 'next/link'

export default function QuickActions({ actions = [] }) {
  const defaultActions = [
    {
      title: 'Create AI Job',
      description: 'Set up a new AI-powered interview',
      icon: 'bi-robot',
      color: 'primary',
      link: '/jobs',
      gradient: true
    },
    {
      title: 'View Analytics',
      description: 'Check interview performance',
      icon: 'bi-graph-up',
      color: 'success',
      link: '/analytics'
    },
    {
      title: 'Manage Interviews',
      description: 'Review ongoing sessions',
      icon: 'bi-camera-video',
      color: 'info',
      link: '/interviews'
    },
    {
      title: 'Export Results',
      description: 'Download interview data',
      icon: 'bi-download',
      color: 'secondary',
      link: '/results/export'
    }
  ]

  const actionItems = actions.length > 0 ? actions : defaultActions

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-0">
        <h5 className="mb-0">⚡ Quick Actions</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          {actionItems.map((action, index) => (
            <Col md={6} lg={3} key={index} className="mb-3">
              <Link href={action.link} className="text-decoration-none">
                <div className={`action-card p-3 rounded-3 h-100 ${action.gradient ? 'gradient-card' : 'border'}`}>
                  <div className="d-flex align-items-center mb-2">
                    <div className={`action-icon ${action.gradient ? 'text-white' : `text-${action.color}`} me-2`}>
                      <i className={`${action.icon} fs-5`}></i>
                    </div>
                    {action.badge && (
                      <Badge bg={action.badge.color || 'primary'} size="sm">
                        {action.badge.text}
                      </Badge>
                    )}
                  </div>
                  <h6 className={`mb-1 ${action.gradient ? 'text-white' : ''}`}>
                    {action.title}
                  </h6>
                  <p className={`small mb-0 ${action.gradient ? 'text-white-50' : 'text-muted'}`}>
                    {action.description}
                  </p>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Card.Body>

      <style jsx>{`
        .action-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          border: 1px solid #e9ecef;
        }

        .action-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .gradient-card {
          background: linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%);
          border: none !important;
        }

        .gradient-card:hover {
          box-shadow: 0 8px 25px rgba(31, 162, 166, 0.3);
        }

        .action-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
      `}</style>
    </Card>
  )
}