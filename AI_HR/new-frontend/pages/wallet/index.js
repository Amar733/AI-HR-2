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
        return <Badge className="bg-success-subtle text-success border-0 px-2 py-1 fw-bold" style={{ fontSize: '10px' }}>PURCHASE</Badge>;
      case "usage":
        return <Badge className="bg-info-subtle text-info border-0 px-2 py-1 fw-bold" style={{ fontSize: '10px' }}>INTERVIEW</Badge>;
      case "admin_adjustment":
        return <Badge className="bg-secondary-subtle text-secondary border-0 px-2 py-1 fw-bold" style={{ fontSize: '10px' }}>ADJUSTMENT</Badge>;
      case "bonus":
        return <Badge className="bg-warning-subtle text-warning border-0 px-2 py-1 fw-bold" style={{ fontSize: '10px' }}>BONUS</Badge>;
      default:
        return <Badge className="bg-light text-muted border-0 px-2 py-1 fw-bold" style={{ fontSize: '10px' }}>{type.toUpperCase()}</Badge>;
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

      <Container className="py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="mb-0 fw-bold">My Wallet</h2>
            <p className="text-muted mb-0 small">
              Manage your interview minutes and view history.
            </p>
          </div>
          <div className="d-flex gap-2 w-100 w-md-auto">
            <Link href="/wallet/topup" className="w-100">
              {/* <Button
                variant="dark"
                className="w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                style={{ borderRadius: '10px', height: '44px' }}
              >
                <i className="bi bi-patch-plus"></i> Buy Minutes
              </Button> */}
            </Link>
          </div>
        </div>

        <Row className="mb-5">
          {/* Balance Card */}
          <Col md={6} lg={4} className="mb-3">
            <Card
              className="border-0 shadow-sm text-white h-100 position-relative overflow-hidden"
              style={{
                background: "#000000",
                borderRadius: '16px',
                minHeight: '200px'
              }}
            >
              <div className="position-absolute bottom-0 end-0 p-4 opacity-10" style={{ marginBottom: '-20px', marginRight: '-10px' }}>
                <i className="bi bi-shield-lock-fill" style={{ fontSize: '100px' }}></i>
              </div>
              <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative" style={{ zIndex: 1 }}>
                <div>
                  <h6 className="text-white-50 mb-1 fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Available Balance</h6>
                  <h1 className="fw-bold mb-0" style={{ fontSize: walletData.minutesBalance?.toString().length > 7 ? '2.2rem' : '2.8rem' }}>
                    {walletData.minutesBalance}{" "}
                    <span className="fs-6 fw-normal opacity-50">mins</span>
                  </h1>
                </div>
                <div className="mt-auto pt-4 border-top border-white border-opacity-10">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-white-50 fw-bold" style={{ fontSize: '10px' }}>ACCOUNT STATUS</small>
                    <Badge className="bg-success text-white px-2 py-1 border-0" style={{ fontSize: '10px' }}>
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Usage Stats Card */}
          <Col md={6} lg={4} className="mb-3">
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-light text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                    <i className="bi bi-clock-history fs-5"></i>
                  </div>
                  <h5 className="mb-0 fw-bold">Lifetime Usage</h5>
                </div>
                <h3 className="mb-1 fw-bold">
                  {walletData.totalUsed}{" "}
                  <small className="text-muted fs-6 fw-normal">mins consumed</small>
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
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', borderRadius: '0 0 16px 16px' }}>
              <Table hover className="mb-0 align-middle" style={{ minWidth: '800px', tableLayout: 'auto' }}>
                <thead className="bg-light">
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th className="ps-4 py-3" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Date & Time</th>
                    <th className="py-3" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Activity Details</th>
                    <th className="py-3" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Category</th>
                    <th className="text-end py-3" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Amount</th>
                    <th className="text-end pe-4 py-3" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {/* FIXED: Removed extra .data */}
                  {walletData.transactions &&
                  walletData.transactions.length > 0 ? (
                    walletData.transactions.map((tx) => (
                      <tr key={tx._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td className="ps-4 py-3 text-muted" style={{ fontSize: '12px' }}>
                          <span className="d-block fw-semibold text-dark">{formatDate(tx.createdAt)}</span>
                          <span className="opacity-75">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="py-3">
                          <div className="fw-bold text-dark mb-0" style={{ fontSize: '13px' }}>
                            {tx.description || "System adjustment"}
                          </div>
                          {tx.referenceModel === "InterviewSession" && (
                            <div className="text-muted" style={{ fontSize: '10px' }}>
                              <i className="bi bi-camera-video me-1"></i> AI Interview
                            </div>
                          )}
                          {tx.referenceModel === "Payment" && (
                            <div className="text-muted" style={{ fontSize: '10px' }}>
                              <i className="bi bi-credit-card me-1"></i> Stripe Transaction
                            </div>
                          )}
                          {tx.referenceModel === "AdminLog" && (
                            <div className="text-muted" style={{ fontSize: '10px' }}>
                              <i className="bi bi-gear-fill me-1"></i> Admin Adjustment
                            </div>
                          )}
                        </td>
                        <td className="py-3">{getTypeBadge(tx.type)}</td>
                        <td
                          className={`text-end py-3 fw-bold ${
                            tx.amount > 0 ? "text-success" : "text-dark"
                          }`}
                          style={{ fontSize: '14px' }}
                        >
                          {tx.amount > 0 ? "+" : "-"}
                          {Math.abs(tx.amount)} <small className="fw-normal opacity-50">m</small>
                        </td>
                        <td className="text-end pe-4 py-3 text-muted fw-semibold" style={{ fontSize: '13px' }}>
                          {tx.balanceAfter} <small className="fw-normal opacity-50">m</small>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted border-0">
                        <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
                          <i className="bi bi-receipt fs-1 text-muted"></i>
                        </div>
                        <h6 className="fw-bold text-dark">No transactions found</h6>
                        <p className="small mb-0">Your financial activity will appear here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
}

export default withAuth(WalletPage);
