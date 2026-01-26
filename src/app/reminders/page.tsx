"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import DrawerMenu from "@/components/DrawerMenu";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import ReminderTable from "@/components/reminders/ReminderTable";
import AddReminderSheet from "@/components/reminders/AddReminderSheet";
import ReminderActionSheet from "@/components/reminders/ReminderActionSheet";
import ReschedulePopup from "@/components/reminders/ReschedulePopup";
import { Sparkles, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function RemindersPage() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<any | null>(null);
    const [selectedReminder, setSelectedReminder] = useState<any | null>(null);

    const [remindersProfiled, setRemindersProfiled] = useState<any[]>([]);
    const [remindersCustom, setRemindersCustom] = useState<any[]>([]);
    const [remindersOverdue, setRemindersOverdue] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatingSmart, setGeneratingSmart] = useState(false);

    // ----------------------
    // LOAD REMINDERS
    // ----------------------
    const fetchReminders = async () => {
        setLoading(true);
        try {
            const res = await api.get(Endpoints.reminders);
            const data = res.data || {};

            setRemindersProfiled(Array.isArray(data.profiled) ? data.profiled : []);
            setRemindersCustom(Array.isArray(data.customs) ? data.customs : []);
        } catch (err) {
            console.error("Failed to load reminders", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOverdueReminders = async () => {
        try {
            const res = await api.get(Endpoints.remindersOverdue);
            setRemindersOverdue(res.data || []);
        } catch (err: any) {
            // Silently handle errors - don't block the page
            setRemindersOverdue([]);
            
            // Only log to console, don't show to user
            if (err?.response?.status === 422) {
                console.warn("Overdue reminders validation error (422) - ignoring");
            } else if (err?.response?.status !== 404) {
                console.warn("Overdue reminders error:", err?.response?.status, err?.response?.data);
            }
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get(Endpoints.customers);
            setCustomers(res.data || []);
        } catch (e) {
            console.error("Failed loading customers", e);
        }
    };

    useEffect(() => {
        fetchReminders();
        fetchOverdueReminders();
        fetchCustomers();
    }, []);

    // ----------------------
    // SMART GENERATION
    // ----------------------
    const handleGenerateSmart = async () => {
        if (!confirm("Generate smart reminders based on customer purchase patterns?\n\nThis will analyze all customers and create reminders for those who are due.")) return;

        setGeneratingSmart(true);
        try {
            const res = await api.post(Endpoints.generateSmartReminders);
            const data = res.data;
            
            // Show detailed results
            let message = `✅ Smart Reminders Generated!\n\n`;
            message += `📝 Created: ${data.created} reminders\n`;
            message += `⏭️ Skipped: ${data.skipped} (already have reminders or not due)\n`;
            
            if (data.inactive > 0) {
                message += `⚠️ Inactive: ${data.inactive} customers (no purchase in 60+ days)\n`;
            }
            
            if (data.no_pattern > 0) {
                message += `ℹ️ No Pattern: ${data.no_pattern} customers (need more sales data)\n`;
            }
            
            message += `\n👥 Total Customers: ${data.total_customers}`;
            
            toast.success(message, { duration: 6000 });
            
            // Show warning if many inactive
            if (data.inactive > 5) {
                setTimeout(() => {
                    toast(
                        `${data.inactive} customers appear inactive. Consider reviewing them manually.`,
                        { icon: '⚠️', duration: 5000 }
                    );
                }, 1000);
            }
            
            await fetchReminders();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Failed to generate smart reminders");
        } finally {
            setGeneratingSmart(false);
        }
    };

    // ----------------------
    // ADVANCE OVERDUE
    // ----------------------
    const handleAutoAdvance = async () => {
        if (!confirm("Advance all overdue reminders to today?\n\nThis will move all yesterday's and older reminders to today.")) return;

        try {
            const res = await api.post(Endpoints.advanceOverdueReminders);
            toast.success(res.data.message || `Advanced ${res.data.advanced} overdue reminders`);
            await fetchReminders();
            await fetchOverdueReminders();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Failed to advance reminders");
        }
    };

    // ----------------------
    // OPEN SHEETS
    // ----------------------
    const openAdd = () => {
        setEditingReminder(null);
        setSheetOpen(true);
    };

    const openEdit = (r: any) => {
        setEditingReminder(r);
        setSheetOpen(true);
    };

    const handleRowClick = (r: any) => {
        setSelectedReminder(r);
        setActionSheetOpen(true);
    };

    const onSaved = async () => {
        await fetchReminders();
        await fetchOverdueReminders();
    };

    // ----------------------
    // ACTIONS
    // ----------------------
    const handleSkip = async (id: number) => {
        try {
            await api.post(Endpoints.markReminderStatus(id), { status: "skipped" });
            await fetchReminders();
            await fetchOverdueReminders();
            toast.success("Reminder skipped");
        } catch (err) {
            console.error("Skip failed:", err);
            toast.error("Failed to skip reminder");
        }
    };

    const handleReschedule = async (id: number, nextIso: string) => {
        try {
            await api.put(Endpoints.reminderById(id), {
                next_date: nextIso,
                status: "rescheduled",
            });
            await fetchReminders();
            await fetchOverdueReminders();
        } catch (e) {
            console.error(e);
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await api.post(Endpoints.reminderComplete(id));
            toast.success("Reminder completed!");
            await fetchReminders();
            await fetchOverdueReminders();
        } catch (e) {
            console.error("Mark complete failed:", e);
            toast.error("Failed to complete reminder");
        }
    };

    const handleMoveTomorrow = async (id: number) => {
        try {
            await api.post(`${Endpoints.reminders}/${id}/move-tomorrow`);
            toast.success("Reminder moved to tomorrow!");
            await fetchReminders();
            await fetchOverdueReminders();
        } catch (e) {
            console.error("Move tomorrow failed:", e);
            toast.error("Failed to move reminder");
        }
    };

    const handleMarkInactive = async () => {
        if (!selectedReminder || !selectedReminder.customer_id) {
            toast.error("Only profiled customers can be marked inactive");
            return;
        }

        const customerName = selectedReminder.customer_name || "this customer";
        if (!confirm(`Mark ${customerName} as inactive? This will stop auto-generating reminders for them.`)) {
            return;
        }

        try {
            await api.post(`${Endpoints.customers}/${selectedReminder.customer_id}/mark-inactive`);
            toast.success(`${customerName} marked as inactive`);
            await fetchReminders();
            await fetchOverdueReminders();
        } catch (e) {
            console.error("Mark inactive failed:", e);
            toast.error("Failed to mark customer as inactive");
        }
    };

    const handleDelete = async () => {
        if (!selectedReminder) return;

        const customerName = selectedReminder.customer_name || selectedReminder.custom_name || "this reminder";
        if (!confirm(`Delete reminder for ${customerName}? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`${Endpoints.reminders}/${selectedReminder.id}`);
            toast.success("Reminder deleted successfully");
            await fetchReminders();
            await fetchOverdueReminders();
        } catch (e) {
            console.error("Delete failed:", e);
            toast.error("Failed to delete reminder");
        }
    };

    return (
        <main className="pt-2">
            <TopNav onMenuClick={() => setDrawerOpen(true)} />
            <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

            <div className="p-4 pb-24">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-[#045b68] dark:text-[#B4F2EE] mb-1">
                        Reminders
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage delivery schedules and follow-ups
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    <button
                        onClick={handleGenerateSmart}
                        disabled={generatingSmart}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        <Sparkles size={16} />
                        <span>{generatingSmart ? "Generating..." : "Smart"}</span>
                    </button>

                    <button
                        onClick={handleAutoAdvance}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
                        title="Auto-advance overdue reminders"
                    >
                        <span>⏭️ Advance</span>
                    </button>

                    <button
                        onClick={openAdd}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <span>+ Add</span>
                    </button>
                </div>

                {/* Overdue Alert */}
                {remindersOverdue.length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <AlertCircle size={20} />
                            <span className="font-semibold">
                                {remindersOverdue.length} Overdue Reminder{remindersOverdue.length > 1 ? "s" : ""}
                            </span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            These reminders are past their scheduled date. Please review and take action.
                        </p>
                    </div>
                )}

                {/* PROFILED */}
                <ReminderTable
                    reminders={remindersProfiled}
                    type="profiled"
                    loading={loading}
                    onEdit={openEdit}
                    onSkip={handleSkip}
                    onReschedule={handleReschedule}
                    onComplete={handleComplete}
                    onRowClick={handleRowClick}
                />

                {/* CUSTOM */}
                <ReminderTable
                    reminders={remindersCustom}
                    type="custom"
                    loading={loading}
                    onEdit={openEdit}
                    onSkip={handleSkip}
                    onReschedule={handleReschedule}
                    onComplete={handleComplete}
                    onRowClick={handleRowClick}
                />
            </div>

            {/* Add/Edit Sheet */}
            <AddReminderSheet
                isOpen={sheetOpen}
                onClose={() => setSheetOpen(false)}
                customers={customers}
                initialData={editingReminder}
                onSaved={onSaved}
            />

            {/* Action Sheet */}
            <ReminderActionSheet
                isOpen={actionSheetOpen}
                onClose={() => setActionSheetOpen(false)}
                reminder={selectedReminder}
                onEdit={() => {
                    if (selectedReminder) {
                        openEdit(selectedReminder);
                    }
                }}
                onComplete={() => {
                    if (selectedReminder) {
                        handleComplete(selectedReminder.id);
                    }
                }}
                onSkip={() => {
                    if (selectedReminder) {
                        handleSkip(selectedReminder.id);
                    }
                }}
                onReschedule={() => {
                    if (selectedReminder) {
                        const dlg = document.getElementById("reschedule-dialog-" + selectedReminder.id) as HTMLDialogElement;
                        dlg?.showModal();
                    }
                }}
                onMoveTomorrow={() => {
                    if (selectedReminder) {
                        handleMoveTomorrow(selectedReminder.id);
                    }
                }}
                onMarkInactive={handleMarkInactive}
                onDelete={handleDelete}
            />

            {/* Reschedule Popups (one for each reminder) */}
            {[...remindersProfiled, ...remindersCustom].map((r) => (
                <ReschedulePopup
                    key={r.id}
                    id={r.id}
                    onClose={() => {
                        const dlg = document.getElementById("reschedule-dialog-" + r.id) as HTMLDialogElement;
                        dlg?.close();
                    }}
                    onConfirm={handleReschedule}
                    initialDate={r.next_date}
                />
            ))}
        </main>
    );
}
