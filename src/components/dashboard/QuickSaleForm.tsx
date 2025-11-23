// frontend\src\components\dashboard\QuickSaleForm.tsx
"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

export default function QuickSaleForm({
  customers = [],
  sales = [],
  prefillName = "",
  initialData = null,      // ⭐ NEW
  saleDate = null,
  onSaleSaved,
}: {
  customers: any[];
  sales: any[];
  prefillName?: string;
  initialData?: any;       // ⭐ NEW
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

  // ⭐ NEW — Prefill form when editing a sale
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

  // Prefill name when Sell Again
  useEffect(() => {
    if (!initialData) {
      setForm((f) => ({ ...f, customer_name: prefillName }));
    }
  }, [prefillName]);

  // Auto calculations
  const totalAmount =
    Number(form.total_jars || 0) * Number(form.price_per_jar || 0);

  const dueAmount =
    totalAmount - Number(form.amount_paid || 0) > 0
      ? totalAmount - Number(form.amount_paid || 0)
      : 0;

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

    let match = [];

    if (isProfiled) {
      match = profiledList.filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      match = walkins.filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
    }

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

  const handleSave = async (e: any) => {
    e.preventDefault();

    if (isProfiled) {
      const profiled = customers.find(
        (c) => c.name.toLowerCase() === form.customer_name.toLowerCase()
      );

      if (!profiled) {
        toast.error("❌ Profile does not exist!");
        return;
      }
    } else {
      const exists = customers.find(
        (c) => c.name.toLowerCase() === form.customer_name.toLowerCase()
      );
      if (exists) {
        toast.error("❌ Profile exists. Use profiled mode.");
        return;
      }
    }

    try {
      // ⭐ Always normalize walk-in name on frontend
      if (!isProfiled && form.customer_name) {
        const clean = form.customer_name.trim().replace(/\s+/g, " ");
        form.customer_name = clean
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
      const payload = isProfiled
        ? {
          is_profiled: true,
          customer_id: form.customer_id,
          total_jars: Number(form.total_jars),
          customer_own_jars: Number(form.customer_own_jars),
          cost_per_jar: Number(form.price_per_jar),
          amount_paid: Number(form.amount_paid || 0),
          sale_date: saleDate || null,
        }
        : {
          is_profiled: false,
          customer_name: form.customer_name || "Walk-in",
          total_jars: Number(form.total_jars),
          customer_own_jars: Number(form.customer_own_jars),
          cost_per_jar: Number(form.price_per_jar),
          amount_paid: Number(form.amount_paid || 0),
          sale_date: saleDate || null,
        };

      // ⭐ NEW — EDIT MODE (PUT)
      if (initialData && initialData.id) {
        await api.put(Endpoints.saleById(initialData.id), payload);
        toast.success("✅ Sale updated!");
      } else {
        await api.post(Endpoints.sales, payload);
        toast.success("✅ Sale recorded!");
      }

      onSaleSaved?.();
      setForm(emptyForm);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Error";

      // ⭐ Detect backend error for duplicate walk-in customer
      if (
        msg.toLowerCase().includes("walk-in") &&
        msg.toLowerCase().includes("already exists")
      ) {
        toast.error("🚫 Walk-in customer with same name already exists!");
        return;
      }

      // ⭐ Detect backend error for profiled duplicate name
      if (
        msg.toLowerCase().includes("customer") &&
        msg.toLowerCase().includes("already exists")
      ) {
        toast.error("🚫 A profiled customer with this name already exists!");
        return;
      }

      // default
      toast.error(msg);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg">

      {/* Simple Toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold mr-2">
          {isProfiled ? "Profiled" : "Walk-in"}
        </span>

        <div
          onClick={() => {
            setIsProfiled(!isProfiled);
            setSuggestions([]);
          }}
          className={`w-14 h-7 flex items-center rounded-full cursor-pointer transition-all 
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
            onBlur={() => {
              setTimeout(() => setFocused(false), 150);

              // ⭐ Normalize only when user finishes typing
              if (!isProfiled && form.customer_name) {
                const clean = form.customer_name.trim().replace(/\s+/g, " ");
                const normalized = clean
                  .split(" ")
                  .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                  .join(" ");

                setForm((f) => ({ ...f, customer_name: normalized }));
              }
            }}
          />

          {focused && suggestions.length > 0 && (
            <div className="absolute w-full bg-white rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
              {suggestions.map((c, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => selectCustomer(c)}
                >
                  <span className="flex items-center justify-center w-3 h-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${c.type === "profiled" ? "bg-green-600" : "bg-gray-500"
                        }`}
                    />
                  </span>
                  <span className="text-sm">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jars */}
        <input
          className="input"
          type="number"
          placeholder="Total Jars"
          value={form.total_jars}
          onChange={(e) => setForm({ ...form, total_jars: e.target.value })}
        />

        {/* Own Jars */}
        <label className="text-sm font-semibold text-gray-700">
          Customer’s Own Jars
        </label>
        <input
          className="input mb-2"
          type="number"
          placeholder="0"
          value={form.customer_own_jars}
          onChange={(e) =>
            setForm({ ...form, customer_own_jars: e.target.value })
          }
        />

        {/* Price */}
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

        {/* Paid */}
        <input
          className="input"
          type="number"
          placeholder="Amount Paid"
          value={form.amount_paid}
          onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
        />

        <div className="text-sm font-semibold text-red-600">
          Due Amount: ₹{dueAmount.toFixed(2)}
        </div>

        {/* ⭐ NEW — dynamic button label */}
        <button className="btn w-full">
          {initialData ? "Update Sale" : "Save Sale"}
        </button>
      </form>
    </div>
  );
}
