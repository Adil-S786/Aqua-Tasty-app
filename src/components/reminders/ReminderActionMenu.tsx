"use client";
import { useState, useRef, useEffect } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" 
        onClick={() => setOpen(o => !o)}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-40 bg-white dark:bg-[#0C3C40] shadow-xl rounded-lg z-[100] border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-[#045b68] text-gray-700 dark:text-gray-200 transition-colors"
            onClick={() => {
              setOpen(false);
              onEdit(reminder);
            }}
          >
            ✏️ Edit
          </button>

          <button
            className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-[#045b68] text-gray-700 dark:text-gray-200 transition-colors border-t border-gray-100 dark:border-gray-700"
            onClick={() => {
              setOpen(false);
              const dlg = document.getElementById("reschedule-dialog-" + reminder.id) as HTMLDialogElement;
              dlg?.showModal();
            }}
          >
            📅 Reschedule
          </button>

          <button
            className="block w-full text-left px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
            onClick={() => {
              setOpen(false);
              onSkip(reminder.id);
            }}
          >
            ⏭️ Skip
          </button>
        </div>
      )}
    </div>
  );
}
