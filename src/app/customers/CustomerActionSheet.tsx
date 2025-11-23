"use client";
import { AnimatePresence, motion } from "framer-motion";

export default function CustomerActionSheet({
  isOpen,
  onClose,
  row,
  onSellAgain,
  onPayDue,
  onReturnJar,
  onProfileOrConvert,
  onViewBill,
}: {
  isOpen: boolean;
  onClose: () => void;
  row: any;
  onSellAgain: () => void;
  onPayDue: () => void;
  onReturnJar: () => void;
  onProfileOrConvert: () => void;
  onViewBill: () => void;
}) {
  const title = row?.is_profiled ? "Customer Profile" : "Walk-in Customer";

  
  
  return (
    <AnimatePresence>
      {isOpen && row && (
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
            <h2 className="text-center text-lg font-semibold text-ocean mb-1">{title}</h2>
            <p className="text-center text-sm text-gray-600 mb-3">{row.name}</p>

            <div className="space-y-2">
              <button className="btn w-full bg-green-600" onClick={onSellAgain}>
                Sell Again
              </button>
              <button className="btn w-full bg-yellow-500" onClick={onPayDue}>
                Pay Due
              </button>
              <button className="btn w-full bg-blue-600" onClick={onReturnJar}>
                Return Jars
              </button>

              <button className="btn w-full bg-indigo-600" onClick={onProfileOrConvert}>
                {row.is_profiled ? "View Profile" : "Convert to Profiled"}
              </button>

              {!row.is_profiled && (
                <button className="btn w-full bg-purple-600" onClick={onViewBill}>
                  View Bill
                </button>
              )}

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
