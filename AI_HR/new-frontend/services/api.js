// services/api.js
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  // DO NOT set a default Content-Type here — let axios set it per request.
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
// NOTE: this returns response.data — so `api.post(...)` resolves to the server data directly.
// Call sites should use: `const data = await api.post(...)` (not `const { data } = ...`)
api.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    if (response.config.metadata) {
      const endTime = new Date();
      const duration = endTime - response.config.metadata.startTime;
      console.log(
        `API Call: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${duration}ms`
      );
    }

    return response.data;
  },
  (error) => {
    console.error("API Error:", error);

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect
          Cookies.remove("token");
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/")
          ) {
            window.location.href = "/";
          }
          break;

        case 403:
          toast.error(
            "Access denied. You don't have permission to perform this action."
          );
          break;

        case 404:
          toast.error("Resource not found");
          break;

        case 422:
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err) => {
              toast.error(err.message || "Validation error");
            });
          } else {
            toast.error(data.message || "Validation error");
          }
          break;

        case 429:
          toast.error("Too many requests. Please wait a moment and try again.");
          break;

        case 500:
          toast.error("Server error. Please try again later.");
          break;

        default:
          toast.error(data.message || "An unexpected error occurred");
      }

      return Promise.reject(data || error.response);
    } else if (error.request) {
      // Network error
      toast.error("Network error. Please check your connection.");
      return Promise.reject({ message: "Network error" });
    } else {
      // Other error
      toast.error("An unexpected error occurred");
      return Promise.reject(error);
    }
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  signup: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.put(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.put(`/auth/verify-email/${token}`),
  logout: () => api.post("/auth/logout"),
};

// Interview API endpoints
export const interviewAPI = {
  getAll: (params = {}) => api.get("/interviews", { params }),
  getById: (id) => api.get(`/interviews/${id}`),
  create: (interviewData) => api.post("/interviews", interviewData),
  update: (id, interviewData) => api.put(`/interviews/${id}`, interviewData),
  delete: (id) => api.delete(`/interviews/${id}`),
  bulkCreate: (data) => api.post("/interviews/bulk", data),
  getStats: () => api.get("/interviews/stats"),
  getRecent: () => api.get("/interviews/recent"),
  getCalendar: (params = {}) => api.get("/interviews/calendar", { params }),
  exportToCSV: () => api.get("/interviews/export"),
};

// Result API endpoints
export const resultAPI = {
  getAll: (params = {}) => api.get("/results", { params }),
  getById: (id) => api.get(`/results/${id}`),
  create: (resultData) => api.post("/results", resultData),
  update: (id, resultData) => api.put(`/results/${id}`, resultData),
  delete: (id) => api.delete(`/results/${id}`),
  getStats: () => api.get("/results/stats"),
  export: () => api.get("/results/export"),
};

// Settings API endpoints
export const settingsAPI = {
  getSettings: () => api.get("/settings"),
  updateSettings: (settingsData) => api.put("/settings", settingsData),
  updateNotifications: (notificationData) =>
    api.put("/settings/notifications", notificationData),
  getUsage: () => api.get("/settings/usage"),
  resetUsage: () => api.post("/settings/reset-usage"),
};

// Payments API endpoints

// Upload API endpoints
export const uploadAPI = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    // DO NOT set Content-Type manually here
    return api.post("/upload", formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const total = progressEvent.total || 1;
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  processCSV: (file) => {
    const formData = new FormData();
    formData.append("csvFile", file);

    // DO NOT set Content-Type manually here
    return api.post("/upload/csv", formData);
  },
};

// Helper function to handle file downloads
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: "blob",
    });

    // api returns response.data (here a blob) due to interceptor
    const blob = new Blob([response]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error("Download failed:", error);
    toast.error("Download failed");
    return false;
  }
};

// Enhanced payments API following the same pattern
export const paymentsAPI = {
  // Get current subscription details
  getSubscription: async () => {
    try {
      const response = await api.get("/payments/subscription");
      return response;
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      toast.error("Failed to load subscription details");
      throw error;
    }
  },

  // Get available pricing plans
  getPlans: async () => {
    try {
      const response = await api.get("/payments/plans");
      return response;
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load pricing plans");
      throw error;
    }
  },

  // Create payment intent for subscription change (with proration)
  createPaymentIntent: async (data) => {
    try {
      const response = await api.post("/payments/create-payment-intent", data);
      return response;
    } catch (error) {
      console.error("Failed to create payment intent:", error);
      toast.error(
        error.response?.data?.message || "Failed to create payment intent"
      );
      throw error;
    }
  },

  // Confirm payment and update subscription
  confirmPayment: async (data) => {
    try {
      const response = await api.post("/payments/confirm-payment", data);

      if (response.success) {
        toast.success(
          "Payment successful! Your subscription has been updated."
        );
      }

      return response;
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      const errorMessage =
        error.response?.data?.message || "Payment failed. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  },

  // Update subscription (for free changes)
  updateSubscription: async (data) => {
    try {
      const response = await api.put("/payments/subscription", data);

      if (response.success) {
        toast.success(
          `Subscription updated to ${data.plan} plan successfully!`
        );
      }

      return response;
    } catch (error) {
      console.error("Failed to update subscription:", error);
      toast.error(
        error.response?.data?.message || "Failed to update subscription"
      );
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async () => {
    try {
      const response = await api.delete("/payments/subscription");

      if (response.success) {
        toast.success("Subscription cancelled successfully");
      }

      return response;
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error(
        error.response?.data?.message || "Failed to cancel subscription"
      );
      throw error;
    }
  },

  // Get billing history
  getBillingHistory: async () => {
    try {
      const response = await api.get("/payments/billing-history");
      return response;
    } catch (error) {
      console.error("Failed to fetch billing history:", error);
      toast.error("Failed to load billing history");
      throw error;
    }
  },

  // Download invoice (with proper file handling)
  downloadInvoice: async (invoiceId, filename) => {
    try {
      const response = await api.get(`/payments/invoice/${invoiceId}`, {
        responseType: "blob",
      });

      // Create filename if not provided
      const invoiceFilename = filename || `invoice-${invoiceId}.pdf`;

      // api returns response.data (here a blob) due to interceptor
      const blob = new Blob([response], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = invoiceFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Invoice downloaded successfully");
      return true;
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Failed to download invoice");
      return false;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await api.get("/payments/payment-methods");
      return response;
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      toast.error("Failed to load payment methods");
      throw error;
    }
  },

  // Add payment method
  addPaymentMethod: async (data) => {
    try {
      const response = await api.post("/payments/payment-methods", data);

      if (response.success) {
        toast.success("Payment method added successfully");
      }

      return response;
    } catch (error) {
      console.error("Failed to add payment method:", error);
      toast.error(
        error.response?.data?.message || "Failed to add payment method"
      );
      throw error;
    }
  },

  // Remove payment method
  removePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await api.delete(
        `/payments/payment-methods/${paymentMethodId}`
      );

      if (response.success) {
        toast.success("Payment method removed successfully");
      }

      return response;
    } catch (error) {
      console.error("Failed to remove payment method:", error);
      toast.error(
        error.response?.data?.message || "Failed to remove payment method"
      );
      throw error;
    }
  },

  // Set default payment method
  setDefaultPaymentMethod: async (paymentMethodId) => {
    try {
      const response = await api.put(
        `/payments/payment-methods/${paymentMethodId}/default`
      );

      if (response.success) {
        toast.success("Default payment method updated");
      }

      return response;
    } catch (error) {
      console.error("Failed to set default payment method:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to update default payment method"
      );
      throw error;
    }
  },

  // Get subscription usage/limits
  getUsage: async () => {
    try {
      const response = await api.get("/payments/usage");
      return response;
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
      toast.error("Failed to load usage information");
      throw error;
    }
  },

  // Apply coupon/promo code
  applyCoupon: async (couponCode) => {
    try {
      const response = await api.post("/payments/apply-coupon", {
        coupon: couponCode,
      });

      if (response.success) {
        toast.success("Coupon applied successfully!");
      }

      return response;
    } catch (error) {
      console.error("Failed to apply coupon:", error);
      toast.error(error.response?.data?.message || "Invalid coupon code");
      throw error;
    }
  },

  // Remove coupon
  removeCoupon: async () => {
    try {
      const response = await api.delete("/payments/coupon");

      if (response.success) {
        toast.success("Coupon removed successfully");
      }

      return response;
    } catch (error) {
      console.error("Failed to remove coupon:", error);
      toast.error(error.response?.data?.message || "Failed to remove coupon");
      throw error;
    }
  },

  // Get payment intent status
  getPaymentIntentStatus: async (paymentIntentId) => {
    try {
      const response = await api.get(
        `/payments/payment-intent/${paymentIntentId}/status`
      );
      return response;
    } catch (error) {
      console.error("Failed to get payment intent status:", error);
      throw error;
    }
  },

  // Retry failed payment
  retryPayment: async (paymentIntentId) => {
    try {
      const response = await api.post(
        `/payments/payment-intent/${paymentIntentId}/retry`
      );

      if (response.success) {
        toast.success("Payment retry initiated");
      }

      return response;
    } catch (error) {
      console.error("Failed to retry payment:", error);
      toast.error(error.response?.data?.message || "Failed to retry payment");
      throw error;
    }
  },

  // Get payment receipts
  getReceipts: async (limit = 10) => {
    try {
      const response = await api.get(`/payments/receipts?limit=${limit}`);
      return response;
    } catch (error) {
      console.error("Failed to fetch receipts:", error);
      toast.error("Failed to load payment receipts");
      throw error;
    }
  },

  // Download payment receipt
  downloadReceipt: async (receiptId, filename) => {
    try {
      const response = await api.get(
        `/payments/receipts/${receiptId}/download`,
        {
          responseType: "blob",
        }
      );

      // Create filename if not provided
      const receiptFilename = filename || `receipt-${receiptId}.pdf`;

      // api returns response.data (here a blob) due to interceptor
      const blob = new Blob([response], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = receiptFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Receipt downloaded successfully");
      return true;
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt");
      return false;
    }
  },

  // Request refund
  requestRefund: async (paymentId, reason) => {
    try {
      const response = await api.post(`/payments/refund`, {
        paymentId,
        reason,
      });

      if (response.success) {
        toast.success("Refund request submitted successfully");
      }

      return response;
    } catch (error) {
      console.error("Failed to request refund:", error);
      toast.error(error.response?.data?.message || "Failed to request refund");
      throw error;
    }
  },

  // Get refund status
  getRefundStatus: async (refundId) => {
    try {
      const response = await api.get(`/payments/refund/${refundId}/status`);
      return response;
    } catch (error) {
      console.error("Failed to get refund status:", error);
      throw error;
    }
  },

  // Update billing address
  updateBillingAddress: async (addressData) => {
    try {
      const response = await api.put("/payments/billing-address", addressData);

      if (response.success) {
        toast.success("Billing address updated successfully");
      }

      return response;
    } catch (error) {
      console.error("Failed to update billing address:", error);
      toast.error(
        error.response?.data?.message || "Failed to update billing address"
      );
      throw error;
    }
  },

  // Get tax information
  getTaxInfo: async () => {
    try {
      const response = await api.get("/payments/tax-info");
      return response;
    } catch (error) {
      console.error("Failed to fetch tax information:", error);
      toast.error("Failed to load tax information");
      throw error;
    }
  },
};

// Export the main api instance for custom requests
export default api;
