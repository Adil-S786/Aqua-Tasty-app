"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

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
    // form: frequency stored as number (0..20)
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

    // prefill when editing / opening
    useEffect(() => {
        if (!isOpen) return;
        if (initialData) {
            setForm({
                customer_id: initialData.customer_id ?? null,
                custom_name: initialData.custom_name ?? initialData.customer_name ?? "",
                reason: initialData.reason ?? "delivery",
                frequency: Number(initialData.frequency ?? 0),
                next_date: initialData.next_date
                    ? initialData.next_date.slice(0, 10) + "T00:00:00"
                    : "",

                note: initialData.note ?? "",
                status: initialData.status ?? "pending",
            });
            setQuery(initialData.customer_name ?? initialData.custom_name ?? "");
        } else {
            setForm(emptyForm);
            setQuery("");
        }
        // hide suggestions when sheet opens
        setShowSug(false);
    }, [isOpen, initialData]);

    // safe suggestions: only depends on `query` and `customers` (no setState loops)
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
    };

    // when user blurs/picks save, determine if profiled or custom
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
            toast.error("Please pick next date & time");
            return;
        }

        const freq = Number(form.frequency) || 0;
        if (resolved.customer_id && (freq < 0 || freq > 20)) {
            toast.error("Frequency must be between 0 and 20");
            return;
        }

        const payload: any = {
            customer_id: resolved.customer_id ?? null,
            custom_name: resolved.customer_id ? null : resolved.custom_name,
            reason: form.reason,
            frequency: resolved.customer_id ? freq : 0,
            next_date: new Date(form.next_date).toISOString(),
            note: form.note || null,
            status: form.status || "pending",
        };

        setSaving(true);
        try {
            if (initialData && initialData.id) {
                await api.put(Endpoints.reminderById(initialData.id), payload);
                toast.success("Reminder updated");
            } else {
                await api.post(Endpoints.reminders, payload);
                toast.success("Reminder created");
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
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-xl z-50 max-h-[92vh] overflow-auto"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 160, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-3">
                            {initialData ? "Edit Reminder" : "Add Reminder"}
                        </h2>

                        {/* Customer input + suggestions */}
                        <label className="text-sm text-gray-700 mb-1 block">Customer name</label>
                        <div className="relative mb-3">
                            <input
                                className="input"
                                placeholder="Start typing name — suggestions show profiled customers"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    // assume typing -> custom until a suggestion is selected
                                    setForm((f: any) => ({ ...f, customer_id: null, custom_name: e.target.value }));
                                    setShowSug(true);
                                }}
                                onFocus={() => setShowSug(true)}
                                onBlur={() => setTimeout(() => setShowSug(false), 120)}
                            />
                            {showSug && suggestions.length > 0 && (
                                <div className="absolute left-0 right-0 bg-white rounded-xl shadow-md mt-1 z-50 max-h-44 overflow-auto">
                                    {suggestions.map((c: any) => (
                                        <div
                                            key={c.id}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                            onMouseDown={(e) => { e.preventDefault(); pickSuggestion(c); }}
                                        >
                                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600" />
                                            <div>
                                                <div className="font-medium">{c.name}</div>
                                                {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reason */}
                        <label className="text-sm text-gray-700 mb-1 block">Reason</label>
                        <select
                            className="input mb-3"
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        >
                            <option value="delivery">Delivery</option>
                            <option value="due">Due</option>
                            <option value="jar_return">Jar Return</option>
                            <option value="manual">Manual</option>
                            <option value="other">Other</option>
                        </select>

                        {/* Frequency numeric 0..20 */}
                        <div className="mb-3">
                            <label className="text-sm text-gray-700 block">Frequency (days) — 0 = one-time</label>
                            <input
                                type="number"
                                min={0}
                                max={20}
                                className="input"
                                value={form.frequency}
                                onChange={(e) => setForm({ ...form, frequency: Number(e.target.value) })}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                For profiled customers frequency 0..20. If 0 → single reminder; 1 → daily; 3 → every 3 days.
                            </div>
                        </div>

                        {/* Next date/time */}
                        <label className="block text-sm text-gray-600 mb-1">Next reminder</label>
                        <input
                            type="date"
                            className="input mb-3"
                            value={form.next_date}
                            onChange={(e) => setForm({ ...form, next_date: e.target.value })}
                        />

                        {/* Note */}
                        <textarea
                            className="input h-20 mb-3"
                            placeholder="Note (optional)"
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                        />

                        <div className="flex gap-3 mt-4">
                            <button onClick={onClose} className="btn bg-gray-300 text-black flex-1">Cancel</button>
                            <button onClick={handleSave} className="btn flex-1" disabled={saving}>
                                {saving ? "Saving..." : initialData ? "Update" : "Save"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
