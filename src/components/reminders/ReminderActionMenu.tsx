"use client";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import type { Reminder } from "./ReminderTable";

interface Props {
  reminder: Reminder;
  onEdit: (r: Reminder) => void;
  onReschedule: (id: number, nextIso: string) => void;
  onSkip: (id: number) => void;
}

export default function ReminderActionMenu({
  reminder,
  onEdit,
  onReschedule,
  onSkip
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button className="p-1 rounded hover:bg-gray-100" onClick={() => setOpen(o => !o)}>
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-white shadow-lg rounded-lg z-50">
          <button
            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              onEdit(reminder);
            }}
          >
            Edit
          </button>

          {/* OPEN CALENDAR POPUP */}
          <button
            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              const dlg = document.getElementById("reschedule-dialog-" + reminder.id) as HTMLDialogElement;
              dlg?.showModal();
            }}
          >
            Reschedule
          </button>

          <button
            className="block w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              onSkip(reminder.id);
            }}
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
