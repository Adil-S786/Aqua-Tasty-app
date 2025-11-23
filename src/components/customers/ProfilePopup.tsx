"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import EditProfilePopup from "./EditProfilePopup";

export default function ProfilePopup({
  isOpen,
  onClose,
  customer,
  refreshAll,
  onPayDueClick,
  onUpdateCustomerFromPopup,

  // ⭐ Walk-in / read-only mode
  disableEdit = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  refreshAll: () => Promise<void>;
  onPayDueClick?: (customer: any) => void;
  onUpdateCustomerFromPopup: (updated: any) => void;
  disableEdit?: boolean;
}) {
  const [sales, setSales] = useState<any[]>([]);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [jarDue, setJarDue] = useState<number>(0);
  const [editOpen, setEditOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [localCustomer, setLocalCustomer] = useState(customer);

  useEffect(() => {
    setLocalCustomer(customer);
  }, [customer]);

  // -------------------------------------------------------------
  // ⭐ NEW: Fetch WALK-IN BILL (when disableEdit = true)
  // -------------------------------------------------------------
  const fetchWalkinBill = async () => {
    try {
      const res = await api.get(`/walkin/bill?name=${encodeURIComponent(customer.name)}`);

      setJarDue(res.data.jar_due || 0);
      setTotalDue(res.data.total_due || 0);
      setSales(res.data.pending_sales || []);
      setLastPayment(res.data.last_payment || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load walk-in bill");
    }
  };

  // -------------------------------------------------------------
  // Existing — Fetch PROFILE (only if customer is profiled)
  // -------------------------------------------------------------
  const fetchProfileData = async () => {
    if (!customer?.id) return; // protect walk-in

    try {
      const [salesRes, jarRes, payRes] = await Promise.all([
        api.get(`${Endpoints.sales}/history/${customer.id}`),
        api.get(`${Endpoints.jarTracking}?customer_id=${customer.id}`),
        api.get(`${Endpoints.payments}?customer_id=${customer.id}`),
      ]);

      const filtered = salesRes.data.filter((s: any) => s.due_amount > 0);
      setSales(filtered);

      setTotalDue(filtered.reduce((sum: number, s: any) => sum + s.due_amount, 0));

      const jarTrackRow = jarRes.data.find((jt: any) => jt.customer_id === customer.id);
      setJarDue(jarTrackRow ? jarTrackRow.current_due_jars : 0);

      const custPayments = payRes.data.filter((p: any) => p.customer_id === customer.id);
      if (custPayments.length > 0) {
        const latest = custPayments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        setLastPayment(latest);
      } else {
        setLastPayment(null);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
    }
  };

  // -------------------------------------------------------------
  // Decide which fetch to run
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    if (disableEdit) {
      // ⭐ WALK-IN MODE
      fetchWalkinBill();
    } else {
      // ⭐ PROFILE MODE
      fetchProfileData();
    }
  }, [isOpen, disableEdit]);

  // -------------------------------------------------------------
  // Print
  // -------------------------------------------------------------
  const handlePrint = async () => {
    if (typeof window === "undefined" || !printRef.current) return;

    toast.loading("Generating PDF...", { id: "pdf" });

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = printRef.current.cloneNode(true) as HTMLElement;

      const footer = document.createElement("div");
      footer.style.textAlign = "center";
      footer.style.marginTop = "20px";
      footer.style.fontSize = "10px";
      footer.innerText = `Generated • ${new Date().toLocaleString("en-IN")}`;
      el.appendChild(footer);

      await (html2pdf() as any)
        .from(el)
        .set({
          margin: 10,
          filename: `${localCustomer.name}_bill.pdf`,
          image: { type: "jpeg", quality: 1 },
          html2canvas: { scale: 1.4, useCORS: true },
          jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        })
        .save();

      toast.success("PDF downloaded!", { id: "pdf" });
    } catch (err) {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  };

  // -------------------------------------------------------------
  // Delete (blocked in walk-in mode)
  // -------------------------------------------------------------
  const handleDelete = async () => {
    if (disableEdit) return;

    if (totalDue > 0 || jarDue > 0) {
      toast.error("Cannot delete. Pending dues/jars exist.");
      return;
    }

    if (!confirm(`Delete ${localCustomer.name}?`)) return;

    try {
      await api.delete(`${Endpoints.customers}/${customer.id}`);
      toast.success("Customer deleted!");
      onClose();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Popup */}
          <motion.div
            className="fixed inset-4 md:inset-10 bg-white dark:bg-[#062E33] rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-[#045b68] dark:text-[#B4F2EE]">
                {disableEdit ? "Walk-in Bill" : `Profile — ${localCustomer?.name}`}
              </h2>

              <div className="flex items-center gap-2">
                {/* Print */}
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                >
                  🖨️ Print
                </button>

                {/* Pay Due */}
                <button
                  onClick={() => onPayDueClick?.(customer)}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
                >
                  💰 Pay Due
                </button>

                {/* Edit → hidden */}
                {!disableEdit && (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 text-sm"
                  >
                    ✏️ Edit
                  </button>
                )}

                {/* Delete → hidden */}
                {!disableEdit && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm"
                  >
                    🗑️ Delete
                  </button>
                )}

                <button onClick={onClose} className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div ref={printRef} className="p-5 overflow-y-auto text-sm flex-1 space-y-4">

              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-[#0C3C40] rounded-2xl p-4">
                <h3 className="text-lg font-medium text-[#045b68] dark:text-[#B4F2EE] mb-2">
                  Customer Information
                </h3>
                <p><strong>Name:</strong> {localCustomer.name}</p>
                <p><strong>Address:</strong> {localCustomer.address || "—"}</p>
                <p><strong>Phone:</strong> {localCustomer.phone || "—"}</p>
                <p><strong>Delivery Type:</strong> {localCustomer.delivery_type}</p>
                <p><strong>Fixed Price:</strong> ₹{localCustomer.fixed_price_per_jar || "—"}</p>
                <p><strong>Jars Due:</strong> {jarDue}</p>
              </div>

              {/* Bills */}
              <div className="bg-white dark:bg-[#0C3C40] rounded-2xl shadow p-4">
                <h3 className="text-lg font-medium mb-2 text-[#045b68] dark:text-[#B4F2EE]">
                  Outstanding Bills
                </h3>

                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-center p-2">Total</th>
                      <th className="text-center p-2">Paid</th>
                      <th className="text-center p-2">Due</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-2">
                          {new Date(s.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="text-center p-2">₹{s.total_cost}</td>
                        <td className="text-center p-2 text-green-600">₹{s.amount_paid}</td>
                        <td className="text-center p-2 text-red-600 font-semibold">₹{s.due_amount}</td>
                      </tr>
                    ))}

                    {sales.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-4 text-gray-500 dark:text-gray-300">
                          No pending bills 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {sales.length > 0 && (
                    <tfoot>
                      <tr className="font-semibold border-t border-gray-300 dark:border-gray-700">
                        <td className="p-2">Total Due</td>
                        <td></td><td></td>
                        <td className="text-center p-2 text-red-700">₹{totalDue.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Last Payment */}
              <div className="bg-gray-50 dark:bg-[#0C3C40] rounded-2xl p-4">
                <h3 className="text-lg font-medium text-[#045b68] dark:text-[#B4F2EE] mb-2">
                  Last Payment
                </h3>

                {lastPayment ? (
                  <>
                    <p><strong>Amount:</strong> ₹{lastPayment.amount_paid}</p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(lastPayment.date).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </>
                ) : (
                  <p>No payment record found.</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Edit Popup */}
          {!disableEdit && (
            <EditProfilePopup
              isOpen={editOpen}
              onClose={() => setEditOpen(false)}
              customer={customer}
              onSaved={async (updated) => {
                setLocalCustomer((prev: any) => ({ ...prev, ...updated }));
                onUpdateCustomerFromPopup(updated);
                setEditOpen(false);
                await refreshAll();
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
