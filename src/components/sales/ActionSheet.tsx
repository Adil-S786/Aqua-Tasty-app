"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function ActionSheet({
  isOpen,
  onClose,
  onReturnJar,
  onPayDue,
  onSellAgain,
  onEditSale,
  onDeleteSale,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReturnJar: () => void;
  onPayDue: () => void;
  onSellAgain: () => void;
  onEditSale: () => void;
  onDeleteSale: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

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
              {/* NEW BUTTONS */}
              <button className="btn w-full bg-indigo-600" onClick={onEditSale}>
                ✏️ Edit Sale
              </button>

              <button className="btn w-full bg-red-600" onClick={onDeleteSale}>
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
