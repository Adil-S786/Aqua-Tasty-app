"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Sale = {
  id: number;
  customer_id: number | null;
  customer_name: string | null;
  amount_paid: number;
  due_amount: number;
  total_cost: number;
};

export default function ActionSheet({
  isOpen,
  onClose,
  onReturnJar,
  onPayDue,
  onSellAgain,
  onEditSale,
  onDeleteSale,
  selectedSale,
  totalCustomerDue = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReturnJar: () => void;
  onPayDue: () => void;
  onSellAgain: () => void;
  onEditSale: () => void;
  onDeleteSale: (action: "advance" | "settle_dues" | "delete_payment" | "keep_payment") => void;
  selectedSale?: Sale | null;
  totalCustomerDue?: number;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Calculate other dues (total due minus this sale's due)
  const otherDues = totalCustomerDue - (selectedSale?.due_amount || 0);
  const hasOtherDues = otherDues > 0;

  const handleDeleteClick = () => {
    if (!selectedSale) return;

    // Case 1: Sale has payment → Ask to delete payment or keep it
    if (selectedSale.amount_paid > 0) {
      setShowDeleteDialog(true);
    }
    // Case 2: Sale has no payment but was fully paid (due = 0, total_cost > 0)
    // Auto-handle: if other dues exist → settle them, else → add to advance
    else if (selectedSale.due_amount === 0 && selectedSale.total_cost > 0) {
      if (hasOtherDues) {
        onDeleteSale("settle_dues");
      } else {
        onDeleteSale("advance");
      }
    }
    // Case 3: Sale with due remaining or zero cost → Just delete
    else {
      onDeleteSale("advance");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setShowDeleteDialog(false);
              onClose();
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Delete Dialog for PAYMENT */}
          {showDeleteDialog && selectedSale && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[60] px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm">
                <h3 className="text-lg font-semibold text-center text-gray-800 mb-2">
                  Delete Sale
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  This sale has ₹{selectedSale.amount_paid} payment recorded. Delete payment also?
                </p>

                <div className="space-y-2">
                  <button
                    className="btn w-full bg-red-600 text-white"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      onDeleteSale("delete_payment");
                    }}
                  >
                    🗑️ Yes, Delete Payment Also
                  </button>

                  <button
                    className="btn w-full bg-green-600 text-white"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      onDeleteSale("keep_payment");
                    }}
                  >
                    💰 No, Keep Payment (→ Advance/Settle)
                  </button>

                  <button
                    className="btn w-full bg-gray-400 text-white mt-2"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 z-50"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-center text-lg font-semibold text-ocean mb-3">
              Sale Actions
            </h2>

            <div className="space-y-2">
              <button className="btn w-full bg-green-600" onClick={onSellAgain}>
                Sell Again
              </button>
              <button className="btn w-full bg-yellow-500" onClick={onPayDue}>
                Pay Due
              </button>
              <button className="btn w-full bg-blue-600" onClick={onReturnJar}>
                Return Jar
              </button>
              <button className="btn w-full bg-indigo-600" onClick={onEditSale}>
                ✏️ Edit Sale
              </button>
              <button className="btn w-full bg-red-600" onClick={handleDeleteClick}>
                🗑️ Delete Sale
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
