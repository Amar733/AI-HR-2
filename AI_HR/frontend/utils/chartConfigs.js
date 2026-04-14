// Common chart configurations for consistent styling
export const chartColors = {
  primary: '#3b82f6',
  success: '#1fa2a6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#38bdf8',
  secondary: '#6b7280',
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    success: 'linear-gradient(135deg, #1fa2a6 0%, #0f4c81 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  }
}

// Default chart options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      font: {
        family: 'Inter, system-ui, sans-serif'
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#f3f4f6'
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif'
        }
      }
    }
  }
}

// Line chart specific options
export const lineChartOptions = {
  ...defaultChartOptions,
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6
    },
    line: {
      tension: 0.4
    }
  }
}

// Doughnut chart specific options
export const doughnutChartOptions = {
  ...defaultChartOptions,
  cutout: '70%',
  plugins: {
    ...defaultChartOptions.plugins,
    legend: {
      ...defaultChartOptions.plugins.legend,
      position: 'bottom'
    }
  }
}

// Bar chart specific options
export const barChartOptions = {
  ...defaultChartOptions,
  plugins: {
    ...defaultChartOptions.plugins,
    legend: {
      display: false
    }
  }
}

// Generate gradient colors for charts
export const generateGradient = (ctx, colorStops) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  colorStops.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color)
  })
  return gradient
}

// Color palette for multiple datasets
export const colorPalette = [
  '#1fa2a6', // Success green
  '#3b82f6', // Primary blue
  '#f59e0b', // Warning yellow
  '#ef4444', // Danger red
  '#38bdf8', // Info cyan
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#14b8a6'  // Teal
]

// Generate dataset colors with transparency
export const generateDatasetColors = (count, alpha = 0.8) => {
  return Array.from({ length: count }, (_, i) => {
    const color = colorPalette[i % colorPalette.length]
    return {
      backgroundColor: color + Math.round(alpha * 255).toString(16).padStart(2, '0'),
      borderColor: color,
      borderWidth: 2
    }
  })
}