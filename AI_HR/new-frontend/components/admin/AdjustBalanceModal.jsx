import React, { useState } from "react";
import axios from "../../services/api";
const AdjustBalanceModal = ({ user, onClose, onSuccess }) => {
  const [minutes, setMinutes] = useState(0);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("add"); // 'add' or 'deduct'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return alert("Please provide a reason for the log.");
    if (minutes <= 0) return alert("Minutes must be greater than 0.");

    setIsSubmitting(true);

    // Calculate final value (positive for add, negative for deduct)
    const adjustmentValue = mode === "add" ? Number(minutes) : -Number(minutes);

    try {
      const { data } = await axios.post("/auth/adjust-minutes", {
        userId: user._id,
        minutes: adjustmentValue,
        reason: reason,
      });

      if (data.success) {
        onSuccess(user._id, data.data.newBalance);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to adjust minutes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-96">
        <h3 className="text-lg font-bold mb-4">Adjust Balance: {user.name}</h3>

        <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
          <p className="text-gray-600">Current Balance:</p>
          <p className="text-xl font-bold">{user.wallet.minutesBalance} mins</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Toggle Mode */}
          <div className="flex mb-4 bg-gray-100 p-1 rounded">
            <button
              type="button"
              className={`flex-1 py-1 rounded text-sm font-medium transition-colors ${
                mode === "add"
                  ? "bg-white shadow text-green-600"
                  : "text-gray-500"
              }`}
              onClick={() => setMode("add")}
            >
              Add (+)
            </button>
            <button
              type="button"
              className={`flex-1 py-1 rounded text-sm font-medium transition-colors ${
                mode === "deduct"
                  ? "bg-white shadow text-red-600"
                  : "text-gray-500"
              }`}
              onClick={() => setMode("deduct")}
            >
              Deduct (-)
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Minutes to {mode === "add" ? "Add" : "Remove"}
            </label>
            <input
              type="number"
              min="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g. 30"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Reason (Required for Log)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g. Customer support refund, Bonus credit..."
              rows="2"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white text-base font-medium rounded-md focus:outline-none focus:ring-2 ${
                mode === "add"
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustBalanceModal;
