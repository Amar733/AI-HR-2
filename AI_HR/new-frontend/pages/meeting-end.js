import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import Head from "next/head";
import { APP_NAME } from "../utils/constants";

export default function InterviewEnd() {
  return (
    <>
      <Head>
        <title>{`${APP_NAME} - Interview Completed`}</title>
        <meta
          name="description"
          content="Thank you for participating in your interview!"
        />
      </Head>
      <div className="auth-page bg-light">
        <Container fluid className="min-vh-100">
          <Row className="min-vh-100 align-items-center">
            <Col lg={3} xs={12}></Col>
            <Col
              lg={6}
              xs={12}
              className="d-flex align-items-center justify-content-center p-4 p-lg-5"
            >
              <Card className="shadow-lg border-0 text-center py-4 px-4">
                <Card.Body>
                  <div className="mb-4">
                    <span
                      className="bi bi-check-circle-fill text-success"
                      style={{ fontSize: 64 }}
                    ></span>
                  </div>
                  <h3 className="mb-3 fw-bold">Interview Completed!</h3>
                  <Alert
                    variant="info"
                    className="d-flex align-items-center justify-content-center mb-3"
                  >
                    <span
                      className="bi bi-speedometer2 me-2"
                      style={{ fontSize: 22 }}
                    ></span>
                    <span style={{ fontWeight: "500" }}>
                      We are analyzing your interview.
                    </span>
                  </Alert>
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <span
                      className="bi bi-envelope-open me-2 text-secondary"
                      style={{ fontSize: 22 }}
                    ></span>
                    <span>
                      The company will reach out with the next steps soon.
                    </span>
                  </div>
                  <div
                    className="text-muted mt-4"
                    style={{ fontSize: "1.09rem" }}
                  >
                    Thank you for participating!
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} xs={12}></Col>
          </Row>
        </Container>
      </div>
    </>
  );
}
