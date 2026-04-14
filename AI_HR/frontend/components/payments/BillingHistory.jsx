import React, { useState } from 'react';
import {
  Table,
  Button,
  Badge,
  Card,
  Row,
  Col,
  Form,
  Spinner
} from 'react-bootstrap';

const BillingHistory = ({ billingHistory, onDownloadInvoice }) => {
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const handleDownload = async (invoiceId) => {
    setDownloadingInvoice(invoiceId);
    try {
      await onDownloadInvoice(invoiceId);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      paid: 'success',
      pending: 'warning',
      failed: 'danger',
      refunded: 'info'
    };

    return (
      <Badge bg={variants[status] || 'secondary'} className="text-uppercase">
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      paid: 'bi bi-check-circle',
      pending: 'bi bi-clock',
      failed: 'bi bi-x-circle',
      refunded: 'bi bi-arrow-counterclockwise'
    };

    return icons[status] || 'bi bi-circle';
  };

  // Filter and sort billing history
  const filteredHistory = billingHistory
    .filter(item => filterStatus === 'all' || item.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'amount') {
        return b.amount - a.amount;
      }
      return 0;
    });

  if (!billingHistory.length) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <i className="bi bi-receipt display-1 text-muted"></i>
          <h5 className="mt-3">No billing history yet</h5>
          <p className="text-muted">
            Your billing history will appear here once you make your first payment.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 bg-primary text-white">
            <Card.Body className="text-center">
              <div className="display-6 fw-bold">
                {billingHistory.filter(item => item.status === 'paid').length}
              </div>
              <small>Successful Payments</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 bg-success text-white">
            <Card.Body className="text-center">
              <div className="display-6 fw-bold">
                {formatCurrency(
                  billingHistory
                    .filter(item => item.status === 'paid')
                    .reduce((sum, item) => sum + item.amount, 0)
                )}
              </div>
              <small>Total Paid</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 bg-info text-white">
            <Card.Body className="text-center">
              <div className="display-6 fw-bold">
                {billingHistory.filter(item => item.prorated).length}
              </div>
              <small>Prorated Payments</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="small text-muted">Filter by Status</Form.Label>
            <Form.Select 
              size="sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label className="small text-muted">Sort by</Form.Label>
            <Form.Select 
              size="sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date (Newest First)</option>
              <option value="amount">Amount (Highest First)</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Billing History Table */}
      <Card>
        <Card.Body className="p-0">
          <Table responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td className="text-nowrap">
                    <div>{formatDate(item.date)}</div>
                    <small className="text-muted">#{item.invoice}</small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <div className="fw-medium">{item.plan}</div>
                        {item.prorated && (
                          <Badge bg="info" size="sm" className="mt-1">
                            Prorated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="fw-medium">
                    {formatCurrency(item.amount)}
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <i className={`${getStatusIcon(item.status)} me-2`}></i>
                      {getStatusBadge(item.status)}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-credit-card me-2 text-muted"></i>
                      <span className="small">{item.paymentMethod}</span>
                    </div>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleDownload(item.id)}
                      disabled={downloadingInvoice === item.id}
                    >
                      {downloadingInvoice === item.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <i className="bi bi-download me-1"></i>
                          Invoice
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {filteredHistory.length === 0 && (
        <div className="text-center py-4">
          <i className="bi bi-funnel text-muted display-4"></i>
          <p className="text-muted mt-2">No records match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default BillingHistory;