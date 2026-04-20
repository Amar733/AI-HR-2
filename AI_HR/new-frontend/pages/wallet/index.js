import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
} from "react-bootstrap";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../contexts/AuthContext";
import withAuth from "../../hoc/withAuth";
import axios from "../../services/api";
import { formatDate, formatDateTime } from "../../utils/formatters";
import { APP_NAME } from "../../utils/constants";

function WalletPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState({
    minutesBalance: 0,
    totalUsed: 0,
    transactions: [],
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data } = await axios.get("/wallet/my-wallet");
      console.log("data", data);

      // You set walletData directly to the inner data object here
      setWalletData(data);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "purchase":
        return <Badge bg="success">Top-up</Badge>;
      case "usage":
        return <Badge bg="secondary">Interview</Badge>;
      case "admin_adjustment":
        return <Badge bg="info">Admin Adj.</Badge>;
      case "bonus":
        return (
          <Badge bg="warning" text="dark">
            Bonus
          </Badge>
        );
      default:
        return (
          <Badge bg="light" text="dark">
            {type}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{`My Wallet - ${APP_NAME}`}</title>
      </Head>

      <Container className="py-5">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="mb-1">💳 My Wallet</h2>
            <p className="text-muted">
              Manage your interview minutes and view history.
            </p>
          </Col>
          <Col xs="auto">
            <Link href="/wallet/topup">
              {/* <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
              >
                <i className="bi bi-plus-circle"></i> Buy Minutes
              </Button> */}
            </Link>
          </Col>
        </Row>

        <Row className="mb-5">
          {/* Balance Card */}
          <Col md={6} lg={4} className="mb-3">
            <Card
              className="border-0 shadow-sm text-white h-100"
              style={{
                background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)",
              }}
            >
              <Card.Body className="d-flex flex-column justify-content-between p-4">
                <div>
                  <h6 className="opacity-75 mb-1">Available Balance</h6>
                  <h1 className="display-4 fw-bold mb-0">
                    {/* FIXED: Removed extra .data */}
                    {walletData.minutesBalance}{" "}
                    <span className="fs-5 fw-normal opacity-75">mins</span>
                  </h1>
                </div>
                <div className="mt-4 pt-4 border-top border-white border-opacity-25">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="opacity-75">Account Status</small>
                    <Badge bg="light" text="primary" className="px-3">
                      Active
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Usage Stats Card */}
          <Col md={6} lg={4} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-light text-primary rounded p-2 me-3">
                    <i className="bi bi-clock-history fs-4"></i>
                  </div>
                  <h5 className="mb-0">Lifetime Usage</h5>
                </div>
                <h3 className="mb-1">
                  {/* FIXED: Removed extra .data */}
                  {walletData.totalUsed}{" "}
                  <small className="text-muted fs-6">mins consumed</small>
                </h3>
                <p className="text-muted small mb-0">
                  Total duration of all interviews conducted since registration.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Transactions Table */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <h5 className="mb-0">Transaction History</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Date</th>
                  <th>Activity</th>
                  <th>Type</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end pe-4">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {/* FIXED: Removed extra .data */}
                {walletData.transactions &&
                walletData.transactions.length > 0 ? (
                  walletData.transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="ps-4 text-muted small">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td>
                        <span className="fw-medium text-dark">
                          {tx.description || "System adjustment"}
                        </span>
                        {tx.referenceModel === "InterviewSession" && (
                          <div className="small text-muted">
                            Ref: Interview Session
                          </div>
                        )}
                        {tx.referenceModel === "Payment" && (
                          <div className="small text-muted">
                            Ref: Stripe Payment
                          </div>
                        )}
                        {tx.referenceModel === "AdminLog" && (
                          <div className="small text-muted">
                            Ref: Admin Action
                          </div>
                        )}
                      </td>
                      <td>{getTypeBadge(tx.type)}</td>
                      <td
                        className={`text-end fw-bold ${
                          tx.amount > 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount} m
                      </td>
                      <td className="text-end pe-4 text-muted">
                        {tx.balanceAfter} m
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <i className="bi bi-receipt display-6 d-block mb-2"></i>
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
}

export default withAuth(WalletPage);
