// utils/paymentUtils.js - Payment utility functions

export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return new Date(dateString).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDaysRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = Math.abs(end - now);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isTrialActive = (trialEndDate) => {
  if (!trialEndDate) return false;
  return new Date(trialEndDate) > new Date();
};

export const getTimeUntilRenewal = (nextBillingDate) => {
  const now = new Date();
  const renewal = new Date(nextBillingDate);
  const diffTime = renewal - now;

  if (diffTime <= 0) return 'Overdue';

  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return 'Less than 1 hour';
  }
};

export const validateCardNumber = (cardNumber) => {
  // Remove all non-digits
  const cleanNumber = cardNumber.replace(/\D/g, '');

  // Check if empty or too short
  if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const getCardType = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '');

  // Visa
  if (/^4/.test(cleanNumber)) return 'visa';

  // Mastercard
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'mastercard';

  // American Express
  if (/^3[47]/.test(cleanNumber)) return 'amex';

  // Discover
  if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';

  // Diners Club
  if (/^3[0689]/.test(cleanNumber)) return 'diners';

  // JCB
  if (/^35/.test(cleanNumber)) return 'jcb';

  return 'unknown';
};

export const formatCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const cardType = getCardType(cleanNumber);

  // American Express format: 4-6-5
  if (cardType === 'amex') {
    return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }

  // Default format: 4-4-4-4
  return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
};

export const maskCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length < 4) return cardNumber;

  const last4 = cleanNumber.slice(-4);
  const masked = '*'.repeat(cleanNumber.length - 4);

  return formatCardNumber(masked + last4);
};

export const validateExpiryDate = (month, year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const expYear = parseInt(year);
  const expMonth = parseInt(month);

  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;

  return true;
};

export const validateCVC = (cvc, cardType) => {
  if (!cvc || !/^\d+$/.test(cvc)) return false;

  // American Express uses 4-digit CVC
  if (cardType === 'amex') {
    return cvc.length === 4;
  }

  // All other cards use 3-digit CVC
  return cvc.length === 3;
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    paid: 'success',
    completed: 'success',
    pending: 'warning',
    processing: 'info',
    failed: 'danger',
    cancelled: 'secondary',
    refunded: 'info',
    past_due: 'warning'
  };

  return colors[status] || 'secondary';
};

export const getPaymentStatusIcon = (status) => {
  const icons = {
    paid: 'bi-check-circle',
    completed: 'bi-check-circle',
    pending: 'bi-clock',
    processing: 'bi-arrow-repeat',
    failed: 'bi-x-circle',
    cancelled: 'bi-x-circle-fill',
    refunded: 'bi-arrow-counterclockwise',
    past_due: 'bi-exclamation-triangle'
  };

  return icons[status] || 'bi-circle';
};

export const getPlanColor = (planName) => {
  const colors = {
    starter: 'secondary',
    professional: 'primary',
    enterprise: 'success'
  };

  return colors[planName] || 'secondary';
};

export const calculateSavings = (currentPlan, newPlan, plans) => {
  const current = plans.find(p => p.name === currentPlan);
  const newP = plans.find(p => p.name === newPlan);

  if (!current || !newP) return null;

  const yearlyCurrentCost = current.price * 12;
  const yearlyNewCost = newP.price * 12;
  const savings = yearlyCurrentCost - yearlyNewCost;

  return {
    monthly: current.price - newP.price,
    yearly: savings,
    percentage: Math.round((savings / yearlyCurrentCost) * 100)
  };
};