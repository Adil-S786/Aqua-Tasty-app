"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

type NewCustomer = {
  name: string;
  phone?: string | null;
  address?: string | null;
  fixed_price_per_jar?: number | null;
  delivery_type?: "self" | "delivery";
};

export default function AddCustomerSheet({
  isOpen,
  onClose,
  onSaved,
  prefillName = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (created: any, convertedFromName?: string) => void;
  prefillName?: string;
}) {
  const [form, setForm] = useState<NewCustomer>({
    name: prefillName || "",
    phone: "",
    address: "",
    fixed_price_per_jar: null,
    delivery_type: "self",
  });

  useEffect(() => {
    setForm({
      name: prefillName || "",
      phone: "",
      address: "",
      fixed_price_per_jar: null,
      delivery_type: "self",
    });
  }, [prefillName, isOpen]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);

    // unified payload for convert API (it works for both modes)
    const payload = {
      customer_name: prefillName || null,   // walk-in name (only in convert)
      name: form.name.trim(),
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
      fixed_price_per_jar: form.fixed_price_per_jar,
      delivery_type: form.delivery_type,
    };

    try {
      if (prefillName) {
        // ------------------------------------------------------
        // 🔥 CONVERT MODE — DO NOT CREATE CUSTOMER HERE
        // ------------------------------------------------------
        onSaved({ mode: "convert", data: payload });
      } else {
        // ------------------------------------------------------
        // 🔥 NORMAL ADD CUSTOMER MODE — create customer
        // ------------------------------------------------------
        const res = await api.post(Endpoints.customers, payload);
        onSaved({ mode: "add", data: res.data.customer });
      }

      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };


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
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 z-50 max-h-[90vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-center text-lg font-semibold text-ocean mb-3">
              {prefillName ? "Convert to Profiled" : "Add Customer"}
            </h2>

            <div className="space-y-2">
              <input
                className="input"
                placeholder="Customer Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                className="input"
                placeholder="Phone"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <textarea
                className="input"
                placeholder="Address"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <input
                className="input"
                type="number"
                placeholder="Fixed Price per Jar"
                value={form.fixed_price_per_jar ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fixed_price_per_jar:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />

              <div className="bg-white/70 rounded-xl p-2 border">
                <p className="text-sm font-medium text-[#045b68] mb-1">
                  Delivery Type
                </p>

                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delivery_type"
                      checked={form.delivery_type === "self"}
                      onChange={() =>
                        setForm({ ...form, delivery_type: "self" })
                      }
                    />
                    <span>Self Pickup</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delivery_type"
                      checked={form.delivery_type === "delivery"}
                      onChange={() =>
                        setForm({ ...form, delivery_type: "delivery" })
                      }
                    />
                    <span>Home Delivery</span>
                  </label>
                </div>
              </div>


              <button disabled={saving} className="btn w-full" onClick={handleSave}>
                {saving ? "Saving..." : prefillName ? "Convert & Save" : "Save"}
              </button>

              <button className="btn w-full bg-gray-400" onClick={onClose}>
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
