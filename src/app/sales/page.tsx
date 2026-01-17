// src/app/sales/page.tsx
"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import TopNav from "@/components/TopNav";
import DrawerMenu from "@/components/DrawerMenu";
import ActionSheet from "@/components/sales/ActionSheet";
import SaleFormSheet from "@/components/sales/SaleFormSheet";
import PayDueSheet from "@/components/sales/PayDueSheet";
import ReturnJarSheet from "@/components/sales/ReturnJarSheet";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { startOfDay, endOfDay, isSameDay, subDays } from "date-fns";
import { toast } from "react-hot-toast/headless";
import { AnimatePresence, motion } from "framer-motion";

type Sale = {
  id: number;
  customer_id: number | null;
  customer_name: string | null;
  profile_name?: string | null;
  date: string;
  total_jars: number;
  customer_own_jars: number;
  our_jars: number;
  total_cost: number;
  amount_paid: number;
  due_amount: number;
};

const DatePickerAny = DatePicker as any;

export default function SalesPage() {
  const [open, setOpen] = useState(false);

  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [jarTrack, setJarTrack] = useState<any[]>([]);

  const [filter, setFilter] = useState("today");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [saleSheetOpen, setSaleSheetOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleCustomerName, setSaleCustomerName] = useState("");

  const [paySheetOpen, setPaySheetOpen] = useState(false);
  const [returnSheetOpen, setReturnSheetOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [oldSaleDate, setOldSaleDate] = useState<Date | null>(null);
  const [forceOldSaleMode, setForceOldSaleMode] = useState<boolean>(false);

  // inside SalesPage component (add new state)
  const [allowBackdateButton, setAllowBackdateButton] = useState<boolean>(true);




  // ------------ Fetch ------------
  const refreshAll = async () => {
    try {
      const [sRes, cRes, jRes] = await Promise.all([
        api.get(Endpoints.sales),
        api.get(Endpoints.customers),
        api.get(Endpoints.jarTracking),
      ]);
      setSales(sRes.data || []);
      setCustomers(cRes.data || []);
      setJarTrack(jRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => {
    refreshAll();

    const onDocClick = (e: MouseEvent) => {
      if (!calendarRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!calendarRef.current.contains(e.target)) setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ------------ Date Helpers ------------
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = subDays(startOfToday, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const calendarIsActive = Boolean(dateRange[0]);

  const isDateInSelection = (d: Date) => {
    const [s, e] = dateRange;
    if (!s) return true;
    if (s && !e) return isSameDay(d, s);
    if (s && e) return d >= startOfDay(s) && d <= endOfDay(e);
    return true;
  };

  // ------------ Filtering ------------

  // Pre-compute correct last-month boundaries
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const filteredSales = useMemo(() => {
    let list = [...sales];

    // If NO calendar selection → use quick filters
    if (!calendarIsActive) {
      list = list.filter((s) => {
        const d = new Date(s.date);

        if (filter === "today") {
          return d >= startOfDay(startOfToday);
        }

        if (filter === "yesterday") {
          return (
            d >= startOfDay(startOfYesterday) &&
            d < startOfDay(startOfToday)
          );
        }

        if (filter === "week") {
          return d >= startOfDay(startOfWeek);
        }

        if (filter === "month") {
          return d >= startOfDay(startOfMonth);
        }

        if (filter === "last-month") {
          return (
            d >= startOfDay(firstDayLastMonth) &&
            d <= endOfDay(lastDayLastMonth)
          );
        }

        return true; // all
      });
    }

    // Apply calendar selection if active
    list = list.filter((s) => isDateInSelection(new Date(s.date)));

    // Search filter (customer / profile)
    list = list.filter((s) =>
      (s.profile_name || s.customer_name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    // Sorting
    if (sortBy === "newest")
      list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    else if (sortBy === "oldest")
      list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    else if (sortBy === "amount-desc")
      list.sort((a, b) => b.total_cost - a.total_cost);
    else if (sortBy === "amount-asc")
      list.sort((a, b) => a.total_cost - b.total_cost);

    return list;
  }, [sales, filter, search, dateRange, sortBy, calendarIsActive]);

  // ------------ Summary ------------
  const summary = useMemo(() => {
    const total_amount = filteredSales.reduce((s, x) => s + x.total_cost, 0);
    const total_due = filteredSales.reduce((s, x) => s + x.due_amount, 0);
    const total_jars = filteredSales.reduce((s, x) => s + x.our_jars, 0);
    const jars_sold = filteredSales.reduce((s, x) => s + x.total_jars, 0);

    return {
      count: filteredSales.length,
      total_amount,
      total_due,
      total_jars,
      jars_sold,
    };
  }, [filteredSales]);

  // ------------ Display date/time ------------
  const displayDateOrTime = (iso: string) => {
    const d = new Date(iso);

    if (isSameDay(d, new Date()))
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // ------------ Clear Calendar ------------
  const clearCalendar = () => {
    setDateRange([null, null]);
    setCalendarOpen(false);
  };

  // ------------ Search Suggestions ------------
  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (!value.trim()) {
      setSearchSuggestions([]);
      return;
    }

    // Get profiled customers
    const profiledList = customers.map((c) => ({
      name: c.name,
      id: c.id,
      type: "profiled",
    }));

    // Get walk-in customers from sales
    const walkins = Array.from(
      new Set(sales.filter((s) => !s.customer_id).map((s) => s.customer_name))
    )
      .filter(Boolean)
      .map((name) => ({
        name,
        id: null,
        type: "walkin",
      }));

    // Combine and filter
    const allCustomers = [...profiledList, ...walkins];
    const matches = allCustomers.filter((c) =>
      c.name.toLowerCase().includes(value.toLowerCase())
    );

    setSearchSuggestions(matches);
  };

  const selectSearchSuggestion = (customerName: string) => {
    setSearch(customerName);
    setSearchSuggestions([]);
    setSearchFocused(false);
  };


  // ------------ UI ------------
  return (
    <main className="pt-2 h-screen overflow-y-auto">
      <TopNav onMenuClick={() => setOpen(true)} />
      <DrawerMenu isOpen={open} onClose={() => setOpen(false)} />

      <div className="p-4 space-y-3 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[#045b68]">
            Sales — {filter}
          </h1>

          <div className="flex gap-2 items-center">

            {/* Calendar */}
            <div className="relative" ref={calendarRef}>
              <button
                className="p-2 rounded-md hover:bg-gray-200"
                onClick={() => setCalendarOpen((s) => !s)}
              >
                <Calendar size={20} />
              </button>

              {calendarOpen && (
                <div
                  className="
      absolute top-12 left-1/2 -translate-x-1/2
      md:left-auto md:right-0
      bg-white shadow-xl rounded-xl z-50
      p-2                     /* smaller padding */
      w-auto                  /* shrink wrap */
      max-w-[90vw]            /* safe width on mobile */
    "
                >
                  {/* Calendar itself */}
                  <div className="scale-[0.85] origin-top mx-auto">
                    <DatePickerAny
                      inline
                      selectsRange
                      startDate={dateRange[0]}
                      endDate={dateRange[1]}
                      onChange={(val: any) => {
                        if (Array.isArray(val)) setDateRange([val[0], val[1]]);
                      }}
                      maxDate={new Date()}
                    />
                  </div>

                  {/* Buttons row */}
                  <div className="flex justify-between items-center mt-2 px-1">
                    <button
                      className="text-red-600 text-sm"
                      onClick={clearCalendar}
                    >
                      Clear
                    </button>

                    <button
                      className="btn bg-gray-200 px-3 py-1 text-sm"
                      onClick={() => setCalendarOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}


            </div>

            {/* Search */}
            <div className="relative">
              <input
                className="input w-48"
                placeholder="Search customer..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              />

              {searchFocused && searchSuggestions.length > 0 && (
                <div className="absolute right-0 w-64 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 mt-1">
                  {searchSuggestions.map((c, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onClick={() => selectSearchSuggestion(c.name)}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          c.type === "profiled" ? "bg-green-600" : "bg-gray-500"
                        }`}
                      />
                      <span className="text-sm">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            className="input"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setDateRange([null, null]);   // ← auto-clear calendar
            }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="all">All Time</option>
          </select>


          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount-desc">Amount ↓</option>
            <option value="amount-asc">Amount ↑</option>
          </select>

          {/* Show calendar selection if active */}
          {calendarIsActive && (
            <div className="text-sm font-medium text-gray-700">
              {dateRange[0] &&
                dateRange[1] &&
                `${dateRange[0].toLocaleDateString()} → ${dateRange[1].toLocaleDateString()}`}
              {dateRange[0] && !dateRange[1] &&
                dateRange[0].toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white/60 backdrop-blur-xl p-3 rounded-xl shadow-md">
          <div className="grid grid-cols-5 md:grid-cols-5 gap-3">
            <div>
              <div className="text-sm text-gray-600">Records</div>
              <div className="text-lg font-semibold">{summary.count}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Sales</div>
              <div className="text-lg font-semibold">₹{summary.total_amount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">i Due</div>
              <div className="text-lg font-semibold text-red-600">
                ₹{summary.total_due}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Jars Sold</div>
              <div className="text-lg font-semibold text-green-600">
                {summary.jars_sold}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Jar Due</div>
              <div className="text-lg font-semibold text-blue-700">
                {summary.total_jars}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/65 p-3 rounded-2xl shadow-md backdrop-blur-md">
          <table className="w-full text-sm">
            <thead className="text-[#055f6a]">
              <tr>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Date / Time</th>
                <th className="p-2 text-center">Jars</th>
                <th className="p-2 text-center">Jar Due</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-right">Due</th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.map((s) => {
                const displayName = s.customer_id
                  ? customers.find((c) => c.id === s.customer_id)?.name ||
                  s.profile_name ||
                  "Unknown"
                  : s.customer_name || "Walk-in";

                return (
                  <tr
                    key={s.id}
                    onClick={() => {
                      setSelectedSale(s);
                      setSheetOpen(true);
                    }}
                    className="border-t cursor-pointer hover:bg-gray-100"
                  >
                    <td className="p-2 flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${s.customer_id ? "bg-green-600" : "bg-gray-500"
                          }`}
                      />
                      {displayName}
                    </td>

                    <td className="p-2">{displayDateOrTime(s.date)}</td>

                    <td className="p-2 text-center">{s.total_jars}</td>
                    <td className="p-2 text-center text-blue-600">
                      {s.our_jars}
                    </td>
                    <td className="p-2 text-right">₹{s.total_cost}</td>
                    <td className="p-2 text-right text-red-600">
                      ₹{s.due_amount}
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Old Sale */}
        <button
          className="fixed bottom-20 right-5 btn bg-yellow-600 ..."
          onClick={() => {
            setSelectedSale(null);
            setSaleCustomerName("");
            setEditingSale(null);
            setForceOldSaleMode(true);   // open in backdate mode
            setAllowBackdateButton(false); // don't show extra button (already in backdate mode)
            setSaleSheetOpen(true);
          }}
        >
          📅 Old Sale
        </button>




        {/* Floating Button */}
        <button
          className="fixed bottom-5 right-5 btn ..."
          onClick={() => {
            setSelectedSale(null);
            setSaleCustomerName("");
            setEditingSale(null);
            setForceOldSaleMode(false);   // normal new sale
            setAllowBackdateButton(false); // hide the Old Sale button in this flow
            setSaleSheetOpen(true);
          }}
        >
          + New Sale
        </button>

      </div>

      {/* Sheets */}
      <ActionSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}

        onSellAgain={() => {
          setSheetOpen(false);
          if (selectedSale?.customer_id) {
            const customer = customers.find(c => c.id === selectedSale.customer_id);
            setSaleCustomerName(customer?.name || "");
          } else {
            setSaleCustomerName(selectedSale?.customer_name || "");
          }
          setEditingSale(null);
          setForceOldSaleMode(false);
          setAllowBackdateButton(true); // allow the backdate button here
          setSaleSheetOpen(true);
        }}

        onPayDue={() => {
          setSheetOpen(false);
          setPaySheetOpen(true);
        }}

        onReturnJar={() => {
          setSheetOpen(false);
          setReturnSheetOpen(true);
        }}

        onEditSale={() => {
          setSheetOpen(false);
          setEditingSale(selectedSale || null);
          setForceOldSaleMode(false);
          setAllowBackdateButton(false); // hide backdate button when editing
          setSaleSheetOpen(true);
        }}



        onDeleteSale={async () => {
          if (!selectedSale) return;
          if (!confirm("Are you sure you want to delete this sale?")) return;
          try {
            await api.delete(Endpoints.saleById(selectedSale.id));
            toast.success("Sale deleted");
            setSheetOpen(false);
            await refreshAll();
          } catch (err) {
            toast.error("Failed to delete sale");
          }
        }}
      />

      <SaleFormSheet
        isOpen={saleSheetOpen}
        onClose={() => {
          setSaleSheetOpen(false);
          setEditingSale(null);
          setForceOldSaleMode(false); // reset on close
          setAllowBackdateButton(true); // restore default
        }}
        customerName={saleCustomerName}
        customers={customers}
        sales={sales}
        editingSale={editingSale}
        incomingSaleDate={oldSaleDate ?? null}
        forceOldSaleMode={forceOldSaleMode}
        allowBackdateButton={allowBackdateButton} // NEW
        refreshAll={refreshAll}
      />




      <PayDueSheet
        isOpen={paySheetOpen}
        onClose={() => setPaySheetOpen(false)}
        sale={selectedSale}
        onPaid={refreshAll}
      />

      <ReturnJarSheet
        isOpen={returnSheetOpen}
        onClose={() => setReturnSheetOpen(false)}
        sale={selectedSale}
        refreshData={refreshAll}
      />



    </main>
  );
}
