import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Nav, Tab } from "react-bootstrap";
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
    { key: "profile", label: "Profile", icon: "bi-person" },
    { key: "security", label: "Security", icon: "bi-shield-lock" },
    { key: "integrations", label: "Integrations", icon: "bi-plug" },
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
          {/* Header */}
          <Row className="mb-4">
            <Col>
              <h1 className="h3 mb-1">Settings</h1>
              <p className="text-muted mb-0">
                Manage your account settings and preferences
              </p>
            </Col>
          </Row>

          <Row>
            {/* Sidebar Navigation */}
            <Col lg={3} className="mb-4">
              <Card className="settings-nav">
                <Card.Body className="p-0">
                  <Nav
                    variant="pills"
                    className="flex-column settings-nav-pills"
                  >
                    {tabItems.map((item) => (
                      <Nav.Item key={item.key}>
                        <Nav.Link
                          eventKey={item.key}
                          active={activeTab === item.key}
                          onClick={() => setActiveTab(item.key)}
                          className="d-flex align-items-center px-3 py-3 border-0"
                        >
                          <i className={`bi ${item.icon} me-3`}></i>
                          {item.label}
                        </Nav.Link>
                      </Nav.Item>
                    ))}
                  </Nav>
                </Card.Body>
              </Card>
            </Col>

            {/* Content Area */}
            <Col lg={9}>
              <Tab.Container activeKey={activeTab}>
                <Tab.Content>
                  <Tab.Pane eventKey="profile">
                    <ProfileSettings
                      settings={settings}
                      onUpdate={handleUpdateSettings}
                    />
                  </Tab.Pane>

                  <Tab.Pane eventKey="security">
                    <SecuritySettings onUpdate={handleUpdateSettings} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="integrations">
                    <IntegrationSettings
                      settings={settings}
                      onUpdate={handleUpdateSettings}
                    />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Col>
          </Row>
        </Container>
      </Layout>
    </>
  );
}

export default withAuth(Settings);
