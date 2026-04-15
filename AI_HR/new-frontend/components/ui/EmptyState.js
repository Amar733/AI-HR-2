import { Card, Button } from 'react-bootstrap'

export default function EmptyState({
  icon = 'bi-inbox',
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  actionText,
  onAction,
  className = ''
}) {
  return (
    <Card className={`empty-state-card ${className}`}>
      <Card.Body className="text-center py-5">
        <div className="empty-state-icon mb-3">
          <i className={`bi ${icon} display-1 text-muted`}></i>
        </div>
        <h5 className="mb-3">{title}</h5>
        <p className="text-muted mb-4">{description}</p>
        {actionText && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Card.Body>
    </Card>
  )
}