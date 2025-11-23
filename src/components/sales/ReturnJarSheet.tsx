"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

// centralized API imports
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

export default function ReturnJarSheet({
  isOpen,
  onClose,
  sale,
  refreshData,
}: {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  refreshData: () => Promise<void>;
}) {
  const [currentDue, setCurrentDue] = useState(0);
  const [returnCount, setReturnCount] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch live due jars for this customer
  useEffect(() => {
    const fetchDue = async () => {
      if (!sale || !isOpen) return;
      try {
        const res = await api.get(Endpoints.jarTracking);
        const list = res.data;

        let entry;
        if (sale.customer_id) {
          entry = list.find((j: any) => j.customer_id === sale.customer_id);
        } else {
          entry = list.find((j: any) => j.customer_name === sale.customer_name);
        }

        setCurrentDue(entry?.current_due_jars || 0);
      } catch (err) {
        console.error("Error fetching jar tracking:", err);
        setCurrentDue(0);
      }
    };

    fetchDue();
  }, [sale, isOpen]);

  const handleReturn = async () => {
    if (!returnCount || Number(returnCount) <= 0) {
      toast.error("Please enter a valid number of jars to return.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: sale.customer_id || null,
        customer_name: sale.customer_name || null,
        returned_count: Number(returnCount),
      };

      // POST to backend; backend (FIFO) returns remaining_due etc.
      const res = await api.post(Endpoints.jarReturn, payload);

      // Prefer backend-calculated remaining due if provided
      const remaining_due =
        res.data?.remaining_due ?? res.data?.remaining_due_jars ?? null;

      // Update displayed current due from response (if present)
      if (typeof remaining_due === "number") {
        setCurrentDue(remaining_due);
      } else {
        // fallback: re-fetch jartracking entries after refreshData
        // (the refreshData below will update the parent's state)
      }

      toast.success(
        `✅ Jars returned: ${Number(returnCount)}. Remaining due: ₹${remaining_due ?? "updated"}`
      );

      setReturnCount("");

      // refresh parent data (must await so UI uses fresh values)
      if (refreshData) {
        await refreshData();
      } else {
        // as fallback, re-fetch local jartracking
        try {
          const r = await api.get(Endpoints.jarTracking);
          const list = r.data;
          let entry;
          if (sale.customer_id) {
            entry = list.find((j: any) => j.customer_id === sale.customer_id);
          } else {
            entry = list.find((j: any) => j.customer_name === sale.customer_name);
          }
          setCurrentDue(entry?.current_due_jars || 0);
        } catch (e) {
          console.error("fallback jartracking fetch failed", e);
        }
      }

      // small delay to let UI show toast and refreshed values
      setTimeout(() => onClose(), 180);
    } catch (err: any) {
      console.error("Return jars error:", err);
      toast.error(
        err?.response?.data?.detail || err?.response?.data?.message || "Failed to return jars"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full p-4 shadow-xl">
        <h2 className="text-lg font-semibold text-ocean text-center">Return Jars</h2>

        <p className="text-center text-sm text-gray-600 mt-1">
          Customer: <b>{sale?.customer_name ?? sale?.profile_name ?? "Walk-in"}</b>
        </p>

        {/* LIVE Jar Due */}
        <p className="text-center text-lg font-bold text-blue-700 mt-2">
          Current Jar Due: {currentDue}
        </p>

        <input
          className="input mt-3"
          placeholder="Number of jars returning"
          type="number"
          min={0}
          value={returnCount}
          onChange={(e) => setReturnCount(e.target.value)}
        />

        <div className="flex gap-3 mt-4">
          <button
            className={`btn flex-1 ${loading ? "opacity-50" : ""}`}
            onClick={handleReturn}
            disabled={loading}
          >
            {loading ? "Processing..." : "Return"}
          </button>
          <button className="btn flex-1 bg-gray-400" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
