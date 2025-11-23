"use client";

export default function PendingReminderDrawer({
  isOpen,
  onClose,
  reminders = [],
}: any) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-80 bg-white z-50 shadow-xl p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-3">Today's Reminders</h2>

        {reminders.length === 0 ? (
          <p className="text-gray-500">No pending reminders today.</p>
        ) : (
          reminders.map((r: any) => (
            <div key={r.id} className="border-b py-2">
              <div className="font-medium">{r.customer_name || r.custom_name}</div>
              <div className="text-sm capitalize text-gray-600">{r.reason}</div>
            </div>
          ))
        )}

        <button
          className="btn w-full mt-5 bg-gray-300 text-black"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </>
  );
}
