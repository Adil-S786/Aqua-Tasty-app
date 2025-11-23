"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";



export default function PayDueSheet({
  isOpen,
  onClose,
  sale,
  onPaid,
}: {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalDue, setTotalDue] = useState<number | null>(null);

  // 🔁 Fetch total due dynamically when sheet opens
  useEffect(() => {
    const fetchTotalDue = async () => {
      if (!isOpen || !sale) return;

      try {
        const payload = {
          customer_id: sale.customer_id || null,
          customer_name: sale.customer_name || null,
        };
        const res = await api.post(Endpoints.totalDue, payload);
        setTotalDue(res.data.total_due);
      } catch (err) {
        console.error("Failed to fetch total due:", err);
        setTotalDue(0);
      }
    };

    fetchTotalDue();
  }, [isOpen, sale]);

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount!");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: parseFloat(amount),
        customer_id: sale.customer_id || null,
        customer_name: sale.customer_name || null,
      };

      const res = await api.post(Endpoints.payDue, payload);

      const paid = res.data.paid_amount.toFixed(2);
      const remain = res.data.total_due_now.toFixed(2);

      toast.success(
        `💰 Payment successful!\nPaid: ₹${paid}\nRemaining Due: ₹${remain}`
      );

      // 🔁 Refresh data instantly
      await onPaid();

      // Update displayed total due
      setTotalDue(res.data.total_due_now);
      setAmount("");
      onClose();
    } catch (err: any) {
      console.error("Pay due error:", err);
      toast.error(err?.response?.data?.detail || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  const displayName = sale.customer_id
    ? sale.profile_name || "Profiled Customer"
    : sale.customer_name || "Walk-in";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 z-50"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-center text-lg font-semibold text-ocean mb-3">
              Pay Due — {displayName}
            </h2>
            

            <div className="bg-gray-50 rounded-xl p-3 mb-3 text-center text-gray-700">
              <p>
                <strong>Total Due:</strong>{" "}
                {totalDue !== null ? `₹${totalDue.toFixed(2)}` : "Calculating..."}
              </p>
              <p className="text-xs text-gray-500">
                (All unpaid sales will be adjusted oldest first)
              </p>
            </div>

            <input
              type="number"
              className="input w-full mb-3"
              placeholder="Enter amount to pay..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button
              className={`btn w-full bg-green-600 ${
                loading ? "opacity-50" : ""
              }`}
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </button>

            <button className="btn w-full bg-gray-400 mt-3" onClick={onClose}>
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
