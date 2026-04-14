// Application constants
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "AI Interview";
export const APP_VERSION = "1.0.0";

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  INTERVIEWS: {
    BASE: "/interviews",
    BULK: "/interviews/bulk",
    STATS: "/interviews/stats",
    RECENT: "/interviews/recent",
    CALENDAR: "/interviews/calendar",
  },
  RESULTS: {
    BASE: "/results",
    STATS: "/results/stats",
    EXPORT: "/results/export",
  },
  SETTINGS: {
    BASE: "/settings",
    NOTIFICATIONS: "/settings/notifications",
    USAGE: "/settings/usage",
  },
  PAYMENTS: {
    BASE: "/payments",
    SUBSCRIPTION: "/payments/subscription",
    BILLING: "/payments/billing-history",
    PLANS: "/payments/plans",
  },
};

// Interview types
export const INTERVIEW_TYPES = [
  { value: "video", label: "Video Call", icon: "bi-camera-video" },
  { value: "phone", label: "Phone Call", icon: "bi-telephone" },
  { value: "in-person", label: "In Person", icon: "bi-geo-alt" },
  { value: "panel", label: "Panel Interview", icon: "bi-people" },
];

// Interview statuses
export const INTERVIEW_STATUSES = [
  { value: "scheduled", label: "Scheduled", color: "primary" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "cancelled", label: "Cancelled", color: "danger" },
  { value: "no-show", label: "No Show", color: "warning" },
  { value: "rescheduled", label: "Rescheduled", color: "info" },
  { value: "pending", label: "Pending", color: "secondary" },
];

// Result statuses
export const RESULT_STATUSES = [
  { value: "passed", label: "Passed", color: "success" },
  { value: "failed", label: "Failed", color: "danger" },
  { value: "pending", label: "Pending", color: "warning" },
  { value: "on-hold", label: "On Hold", color: "secondary" },
];

// Recommendations
export const RECOMMENDATIONS = [
  { value: "hire", label: "Hire", color: "success" },
  { value: "reject", label: "Reject", color: "danger" },
  { value: "maybe", label: "Maybe", color: "warning" },
  { value: "next_round", label: "Next Round", color: "info" },
];

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    features: [
      "Up to 50 interviews/month",
      "Basic scheduling",
      "Email support",
    ],
    limits: { interviews: 50, storage: 1000, apiCalls: 1000 },
  },
  {
    id: "professional",
    name: "Professional",
    price: 79,
    popular: true,
    features: [
      "Up to 200 interviews/month",
      "Advanced scheduling",
      "CSV import",
      "Priority support",
    ],
    limits: { interviews: 200, storage: 5000, apiCalls: 5000 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    features: [
      "Unlimited interviews",
      "API access",
      "White-label options",
      "Dedicated support",
    ],
    limits: { interviews: -1, storage: -1, apiCalls: -1 },
  },
];

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM DD, YYYY",
  INPUT: "YYYY-MM-DD",
  DATETIME: "MMM DD, YYYY hh:mm A",
  TIME: "hh:mm A",
};

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "application/pdf", "text/csv"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".pdf", ".csv"],
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};
