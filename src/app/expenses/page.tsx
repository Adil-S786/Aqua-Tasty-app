"use client";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import TopNav from "@/components/TopNav";
import DrawerMenu from "@/components/DrawerMenu";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ExpenseActionSheet from "@/components/expense/ExpenseActionSheet";


type Expense = {
  id: number;
  description: string;
  amount: number;
  date: string;
};

export default function ExpensesPage() {
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("month");
  const [sortBy, setSortBy] = useState("newest");
  const [addOpen, setAddOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    type: "",
  });

  const fetchExpenses = async () => {
    const res = await api.get(Endpoints.expenses);
    setExpenses(res.data || []);
  };

  const [actionOpen, setActionOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);

  const deleteExpense = async (id: number) => {
    if (!confirm("Delete this expense?")) return;

    try {
      await api.delete(Endpoints.expenseById(id));
      toast.success("Expense deleted!");
      fetchExpenses();
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const handleSaveEdit = async () => {
    if (!editExpense) return;

    if (!editExpense.description.trim() || !editExpense.amount) {
      toast.error("Fill all fields");
      return;
    }

    try {
      await api.put(Endpoints.expenseById(editExpense.id), {
        description: editExpense.description.trim(),
        amount: Number(editExpense.amount),
      });

      toast.success("Expense updated!");
      setEditOpen(false);
      fetchExpenses();
    } catch {
      toast.error("Failed to update expense");
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter and sort
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = useMemo(() => {
    let f = expenses.filter((e) =>
      e.description.toLowerCase().includes(search.toLowerCase())
    );

    f = f.filter((e) => {
      const d = new Date(e.date);
      if (filter === "today") return d >= startOfToday;
      if (filter === "week") return d >= startOfWeek;
      if (filter === "month") return d >= startOfMonth;
      return true;
    });

    if (sortBy === "newest") f.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    else if (sortBy === "oldest") f.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    else if (sortBy === "amount-desc") f.sort((a, b) => b.amount - a.amount);
    else if (sortBy === "amount-asc") f.sort((a, b) => a.amount - b.amount);

    return f;
  }, [expenses, search, filter, sortBy]);

  const totalExpense = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || !newExpense.amount) {
      toast.error("Fill all fields");
      return;
    }

    try {
      await api.post(Endpoints.expenses, {
        description: newExpense.description.trim(),
        amount: Number(newExpense.amount),
      });
      toast.success("Expense added!");
      setAddOpen(false);
      setNewExpense({ description: "", amount: "", type: "" });
      fetchExpenses();
    } catch (err) {
      toast.error("Failed to add expense");
    }
  };

  return (
    <main className="pt-2">
      <TopNav onMenuClick={() => setOpen(true)} />
      <DrawerMenu isOpen={open} onClose={() => setOpen(false)} />

      <div className="p-4 space-y-4">
        <h1 className="text-xl font-semibold text-[#045b68]">💸 Expenses</h1>

        {/* Summary */}
        <div className="bg-[#B4F2EE]/60 p-3 rounded-2xl text-center shadow-md">
          <p className="text-sm text-gray-600">Total Spent</p>
          <h2 className="text-2xl font-bold text-red-600">
            ₹{totalExpense.toFixed(2)}
          </h2>
        </div>

        {/* Filters */}
        <input
          className="input"
          placeholder="Search expenses..."
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
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="amount-desc">Sort: Amount ↓</option>
            <option value="amount-asc">Sort: Amount ↑</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-md">
          <table className="w-full text-sm">
            <thead className="text-[#055f6a] border-b border-gray-300">
              <tr>
                <th className="text-left p-2">Description</th>
                <th className="text-center p-2">Amount</th>
                <th className="text-right p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => {
                    setSelectedExpense(e);
                    setActionOpen(true);
                  }}
                  className="border-t border-gray-200 hover:bg-gray-100 cursor-pointer transition"
                >
                  <td className="p-2 text-gray-700">{e.description}</td>
                  <td className="p-2 text-center font-semibold text-red-600">
                    ₹{e.amount.toFixed(2)}
                  </td>
                  <td className="p-2 text-right text-gray-600">
                    {new Date(e.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-4 text-gray-500">
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setAddOpen(true)}
          className="fixed bottom-5 right-5 btn text-lg px-6 py-3 rounded-full shadow-lg"
        >
          + Add Expense
        </button>

        {/* Add Expense Sheet */}
        <AnimatePresence>
          {addOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setAddOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <motion.div
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 z-50"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <h2 className="text-center text-lg font-semibold text-ocean mb-3">
                  Add Expense
                </h2>

                {/* Expense Type Dropdown */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Type
                </label>
                <select
                  className="input mb-2"
                  value={newExpense.type}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "Other") {
                      setNewExpense({
                        ...newExpense,
                        description: "",
                        type: "Other",
                      });
                    } else {
                      setNewExpense({
                        ...newExpense,
                        description: value,
                        type: value,
                      });
                    }
                  }}
                >
                  <option value="">Select Expense Type</option>
                  <option value="Bike Petrol">Bike Petrol</option>
                  <option value="Staff Payment">Staff Payment</option>
                  <option value="Cartridge Change">Cartridge Change</option>
                  <option value="Electricity Bill">Electricity Bill</option>
                  <option value="Machine Servicing">Machine Servicing</option>
                  <option value="Buy Jars">Buy Jars</option>
                  <option value="Other">Other</option>
                </select>

                {/* If "Other" → show custom input */}
                {newExpense.type === "Other" && (
                  <input
                    className="input mb-2"
                    placeholder="Enter description..."
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        description: e.target.value,
                      })
                    }
                  />
                )}

                {/* Amount Input */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  className="input mb-3"
                  type="number"
                  placeholder="Enter amount..."
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />

                {/* Buttons */}
                <button className="btn w-full" onClick={handleAddExpense}>
                  Save Expense
                </button>
                <button
                  className="btn w-full bg-gray-400 mt-2"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {editOpen && editExpense && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setEditOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <motion.div
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 z-50"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <h2 className="text-center text-lg font-semibold text-ocean mb-3">
                  Edit Expense
                </h2>

                <input
                  className="input mb-2"
                  value={editExpense.description}
                  onChange={(e) =>
                    setEditExpense({ ...editExpense, description: e.target.value })
                  }
                  placeholder="Description"
                />

                <input
                  className="input mb-2"
                  type="number"
                  value={editExpense.amount}
                  onChange={(e) =>
                    setEditExpense({
                      ...editExpense,
                      amount: Number(e.target.value),
                    })
                  }
                  placeholder="Amount (₹)"
                />

                <button className="btn w-full" onClick={handleSaveEdit}>
                  Save Changes
                </button>

                <button
                  className="btn w-full bg-gray-400 mt-2"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <ExpenseActionSheet
          isOpen={actionOpen}
          onClose={() => setActionOpen(false)}
          expense={selectedExpense}
          onEdit={() => {
            setActionOpen(false);
            setEditExpense(selectedExpense);
            setEditOpen(true);
          }}
          onDelete={() => {
            setActionOpen(false);
            deleteExpense(selectedExpense.id);
          }}
        />

      </div>
    </main>
  );
}
