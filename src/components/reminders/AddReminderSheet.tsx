"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import { Sparkles, Calendar, Clock, User, FileText, Repeat } from "lucide-react";

export default function AddReminderSheet({
    isOpen,
    onClose,
    customers = [],
    initialData = null,
    onSaved,
}: {
    isOpen: boolean;
    onClose: () => void;
    customers?: any[];
    initialData?: any | null;
    onSaved?: () => void;
}) {
    const emptyForm = {
        customer_id: null as number | null,
        custom_name: "",
        reason: "delivery",
        frequency: 0,
        next_date: "",
        note: "",
        status: "pending",
    };

    const [form, setForm] = useState<any>(emptyForm);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSug, setShowSug] = useState(false);
    const [saving, setSaving] = useState(false);
    const [customerPattern, setCustomerPattern] = useState<any>(null);
    const [loadingPattern, setLoadingPattern] = useState(false);

    // Prefill when editing / opening
    useEffect(() => {
        if (!isOpen) return;
        if (initialData) {
            setForm({
                customer_id: initialData.customer_id ?? null,
                custom_name: initialData.custom_name ?? initialData.customer_name ?? "",
                reason: initialData.reason ?? "delivery",
                frequency: Number(initialData.frequency ?? 0),
                next_date: initialData.next_date
                    ? initialData.next_date.slice(0, 10)
                    : "",
                note: initialData.note ?? "",
                status: initialData.status ?? "pending",
            });
            setQuery(initialData.customer_name ?? initialData.custom_name ?? "");
            
            // Load pattern if profiled customer
            if (initialData.customer_id) {
                fetchCustomerPattern(initialData.customer_id);
            }
        } else {
            setForm(emptyForm);
            setQuery("");
            setCustomerPattern(null);
        }
        setShowSug(false);
    }, [isOpen, initialData]);

    // Fetch customer pattern
    const fetchCustomerPattern = async (customerId: number) => {
        setLoadingPattern(true);
        try {
            const res = await api.get(Endpoints.customerPattern(customerId));
            setCustomerPattern(res.data);
            
            // Auto-suggest frequency if available
            if (res.data.average_days_between_orders && !initialData) {
                setForm((f: any) => ({
                    ...f,
                    frequency: res.data.average_days_between_orders
                }));
            }
        } catch (err: any) {
            console.error("Failed to load pattern:", err);
            // Don't show error to user - pattern is optional
            setCustomerPattern(null);
        } finally {
            setLoadingPattern(false);
        }
    };

    // Suggestions
    useEffect(() => {
        const q = (query || "").trim();
        if (!q) {
            setSuggestions([]);
            return;
        }
        const lower = q.toLowerCase();
        const matches = customers
            .filter((c: any) => (c.name || "").toLowerCase().includes(lower))
            .slice(0, 8);
        setSuggestions(matches);
    }, [query, customers]);

    const normalizeName = (s: string) =>
        s
            .trim()
            .replace(/\s+/g, " ")
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");

    const pickSuggestion = (c: any) => {
        setForm((f: any) => ({ ...f, customer_id: c.id, custom_name: "" }));
        setQuery(c.name);
        setSuggestions([]);
        setShowSug(false);
        fetchCustomerPattern(c.id);
    };

    const resolveProfileOrCustom = () => {
        const found = customers.find(
            (c: any) => (c.name || "").toLowerCase() === (query || "").trim().toLowerCase()
        );
        if (found) {
            setForm((f: any) => ({ ...f, customer_id: found.id, custom_name: "" }));
            return { customer_id: found.id, custom_name: null };
        } else {
            const normalized = normalizeName(query || form.custom_name || "");
            setForm((f: any) => ({ ...f, customer_id: null, custom_name: normalized }));
            return { customer_id: null, custom_name: normalized };
        }
    };

    const handleSave = async () => {
        const resolved = resolveProfileOrCustom();

        if (!resolved.customer_id && !(form.custom_name || resolved.custom_name)) {
            toast.error("Please enter a customer name");
            return;
        }
        if (!form.next_date) {
            toast.error("Please pick next date");
            return;
        }

        const freq = Number(form.frequency) || 0;
        if (freq < 0 || freq > 30) {
            toast.error("Frequency must be between 0 and 30 days");
            return;
        }

        const payload: any = {
            customer_id: resolved.customer_id ?? null,
            custom_name: resolved.customer_id ? null : resolved.custom_name,
            reason: form.reason,
            frequency: freq,
            next_date: new Date(form.next_date + "T00:00:00").toISOString(),
            note: form.note || null,
            status: form.status || "pending",
        };

        setSaving(true);
        try {
            if (initialData && initialData.id) {
                await api.put(Endpoints.reminderById(initialData.id), payload);
                toast.success("Reminder updated successfully!");
            } else {
                await api.post(Endpoints.reminders, payload);
                toast.success("Reminder created successfully!");
            }
            onSaved?.();
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to save reminder");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#062E33] rounded-t-3xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-auto"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 160, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-4 text-[#045b68] dark:text-[#B4F2EE] flex items-center gap-2">
                            {initialData ? "Edit Reminder" : "Create New Reminder"}
                            {!initialData && <Sparkles size={20} className="text-blue-500" />}
                        </h2>

                        {/* Customer Input */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <User size={16} />
                                Customer Name
                            </label>
                            <div className="relative">
                                <input
                                    className="input w-full"
                                    placeholder="Type customer name (profiled customers will show suggestions)"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setForm((f: any) => ({ ...f, customer_id: null, custom_name: e.target.value }));
                                        setShowSug(true);
                                        setCustomerPattern(null);
                                    }}
                                    onFocus={() => setShowSug(true)}
                                    onBlur={() => setTimeout(() => setShowSug(false), 150)}
                                />
                                {showSug && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 bg-white dark:bg-[#0C3C40] rounded-xl shadow-lg mt-1 z-50 max-h-48 overflow-auto border border-gray-200 dark:border-gray-700">
                                        {suggestions.map((c: any) => (
                                            <div
                                                key={c.id}
                                                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#045b68] cursor-pointer flex items-center gap-3 transition-colors"
                                                onMouseDown={(e) => { e.preventDefault(); pickSuggestion(c); }}
                                            >
                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-white">{c.name}</div>
                                                    {c.phone && <div className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pattern Info */}
                        {customerPattern && (
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                    <Sparkles size={14} />
                                    <span className="font-medium">Smart Suggestion:</span>
                                </div>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                    {customerPattern.recommendation}
                                </p>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FileText size={16} />
                                Reason
                            </label>
                            <select
                                className="input w-full"
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            >
                                <option value="delivery">Delivery</option>
                                <option value="due">Payment Due</option>
                                <option value="jar_return">Jar Return</option>
                                <option value="follow_up">Follow Up</option>
                                <option value="manual">Manual</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Frequency */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Repeat size={16} />
                                Frequency (days)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={30}
                                className="input w-full"
                                value={form.frequency}
                                onChange={(e) => setForm({ ...form, frequency: Number(e.target.value) })}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                0 = One-time reminder • 1-30 = Recurring every N days
                            </p>
                        </div>

                        {/* Next Date */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar size={16} />
                                Next Reminder Date
                            </label>
                            <input
                                type="date"
                                className="input w-full"
                                value={form.next_date}
                                onChange={(e) => setForm({ ...form, next_date: e.target.value })}
                            />
                        </div>

                        {/* Note */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FileText size={16} />
                                Note (Optional)
                            </label>
                            <textarea
                                className="input w-full h-20 resize-none"
                                placeholder="Add any additional notes..."
                                value={form.note}
                                onChange={(e) => setForm({ ...form, note: e.target.value })}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button 
                                onClick={onClose} 
                                className="flex-1 px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : initialData ? "Update Reminder" : "Create Reminder"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
