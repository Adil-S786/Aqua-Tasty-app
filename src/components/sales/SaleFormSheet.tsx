// frontend/src/components/sales/SaleFormSheet.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuickSaleForm from "../dashboard/QuickSaleForm";

export default function SaleFormSheet({
  isOpen,
  onClose,
  customerName = "",
  customers = [],
  sales = [],
  editingSale = null,
  incomingSaleDate = null,
  forceOldSaleMode = false,
  allowBackdateButton = true,
  showHeading = false,   // ⭐ NEW (Dashboard only)
  refreshAll,
}: {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  customers: any[];
  sales: any[];
  editingSale?: any;
  incomingSaleDate?: Date | null;
  forceOldSaleMode?: boolean;
  allowBackdateButton?: boolean;
  showHeading?: boolean;
  refreshAll: () => void;
}) {
  const handleClose = () => onClose();

  // ---------- LOCAL STATE ----------
  const [isOldSale, setIsOldSale] = useState<boolean>(false);
  const [localSaleDate, setLocalSaleDate] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setIsOldSale(Boolean(forceOldSaleMode));

      const defaultDate =
        incomingSaleDate instanceof Date
          ? incomingSaleDate.toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

      setLocalSaleDate(defaultDate);
    }
  }, [isOpen, forceOldSaleMode, incomingSaleDate]);

  // Title for normal usage
  const title = editingSale
    ? "Edit Sale"
    : isOldSale
    ? "Old Sale (Backdate)"
    : customerName
    ? `Sell Again to ${customerName}`
    : "New Sale";

  const formattedSaleDate = isOldSale ? localSaleDate : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 z-50"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* ===================== */}
            {/* ⭐ HEADING LOGIC HERE */}
            {/* ===================== */}

            {showHeading ? (
              <h2 className="text-center text-lg font-semibold text-ocean mb-3">
                Quick Sell
              </h2>
            ) : (
              <h2 className="text-center text-lg font-semibold text-ocean mb-3">
                {title}
              </h2>
            )}

            {/* OLD SALE DATE PICKER */}
            {isOldSale && (
              <div className="mb-3">
                <label className="font-semibold text-sm">Select Sale Date</label>
                <input
                  type="date"
                  className="input mt-1"
                  max={new Date().toISOString().slice(0, 10)}
                  value={localSaleDate}
                  onChange={(e) => setLocalSaleDate(e.target.value)}
                />
              </div>
            )}

            {/* MAIN SALE FORM */}
            <QuickSaleForm
              customers={customers}
              sales={sales}
              prefillName={customerName}
              initialData={editingSale}
              saleDate={formattedSaleDate}
              onSaleSaved={() => {
                refreshAll();
                handleClose();
              }}
            />

            {/* OLD SALE BUTTON (only when allowed) */}
            {!editingSale &&
              allowBackdateButton &&
              !forceOldSaleMode &&
              !isOldSale && (
                <button
                  className="btn w-full bg-purple-600 mt-3"
                  onClick={() => setIsOldSale(true)}
                >
                  Old Sale (Backdate)
                </button>
              )}

            <button className="btn w-full bg-gray-400 mt-3" onClick={handleClose}>
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
