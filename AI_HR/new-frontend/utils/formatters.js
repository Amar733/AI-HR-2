// Format numbers with appropriate separators
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0'
  return new Intl.NumberFormat('en-US').format(number)
}

// Format currency values
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Format dates in a readable format
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A'

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

// Format date and time
export const formatDateTime = (date, options = {}) => {
  if (!date) return 'N/A'

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  return new Date(date).toLocaleString('en-US', { ...defaultOptions, ...options })
}

// Format time duration in minutes/hours
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min'

  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
}

// Format percentage values
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(decimals)}%`
}

// Get status color for badges
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success'
    case 'completed': return 'success'
    case 'in_progress': return 'primary'
    case 'started': return 'info'
    case 'pending': return 'warning'
    case 'invited': return 'info'
    case 'abandoned': return 'danger'
    case 'expired': return 'secondary'
    case 'inactive': return 'secondary'
    default: return 'secondary'
  }
}

// Get difficulty color
export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'danger'
    case 'expert': return 'dark'
    default: return 'secondary'
  }
}

// Get score color based on value
export const getScoreColor = (score) => {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  if (score >= 4) return 'info'
  return 'danger'
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A'

  const now = new Date()
  const diffMs = now - new Date(date)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return formatDate(date)
}

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Format job requirements
export const formatJobRequirements = (requirements) => {
  if (!requirements || !Array.isArray(requirements)) return 'None'
  return requirements.map(req => `${req.skill} (${req.level})`).join(', ')
}

// Format interview settings
export const formatInterviewSettings = (settings) => {
  if (!settings) return {}

  const formatted = []
  if (settings.recordVideo) formatted.push('Video Recording')
  if (settings.recordAudio) formatted.push('Audio Recording')
  if (settings.showTimer) formatted.push('Timer')
  if (settings.antiCheat) formatted.push('Anti-Cheat')
  if (settings.allowNotes) formatted.push('Notes Allowed')

  return formatted
}