"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

export default function OldPayDueSheet({
  isOpen,
  onClose,
  onSaved,
  customers = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  customers: any[];
}) {
  const [isProfiled, setIsProfiled] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [focused, setFocused] = useState(false);

  // Set default date to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setPaymentDate(today);
    }
  }, [isOpen]);

  const handleNameChange = (value: string) => {
    setCustomerName(value);
    setCustomerId(null);

    if (isProfiled) {
      const match = customers.filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(match);
    }
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.name);
    setCustomerId(c.id);
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!customerName) {
      toast.error("Please enter customer name");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!paymentDate) {
      toast.error("Please select a payment date");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: isProfiled ? customerId : null,
        customer_name: customerName,
        amount: parseFloat(amount),
        payment_date: new Date(paymentDate).toISOString(),
      };

      await api.post(Endpoints.createBackdatedPayment, payload);
      toast.success("✅ Backdated payment recorded and dues settled!");
      
      // Reset form
      setCustomerName("");
      setCustomerId(null);
      setAmount("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        key="sheet"
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#062E33] rounded-t-2xl shadow-xl p-6 z-50 max-h-[90vh] overflow-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[#045b68] dark:text-[#B4F2EE] mb-4">
          📅 Backdate Payment
        </h2>

        {/* Profiled / Walk-in Toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold">
            {isProfiled ? "Profiled" : "Walk-in"}
          </span>
          <div
            onClick={() => {
              setIsProfiled(!isProfiled);
              setCustomerName("");
              setCustomerId(null);
              setSuggestions([]);
            }}
            className={`w-14 h-7 flex items-center rounded-full cursor-pointer ${
              isProfiled ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full transform transition-all ${
                isProfiled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </div>
        </div>

        {/* Customer Name */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1">Customer Name</label>
          <input
            className="input w-full"
            placeholder="Enter customer name..."
            value={customerName}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
          />

          {focused && suggestions.length > 0 && isProfiled && (
            <div className="absolute w-full bg-white rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 mt-1">
              {suggestions.map((c) => (
                <div
                  key={c.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectCustomer(c)}
                >
                  <span className="text-sm">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount Paid</label>
          <input
            type="number"
            className="input w-full"
            placeholder="Enter amount..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Payment Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Payment Date</label>
          <input
            type="date"
            className="input w-full"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            className={`w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Record Payment"}
          </button>

          <button
            className="w-full px-4 py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
