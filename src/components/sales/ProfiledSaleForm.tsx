"use client";
import { useState } from "react";

// ✅ Centralized API imports
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

export default function ProfiledSaleForm({
  customer,
  onSaleSaved,
}: {
  customer: { id: number; name: string; fixed_price_per_jar?: number | null };
  onSaleSaved?: () => void;
}) {
  const [form, setForm] = useState({
    total_jars: "",
    customer_own_jars: "0",
    price_per_jar: customer.fixed_price_per_jar?.toString() || "",
    amount_paid: "",
  });

  const saveSale = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        is_profiled: true,
        customer_id: customer.id,
        total_jars: Number(form.total_jars),
        customer_own_jars: Number(form.customer_own_jars),
        cost_per_jar: form.price_per_jar
          ? Number(form.price_per_jar)
          : undefined,
        amount_paid: Number(form.amount_paid),
      };

      // ✅ Centralized API call
      await api.post(Endpoints.sales, payload);

      alert("✅ Sale Saved Successfully (Profiled Customer)");

      setForm({
        total_jars: "",
        customer_own_jars: "0",
        price_per_jar: customer.fixed_price_per_jar?.toString() || "",
        amount_paid: "",
      });

      onSaleSaved?.();
    } catch (err: any) {
      alert("❌ " + (err.response?.data?.detail || "Failed"));
    }
  };

  return (
    <form onSubmit={saveSale} className="space-y-2">
      <p className="text-sm text-ocean font-medium">
        Customer: <span className="font-semibold">{customer.name}</span>
      </p>

      <input
        className="input"
        placeholder="Total Jars"
        type="number"
        value={form.total_jars}
        onChange={(e) => setForm({ ...form, total_jars: e.target.value })}
      />

      <input
        className="input"
        placeholder="Customer’s Own Jars"
        type="number"
        value={form.customer_own_jars}
        onChange={(e) =>
          setForm({ ...form, customer_own_jars: e.target.value })
        }
      />

      <input
        className="input"
        placeholder="Price Per Jar"
        type="number"
        value={form.price_per_jar}
        onChange={(e) =>
          setForm({ ...form, price_per_jar: e.target.value })
        }
      />

      <input
        className="input"
        placeholder="Amount Paid"
        type="number"
        value={form.amount_paid}
        onChange={(e) =>
          setForm({ ...form, amount_paid: e.target.value })
        }
      />

      <button className="btn w-full">Save Sale</button>
    </form>
  );
}
