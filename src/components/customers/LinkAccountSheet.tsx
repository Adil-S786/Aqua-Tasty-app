"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

interface Customer {
    id: number;
    name: string;
    parent_customer_id?: number | null;
}

export default function LinkAccountSheet({
    isOpen,
    onClose,
    customer,
    allCustomers,
    onLinked,
}: {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
    allCustomers: Customer[];
    onLinked: () => void;
}) {
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    if (!customer) return null;

    // Filter out current customer and show only potential children (accounts without parent)
    const availableChildren = allCustomers.filter(
        (c) => c.id !== customer.id && c.parent_customer_id === null
    );

    const handleLink = async () => {
        if (!selectedParentId) {
            toast.error("Please select a child account");
            return;
        }

        setLoading(true);
        try {
            // Link the selected child TO the current customer (as parent)
            await api.post(Endpoints.linkCustomer(selectedParentId, customer.id));
            toast.success("Accounts linked successfully!");
            onLinked();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Failed to link accounts");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#062E33] rounded-t-3xl shadow-2xl p-6 z-50 max-h-[80vh] overflow-auto"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-[#045b68] dark:text-[#B4F2EE] mb-2">
                            Link Account
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Link a child account to <span className="font-semibold">{customer.name}</span>
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Child Account
                            </label>
                            <select
                                className="input w-full"
                                value={selectedParentId || ""}
                                onChange={(e) => setSelectedParentId(Number(e.target.value))}
                            >
                                <option value="">-- Select Child --</option>
                                {availableChildren.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Only accounts without a parent are shown
                            </p>
                        </div>

                        <div className="space-y-2">
                            <button
                                className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                onClick={handleLink}
                                disabled={loading || !selectedParentId}
                            >
                                {loading ? "Linking..." : "Link Accounts"}
                            </button>

                            <button
                                className="w-full px-4 py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
