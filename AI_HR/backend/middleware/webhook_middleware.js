const crypto = require("crypto");
const { asyncHandler } = require("./errorHandler");

// Middleware to verify webhook signature (for security)
const verifyWebhookSignature = asyncHandler(async (req, res, next) => {
  const signature = req.headers["x-demo-signature"];
  const timestamp = req.headers["x-demo-timestamp"];

  if (!signature || !timestamp) {
    return res.status(400).json({
      success: false,
      message: "Missing webhook signature or timestamp",
    });
  }

  // For demo purposes, we'll use a simple verification
  // In production, you should use proper HMAC verification
  const webhookSecret =
    process.env.DEMO_WEBHOOK_SECRET || "demo_webhook_secret_123";
  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(timestamp + payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  // Check timestamp to prevent replay attacks (within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp);

  if (Math.abs(currentTime - webhookTime) > 300) {
    return res.status(400).json({
      success: false,
      message: "Webhook timestamp too old",
    });
  }

  next();
});

// Middleware to parse webhook payload as raw body
const parseWebhookPayload = (req, res, next) => {
  if (req.originalUrl.includes("/webhook")) {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      req.rawBody = data;
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON payload" });
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = {
  verifyWebhookSignature,
  parseWebhookPayload,
};
