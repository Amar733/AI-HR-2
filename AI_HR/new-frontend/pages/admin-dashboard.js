import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Form,
  Modal,
  InputGroup,
} from "react-bootstrap";
import Head from "next/head";
import Layout from "../components/layout/Layout"; // Adjust path as needed
import LoadingSpinner from "../components/ui/LoadingSpinner"; // Adjust path
import Toast from "../components/ui/Toast"; // Adjust path
import { useAuth } from "../contexts/AuthContext";
import withAuth from "../hoc/withAuth";
import { formatDate } from "../utils/formatters"; // Adjust path
import axios from "../services/api";
import { APP_NAME } from "../utils/constants";

function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMinutes: 0,
    activeUsers: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustFormData, setAdjustFormData] = useState({
    minutes: 0,
    reason: "",
    mode: "add", // 'add' or 'deduct'
  });
  const [submitting, setSubmitting] = useState(false);

  // Toast State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch Users
      const usersRes = await axios.get("/auth/all-user");

      if (usersRes.success) {
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error("Admin data fetch error:", error);
      showToast("Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Logic ---
  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setAdjustFormData({ minutes: "", reason: "", mode: "add" });
    setShowModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustFormData.minutes || !adjustFormData.reason) {
      return showToast("Please fill all fields", "warning");
    }

    setSubmitting(true);
    try {
      // Calculate final minutes (positive or negative)
      const finalMinutes =
        adjustFormData.mode === "add"
          ? Number(adjustFormData.minutes)
          : -Number(adjustFormData.minutes);

      const res = await axios.post("/auth/adjust-minutes", {
        userId: selectedUser._id,
        minutes: finalMinutes,
        reason: adjustFormData.reason,
      });

      if (res.data.success) {
        // Update local state
        setUsers(
          users.map((u) =>
            u._id === selectedUser._id
              ? {
                  ...u,
                  wallet: {
                    ...u.wallet,
                    minutesBalance: res.data.data.newBalance,
                  },
                }
              : u
          )
        );
        showToast("Wallet updated successfully", "success");
        setShowModal(false);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Adjustment failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading Admin Dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{`Admin Dashboard - ${APP_NAME}`}</title>
      </Head>

      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">🛡️ Admin Dashboard</h2>
          </div>
        </div>

        {/* User Management Table */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <Row className="align-items-center">
              <Col>
                <h5 className="mb-0">User Management</h5>
              </Col>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search name, email, company..."
                    className="border-start-0 ps-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">User</th>
                  <th>Company</th>
                  <th>Wallet Balance</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div
                            className="avatar-initial rounded-circle bg-light text-primary fw-bold me-3 d-flex align-items-center justify-content-center"
                            style={{ width: "40px", height: "40px" }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">
                              {user.name}
                            </div>
                            <div className="small text-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.company || "-"}</td>
                      <td>
                        <Badge
                          bg={
                            user.wallet?.minutesBalance < 10
                              ? "danger-subtle"
                              : "success-subtle"
                          }
                          text={
                            user.wallet?.minutesBalance < 10
                              ? "danger"
                              : "success"
                          }
                          className="px-3 py-2 rounded-pill"
                        >
                          <i className="bi bi-stopwatch me-1"></i>
                          {user.wallet?.minutesBalance || 0} mins
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg="secondary-subtle"
                          text="secondary"
                          className="text-capitalize"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="text-muted small">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="text-end pe-4">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                        >
                          Manage Minutes
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Adjust Balance Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Form onSubmit={handleAdjustSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Manage Minutes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedUser && (
                <>
                  <div className="mb-4 p-3 bg-light rounded d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block">
                        Current Balance
                      </small>
                      <strong className="h4 mb-0">
                        {selectedUser.wallet?.minutesBalance} mins
                      </strong>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">User</small>
                      <span className="fw-semibold">{selectedUser.name}</span>
                    </div>
                  </div>

                  {/* Mode Toggle */}
                  <div className="d-flex mb-3 bg-light p-1 rounded">
                    <Button
                      variant={
                        adjustFormData.mode === "add" ? "white" : "light"
                      }
                      className={`flex-fill border-0 shadow-sm ${
                        adjustFormData.mode === "add"
                          ? "text-success fw-bold"
                          : "text-muted"
                      }`}
                      onClick={() =>
                        setAdjustFormData({ ...adjustFormData, mode: "add" })
                      }
                    >
                      <i className="bi bi-plus-circle me-2"></i> Add Minutes
                    </Button>
                    <Button
                      variant={
                        adjustFormData.mode === "deduct" ? "white" : "light"
                      }
                      className={`flex-fill border-0 ${
                        adjustFormData.mode === "deduct"
                          ? "text-danger fw-bold shadow-sm"
                          : "text-muted"
                      }`}
                      onClick={() =>
                        setAdjustFormData({ ...adjustFormData, mode: "deduct" })
                      }
                    >
                      <i className="bi bi-dash-circle me-2"></i> Deduct
                    </Button>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Amount (Minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      placeholder="e.g., 30"
                      value={adjustFormData.minutes}
                      onChange={(e) =>
                        setAdjustFormData({
                          ...adjustFormData,
                          minutes: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Reason (Required for audit log)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="e.g., Bonus for signup, Refund for failed interview..."
                      value={adjustFormData.reason}
                      onChange={(e) =>
                        setAdjustFormData({
                          ...adjustFormData,
                          reason: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                variant={adjustFormData.mode === "add" ? "success" : "danger"}
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Processing..."
                  : `Confirm ${
                      adjustFormData.mode === "add" ? "Addition" : "Deduction"
                    }`}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </Container>

      {/* Custom Styles overrides if needed */}
      <style jsx>{`
        .bg-primary-subtle {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .bg-success-subtle {
          background-color: rgba(31, 162, 166, 0.1) !important;
        }
        .bg-warning-subtle {
          background-color: rgba(245, 158, 11, 0.1) !important;
        }
        .text-primary {
          color: #3b82f6 !important;
        }
        .text-success {
          color: #1fa2a6 !important;
        }
        .text-warning {
          color: #f59e0b !important;
        }
        .avatar-initial {
          font-size: 1.2rem;
        }
      `}</style>
    </Layout>
  );
}

// Ensure strict admin check
export default withAuth(AdminDashboard, ["admin"]);
