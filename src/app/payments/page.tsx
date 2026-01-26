"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import TopNav from "@/components/TopNav";
import DrawerMenu from "@/components/DrawerMenu";
import toast from "react-hot-toast";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import OldPayDueSheet from "@/components/payments/OldPayDueSheet";

type Payment = {
  id: number;
  customer_id: number | null;
  customer_name: string;
  amount_paid: number;
  date: string;
};

export default function PaymentHistoryPage() {
  const [open, setOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState("today");
  const [sortBy, setSortBy] = useState("newest");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // ⭐ NEW: Calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  
  // ⭐ NEW: Old Pay Due sheet
  const [oldPayDueOpen, setOldPayDueOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchPayments = async () => {
    const res = await api.get(Endpoints.payments);
    setPayments(res.data || []);
  };

  const fetchCustomers = async () => {
    const res = await api.get(Endpoints.customers);
    setCustomers(res.data || []);
  };

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    
    // ⭐ NEW: Close calendar on outside click
    const onDocClick = (e: MouseEvent) => {
      if (!calendarRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!calendarRef.current.contains(e.target)) setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ---------------- DATE FILTERS ----------------
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const calendarIsActive = Boolean(dateRange[0]);

  const isDateInSelection = (d: Date) => {
    if (!dateRange[0]) return true;
    const start = new Date(dateRange[0]);
    start.setHours(0, 0, 0, 0);
    
    if (!dateRange[1]) {
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    
    const end = new Date(dateRange[1]);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  };

  const filteredPayments = useMemo(() => {
    let filtered = payments.filter((p) =>
      p.customer_name?.toLowerCase().includes(search.toLowerCase())
    );

    // If NO calendar selection → use quick filters
    if (!calendarIsActive) {
      filtered = filtered.filter((p) => {
        const d = new Date(p.date);
        if (filter === "today") return d >= startOfToday;
        if (filter === "yesterday") return d >= startOfYesterday && d < startOfToday;
        if (filter === "week") return d >= startOfWeek;
        if (filter === "month") return d >= startOfMonth;
        if (filter === "last-month") return d >= startOfLastMonth && d <= endOfLastMonth;
        return true;
      });
    } else {
      // Apply calendar selection
      filtered = filtered.filter((p) => isDateInSelection(new Date(p.date)));
    }

    if (sortBy === "newest")
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sortBy === "oldest")
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    else if (sortBy === "amount-desc")
      filtered.sort((a, b) => b.amount_paid - a.amount_paid);
    else if (sortBy === "amount-asc")
      filtered.sort((a, b) => a.amount_paid - b.amount_paid);

    return filtered;
  }, [payments, search, filter, sortBy, dateRange, calendarIsActive]);

  const filterLabel = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    "last-month": "Last Month",
    all: "All Time",
  }[filter];

  // ⭐ NEW: Clear calendar
  const clearCalendar = () => {
    setDateRange([null, null]);
    setCalendarOpen(false);
  };

  // ---------------- DELETE PAYMENT ----------------
  const deletePayment = async (id: number) => {
    if (!confirm("Delete this payment? This action cannot be undone.")) return;

    try {
      setDeletingId(id);
      await api.delete(Endpoints.paymentById(id)); // ✅ assumes endpoint exists
      toast.success("Payment deleted!");
      fetchPayments();
    } catch (err) {
      toast.error("Failed to delete payment");
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------- UI ----------------
  return (
    <main className="pt-2">
      <TopNav onMenuClick={() => setOpen(true)} />
      <DrawerMenu isOpen={open} onClose={() => setOpen(false)} />

      <div className="p-4 space-y-4">
        <h1 className="text-xl font-semibold text-[#045b68]">
          Payment History — {calendarIsActive ? "Custom Range" : filterLabel}
        </h1>

        {/* ⭐ NEW: Calendar Icon */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              className="input w-full"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && search && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                {Array.from(new Set(payments.map(p => p.customer_name)))
                  .filter((name) => name?.toLowerCase().includes(search.toLowerCase()))
                  .slice(0, 10)
                  .map((name) => (
                    <button
                      key={name}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setSearch(name);
                        setShowSuggestions(false);
                      }}
                    >
                      <span className="font-medium">{name}</span>
                    </button>
                  ))}
                {Array.from(new Set(payments.map(p => p.customer_name)))
                  .filter((name) => name?.toLowerCase().includes(search.toLowerCase()))
                  .length === 0 && (
                  <div className="px-4 py-2 text-gray-500 text-sm">No matches found</div>
                )}
              </div>
            )}
          </div>

          {/* Calendar Button */}
          <div className="relative" ref={calendarRef}>
            <button
              className="p-2 rounded-md hover:bg-gray-200 border border-gray-300"
              onClick={() => setCalendarOpen((s) => !s)}
            >
              <Calendar size={20} />
            </button>

            {calendarOpen && (
              <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-lg z-50 p-3 border border-gray-300">
                <div className="scale-[0.85] origin-top mx-auto">
                  <DatePicker
                    selected={dateRange[0]}
                    onChange={(dates: any) => setDateRange(dates)}
                    startDate={dateRange[0]}
                    endDate={dateRange[1]}
                    selectsRange
                    inline
                    monthsShown={1}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="text-red-600 text-sm"
                    onClick={clearCalendar}
                  >
                    Clear
                  </button>
                  <button
                    className="btn bg-gray-200 px-3 py-1 text-sm ml-auto"
                    onClick={() => setCalendarOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Show calendar selection if active */}
        {calendarIsActive && (
          <div className="text-sm font-medium text-gray-700 bg-blue-50 p-2 rounded-lg">
            📅 {dateRange[0] && dateRange[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            {dateRange[1] && ` - ${dateRange[1].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setDateRange([null, null]); // Clear calendar when using quick filters
            }}
            className="input"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="amount-desc">Sort: Amount ↓</option>
            <option value="amount-asc">Sort: Amount ↑</option>
          </select>
        </div>

        {/* Payment Table */}
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-md">
          <table className="w-full text-sm">
            <thead className="text-[#055f6a] border-b border-gray-300">
              <tr>
                <th className="text-left p-2 w-[40%]">Customer</th>
                <th className="text-center p-2 w-[20%]">Amount Paid</th>
                <th className="text-right p-2 w-[25%]">Date</th>
                <th className="text-center p-2 w-[15%]">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-200 hover:bg-gray-100 transition"
                >
                  {/* Customer */}
                  <td className="p-2 flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        p.customer_id ? "bg-green-600" : "bg-gray-400"
                      }`}
                    />
                    <span className="text-gray-700">{p.customer_name || "Walk-in"}</span>
                  </td>

                  {/* Amount */}
                  <td className="p-2 text-center font-semibold text-green-700">
                    ₹{p.amount_paid.toFixed(2)}
                  </td>

                  {/* Date */}
                  <td className="p-2 text-right text-gray-600">
                    {new Date(p.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Delete */}
                  <td className="p-2 text-center">
                    <button
                      disabled={deletingId === p.id}
                      onClick={() => deletePayment(p.id)}
                      className={`text-red-600 hover:text-red-800 font-semibold ${
                        deletingId === p.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-gray-500">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ⭐ NEW: Old Pay Due Button */}
        <button
          className="fixed bottom-5 right-5 btn bg-yellow-600 text-white shadow-lg hover:bg-yellow-700 px-4 py-3 rounded-full font-semibold"
          onClick={() => setOldPayDueOpen(true)}
        >
          📅 Old Pay Due
        </button>

        {/* ⭐ NEW: Old Pay Due Sheet */}
        <OldPayDueSheet
          isOpen={oldPayDueOpen}
          onClose={() => setOldPayDueOpen(false)}
          onSaved={fetchPayments}
          customers={customers}
        />
      </div>
    </main>
  );
}
