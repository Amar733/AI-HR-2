const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

class DemoWebhookSimulator {
  constructor(webhookUrl, webhookSecret) {
    this.webhookUrl = webhookUrl;
    this.webhookSecret = webhookSecret;
  }

  // Generate webhook signature
  generateSignature(timestamp, payload) {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(timestamp + payload)
      .digest('hex');
  }

  // Send webhook event
  async sendWebhookEvent(eventType, eventData) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = JSON.stringify({
      type: eventType,
      data: {
        object: eventData
      },
      created: timestamp
    });

    const signature = this.generateSignature(timestamp, payload);

    try {
      const response = await axios.post(this.webhookUrl, JSON.parse(payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Signature': signature,
          'X-Demo-Timestamp': timestamp
        }
      });

      console.log(`Webhook sent: ${eventType}`, response.status);
      return response.data;
    } catch (error) {
      console.error(`Webhook failed: ${eventType}`, error.message);
      throw error;
    }
  }

  // Simulate payment success
  async simulatePaymentSuccess(paymentIntentId, metadata) {
    return await this.sendWebhookEvent('payment_intent.succeeded', {
      id: paymentIntentId,
      status: 'succeeded',
      amount_received: Math.round(Math.random() * 10000),
      metadata
    });
  }

  // Simulate payment failure
  async simulatePaymentFailure(paymentIntentId, metadata) {
    return await this.sendWebhookEvent('payment_intent.payment_failed', {
      id: paymentIntentId,
      status: 'failed',
      last_payment_error: {
        code: 'card_declined',
        message: 'Your card was declined.'
      },
      metadata
    });
  }

  // Simulate recurring payment success
  async simulateRecurringPaymentSuccess(customerId, subscriptionId) {
    return await this.sendWebhookEvent('invoice.payment_succeeded', {
      id: `in_${Date.now()}`,
      customer: customerId,
      subscription: subscriptionId,
      amount_paid: Math.round(Math.random() * 10000),
      status: 'paid'
    });
  }

  // Simulate recurring payment failure
  async simulateRecurringPaymentFailure(customerId, subscriptionId) {
    return await this.sendWebhookEvent('invoice.payment_failed', {
      id: `in_${Date.now()}`,
      customer: customerId,
      subscription: subscriptionId,
      amount_due: Math.round(Math.random() * 10000),
      status: 'open',
      attempt_count: 1
    });
  }
}

module.exports = DemoWebhookSimulator;