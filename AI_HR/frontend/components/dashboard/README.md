# Dashboard Components

## 🎯 Complete AI Interview Dashboard

This package contains a modern, comprehensive dashboard for your AI interview platform with professional design and interactive features.

### Main Dashboard Page
- **`pages/dashboard.js`** - Main dashboard page with full layout

### Reusable Components
- **`components/dashboard/DashboardCard.js`** - Statistics cards
- **`components/dashboard/QuickActions.js`** - Action buttons grid
- **`components/dashboard/RecentActivity.js`** - Activity feed

### Utilities
- **`utils/formatters.js`** - Formatting helper functions
- **`utils/chartConfigs.js`** - Chart.js configurations

## 📊 Features

### Statistics Cards
- AI Interview Jobs count
- Total Interviews with completion rate
- Average AI Score with progress bars
- Success Rate with trending indicators

### Interactive Charts
- Interview completion trend (Line chart)
- Job difficulty distribution (Doughnut chart) 
- Department performance (Bar chart)

### Activity Feed
- Real-time job creation events
- Interview completion notifications
- Color-coded status indicators
- Metadata badges for scores and recommendations

### Quick Actions
- Create AI Job (gradient button)
- View Analytics
- Export Results
- Top performing job highlight

## 🎨 Design Features
- Modern card-based layout
- Hover effects and animations
- Professional gradient styling
- Mobile-responsive design
- Bootstrap 5 components
- Consistent color theming

## 📱 Mobile Support
- Adaptive grid layouts
- Touch-friendly interactions
- Responsive charts
- Collapsible sections

## ⚙️ Dependencies Required

```bash
npm install chart.js react-chartjs-2
```

## 🚀 Usage

1. Copy all files to your frontend project
2. Install chart.js dependencies
3. Import dashboard components in your pages
4. Use Layout component for consistent styling

Example:
```jsx
import Layout from '../components/layout/Layout'
import DashboardCard from '../components/dashboard/DashboardCard'

export default function MyPage() {
  return (
    <Layout>
      <DashboardCard 
        title="AI Jobs"
        value="25"
        icon="bi-robot"
        color="primary"
      />
    </Layout>
  )
}
```

This dashboard transforms your interview platform into a professional AI-powered solution! 🚀
