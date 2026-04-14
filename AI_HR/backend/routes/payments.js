const express = require("express");
const {
  getSubscription,
  createPaymentIntent,
  confirmPayment,
  handlePaymentWebhook,
  updateSubscription,
  cancelSubscription,
  getBillingHistory,
  downloadInvoice,
  addPaymentMethod,
  getPaymentMethods,
  getPricingPlans,
} = require("../controllers/paymentController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/plans", getPricingPlans);

// Webhook route (should be before protected routes)
router.post("/webhook", handlePaymentWebhook);

// Protected routes
router.use(protect);

// Subscription management
router
  .route("/subscription")
  .get(getSubscription)
  .put(updateSubscription)
  .delete(cancelSubscription);

// Payment processing
router.post("/create-payment-intent", createPaymentIntent);
router.post("/confirm-payment", confirmPayment);

// Billing and invoices
router.get("/billing-history", getBillingHistory);
router.get("/invoice/:invoiceId", downloadInvoice);

// Payment methods
router.route("/payment-methods").get(getPaymentMethods).post(addPaymentMethod);

module.exports = router;
