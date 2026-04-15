import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Tab,
  Tabs,
  Modal,
  Form,
  Alert,
  Spinner,
  ProgressBar,
} from "react-bootstrap";
import Layout from "../../components/layout/Layout";
import SubscriptionPlan from "../../components/payments/SubscriptionPlan";
import BillingHistory from "../../components/payments/BillingHistory";
import PaymentMethodForm from "../../components/payments/PaymentMethodForm";
import ProrationModal from "../../components/payments/ProrationModal";
import { paymentsAPI } from "../../services/api";
import { useLoading } from "../../contexts/LoadingContext";
import { toast } from "react-toastify";
import withAuth from "../../hoc/withAuth";
import Head from "next/head";
import { APP_NAME } from "../../utils/constants";

function Payments() {
  const [activeTab, setActiveTab] = useState("subscription");
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Modal states
  const [showProrationModal, setShowProrationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Payment states
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [prorationData, setProrationData] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const { setIsLoading } = useLoading();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subscriptionData, billingData, plansData, paymentMethodsData] =
        await Promise.all([
          paymentsAPI.getSubscription(),
          paymentsAPI.getBillingHistory(),
          paymentsAPI.getPlans(),
          paymentsAPI.getPaymentMethods().catch(() => ({ paymentMethods: [] })),
        ]);

      setSubscription(subscriptionData.subscription);
      setBillingHistory(billingData.billingHistory || []);
      setPlans(plansData.plans || []);
      setPaymentMethods(paymentMethodsData.paymentMethods || []);
    } catch (error) {
      toast.error("Failed to fetch payment data");
      console.error("Error fetching payment data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (newPlan) => {
    if (subscription?.plan === newPlan) {
      toast.info("You are already on this plan");
      return;
    }

    try {
      setIsLoading(true);
      setSelectedPlan(newPlan);
      // Create payment intent and get proration details
      const response = await paymentsAPI.createPaymentIntent({ plan: newPlan });

      if (response.paymentRequired) {
        setPaymentIntent(response.paymentIntent);
        setProrationData(response.proratedCalculation);
        setShowProrationModal(true);
      } else {
        // No payment required (downgrade with credit)
        await paymentsAPI.updateSubscription({ plan: newPlan });
        toast.success(`Successfully changed to ${newPlan} plan!`);
        fetchData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to process plan change");
      console.error("Plan change error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmProration = () => {
    setShowProrationModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setPaymentProcessing(true);

      const response = await paymentsAPI.confirmPayment({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: paymentData.paymentMethodId || "pm_demo_card_123",
        newPlan: selectedPlan,
      });

      if (response.success) {
        toast.success(`Successfully upgraded to ${selectedPlan} plan!`);
        setShowPaymentModal(false);
        fetchData();
        resetPaymentState();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.message || "Payment failed. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const resetPaymentState = () => {
    setSelectedPlan(null);
    setProrationData(null);
    setPaymentIntent(null);
    setSelectedPaymentMethod(null);
  };

  const handleCancelSubscription = async () => {
    if (window.confirm("Are you sure you want to cancel your subscription?")) {
      try {
        setIsLoading(true);
        await paymentsAPI.cancelSubscription();
        toast.success("Subscription cancelled successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to cancel subscription");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.downloadInvoice(invoiceId);
      if (response.downloadUrl) {
        window.open(response.downloadUrl, "_blank");
      }
      toast.success("Invoice download started");
    } catch (error) {
      toast.error("Failed to download invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: "success",
      trial: "primary",
      cancelled: "danger",
      past_due: "warning",
    };
    return (
      <Badge bg={variants[status] || "secondary"} className="text-uppercase">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <>
      <Head>
        <title>{`Billing & Payments | ${APP_NAME}`}</title>
        <meta
          name="description"
          content="Manage your subscription, billing, and payment methods"
        />
      </Head>

      <Layout>
        <Container fluid className="py-4">
          {/* Header */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <div className="mb-3 mb-md-0">
                  <h1 className="h3 mb-1">Billing & Payments</h1>
                  <p className="text-muted mb-0">
                    Manage your subscription and billing information
                  </p>
                </div>
                {subscription && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Current Plan:</span>
                    <Badge bg="primary" className="px-3 py-2">
                      {subscription.plan?.charAt(0).toUpperCase() +
                        subscription.plan?.slice(1)}
                    </Badge>
                    {getStatusBadge(subscription.status)}
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* Current Subscription Overview */}
          {subscription && (
            <Row className="mb-4">
              <Col>
                <Card className="subscription-overview border-success">
                  <Card.Header className="bg-success text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">
                          <i className="bi bi-star-fill me-2"></i>
                          Current Plan:{" "}
                          {subscription.plan?.charAt(0).toUpperCase() +
                            subscription.plan?.slice(1)}
                        </h5>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={8}>
                        <div className="subscription-info">
                          <h4 className="mb-2 text-dark">
                            {formatCurrency(subscription.amount || 0)}
                            <small className="text-muted ms-1">/ month</small>
                          </h4>
                          <p className="mb-1">
                            <strong>Next billing date:</strong>{" "}
                            {new Date(
                              subscription.nextBillingDate
                            ).toLocaleDateString()}
                          </p>
                          {subscription.trialEndDate &&
                            new Date(subscription.trialEndDate) >
                              new Date() && (
                              <p className="mb-0 text-warning">
                                <i className="bi bi-clock me-1"></i>
                                Trial ends:{" "}
                                {new Date(
                                  subscription.trialEndDate
                                ).toLocaleDateString()}
                              </p>
                            )}
                        </div>
                      </Col>
                      <Col md={4} className="text-md-end">
                        <div className="d-flex flex-column flex-md-row gap-2">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleCancelSubscription}
                          >
                            Cancel Subscription
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Tabs */}
          <Row>
            <Col>
              <Card>
                <Card.Body className="p-3">
                  <Tabs
                    activeKey={activeTab}
                    onSelect={setActiveTab}
                    className="border-0 nav-tabs-custom"
                  >
                    <Tab
                      eventKey="subscription"
                      title={
                        <span>
                          <i className="bi bi-credit-card me-2"></i>
                          Subscription Plans
                        </span>
                      }
                    >
                      <div className="p-4">
                        <SubscriptionPlan
                          currentPlan={subscription?.plan}
                          plans={plans}
                          onPlanChange={handlePlanChange}
                          subscription={subscription}
                        />
                      </div>
                    </Tab>

                    <Tab
                      eventKey="billing"
                      title={
                        <span>
                          <i className="bi bi-receipt me-2"></i>
                          Billing History
                        </span>
                      }
                    >
                      <div className="p-4">
                        <BillingHistory
                          billingHistory={billingHistory}
                          onDownloadInvoice={handleDownloadInvoice}
                        />
                      </div>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

        {/* Proration Modal */}
        <ProrationModal
          show={showProrationModal}
          onHide={() => {
            setShowProrationModal(false);
            resetPaymentState();
          }}
          currentPlan={subscription?.plan}
          newPlan={selectedPlan}
          prorationData={prorationData}
          onConfirm={handleConfirmProration}
          formatCurrency={formatCurrency}
        />

        {/* Payment Modal */}
        <Modal
          show={showPaymentModal}
          onHide={() => {
            if (!paymentProcessing) {
              setShowPaymentModal(false);
              resetPaymentState();
            }
          }}
          size="lg"
          backdrop={paymentProcessing ? "static" : true}
          keyboard={!paymentProcessing}
        >
          <Modal.Header closeButton={!paymentProcessing}>
            <Modal.Title>Complete Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {prorationData && (
              <Alert variant="info" className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Amount to pay:</span>
                  <strong>{formatCurrency(prorationData.amountToPay)}</strong>
                </div>
              </Alert>
            )}

            <PaymentMethodForm
              paymentMethods={paymentMethods}
              paymentIntent={paymentIntent}
              onSubmit={handlePaymentSubmit}
              processing={paymentProcessing}
            />
          </Modal.Body>
        </Modal>
      </Layout>
    </>
  );
}

export default withAuth(Payments);
