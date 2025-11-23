"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

export default function EditProfilePopup({
  isOpen,
  onClose,
  customer,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSaved: (updated: any) => void;   // ⭐ send updated data
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    fixed_price_per_jar: "",
    delivery_type: "self",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        fixed_price_per_jar: customer.fixed_price_per_jar || "",
        delivery_type: customer.delivery_type || "self",
      });
    }
  }, [customer, isOpen]);

  // Check duplicate
  const checkDuplicateName = async () => {
    const newName = form.name.trim().toLowerCase();
    const oldName = customer.name.trim().toLowerCase();

    if (newName === oldName) return false;

    try {
      const res = await api.get(
        `${Endpoints.checkCustomerName}?name=${encodeURIComponent(form.name)}`
      );
      return res.data.exists;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setLoading(true);

    const exists = await checkDuplicateName();
    if (exists) {
      toast.error("A profiled customer with this name already exists");
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      fixed_price_per_jar: Number(form.fixed_price_per_jar) || 0,
      delivery_type: form.delivery_type,
    };

    try {
      await api.put(`${Endpoints.customers}/${customer.id}`, payload);

      toast.success("Profile updated!");

      onSaved(payload);   // ⭐ return updated data
      onClose();

    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
          >
            <div className="bg-white dark:bg-[#0C3C40] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-center mb-4">
                Edit Customer Profile
              </h2>

              <div className="space-y-3">
                <input
                  className="input"
                  placeholder="Customer Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  className="input"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <input
                  className="input"
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />

                <input
                  className="input"
                  type="number"
                  placeholder="Fixed Price per Jar"
                  value={form.fixed_price_per_jar}
                  onChange={(e) =>
                    setForm({ ...form, fixed_price_per_jar: e.target.value })
                  }
                />

                <select
                  className="input"
                  value={form.delivery_type}
                  onChange={(e) =>
                    setForm({ ...form, delivery_type: e.target.value })
                  }
                >
                  <option value="self">Self Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="mt-5 flex gap-2">
                <button className="btn bg-gray-400" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn bg-[#045b68] text-white" onClick={handleSave}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
