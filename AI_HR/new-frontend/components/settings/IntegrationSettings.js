import { Card, Button, Alert } from "react-bootstrap";

export default function IntegrationSettings() {
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Integrations</h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info">
          <Alert.Heading>Coming Soon!</Alert.Heading>
          <p>
            Integration settings for third-party services like Zoom, Google
            Calendar, and Slack will be available in a future update.
          </p>
        </Alert>

        <div className="integration-list">
          <div className="integration-item d-flex justify-content-between align-items-center p-3 border rounded mb-3">
            <div className="d-flex align-items-center">
              <i className="bi bi-calendar3 fs-4 text-success me-3"></i>
              <div>
                <h6 className="mb-1">Google Calendar</h6>
                <small className="text-muted">
                  Sync interviews with your Google Calendar
                </small>
              </div>
            </div>
            <Button variant="outline-primary" disabled>
              Coming Soon
            </Button>
          </div>

          <div className="integration-item d-flex justify-content-between align-items-center p-3 border rounded">
            <div className="d-flex align-items-center">
              <i className="bi bi-slack fs-4 text-warning me-3"></i>
              <div>
                <h6 className="mb-1">Slack Integration</h6>
                <small className="text-muted">
                  Get interview notifications in Slack
                </small>
              </div>
            </div>
            <Button variant="outline-primary" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
