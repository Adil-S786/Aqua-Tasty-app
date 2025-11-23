"use client";
import { AnimatePresence, motion } from "framer-motion";

export default function ExpenseActionSheet({
  isOpen,
  onClose,
  expense,
  onEdit,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!expense) return null;

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
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 z-50"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-center text-lg font-semibold text-ocean mb-1">
              Expense Options
            </h2>

            <p className="text-center text-gray-600 mb-3">
              {expense.description} – ₹{expense.amount}
            </p>

            <div className="space-y-2">
              <button className="btn w-full bg-yellow-500" onClick={onEdit}>
                ✏️ Edit Expense
              </button>

              <button className="btn w-full bg-red-600" onClick={onDelete}>
                🗑 Delete Expense
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
