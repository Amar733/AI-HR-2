# Payment Gateway API Documentation

## Overview
This API provides a complete payment gateway integration with prorated billing for subscription management.

## Authentication
All endpoints except public ones require JWT authentication via Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Subscription Info
**GET** `/api/payments/subscription`

Returns current subscription details including next billing date and prorated information.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "plan": "professional",
    "status": "active",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-02-01T00:00:00.000Z",
    "trialEndDate": "2025-01-15T00:00:00.000Z",
    "nextBillingDate": "2025-02-01",
    "amount": 79,
    "currency": "USD",
    "customerId": "cust_demo_123",
    "subscriptionId": "sub_demo_456"
  }
}
```

### 2. Create Payment Intent
**POST** `/api/payments/create-payment-intent`

Creates a payment intent for subscription upgrade/downgrade with prorated calculation.

**Request:**
```json
{
  "plan": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "paymentRequired": true,
  "paymentIntent": {
    "id": "pi_demo_123456789",
    "amount": 2680,
    "currency": "USD",
    "status": "requires_payment_method",
    "client_secret": "pi_demo_123456789_secret_abc"
  },
  "proratedCalculation": {
    "currentPlanUnused": 15.50,
    "newPlanProrated": 42.30,
    "amountToPay": 26.80,
    "credit": 0,
    "remainingDays": 15,
    "totalDays": 30
  },
  "planDetails": {
    "current": {
      "name": "starter",
      "price": 29
    },
    "new": {
      "name": "professional",
      "price": 79
    }
  }
}
```

### 3. Confirm Payment
**POST** `/api/payments/confirm-payment`

Confirms payment and updates subscription.

**Request:**
```json
{
  "paymentIntentId": "pi_demo_123456789",
  "paymentMethodId": "pm_demo_card_123",
  "newPlan": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription successfully upgraded to professional plan",
  "subscription": {
    "plan": "professional",
    "status": "active",
    "startDate": "2025-01-15T12:00:00.000Z",
    "endDate": "2025-02-15T12:00:00.000Z"
  },
  "payment": {
    "userId": "64a1b2c3d4e5f6789012345",
    "paymentIntentId": "pi_demo_123456789",
    "amount": 26.80,
    "currency": "USD",
    "status": "completed",
    "plan": "professional",
    "paymentDate": "2025-01-15T12:00:00.000Z"
  }
}
```

### 4. Payment Webhook
**POST** `/api/payments/webhook`

Handles payment gateway callbacks for status updates.

**Headers:**
```
X-Demo-Signature: <webhook_signature>
X-Demo-Timestamp: <unix_timestamp>
Content-Type: application/json
```

**Request:**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_demo_123456789",
      "status": "succeeded",
      "amount_received": 2680,
      "metadata": {
        "userId": "64a1b2c3d4e5f6789012345",
        "newPlan": "professional",
        "type": "subscription_change"
      }
    }
  }
}
```

### 5. Get Pricing Plans
**GET** `/api/payments/plans` (Public)

Returns available subscription plans.

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "name": "starter",
      "displayName": "Starter",
      "price": 29,
      "currency": "USD",
      "interval": "month",
      "features": [
        "Up to 50 interviews/month",
        "Basic scheduling",
        "Email support"
      ],
      "limits": {
        "interviews": 50,
        "storage": 1000,
        "apiCalls": 1000
      }
    }
  ]
}
```

## Prorated Billing Logic

The system automatically calculates prorated amounts when users upgrade or downgrade their subscription mid-cycle:

1. **Calculate unused amount from current plan:**
   ```
   unusedAmount = (currentPlanPrice / totalDaysInPeriod) * remainingDays
   ```

2. **Calculate prorated amount for new plan:**
   ```
   proratedAmount = (newPlanPrice / totalDaysInPeriod) * remainingDays
   ```

3. **Determine amount to charge:**
   ```
   amountToCharge = max(0, proratedAmount - unusedAmount)
   credit = max(0, unusedAmount - proratedAmount)
   ```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error"
  }
}
```

## Webhook Security

Webhooks are secured using HMAC-SHA256 signature verification:

1. Generate signature: `HMAC-SHA256(timestamp + payload, webhook_secret)`
2. Compare with `X-Demo-Signature` header
3. Verify timestamp is within 5 minutes

## Testing

Use the provided `DemoWebhookSimulator` class to test webhook events:

```javascript
const simulator = new DemoWebhookSimulator(webhookUrl, webhookSecret);
await simulator.simulatePaymentSuccess(paymentIntentId, metadata);
```