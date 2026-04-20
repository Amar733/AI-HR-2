import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Nav, Tab, Badge } from "react-bootstrap";
import Layout from "../../components/layout/Layout";
import ProfileSettings from "../../components/settings/ProfileSettings";
import SecuritySettings from "../../components/settings/SecuritySettings";
import IntegrationSettings from "../../components/settings/IntegrationSettings";
import { settingsAPI } from "../../services/api";
import { useLoading } from "../../contexts/LoadingContext";
import { toast } from "react-toastify";
import withAuth from "../../hoc/withAuth";
import Head from "next/head";
import { APP_NAME } from "../../utils/constants";

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState({
    preferences: {},
    subscription: {},
    usage: {},
  });
  const { setIsLoading } = useLoading();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsAPI.getSettings();
      setSettings(data.settings || {});
    } catch (error) {
      toast.error("Failed to fetch settings");
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (updatedSettings) => {
    try {
      setIsLoading(true);
      await settingsAPI.updateSettings(updatedSettings);
      setSettings((prev) => ({ ...prev, ...updatedSettings }));
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const tabItems = [
    { key: "profile", label: "Profile", icon: "bi-person-circle", desc: "Personal information" },
    { key: "security", label: "Security", icon: "bi-shield-check", desc: "Password & authentication" },
    { key: "integrations", label: "Integrations", icon: "bi-plug-fill", desc: "Connected services", badge: "Soon" },
  ];

  return (
    <>
      <Head>
        <title>{`Settings | ${APP_NAME}`}</title>
        <meta
          name="description"
          content="Manage your account settings and preferences"
        />
      </Head>

      <Layout>
        <Container fluid className="py-4">
          <Row className="mb-4 align-items-center">
            <Col>
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="settings-header-icon">
                  <i className="bi bi-gear-fill"></i>
                </div>
                <div>
                  <h1 className="h3 mb-1 fw-bold">Settings</h1>
                  <p className="text-muted mb-0 small">
                    Manage your account settings and preferences
                  </p>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col lg={3} className="mb-4">
              <Card className="settings-nav border-0 shadow-sm">
                <Card.Body className="p-2">
                  <Nav variant="pills" className="flex-column settings-nav-pills">
                    {tabItems.map((item) => (
                      <Nav.Item key={item.key}>
                        <Nav.Link
                          active={activeTab === item.key}
                          onClick={() => setActiveTab(item.key)}
                          className="d-flex align-items-center px-3 py-3 border-0 position-relative"
                        >
                          <i className={`bi ${item.icon} fs-5 me-3`}></i>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="fw-semibold">{item.label}</span>
                              {item.badge && (
                                <Badge bg="info" className="ms-2 small">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>
                              {item.desc}
                            </small>
                          </div>
                        </Nav.Link>
                      </Nav.Item>
                    ))}
                  </Nav>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={9}>
              <div className="settings-content-wrapper">
                <Tab.Container activeKey={activeTab}>
                  <Tab.Content>
                    <Tab.Pane eventKey="profile" className="animate-fadeIn">
                      <ProfileSettings
                        settings={settings}
                        onUpdate={handleUpdateSettings}
                      />
                    </Tab.Pane>

                    <Tab.Pane eventKey="security" className="animate-fadeIn">
                      <SecuritySettings onUpdate={handleUpdateSettings} />
                    </Tab.Pane>

                    <Tab.Pane eventKey="integrations" className="animate-fadeIn">
                      <IntegrationSettings
                        settings={settings}
                        onUpdate={handleUpdateSettings}
                      />
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>
            </Col>
          </Row>
        </Container>
      </Layout>

      <style jsx>{`
        .settings-header-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0f4c81 0%, #1fa2a6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          box-shadow: 0 4px 12px rgba(15, 76, 129, 0.2);
        }

        :global(.settings-nav-pills .nav-link) {
          border-radius: 10px;
          margin-bottom: 4px;
          transition: all 0.2s ease;
        }

        :global(.settings-nav-pills .nav-link:hover:not(.active)) {
          background: rgba(15, 76, 129, 0.05);
          transform: translateX(4px);
        }

        :global(.settings-nav-pills .nav-link.active) {
          background: linear-gradient(135deg, #0f4c81 0%, #1fa2a6 100%);
          box-shadow: 0 4px 12px rgba(15, 76, 129, 0.25);
        }

        :global(.settings-content-wrapper) {
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

export default withAuth(Settings);
