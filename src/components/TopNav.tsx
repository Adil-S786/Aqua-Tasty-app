"use client";
import { Menu, Bell } from "lucide-react";
import { useState } from "react";

export default function TopNav({
  onMenuClick,
  remindersToday, // optional
}: {
  onMenuClick?: () => void;
  remindersToday?: any[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <div className="relative z-[5] bg-gradient-to-b from-[#e8fbff] via-[#c5f3f6] to-[#9ee7eb] pb-8 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={onMenuClick} className="text-[#045b68]">
            <Menu size={28} strokeWidth={2.5} />
          </button>

          <h1 className="text-xl font-semibold text-[#0a6a76] tracking-wide">
            Aqua Tasty
          </h1>

          {/* ⭐ Show bell only when remindersToday prop exists */}
          {remindersToday ? (
            <div className="relative">
              <button
                className="text-[#045b68] relative"
                onClick={() => setOpen(!open)}
              >
                <Bell size={24} strokeWidth={2.5} />
                {remindersToday.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full px-[5px] py-[1px]">
                    {remindersToday.length}
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-lg z-50 p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Reminders Today
                  </h3>

                  {remindersToday.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending reminders.</p>
                  ) : (
                    <ul className="max-h-60 overflow-auto space-y-2">
                      {remindersToday.map((r) => (
                        <li
                          key={r.id}
                          className="bg-gray-100 rounded-md px-2 py-2 text-[14px]"
                        >
                          <b>{r.customer_name || r.custom_name}</b> — {r.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            // other pages icon placeholder
            <div className="w-8 h-8 rounded-full bg-[#8adce3]/60 border border-white/60" />
          )}
        </div>
      </div>

      <div className="absolute w-full bottom-[-1px] left-0 z-[1]">
        <svg viewBox="0 0 1440 90" className="w-full" preserveAspectRatio="none">
          <path
            d="M0,50 C300,95 600,10 900,50 C1150,85 1300,40 1440,60 V90 H0 Z"
            fill="#9ee7eb"
            opacity="0.9"
          />
        </svg>
      </div>
    </div>
  );
}
