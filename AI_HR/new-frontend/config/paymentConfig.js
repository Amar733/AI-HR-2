// config/paymentConfig.js - Payment configuration and constants

export const PAYMENT_CONFIG = {
  // Demo payment gateway settings
  DEMO_GATEWAY: {
    baseUrl: process.env.NEXT_PUBLIC_DEMO_GATEWAY_URL || 'https://demo-payment-gateway.com/api/v1',
    publicKey: process.env.NEXT_PUBLIC_DEMO_GATEWAY_KEY || 'pk_demo_12345',
    merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID || 'DEMO_MERCHANT_123'
  },

  // Payment processing settings
  PROCESSING: {
    timeout: 30000, // 30 seconds
    maxRetries: 3,
    confirmationDelay: 2000 // 2 seconds
  },

  // Supported currencies
  CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],

  // Default currency
  DEFAULT_CURRENCY: 'USD',

  // Minimum charge amount (in cents)
  MIN_CHARGE_AMOUNT: 100, // $1.00

  // Proration settings
  PRORATION: {
    enabled: true,
    minimumDaysForProration: 1,
    roundingPrecision: 2
  }
};

export const PLAN_FEATURES = {
  starter: [
    'Up to 50 interviews/month',
    'Basic scheduling',
    'Email support',
    'Standard templates',
    '1GB storage',
    'Basic analytics',
    'Mobile app access'
  ],
  professional: [
    'Up to 200 interviews/month',
    'Advanced scheduling',
    'CSV import/export',
    'Priority support',
    'Custom templates',
    'Advanced analytics',
    '5GB storage',
    'Team collaboration',
    'API access (limited)',
    'Custom branding'
  ],
  enterprise: [
    'Unlimited interviews',
    'White-label options',
    'Dedicated support',
    'Custom integrations',
    'Advanced analytics & reporting',
    'Unlimited storage',
    'Full API access',
    'SSO integration',
    'Custom training',
    'SLA guarantee'
  ]
};

export const PAYMENT_METHODS = {
  CARDS: ['visa', 'mastercard', 'amex', 'discover'],
  DIGITAL_WALLETS: ['paypal', 'apple_pay', 'google_pay'],
  BANK_TRANSFERS: ['ach', 'wire_transfer']
};

export const BILLING_CYCLES = {
  MONTHLY: 'month',
  YEARLY: 'year',
  QUARTERLY: 'quarter'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const ERROR_CODES = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_CARD: 'invalid_card',
  EXPIRED_CARD: 'expired_card',
  PROCESSING_ERROR: 'processing_error',
  NETWORK_ERROR: 'network_error',
  AUTHENTICATION_ERROR: 'authentication_error'
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.CARD_DECLINED]: 'Your card was declined. Please try a different payment method.',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds. Please check your account balance.',
  [ERROR_CODES.INVALID_CARD]: 'Invalid card details. Please check and try again.',
  [ERROR_CODES.EXPIRED_CARD]: 'Your card has expired. Please use a different payment method.',
  [ERROR_CODES.PROCESSING_ERROR]: 'Payment processing failed. Please try again.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication failed. Please verify your details.'
};

export const WEBHOOK_EVENTS = {
  PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_FAILED: 'payment_intent.payment_failed',
  INVOICE_PAID: 'invoice.payment_succeeded',
  INVOICE_FAILED: 'invoice.payment_failed',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled'
};

// Validation rules
export const VALIDATION_RULES = {
  cardNumber: {
    minLength: 13,
    maxLength: 19,
    pattern: /^[0-9]{13,19}$/
  },
  expiryMonth: {
    min: 1,
    max: 12
  },
  expiryYear: {
    min: new Date().getFullYear(),
    max: new Date().getFullYear() + 20
  },
  cvc: {
    visa: { length: 3 },
    mastercard: { length: 3 },
    amex: { length: 4 },
    discover: { length: 3 },
    default: { length: 3 }
  }
};

// Demo card numbers for testing
export const DEMO_CARDS = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069'
};