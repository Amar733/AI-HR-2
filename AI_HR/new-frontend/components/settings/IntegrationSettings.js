import { Card, Button, Alert, Badge } from "react-bootstrap";

export default function IntegrationSettings() {
  const integrations = [
    {
      id: 1,
      name: "Google Calendar",
      icon: "bi-calendar3",
      color: "#4285F4",
      description: "Sync interviews with your Google Calendar",
      status: "coming-soon"
    },
    {
      id: 2,
      name: "Slack",
      icon: "bi-slack",
      color: "#E01E5A",
      description: "Get interview notifications in Slack",
      status: "coming-soon"
    },
    {
      id: 3,
      name: "Microsoft Teams",
      icon: "bi-microsoft-teams",
      color: "#5558AF",
      description: "Connect with Microsoft Teams for meetings",
      status: "coming-soon"
    },
    {
      id: 4,
      name: "Zoom",
      icon: "bi-camera-video",
      color: "#2D8CFF",
      description: "Integrate Zoom for video interviews",
      status: "coming-soon"
    }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom py-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-plug-fill text-dark fs-4 me-2"></i>
          <h5 className="mb-0 fw-bold">Integrations</h5>
        </div>
        <p className="text-muted small mb-0 mt-1">Connect third-party services to enhance your workflow</p>
      </Card.Header>
      <Card.Body className="p-4">
        <Alert variant="info" className="d-flex align-items-start border-0 mb-4" style={{ background: 'rgba(31, 162, 166, 0.1)' }}>
          <i className="bi bi-info-circle-fill me-2 mt-1"></i>
          <div>
            <strong>Coming Soon!</strong>
            <p className="mb-0 mt-1 small">
              Integration settings for third-party services will be available in a future update.
              Stay tuned for seamless connectivity with your favorite tools.
            </p>
          </div>
        </Alert>

        <div className="integration-list">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="integration-item d-flex align-items-center justify-content-between p-3 mb-3 border rounded-3 position-relative overflow-hidden"
              style={{ transition: 'all 0.2s ease', cursor: 'not-allowed', opacity: 0.85 }}
            >
              <div className="d-flex align-items-center flex-grow-1">
                <div
                  className="integration-icon d-flex align-items-center justify-content-center rounded-3 me-3"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: `${integration.color}15`,
                    color: integration.color
                  }}
                >
                  <i className={`bi ${integration.icon} fs-4`}></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0 fw-semibold">{integration.name}</h6>
                    <Badge bg="secondary" className="small">
                      Coming Soon
                    </Badge>
                  </div>
                  <small className="text-muted d-block mt-1">
                    {integration.description}
                  </small>
                </div>
              </div>
              <Button variant="outline-secondary" size="sm" disabled className="px-3">
                <i className="bi bi-clock me-2"></i>
                Soon
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div className="d-flex align-items-start">
            <i className="bi bi-lightbulb-fill text-warning fs-5 me-2 mt-1"></i>
            <div>
              <strong className="d-block mb-1">Need a specific integration?</strong>
              <small className="text-muted">
                Let us know which integrations you'd like to see! Contact our support team with your suggestions.
              </small>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
