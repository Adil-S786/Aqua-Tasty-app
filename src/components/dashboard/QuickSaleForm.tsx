// frontend/src/components/dashboard/QuickSaleForm.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

export default function QuickSaleForm({
  customers = [],
  sales = [],
  prefillName = "",
  initialData = null,
  saleDate = null,
  onSaleSaved,
}: {
  customers: any[];
  sales: any[];
  prefillName?: string;
  initialData?: any;
  onSaleSaved?: () => void;
  saleDate?: string | null;
}) {
  const [isProfiled, setIsProfiled] = useState(true);

  const emptyForm = {
    customer_name: "",
    customer_id: null,
    is_profiled: true,
    total_jars: "",
    customer_own_jars: "0",
    price_per_jar: "",
    amount_paid: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previousDue, setPreviousDue] = useState(0); // ⭐ NEW: Fetch from API
  const [jarDue, setJarDue] = useState(0); // ⭐ NEW: Fetch from API

  // ---------------- PREFILL (EDIT / SELL AGAIN) ----------------
  useEffect(() => {
    if (initialData) {
      setIsProfiled(!!initialData.customer_id);
      setForm({
        customer_name:
          initialData.customer_name ||
          initialData.profile_name ||
          prefillName ||
          "",
        customer_id: initialData.customer_id || null,
        is_profiled: !!initialData.customer_id,
        total_jars: initialData.total_jars?.toString() || "",
        customer_own_jars: initialData.customer_own_jars?.toString() || "0",
        price_per_jar: initialData.cost_per_jar?.toString() || "",
        amount_paid: initialData.amount_paid?.toString() || "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData) {
      setForm((f) => ({ ...f, customer_name: prefillName }));
    }
  }, [prefillName]);

  // ---------------- CALCULATIONS ----------------
  const totalAmount =
    Number(form.total_jars || 0) * Number(form.price_per_jar || 0);

  const paidAmount = Number(form.amount_paid || 0);

  // ⭐ NEW: Fetch jar due from API (includes linked accounts)
  useEffect(() => {
    const fetchJarDue = async () => {
      if (isProfiled && !form.customer_id) {
        setJarDue(0);
        return;
      }
      if (!isProfiled && !form.customer_name) {
        setJarDue(0);
        return;
      }

      try {
        const payload = {
          customer_id: isProfiled ? form.customer_id : null,
          customer_name: !isProfiled ? form.customer_name : null,
        };
        const res = await api.post(Endpoints.totalJars, payload);
        setJarDue(res.data.total_jars || 0);
      } catch (err) {
        console.error("Failed to fetch jar due:", err);
        setJarDue(0);
      }
    };

    fetchJarDue();
  }, [isProfiled, form.customer_id, form.customer_name]);

  // ⭐ NEW: Fetch previous due from API (includes linked accounts)
  useEffect(() => {
    const fetchPreviousDue = async () => {
      if (isProfiled && !form.customer_id) {
        setPreviousDue(0);
        return;
      }
      if (!isProfiled && !form.customer_name) {
        setPreviousDue(0);
        return;
      }

      try {
        const payload = {
          customer_id: isProfiled ? form.customer_id : null,
          customer_name: !isProfiled ? form.customer_name : null,
        };
        console.log("Fetching total due with payload:", payload);
        const res = await api.post(Endpoints.totalDue, payload);
        console.log("Total due response:", res.data);
        setPreviousDue(res.data.total_due || 0);
      } catch (err) {
        console.error("Failed to fetch previous due:", err);
        setPreviousDue(0);
      }
    };

    fetchPreviousDue();
  }, [isProfiled, form.customer_id, form.customer_name]);

  // Get customer's advance payment
  const advancePayment = useMemo(() => {
    if (!isProfiled || !form.customer_id) return 0;
    const customer = customers.find((c) => c.id === form.customer_id);
    return customer?.advance_payment || 0;
  }, [customers, isProfiled, form.customer_id]);

  // ⭐ ENHANCED FIFO CALCULATION: Use advance payment + actual payment
  const totalAvailablePayment = paidAmount + advancePayment;
  let remainingPayment = totalAvailablePayment;
  let settledPreviousDue = 0;
  let currentSaleDue = totalAmount;
  
  // First, settle previous dues
  if (remainingPayment > 0 && previousDue > 0) {
    settledPreviousDue = Math.min(remainingPayment, previousDue);
    remainingPayment -= settledPreviousDue;
  }
  
  // Then, settle current sale with remaining payment
  if (remainingPayment > 0) {
    currentSaleDue = Math.max(0, totalAmount - remainingPayment);
  }
  
  // Calculate what previous due will be after this payment
  const remainingPreviousDue = previousDue - settledPreviousDue;
  
  // Calculate how much advance will be used
  const advanceUsed = Math.min(advancePayment, totalAvailablePayment - remainingPayment);
  const remainingAdvance = advancePayment - advanceUsed;

  // ---------------- NAME HANDLING ----------------
  const handleNameChange = (value: string) => {
    setForm({
      ...form,
      customer_name: value,
      customer_id: null,
      is_profiled: isProfiled,
    });

    const profiledList = customers.map((c) => ({
      name: c.name,
      id: c.id,
      price: c.fixed_price_per_jar,
      type: "profiled",
    }));

    const walkins = Array.from(
      new Set(sales.filter((s) => !s.customer_id).map((s) => s.customer_name))
    )
      .filter(Boolean)
      .map((name) => ({
        name,
        id: null,
        price: null,
        type: "walkin",
      }));

    const match = isProfiled
      ? profiledList.filter((c) =>
          c.name.toLowerCase().includes(value.toLowerCase())
        )
      : walkins.filter((c) =>
          c.name.toLowerCase().includes(value.toLowerCase())
        );

    setSuggestions(match);
  };

  const selectCustomer = (c: any) => {
    setForm({
      ...form,
      customer_name: c.name,
      customer_id: c.id,
      is_profiled: true,
      price_per_jar: c.price || "",
    });
    setSuggestions([]);
  };

  // ---------------- SAVE ----------------
  const handleSave = async (e: any) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);

    try {
      // ⭐ SEND FULL PAYMENT - Backend handles FIFO automatically
      const payload = isProfiled
        ? {
            is_profiled: true,
            customer_id: form.customer_id,
            total_jars: Number(form.total_jars),
            customer_own_jars: Number(form.customer_own_jars),
            cost_per_jar: Number(form.price_per_jar),
            amount_paid: paidAmount, // Send full amount, backend handles FIFO
            sale_date: saleDate || null,
          }
        : {
            is_profiled: false,
            customer_name: form.customer_name || "Walk-in",
            total_jars: Number(form.total_jars),
            customer_own_jars: Number(form.customer_own_jars),
            cost_per_jar: Number(form.price_per_jar),
            amount_paid: paidAmount, // Send full amount, backend handles FIFO
            sale_date: saleDate || null,
          };

      if (initialData && initialData.id) {
        const response = await api.put(Endpoints.saleById(initialData.id), payload);
        if (response.data?.advance_payment_message) {
          toast.success(`✅ Sale updated. ${response.data.advance_payment_message}`);
        } else {
          toast.success("✅ Sale updated");
        }
      } else {
        const response = await api.post(Endpoints.sales, payload);
        if (response.data?.advance_payment_message) {
          toast.success(`✅ Sale recorded. ${response.data.advance_payment_message}`);
        } else {
          toast.success("✅ Sale recorded");
        }
      }

      onSaleSaved?.();
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="p-4 rounded-xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg">

      {/* ✅ RESTORED PROFILED / WALK-IN TOGGLE */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold mr-2">
          {isProfiled ? "Profiled" : "Walk-in"}
        </span>

        <div
          onClick={() => {
            setIsProfiled(!isProfiled);
            setSuggestions([]);
          }}
          className={`w-14 h-7 flex items-center rounded-full cursor-pointer
            ${isProfiled ? "bg-green-500" : "bg-gray-400"}`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full transform transition-all
              ${isProfiled ? "translate-x-7" : "translate-x-1"}`}
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-2">
        {/* Name */}
        <div className="relative">
          <input
            className="input"
            placeholder="Customer Name"
            value={form.customer_name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
          />

          {focused && suggestions.length > 0 && (
            <div className="absolute w-full bg-white rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
              {suggestions.map((c, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => selectCustomer(c)}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      c.type === "profiled" ? "bg-green-600" : "bg-gray-500"
                    }`}
                  />
                  <span className="text-sm">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          className="input"
          type="number"
          placeholder="Total Jars"
          value={form.total_jars}
          onChange={(e) => setForm({ ...form, total_jars: e.target.value })}
        />

        {/* Own Jars + Jar Due */}
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-gray-700">
            Customer’s Own Jars
          </label>
          <span className="text-sm text-blue-600">
            Due Jars: {jarDue}
          </span>
        </div>

        <input
          className="input"
          type="number"
          placeholder="0"
          value={form.customer_own_jars}
          onChange={(e) =>
            setForm({ ...form, customer_own_jars: e.target.value })
          }
        />

        <input
          className="input"
          type="number"
          placeholder="Price Per Jar"
          value={form.price_per_jar}
          onChange={(e) => setForm({ ...form, price_per_jar: e.target.value })}
        />

        <div className="text-sm font-semibold text-blue-700">
          Total Amount: ₹{totalAmount.toFixed(2)}
        </div>

        <input
          className="input"
          type="number"
          placeholder="Amount Paid"
          value={form.amount_paid}
          onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
        />

        <div className="text-sm font-semibold text-red-600">
          Total Due: ₹{(currentSaleDue + remainingPreviousDue).toFixed(2)}
          <span className="text-xs text-gray-500 ml-2">
            (Current: ₹{currentSaleDue.toFixed(2)} + Previous: ₹{remainingPreviousDue.toFixed(2)}
            {advancePayment > 0 && ` - Advance: ₹${advancePayment.toFixed(2)}`})
          </span>
        </div>

        {advanceUsed > 0 && (
          <div className="text-sm text-green-600 font-semibold">
            ₹{advanceUsed.toFixed(2)} advance payment will be used
          </div>
        )}

        <button
          disabled={saving}
          className={`btn w-full ${
            saving ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {saving ? "Saving..." : initialData ? "Update Sale" : "Save Sale"}
        </button>
      </form>
    </div>
  );
}
