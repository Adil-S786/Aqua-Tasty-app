"use client";

import { useMemo, useState } from "react";
import {
    format,
    startOfWeek,
    endOfWeek,
    addDays,
    startOfMonth,
    endOfMonth,
} from "date-fns";

// ---------------------- TYPES ----------------------
export interface Reminder {
    id: number;
    customer_id?: number | null;
    customer_name?: string | null;
    custom_name?: string | null;
    reason: string;
    frequency: number | string;
    next_date: string;
    note?: string | null;
    status: string;
}

interface Props {
    reminders: Reminder[];
    type?: "profiled" | "custom";
    loading?: boolean;

    onEdit: (r: Reminder) => void;
    onReschedule: (id: number, nextIso: string) => void;
    onSkip: (id: number) => void;
    onComplete: (id: number) => void;
    onRowClick: (r: Reminder) => void;  // ⭐ NEW
}



// ---------------------- COMPONENT ----------------------
export default function ReminderTable({
    reminders = [],
    type = "profiled",
    loading = false,
    onEdit,
    onReschedule,
    onSkip,
    onComplete,
    onRowClick,  // ⭐ NEW
}: Props) {
    const [dateFilter, setDateFilter] = useState("today");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");

    // compute date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = addDays(todayStart, 1);
    const tomorrowStart = addDays(todayStart, 1);
    const tomorrowEnd = addDays(todayStart, 2);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const upcomingWeekStart = addDays(todayStart, 1);
    const upcomingWeekEnd = addDays(todayStart, 7);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // ---------------------- FILTERING ----------------------
    const filtered = useMemo(() => {
        const out = reminders.filter((r) => {
            // status filter
            if (statusFilter !== "all" && (r.status || "pending") !== statusFilter)
                return false;

            // search
            const term = search.toLowerCase();
            if (term) {
                const cname = (r.customer_name || r.custom_name || "").toLowerCase();
                const reason = r.reason.toLowerCase();
                if (!cname.includes(term) && !reason.includes(term)) return false;
            }

            // date filter
            const dt = r.next_date ? new Date(r.next_date) : null;
            if (!dt) return dateFilter === "all";

            if (dateFilter === "today") return dt >= todayStart && dt < todayEnd;
            if (dateFilter === "tomorrow") return dt >= tomorrowStart && dt < tomorrowEnd;
            if (dateFilter === "yesterday") {
                const yStart = addDays(todayStart, -1);
                const yEnd = todayStart;
                return dt >= yStart && dt < yEnd;
            }
            if (dateFilter === "week") return dt >= weekStart && dt <= weekEnd;
            if (dateFilter === "upcoming_week")
                return dt >= upcomingWeekStart && dt <= upcomingWeekEnd;
            if (dateFilter === "month") return dt >= monthStart && dt <= monthEnd;

            return true;
        });

        return [...out].sort((a, b) => {
            const da = a.next_date ? new Date(a.next_date).getTime() : 0;
            const db = b.next_date ? new Date(b.next_date).getTime() : 0;
            return da - db;
        });
    }, [reminders, dateFilter, statusFilter, search]);

    // ---------------------- RENDER UI ----------------------
    return (
        <div className="mb-6 bg-white rounded-xl shadow p-3">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-ocean">
                    {type === "profiled"
                        ? "Upcoming Delivery Reminders"
                        : "Custom Reminders"}
                </h2>

                <div className="flex gap-2 items-center">
                    <input
                        className="input !py-1"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="input !py-1"
                    >
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">This Week</option>
                        <option value="upcoming_week">Upcoming 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="all">All</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input !py-1"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Delivered</option>
                        <option value="skipped">Skipped</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-[#0C3C40]">
                            <th className="p-2 text-left w-[30%]">Customer</th>
                            <th className="p-2 text-left w-[15%]">Reason</th>
                            <th className="p-2 w-[25%]">Next Date</th>
                            <th className="p-2 w-[15%]">Freq</th>
                            <th className="p-2 w-[15%]">Status</th>
                        </tr>
                    </thead>

                    <tbody className="relative">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    No reminders found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r) => (
                                <tr 
                                    key={r.id} 
                                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#0C3C40] cursor-pointer transition-colors"
                                    onClick={() => onRowClick(r)}
                                >
                                    <td className="p-3 w-[30%]">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {r.customer_name || r.custom_name}
                                        </div>
                                        {r.note && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {r.note}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-3 w-[15%] capitalize text-gray-700 dark:text-gray-300">
                                        {r.reason}
                                    </td>

                                    <td className="p-3 text-center w-[25%]">
                                        <span className={
                                            new Date(r.next_date) < new Date()
                                                ? "text-red-600 dark:text-red-400 font-semibold"
                                                : "text-gray-700 dark:text-gray-300"
                                        }>
                                            {r.next_date
                                                ? format(new Date(r.next_date), "dd-MMM-yyyy")
                                                : "-"}
                                        </span>
                                    </td>

                                    <td className="p-3 w-[15%] text-center text-gray-700 dark:text-gray-300">
                                        {r.frequency > 0 ? `${r.frequency} days` : "One-time"}
                                    </td>

                                    <td className="p-3 w-[15%] text-center capitalize">
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                                r.status === "completed"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : r.status === "skipped"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : r.status === "rescheduled"
                                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            }`}
                                        >
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
