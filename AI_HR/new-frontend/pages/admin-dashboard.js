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
            <h2 className="mb-1 d-flex align-items-center fw-bold text-dark">
              <i className="bi bi-shield-check me-3"></i>
              Admin Control Center
            </h2>
            <p className="text-muted small">Manage users and platform-wide resources</p>
          </div>
        </div>

        {/* User Management Table */}
        <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
          <Card.Header className="bg-white border-0 py-4">
            <Row className="align-items-center">
              <Col>
                <h5 className="mb-0 fw-bold">User Management</h5>
              </Col>
              <Col md={5}>
                <div className="position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ zIndex: 10 }}></i>
                  <Form.Control
                    placeholder="Search name, email, company..."
                    className="ps-5 border-0 bg-light"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: '12px', padding: '10px 0 10px 48px' }}
                  />
                </div>
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
                            className="avatar-initial rounded-circle bg-dark text-white fw-bold me-3 d-flex align-items-center justify-content-center"
                            style={{ width: "40px", height: "40px", fontSize: '14px' }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">
                              {user.name}
                            </div>
                            <div className="small text-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                           <i className="bi bi-building text-muted small"></i>
                           <span className="small fw-semibold">{user.company || "Personal Account"}</span>
                        </div>
                      </td>
                      <td>
                        <Badge
                          className={`px-3 py-2 border-0 fw-bold ${
                            user.wallet?.minutesBalance < 10
                              ? "bg-danger-subtle text-danger"
                              : "bg-success-subtle text-success"
                          }`}
                          style={{ borderRadius: '8px', fontSize: '11px' }}
                        >
                          {user.wallet?.minutesBalance || 0} MINS
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          className="bg-light text-dark border px-2 py-1 fw-bold text-uppercase"
                          style={{ fontSize: '10px' }}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="text-muted small">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="text-end pe-4">
                        <Button
                          variant="light"
                          size="sm"
                          className="px-3 py-1 border-0 fw-bold shadow-sm manage-btn"
                          style={{ 
                            fontSize: '11px', 
                            borderRadius: '8px', 
                            background: '#f1f5f9',
                            color: '#475569' 
                          }}
                          onClick={() => handleOpenModal(user)}
                        >
                          <i className="bi bi-gear-fill me-2 opacity-50"></i>
                          MANAGE
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
        <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
          <Form onSubmit={handleAdjustSubmit}>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold d-flex align-items-center">
                <div className="bg-dark text-white rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-clock-history fs-5"></i>
                </div>
                Manage User Minutes
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-4">
              {selectedUser && (
                <>
                  <div className="mb-4 p-4 rounded-4 border-0 shadow-sm position-relative overflow-hidden" style={{ background: '#f8fafc' }}>
                    <div className="position-absolute bottom-0 end-0 opacity-03 pe-2 mb-n2">
                       <i className="bi bi-person-fill" style={{ fontSize: '64px', filter: 'grayscale(1)' }}></i>
                    </div>
                    <div className="position-relative" style={{ zIndex: 1 }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Target User</small>
                          <h6 className="mb-0 fw-bold text-dark">{selectedUser.name}</h6>
                          <div className="text-muted x-small" style={{ fontSize: '11px' }}>{selectedUser.email}</div>
                        </div>
                        <Badge bg="light" className="text-dark border-0 shadow-sm small fw-bold" style={{ borderRadius: '6px' }}>{selectedUser.company || 'Personal'}</Badge>
                      </div>
                      <div className="pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10px' }}>Current Balance</small>
                        <div className="d-flex align-items-baseline">
                          <h2 className="mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.02em' }}>{selectedUser.wallet?.minutesBalance}</h2>
                          <span className="ms-2 text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>MINUTES</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode Toggle - Modern Segmented Control */}
                  <label className="fw-bold small text-muted text-uppercase mb-2 mb-2 d-block px-1">Action Type</label>
                  <div className="d-flex mb-4 bg-light p-1 rounded-3 border" style={{ height: '48px' }}>
                    <div 
                      className={`flex-fill d-flex align-items-center justify-content-center rounded-2 cursor-pointer transition-all ${adjustFormData.mode === "add" ? 'bg-white shadow-sm text-success fw-bold border' : 'text-muted'}`}
                      onClick={() => setAdjustFormData({ ...adjustFormData, mode: "add" })}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`bi bi-plus-circle-fill me-2 ${adjustFormData.mode === "add" ? 'text-success' : 'opacity-50'}`}></i>
                      Add Minutes
                    </div>
                    <div 
                      className={`flex-fill d-flex align-items-center justify-content-center rounded-2 cursor-pointer transition-all ${adjustFormData.mode === "deduct" ? 'bg-white shadow-sm text-danger fw-bold border' : 'text-muted'}`}
                      onClick={() => setAdjustFormData({ ...adjustFormData, mode: "deduct" })}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`bi bi-dash-circle-fill me-2 ${adjustFormData.mode === "deduct" ? 'text-danger' : 'opacity-50'}`}></i>
                      Deduct
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase px-1">Amount (Minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      placeholder="e.g., 30"
                      className="py-2 border-slate shadow-none"
                      style={{ borderRadius: '10px' }}
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

                  <Form.Group className="mb-0">
                    <Form.Label className="fw-bold small text-muted text-uppercase px-1">Change Reason</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="e.g., Refund for failed session..."
                      className="py-2 border-slate shadow-none"
                      style={{ borderRadius: '10px', resize: 'none' }}
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
            <Modal.Footer className="border-0 pt-0 pb-4 px-4 gap-2">
              <Button variant="light" className="flex-fill fw-bold py-2 border" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>
                CANCEL
              </Button>
              <Button
                variant={adjustFormData.mode === "add" ? "dark" : "danger"}
                type="submit"
                className="flex-fill fw-bold py-2 shadow-sm"
                style={{ borderRadius: '10px' }}
                disabled={submitting}
              >
                {submitting
                  ? "PROCESSING..."
                  : `CONFIRM ${
                      adjustFormData.mode === "add" ? "ADDITION" : "DEDUCTION"
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
          background-color: rgba(0, 0, 0, 0.05) !important;
        }
        .bg-success-subtle {
          background-color: rgba(12, 148, 136, 0.1) !important;
        }
        .bg-danger-subtle {
          background-color: rgba(220, 38, 38, 0.1) !important;
        }
        .text-primary {
          color: #000000 !important;
        }
        .text-success {
          color: #0c9488 !important;
        }
        .avatar-initial {
          font-size: 1.2rem;
          background: #000000 !important;
          color: white !important;
        }
        :global(.manage-btn) {
          transition: all 0.2s ease !important;
        }
        :global(.manage-btn:hover) {
          background: #000000 !important;
          color: #ffffff !important;
          transform: translateY(-1px);
        }
      `}</style>
    </Layout>
  );
}

// Ensure strict admin check
export default withAuth(AdminDashboard, ["admin"]);
