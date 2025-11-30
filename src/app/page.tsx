"use client";
import { useState, useEffect, useRef } from "react";
import TopNav from "../components/TopNav";
import DrawerMenu from "../components/DrawerMenu";
import MetricCard from "../components/dashboard/MetricCard";
import QuickSaleForm from "../components/dashboard/QuickSaleForm";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Calendar } from "lucide-react";
import type { Reminder } from "@/components/reminders/ReminderTable";

export default function Home() {
  const [open, setOpen] = useState(false);

  const [stats, setStats] = useState({
    total_sale: 0,
    sale_amount_received: 0,
    due_amount_received: 0,
    total_received: 0,
    due: 0,
    walkin_sales: 0,
    profile_sales: 0,
    total_orders: 0,
    new_customers: 0,
    total_jars_sold: 0,
    jar_due: 0,
    jar_returned: 0,
    expense: 0,
    profit: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const [loading, setLoading] = useState(true);


  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [quickFilter, setQuickFilter] = useState("today");

  // ✅ FIXED: Local timezone date (NOT UTC)
  const formatLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchStats = async (s: string, e: string) => {
    try {
      const res = await api.get(Endpoints.dashboardStats, {
        params: { start_date: s, end_date: e },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const handleQuickFilter = (value: string) => {
    setQuickFilter(value);

    const today = new Date();
    let s = "";
    let e = "";

    switch (value) {
      case "today":
        s = e = formatLocal(today);
        break;

      case "yesterday":
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        s = e = formatLocal(y);
        break;

      case "this_week":
        const first = new Date(today);
        first.setDate(first.getDate() - first.getDay());
        s = formatLocal(first);
        e = formatLocal(today);
        break;

      case "last_week":
        const lw_s = new Date(today);
        lw_s.setDate(lw_s.getDate() - lw_s.getDay() - 7);
        const lw_e = new Date(lw_s);
        lw_e.setDate(lw_s.getDate() + 6);
        s = formatLocal(lw_s);
        e = formatLocal(lw_e);
        break;

      case "last_7":
        const d7 = new Date(today);
        d7.setDate(today.getDate() - 6);
        s = formatLocal(d7);
        e = formatLocal(today);
        break;

      case "this_month":
        const ms = new Date(today.getFullYear(), today.getMonth(), 1);
        s = formatLocal(ms);
        e = formatLocal(today);
        break;

      case "last_month":
        const lms = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lme = new Date(today.getFullYear(), today.getMonth(), 0);
        s = formatLocal(lms);
        e = formatLocal(lme);
        break;

      case "this_year":
        const y1 = new Date(today.getFullYear(), 0, 1);
        s = formatLocal(y1);
        e = formatLocal(today);
        break;

      case "last_year":
        const ly_s = new Date(today.getFullYear() - 1, 0, 1);
        const ly_e = new Date(today.getFullYear() - 1, 11, 31);
        s = formatLocal(ly_s);
        e = formatLocal(ly_e);
        break;
    }

    fetchStats(s, e);
  };

  const handleRangeChange = (item: any) => {
    const sel = item.selection;
    const start = formatLocal(sel.startDate);
    const end = formatLocal(sel.endDate);

    setRange([item.selection]);
    setQuickFilter("custom");
    fetchStats(start, end);
  };

  const fetchCustomers = async () => {
    const res = await api.get(Endpoints.customers);
    setCustomers(res.data || []);
  };

  const fetchSales = async () => {
    const res = await api.get(Endpoints.sales);
    setSales(res.data || []);
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchCustomers(), fetchSales()]);
    setLoading(false);
  };

  // INITIAL LOAD with proper local date
  useEffect(() => {
    const today = formatLocal(new Date());
    fetchStats(today, today);
    refreshAll();
  }, []);


  const [remindersToday, setRemindersToday] = useState<Reminder[]>([]);


  const fetchRemindersToday = async () => {
    try {
      const res = await api.get(Endpoints.reminders);
      const all = [...(res.data.profiled || []), ...(res.data.customs || [])];

      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const filtered = all.filter(
        (r) =>
          r.status === "pending" &&
          new Date(r.next_date) >= start &&
          new Date(r.next_date) < end
      );

      setRemindersToday(filtered);
    } catch (err) {
      console.error("Failed to load reminders", err);
    }
  };

  useEffect(() => {
    fetchRemindersToday();
  }, []);


  return (
    <main className="pt-2" onMouseDown={(e) => e.stopPropagation()}>
      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[3px] z-50">
          <div className="loader border-4 border-t-transparent border-blue-600 w-10 h-10 rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading...</p>
        </div>
      )}

      {/* EVERYTHING ELSE FADES IN */}
      <div className="relative">
        <div className={loading ? "blur-sm pointer-events-none" : ""}>
          <TopNav onMenuClick={() => setOpen(true)} remindersToday={remindersToday} />

          <DrawerMenu isOpen={open} onClose={() => setOpen(false)} />

          <div className="mt-2 rounded-3xl bg-[#B4F2EE]/60 backdrop-blur-md p-4 shadow-[0_8px_25px_rgba(0,80,90,0.15)] mx-2 relative overflow-visible z-[1]">
            <h2 className="text-2xl font-semibold text-ocean mt-2">Quick Sell</h2>
            <QuickSaleForm customers={customers} sales={sales} onSaleSaved={() => {
              refreshAll();

              const s = formatLocal(range[0].startDate);
              const e = formatLocal(range[0].endDate);

              fetchStats(s, e);
            }} />

            <h2 className="text-2xl font-semibold text-ocean mt-6">Dashboard</h2>

            <div className="flex items-center gap-3 mt-3 justify-between">

              {/* LEFT SIDE — Toggle */}
              <div className="flex items-center gap-2 select-none">
                <span className="text-sm font-medium text-gray-700">
                  {showFullDashboard ? "Hide Dashboard" : "Show Dashboard"}
                </span>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFullDashboard}
                    onChange={() => setShowFullDashboard(!showFullDashboard)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-400 peer-checked:bg-blue-600 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-all"></div>
                </label>
              </div>

              {/* RIGHT SIDE — Calendar + Select */}
              <div className="flex items-center gap-3">

                {/* Calendar Button */}
                <div className="relative" ref={calendarRef}>
                  <button
                    className="p-2 rounded-md hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCalendarOpen((prev) => !prev);
                    }}
                  >
                    <Calendar size={20} />
                  </button>

                  {calendarOpen && (
                    <div
                      className="absolute top-12 right-0 bg-white shadow-xl rounded-xl z-50 p-2 w-auto max-w-[90vw]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="scale-[0.85] origin-top mx-auto overflow-visible">
                        <DateRange
                          editableDateInputs={true}
                          moveRangeOnFirstSelection={false}
                          ranges={range}
                          onChange={handleRangeChange}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-2 px-1">
                        <button
                          className="text-red-600 text-sm"
                          onClick={() => {
                            const today = new Date();
                            const formatted = formatLocal(today);
                            setRange([{ startDate: today, endDate: today, key: "selection" }]);
                            fetchStats(formatted, formatted);
                            setCalendarOpen(false);
                          }}
                        >
                          Clear
                        </button>

                        <button className="btn bg-gray-200 px-3 py-1 text-sm" onClick={() => setCalendarOpen(false)}>
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Filter Select */}
                <select
                  value={quickFilter}
                  onChange={(e) => handleQuickFilter(e.target.value)}
                  className="input !w-40 !px-2 !py-1 text-sm"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7">Last 7 Days</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="last_year">Last Year</option>
                </select>

              </div>
            </div>




            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <MetricCard label="Total Sale" value={`₹${stats.total_sale}`} />
              <MetricCard label="Sale Amount Received" value={`₹${stats.sale_amount_received}`} />
              <MetricCard label="Total Due" value={`₹${stats.due}`} />
              <MetricCard label="Total Jars Sold" value={stats.total_jars_sold} />
              <MetricCard label="Jar Due" value={stats.jar_due} />
              <MetricCard label="Jar Returned" value={stats.jar_returned} />

              {showFullDashboard && (
                <>
                  <MetricCard label="Due Amount Received" value={`₹${stats.due_amount_received}`} />
                  <MetricCard label="Total Received" value={`₹${stats.total_received}`} />
                  <MetricCard label="Walk-in Sales" value={stats.walkin_sales} />
                  <MetricCard label="Profiled Sales" value={stats.profile_sales} />
                  <MetricCard label="Total Orders" value={stats.total_orders} />
                  <MetricCard label="New Customers Added" value={stats.new_customers} />
                  <MetricCard label="Expense" value={`₹${stats.expense}`} />
                  <MetricCard label="Net" value={`₹${stats.profit}`} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
