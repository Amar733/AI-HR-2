// Common validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''))
}

export const validatePassword = (password) => {
  const errors = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`
  }
  return null
}

export const validateMinLength = (value, minLength, fieldName = 'Field') => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`
  }
  return null
}

export const validateMaxLength = (value, maxLength, fieldName = 'Field') => {
  if (value && value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`
  }
  return null
}

export const validateDateRange = (startDate, endDate) => {
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return 'Start date must be before end date'
  }
  return null
}

export const validateFutureDate = (date, fieldName = 'Date') => {
  if (date && new Date(date) <= new Date()) {
    return `${fieldName} must be in the future`
  }
  return null
}