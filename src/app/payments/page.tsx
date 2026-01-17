"use client";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import TopNav from "@/components/TopNav";
import DrawerMenu from "@/components/DrawerMenu";
import toast from "react-hot-toast";

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
  const [filter, setFilter] = useState("today");
  const [sortBy, setSortBy] = useState("newest");

  const [deletingId, setDeletingId] = useState<number | null>(null); // ✅ NEW

  const fetchPayments = async () => {
    const res = await api.get(Endpoints.payments);
    setPayments(res.data || []);
  };

  useEffect(() => {
    fetchPayments();
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

  const filteredPayments = useMemo(() => {
    let filtered = payments.filter((p) =>
      p.customer_name?.toLowerCase().includes(search.toLowerCase())
    );

    filtered = filtered.filter((p) => {
      const d = new Date(p.date);
      if (filter === "today") return d >= startOfToday;
      if (filter === "yesterday") return d >= startOfYesterday && d < startOfToday;
      if (filter === "week") return d >= startOfWeek;
      if (filter === "month") return d >= startOfMonth;
      if (filter === "last-month") return d >= startOfLastMonth && d <= endOfLastMonth;
      return true;
    });

    if (sortBy === "newest")
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sortBy === "oldest")
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    else if (sortBy === "amount-desc")
      filtered.sort((a, b) => b.amount_paid - a.amount_paid);
    else if (sortBy === "amount-asc")
      filtered.sort((a, b) => a.amount_paid - b.amount_paid);

    return filtered;
  }, [payments, search, filter, sortBy]);

  const filterLabel = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    "last-month": "Last Month",
    all: "All Time",
  }[filter];

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
          Payment History — {filterLabel}
        </h1>

        {/* Search & Filters */}
        <input
          className="input"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
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
      </div>
    </main>
  );
}
