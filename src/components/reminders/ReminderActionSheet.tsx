"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { Reminder } from "./ReminderTable";

export default function ReminderActionSheet({
  isOpen,
  onClose,
  reminder,
  onEdit,
  onComplete,
  onSkip,
  onReschedule,
  onMoveTomorrow,
  onMarkInactive,
}: {
  isOpen: boolean;
  onClose: () => void;
  reminder: Reminder | null;
  onEdit: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onReschedule: () => void;
  onMoveTomorrow: () => void;
  onMarkInactive?: () => void;
}) {
  if (!reminder) return null;

  const isOverdue = new Date(reminder.next_date) < new Date();
  const isPending = reminder.status === "pending" || reminder.status === "scheduled";
  const frequency = typeof reminder.frequency === 'string' ? parseInt(reminder.frequency) : reminder.frequency;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#062E33] rounded-t-3xl shadow-2xl p-6 z-50 max-h-[80vh] overflow-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-[#045b68] dark:text-[#B4F2EE]">
                Reminder Actions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {reminder.customer_name || reminder.custom_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                {reminder.reason} • {new Date(reminder.next_date).toLocaleDateString("en-IN")}
                {isOverdue && <span className="text-red-600 font-semibold ml-2">OVERDUE</span>}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Complete - Only for pending/scheduled */}
              {isPending && (
                <button
                  className="w-full px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                >
                  ✅ Mark Complete
                </button>
              )}

              {/* Reschedule */}
              <button
                className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  onReschedule();
                  onClose();
                }}
              >
                📅 Reschedule
              </button>

              {/* Move to Tomorrow */}
              {isPending && (
                <button
                  className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    onMoveTomorrow();
                    onClose();
                  }}
                >
                  ➡️ Move to Tomorrow
                </button>
              )}

              {/* Skip - Only for pending/scheduled with frequency */}
              {isPending && Number(frequency) > 0 && (
                <button
                  className="w-full px-4 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    onSkip();
                    onClose();
                  }}
                >
                  ⏭️ Skip (Move to Next)
                </button>
              )}

              {/* Edit */}
              <button
                className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  onEdit();
                  onClose();
                }}
              >
                ✏️ Edit Reminder
              </button>

              {/* Mark Inactive - Only for profiled customers */}
              {reminder.customer_id && onMarkInactive && (
                <button
                  className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    onMarkInactive();
                    onClose();
                  }}
                >
                  🔴 Mark Customer Inactive
                </button>
              )}

              {/* Cancel */}
              <button
                className="w-full px-4 py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
