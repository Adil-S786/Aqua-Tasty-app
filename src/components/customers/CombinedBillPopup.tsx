"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";

interface CombinedBillData {
    accounts: Array<{ id: number; name: string; type: string }>;
    total_due: number;
    total_jars_due: number;
    pending_sales: Array<{
        id: number;
        customer_id: number;
        customer_name: string;
        date: string;
        total_cost: number;
        amount_paid: number;
        due_amount: number;
    }>;
    last_payment: { amount_paid: number; date: string } | null;
}

export default function CombinedBillPopup({
    isOpen,
    onClose,
    customerId,
}: {
    isOpen: boolean;
    onClose: () => void;
    customerId: number | null;
}) {
    const [billData, setBillData] = useState<CombinedBillData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && customerId) {
            fetchCombinedBill();
        }
    }, [isOpen, customerId]);

    const fetchCombinedBill = async () => {
        if (!customerId) return;

        setLoading(true);
        try {
            const res = await api.get(Endpoints.combinedBill(customerId));
            setBillData(res.data);
        } catch (err) {
            console.error("Failed to fetch combined bill:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!customerId) return null;

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
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white dark:bg-[#062E33] rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-auto"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-[#045b68] dark:text-[#B4F2EE] mb-4">
                            Combined Bill
                        </h2>

                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : billData ? (
                            <>
                                {/* Linked Accounts */}
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Linked Accounts ({billData.accounts.length})
                                    </h3>
                                    <div className="space-y-1">
                                        {billData.accounts.map((acc) => (
                                            <div key={acc.id} className="text-sm text-gray-700 dark:text-gray-300">
                                                • {acc.name} <span className="text-xs text-gray-500">({acc.type})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Due</div>
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            ₹{billData.total_due.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Jars Due</div>
                                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                            {billData.total_jars_due}
                                        </div>
                                    </div>
                                </div>

                                {/* Pending Sales */}
                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Pending Sales ({billData.pending_sales.length})
                                    </h3>
                                    <div className="max-h-60 overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 dark:bg-gray-800">
                                                <tr>
                                                    <th className="p-2 text-left">Account</th>
                                                    <th className="p-2 text-left">Date</th>
                                                    <th className="p-2 text-right">Total</th>
                                                    <th className="p-2 text-right">Due</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billData.pending_sales.map((sale) => (
                                                    <tr key={sale.id} className="border-b dark:border-gray-700">
                                                        <td className="p-2">{sale.customer_name}</td>
                                                        <td className="p-2">
                                                            {new Date(sale.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-2 text-right">₹{sale.total_cost}</td>
                                                        <td className="p-2 text-right text-red-600">
                                                            ₹{sale.due_amount}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Last Payment */}
                                {billData.last_payment && (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Last Payment: </span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            ₹{billData.last_payment.amount_paid}
                                        </span>
                                        <span className="text-gray-500 ml-2">
                                            on {new Date(billData.last_payment.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">No data available</div>
                        )}

                        <button
                            className="w-full mt-4 px-4 py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
