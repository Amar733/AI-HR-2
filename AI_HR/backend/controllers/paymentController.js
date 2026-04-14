const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const mongoose = require("mongoose");

// Demo Payment Gateway Configuration
const DEMO_GATEWAY = {
  baseUrl: "https://demo-payment-gateway.com/api/v1",
  merchantId: "DEMO_MERCHANT_123",
  apiKey: "demo_api_key_12345",
};

// Plan configurations with pricing
const PLAN_CONFIG = {
  starter: {
    name: "starter",
    displayName: "Starter",
    price: 29,
    currency: "USD",
    interval: "month",
    features: [
      "Up to 50 interviews/month",
      "Basic scheduling",
      "Email support",
      "Standard templates",
      "1GB storage",
    ],
    limits: {
      interviews: 50,
      storage: 1000,
      apiCalls: 1000,
    },
  },
  professional: {
    name: "professional",
    displayName: "Professional",
    price: 79,
    currency: "USD",
    interval: "month",
    features: [
      "Up to 200 interviews/month",
      "Advanced scheduling",
      "CSV import",
      "Priority support",
      "Custom templates",
      "Analytics",
      "5GB storage",
    ],
    limits: {
      interviews: 200,
      storage: 5000,
      apiCalls: 5000,
    },
    popular: true,
  },
  enterprise: {
    name: "enterprise",
    displayName: "Enterprise",
    price: 199,
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited interviews",
      "API access",
      "White-label options",
      "Dedicated support",
      "Custom integrations",
      "Advanced analytics",
      "Unlimited storage",
    ],
    limits: {
      interviews: -1,
      storage: -1,
      apiCalls: -1,
    },
  },
};

// Helper function to calculate prorated amount
const calculateProratedAmount = (
  currentPlan,
  newPlan,
  currentPeriodStart,
  currentPeriodEnd
) => {
  const now = new Date();
  const totalDays = Math.ceil(
    (currentPeriodEnd - currentPeriodStart) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.ceil(
    (currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
  );

  if (remainingDays <= 0) {
    return PLAN_CONFIG[newPlan].price;
  }

  // Calculate unused amount from current plan
  const currentPlanPrice = PLAN_CONFIG[currentPlan].price;
  const unusedAmount = (currentPlanPrice / totalDays) * remainingDays;

  // Calculate prorated amount for new plan
  const newPlanPrice = PLAN_CONFIG[newPlan].price;
  const proratedNewPlanAmount = (newPlanPrice / totalDays) * remainingDays;

  // Return the difference (could be positive for upgrade, negative for downgrade)
  const amountToPay = proratedNewPlanAmount - unusedAmount;

  return {
    currentPlanUnused: parseFloat(unusedAmount.toFixed(2)),
    newPlanProrated: parseFloat(proratedNewPlanAmount.toFixed(2)),
    amountToPay: parseFloat(Math.max(0, amountToPay).toFixed(2)), // Never negative
    credit: parseFloat(Math.max(0, -amountToPay).toFixed(2)), // Credit if downgrading
    remainingDays,
    totalDays,
  };
};

// Demo payment gateway API calls
const demoPaymentGateway = {
  async createPaymentIntent(amount, currency, metadata) {
    // Simulate API call to demo payment gateway
    const paymentIntentId = `pi_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      id: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      status: "requires_payment_method",
      client_secret: `${paymentIntentId}_secret_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      metadata,
    };
  },

  async confirmPayment(paymentIntentId, paymentMethodId) {
    // Simulate payment confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate processing time

    const isSuccess = Math.random() > 0.1; // 90% success rate for demo

    return {
      id: paymentIntentId,
      status: isSuccess ? "succeeded" : "failed",
      payment_method: paymentMethodId,
      amount_received: isSuccess ? Math.round(Math.random() * 10000) : 0,
      failure_code: !isSuccess ? "card_declined" : null,
      failure_message: !isSuccess ? "Your card was declined." : null,
    };
  },

  async retrievePayment(paymentIntentId) {
    // Simulate payment retrieval
    return {
      id: paymentIntentId,
      status: "succeeded",
      amount_received: Math.round(Math.random() * 10000),
      created: Math.floor(Date.now() / 1000),
    };
  },
};

// @desc Get subscription info
// @route GET /api/payments/subscription
// @access Private
const getSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("subscription usage");

  // Calculate next billing date
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  res.json({
    success: true,
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      trialEndDate: user.subscription.trialEndDate,
      nextBillingDate: nextBillingDate.toISOString().split("T")[0],
      amount: PLAN_CONFIG[user.subscription.plan].price,
      currency: "USD",
      customerId: user.subscription.stripeCustomerId,
      subscriptionId: user.subscription.stripeSubscriptionId,
    },
  });
});

// @desc Create payment intent for subscription upgrade/change
// @route POST /api/payments/create-payment-intent
// @access Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  console.log(plan);
  const userId = req.user.id;

  if (!["starter", "professional", "enterprise"].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: "Invalid subscription plan",
    });
  }

  const user = await User.findById(userId).select("subscription");
  const currentPlan = user.subscription.plan;

  if (currentPlan === plan) {
    return res.status(400).json({
      success: false,
      message: "User is already on this plan",
    });
  }

  // Calculate billing period
  const now = new Date();
  const currentPeriodStart = user.subscription.startDate || now;
  const currentPeriodEnd =
    user.subscription.endDate ||
    new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Calculate prorated amount
  const proratedCalculation = calculateProratedAmount(
    currentPlan,
    plan,
    currentPeriodStart,
    currentPeriodEnd
  );

  let paymentIntent = null;

  if (proratedCalculation.amountToPay > 0) {
    // Create payment intent for the prorated amount
    paymentIntent = await demoPaymentGateway.createPaymentIntent(
      proratedCalculation.amountToPay,
      "USD",
      {
        userId: userId.toString(),
        currentPlan,
        newPlan: plan,
        type: "subscription_change",
        prorated: "true",
      }
    );
  }

  res.json({
    success: true,
    paymentRequired: proratedCalculation.amountToPay > 0,
    paymentIntent: paymentIntent,
    proratedCalculation,
    planDetails: {
      current: PLAN_CONFIG[currentPlan],
      new: PLAN_CONFIG[plan],
    },
  });
});

// @desc Confirm payment and update subscription
// @route POST /api/payments/confirm-payment
// @access Private
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, paymentMethodId, newPlan } = req.body;
  const userId = req.user.id;

  if (!paymentIntentId || !paymentMethodId || !newPlan) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    // Confirm payment with demo gateway
    const paymentResult = await demoPaymentGateway.confirmPayment(
      paymentIntentId,
      paymentMethodId
    );

    if (paymentResult.status === "succeeded") {
      // Update user subscription
      const now = new Date();
      const nextBillingDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      );

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          "subscription.plan": newPlan,
          "subscription.status": "active",
          "subscription.startDate": now,
          "subscription.endDate": nextBillingDate,
          "subscription.stripeCustomerId": `cust_demo_${userId}`,
          "subscription.stripeSubscriptionId": `sub_demo_${Date.now()}`,
        },
        { new: true }
      ).select("subscription");

      // Store payment record (you might want to create a Payment model for this)
      const paymentRecord = {
        userId,
        paymentIntentId,
        amount: paymentResult.amount_received / 100, // Convert from cents
        currency: "USD",
        status: "completed",
        plan: newPlan,
        paymentDate: now,
        paymentMethod: paymentMethodId,
      };

      res.json({
        success: true,
        message: `Subscription successfully upgraded to ${newPlan} plan`,
        subscription: updatedUser.subscription,
        payment: paymentRecord,
      });
    } else {
      res.status(400).json({
        success: false,
        message: paymentResult.failure_message || "Payment failed",
        failureCode: paymentResult.failure_code,
      });
    }
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
    });
  }
});

// @desc Handle payment webhook (callback)
// @route POST /api/payments/webhook
// @access Public (but should be secured with webhook signature verification)
const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  try {
    switch (type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure(data.object);
        break;

      case "invoice.payment_succeeded":
        await handleRecurringPaymentSuccess(data.object);
        break;

      case "invoice.payment_failed":
        await handleRecurringPaymentFailure(data.object);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Helper function to handle successful payments
const handlePaymentSuccess = async (paymentIntent) => {
  const { userId, newPlan } = paymentIntent.metadata;

  if (userId && newPlan) {
    const now = new Date();
    const nextBillingDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    await User.findByIdAndUpdate(userId, {
      "subscription.plan": newPlan,
      "subscription.status": "active",
      "subscription.startDate": now,
      "subscription.endDate": nextBillingDate,
    });

    console.log(`Subscription updated for user ${userId} to ${newPlan} plan`);
  }
};

// Helper function to handle failed payments
const handlePaymentFailure = async (paymentIntent) => {
  const { userId } = paymentIntent.metadata;

  if (userId) {
    await User.findByIdAndUpdate(userId, {
      "subscription.status": "past_due",
    });

    console.log(
      `Payment failed for user ${userId}, subscription marked as past_due`
    );
  }
};

// Helper function to handle successful recurring payments
const handleRecurringPaymentSuccess = async (invoice) => {
  const customerId = invoice.customer;

  // Find user by customer ID and update subscription
  const user = await User.findOne({
    "subscription.stripeCustomerId": customerId,
  });

  if (user) {
    const now = new Date();
    const nextBillingDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    await User.findByIdAndUpdate(user._id, {
      "subscription.status": "active",
      "subscription.startDate": now,
      "subscription.endDate": nextBillingDate,
    });

    console.log(`Recurring payment successful for user ${user._id}`);
  }
};

// Helper function to handle failed recurring payments
const handleRecurringPaymentFailure = async (invoice) => {
  const customerId = invoice.customer;

  const user = await User.findOne({
    "subscription.stripeCustomerId": customerId,
  });

  if (user) {
    await User.findByIdAndUpdate(user._id, {
      "subscription.status": "past_due",
    });

    console.log(`Recurring payment failed for user ${user._id}`);
  }
};

// @desc Update subscription plan (free changes)
// @route PUT /api/payments/subscription
// @access Private
const updateSubscription = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!["starter", "professional", "enterprise"].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: "Invalid subscription plan",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      "subscription.plan": plan,
      "subscription.status": "active",
    },
    { new: true }
  ).select("subscription");

  res.json({
    success: true,
    message: `Subscription updated to ${plan} plan`,
    subscription: user.subscription,
  });
});

// @desc Cancel subscription
// @route DELETE /api/payments/subscription
// @access Private
const cancelSubscription = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      "subscription.status": "cancelled",
    },
    { new: true }
  ).select("subscription");

  res.json({
    success: true,
    message: "Subscription cancelled successfully",
    subscription: user.subscription,
  });
});

// @desc Get billing history
// @route GET /api/payments/billing-history
// @access Private
const getBillingHistory = asyncHandler(async (req, res) => {
  // Mock billing history - in real app, fetch from payment gateway
  const mockBillingHistory = [
    {
      id: "inv_001",
      date: "2025-08-01",
      plan: "Professional",
      amount: 79.0,
      status: "paid",
      invoice: "INV-2025-001",
      paymentMethod: "**** 4242",
      prorated: false,
    },
    {
      id: "inv_002",
      date: "2025-07-01",
      plan: "Professional",
      amount: 79.0,
      status: "paid",
      invoice: "INV-2025-002",
      paymentMethod: "**** 4242",
      prorated: false,
    },
    {
      id: "inv_003",
      date: "2025-06-15",
      plan: "Starter to Professional (Prorated)",
      amount: 35.5,
      status: "paid",
      invoice: "INV-2025-003",
      paymentMethod: "**** 4242",
      prorated: true,
    },
  ];

  res.json({
    success: true,
    billingHistory: mockBillingHistory,
  });
});

// @desc Download invoice
// @route GET /api/payments/invoice/:invoiceId
// @access Private
const downloadInvoice = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  res.json({
    success: true,
    message: `Invoice ${invoiceId} download initiated`,
    downloadUrl: `${process.env.FRONTEND_URL}/invoices/${invoiceId}.pdf`,
  });
});

// @desc Add payment method
// @route POST /api/payments/payment-methods
// @access Private
const addPaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethodId, isDefault } = req.body;

  res.json({
    success: true,
    message: "Payment method added successfully",
    paymentMethodId,
  });
});

// @desc Get payment methods
// @route GET /api/payments/payment-methods
// @access Private
const getPaymentMethods = asyncHandler(async (req, res) => {
  const mockPaymentMethods = [
    {
      id: "pm_001",
      type: "card",
      card: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2027,
      },
      isDefault: true,
    },
  ];

  res.json({
    success: true,
    paymentMethods: mockPaymentMethods,
  });
});

// @desc Get pricing plans
// @route GET /api/payments/plans
// @access Public
const getPricingPlans = asyncHandler(async (req, res) => {
  const plans = Object.values(PLAN_CONFIG);

  res.json({
    success: true,
    plans,
  });
});

module.exports = {
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
};
