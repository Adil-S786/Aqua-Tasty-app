"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import DrawerMenu from "@/components/DrawerMenu";
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import ReminderTable from "@/components/reminders/ReminderTable";
import AddReminderSheet from "@/components/reminders/AddReminderSheet";

export default function RemindersPage() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<any | null>(null);

    const [remindersProfiled, setRemindersProfiled] = useState<any[]>([]);
    const [remindersCustom, setRemindersCustom] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
        fetchCustomers();
    }, []);

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

    const onSaved = async () => {
        await fetchReminders();
    };

    // ----------------------
    // ACTIONS
    // ----------------------
    const handleSkip = async (id: number) => {
        try {
            await api.post(
                Endpoints.markReminderStatus(id),
                "skipped", // MUST be raw string
                { headers: { "Content-Type": "text/plain" } }
            );

            await fetchReminders();
        } catch (err) {
            console.error("Skip failed:", err);
        }
    };

    const handleReschedule = async (id: number, nextIso: string) => {
        try {
            await api.put(Endpoints.reminderById(id), {
                next_date: nextIso,
                status: "rescheduled",
            });
            await fetchReminders();
        } catch (e) {
            console.error(e);
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await api.post(
                Endpoints.markReminderStatus(id),
                "completed",
                { headers: { "Content-Type": "text/plain" } }
            );
            await fetchReminders();
        } catch (e) {
            console.error("Mark complete failed:", e);
        }
    };


    return (
        <main className="pt-2">
            <TopNav onMenuClick={() => setDrawerOpen(true)} />
            <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold text-[#045b68]">Reminders</h1>

                    <button
                        onClick={openAdd}
                        className="btn px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        + Add Reminder
                    </button>
                </div>

                {/* PROFILED */}
                <ReminderTable
                    reminders={remindersProfiled}
                    type="profiled"
                    loading={loading}
                    onEdit={openEdit}
                    onSkip={handleSkip}
                    onReschedule={handleReschedule}
                    onComplete={handleComplete}
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
        </main>
    );
}
