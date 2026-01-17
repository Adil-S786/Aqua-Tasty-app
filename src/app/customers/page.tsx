"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import TopNav from "@/components/TopNav";
import DrawerMenu from "@/components/DrawerMenu";
import SaleFormSheet from "@/components/sales/SaleFormSheet";
import PayDueSheet from "@/components/sales/PayDueSheet";
import ReturnJarSheet from "@/components/sales/ReturnJarSheet";
import CustomerActionSheet from "@/app/customers/CustomerActionSheet";
import AddCustomerSheet from "@/components/customers/AddCustomerSheet";
import ProfilePopup from "@/components/customers/ProfilePopup"; // ✅ NEW
import api from "@/lib/api";
import { Endpoints } from "@/config/endpoints";
import toast from "react-hot-toast";

type Customer = {
    id: number;
    name: string;
    phone?: string | null;
    address?: string | null;
    fixed_price_per_jar?: number | null;
    delivery_type?: "self" | "delivery";
};

type Sale = {
    id: number;
    customer_id: number | null;
    customer_name: string | null;
    total_jars: number;
    our_jars: number;
    total_cost: number;
    amount_paid: number;
    due_amount: number;
    date: string;
};

type JarTrack = {
    id: number;
    customer_id: number | null;
    customer_name: string | null;
    current_due_jars: number;
};

type Row = {
    id: number | null;
    name: string;
    is_profiled: boolean;
    current_due_jars: number;
    total_due: number;
    last_buy_date: string | null;
    delivery_type?: "self" | "delivery";
    phone?: string | null;
    fixed_price_per_jar?: number | null;
    address?: string | null;
};

export default function CustomersPage() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<
        "all" | "due" | "jar-due" | "profiled" | "walkin"
    >("all");
    const [sortBy, setSortBy] = useState<"jars" | "amount" | "recent">("jars");

    // raw data
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [jarTrack, setJarTrack] = useState<JarTrack[]>([]);

    // action states
    const [actionOpen, setActionOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<Row | null>(null);

    // sheets
    const [saleSheetOpen, setSaleSheetOpen] = useState(false);
    const [salePrefillName, setSalePrefillName] = useState<string | null>(null);

    const [paySheetOpen, setPaySheetOpen] = useState(false);
    const [payTargetSale, setPayTargetSale] = useState<Sale | null>(null);

    const [returnSheetOpen, setReturnSheetOpen] = useState(false);

    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [convertWalkInName, setConvertWalkInName] = useState<string | null>(
        null
    );

    const [walkinBillCustomer, setWalkinBillCustomer] = useState<any>(null);
    const [walkinBillOpen, setWalkinBillOpen] = useState(false);


    // ✅ NEW for Profile Popup
    const [profileOpen, setProfileOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    // fetchers
    const fetchCustomers = async () => {
        const res = await api.get("/customers");
        setCustomers(res.data || []);
    };
    const fetchSales = async () => {
        const res = await api.get("/sales");
        setSales(res.data || []);
    };
    const fetchJarTrack = async () => {
        const res = await api.get("/jartracking");
        setJarTrack(res.data || []);
    };

    const refreshAll = async () => {
        await Promise.all([fetchCustomers(), fetchSales(), fetchJarTrack()]);
    };

    useEffect(() => {
        refreshAll();
    }, []);

    // ------------------ BUILD ROWS -------------------
    const rows: Row[] = useMemo(() => {
        const byId: Record<number, Row> = {};
        const walkinMap: Record<string, Row> = {};

        for (const c of customers) {
            const jt = jarTrack.find((j) => j.customer_id === c.id);
            const custSales = sales.filter((s) => s.customer_id === c.id);
            const last = custSales.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0];

            const total_due = custSales.reduce((sum, s) => sum + (s.due_amount || 0), 0);
            byId[c.id] = {
                id: c.id,
                name: c.name,
                is_profiled: true,
                current_due_jars: jt?.current_due_jars || 0,
                total_due,
                last_buy_date: last?.date || null,
                delivery_type: (c.delivery_type as any) || "self",
                phone: c.phone || null,
                fixed_price_per_jar: c.fixed_price_per_jar ?? null,
                address: c.address || null,
            };
        }

        // Walk-in group
        const walkinSales = sales.filter((s) => !s.customer_id && s.customer_name);
        for (const s of walkinSales) {
            const key = (s.customer_name || "").trim();
            if (!key) continue;
            if (!walkinMap[key]) {
                walkinMap[key] = {
                    id: null,
                    name: key,
                    is_profiled: false,
                    current_due_jars: 0,
                    total_due: 0,
                    last_buy_date: s.date || null,
                };
            }
            walkinMap[key].total_due += s.due_amount || 0;
            if (
                walkinMap[key].last_buy_date &&
                new Date(s.date).getTime() >
                new Date(walkinMap[key].last_buy_date!).getTime()
            ) {
                walkinMap[key].last_buy_date = s.date;
            }
        }

        // add jar due for walkins
        for (const jt of jarTrack) {
            if (!jt.customer_id && jt.customer_name) {
                const k = jt.customer_name.trim();
                if (!walkinMap[k]) {
                    walkinMap[k] = {
                        id: null,
                        name: k,
                        is_profiled: false,
                        current_due_jars: jt.current_due_jars || 0,
                        total_due: 0,
                        last_buy_date: null,
                    };
                } else {
                    walkinMap[k].current_due_jars = jt.current_due_jars || 0;
                }
            }
        }

        const allRows = [...Object.values(byId), ...Object.values(walkinMap)];

        // filters
        const filtered = allRows
            .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
            .filter((r) => {
                if (filter === "due") return (r.total_due || 0) > 0;
                if (filter === "jar-due") return (r.current_due_jars || 0) > 0;
                if (filter === "profiled") return r.is_profiled;
                if (filter === "walkin") return !r.is_profiled;
                return true;
            });

        // sort
        if (sortBy === "jars") {
            filtered.sort(
                (a, b) => (b.current_due_jars || 0) - (a.current_due_jars || 0)
            );
        } else if (sortBy === "amount") {
            filtered.sort((a, b) => (b.total_due || 0) - (a.total_due || 0));
        } else if (sortBy === "recent") {
            filtered.sort(
                (a, b) =>
                    new Date(b.last_buy_date || 0).getTime() -
                    new Date(a.last_buy_date || 0).getTime()
            );
        }

        return filtered;
    }, [customers, sales, jarTrack, search, filter, sortBy]);

    // ------------------ SUMMARY -------------------
    const summary = useMemo(() => {
        const total_customers = rows.length;
        const profiled_count = rows.filter(r => r.is_profiled).length;
        const walkin_count = rows.filter(r => !r.is_profiled).length;
        const total_due = rows.reduce((sum, r) => sum + (r.total_due || 0), 0);
        const total_jar_due = rows.reduce((sum, r) => sum + (r.current_due_jars || 0), 0);

        return {
            total_customers,
            profiled_count,
            walkin_count,
            total_due,
            total_jar_due,
        };
    }, [rows]);

    // ------------------ ACTIONS -------------------
    const openActions = (row: Row) => {
        setSelectedRow(row);
        setActionOpen(true);
    };

    const beginProfileOrConvert = (row: Row) => {
        if (row.is_profiled) {
            // ⭐ Fetch the selected customer object
            const customer = customers.find((c) => c.id === row.id);

            // ⭐ Important: clone object to force re-render of ProfilePopup
            setSelectedCustomer(customer ? { ...customer } : null);

            // ⭐ Open Profile Popup
            setProfileOpen(true);

        } else {
            // ⭐ Walk-in → Convert sheet
            setConvertWalkInName(row.name);
            setAddSheetOpen(true);
        }
    };

    const beginPayDue = (row: Row) => {
        const filterFn = row.is_profiled
            ? (s: Sale) => s.customer_id === row.id && s.due_amount > 0
            : (s: Sale) => !s.customer_id && s.customer_name === row.name && s.due_amount > 0;

        const dueSale = sales
            .filter(filterFn)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (dueSale) {
            setPayTargetSale(dueSale);
            setPaySheetOpen(true);
        } else alert("No due found for this customer.");
    };

    const beginReturnJar = (row: Row) => {
        const pseudoSale = {
            id: 0,
            customer_id: row.is_profiled ? row.id : null,
            customer_name: row.is_profiled ? null : row.name,
            total_jars: 0,
            our_jars: 0,
            total_cost: 0,
            amount_paid: 0,
            due_amount: 0,
            date: new Date().toISOString(),
        } as Sale;
        setPayTargetSale(pseudoSale);
        setReturnSheetOpen(true);
    };

    const beginSellAgain = (row: Row) => {
        setSalePrefillName(row.name);
        setSaleSheetOpen(true);
    };

    // ------------------ RENDER -------------------
    return (
        <main className="pt-2">
            <TopNav onMenuClick={() => setOpen(true)} />
            <DrawerMenu isOpen={open} onClose={() => setOpen(false)} />

            <div className="p-4 space-y-3">
                <h1 className="text-xl font-semibold text-[#045b68]">Customers</h1>

                {/* Search */}
                <input
                    className="input"
                    placeholder="Search customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="input"
                    >
                        <option value="all">All</option>
                        <option value="due">Due Amount</option>
                        <option value="jar-due">Due Jars</option>
                        <option value="profiled">Profiled</option>
                        <option value="walkin">Walk-in</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="input"
                    >
                        <option value="jars">Sort: Jar Due ↓</option>
                        <option value="amount">Sort: Amount Due ↓</option>
                        <option value="recent">Sort: Recent Purchase</option>
                    </select>
                </div>

                {/* Summary */}
                <div className="bg-white/60 backdrop-blur-xl p-3 rounded-xl shadow-md">
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                        <div>
                            <div className="text-sm text-gray-600">Total</div>
                            <div className="text-lg font-semibold">{summary.total_customers}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Profiled</div>
                            <div className="text-lg font-semibold text-green-600">{summary.profiled_count}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Due</div>
                            <div className="text-lg font-semibold text-red-600">₹{summary.total_due.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Jar Due</div>
                            <div className="text-lg font-semibold text-blue-700">{summary.total_jar_due}</div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/65 backdrop-blur-md p-3 rounded-2xl shadow-md">
                    <table className="w-full text-sm">
                        <thead className="text-[#055f6a]">
                            <tr>
                                <th className="text-left p-2">Name</th>
                                <th className="text-center p-2">Jar Due</th>
                                <th className="text-right p-2">₹ Due</th>
                                <th className="text-right p-2">Last Buy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={`${r.is_profiled ? r.id : "walkin"}-${r.name}`}
                                    className="border-t border-gray-200 active:bg-gray-100 cursor-pointer"
                                    onClick={() => openActions(r)}
                                >
                                    <td className="flex items-center gap-1 p-2">
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full ${r.is_profiled ? "bg-green-600" : "bg-gray-500"
                                                }`}
                                        />
                                        {r.name}
                                    </td>
                                    <td className="p-2 text-center text-blue-700">
                                        {r.current_due_jars}
                                    </td>
                                    <td className="p-2 text-right text-red-600">
                                        ₹{(r.total_due || 0).toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right">
                                        {r.last_buy_date
                                            ? new Date(r.last_buy_date).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                            })
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Customer Button */}
                <button
                    className="fixed bottom-5 right-5 btn text-lg px-6 py-3 rounded-full"
                    onClick={() => {
                        setConvertWalkInName(null);
                        setAddSheetOpen(true);
                    }}
                >
                    + Add Customer
                </button>
            </div>

            {/* Action Sheet */}
            <CustomerActionSheet
                isOpen={actionOpen}
                onClose={() => setActionOpen(false)}
                row={selectedRow}
                onSellAgain={() => {
                    setActionOpen(false);
                    if (selectedRow) beginSellAgain(selectedRow);
                }}
                onPayDue={() => {
                    setActionOpen(false);
                    if (selectedRow) beginPayDue(selectedRow);
                }}
                onReturnJar={() => {
                    setActionOpen(false);
                    if (selectedRow) beginReturnJar(selectedRow);
                }}
                onProfileOrConvert={() => {
                    setActionOpen(false);
                    if (selectedRow) beginProfileOrConvert(selectedRow);
                }}
                onViewBill={() => {
                    setActionOpen(false);

                    // Build a temporary customer-like object for popup
                    setWalkinBillCustomer({
                        id: null,
                        name: selectedRow?.name,
                        phone: null,
                        address: null,
                        fixed_price_per_jar: null,
                        delivery_type: "self"
                    });

                    setWalkinBillOpen(true);
                }}
            />

            {/* Sheets */}
            <SaleFormSheet
                isOpen={saleSheetOpen}
                onClose={() => setSaleSheetOpen(false)}
                customerName={salePrefillName || undefined}
                customers={customers}
                sales={sales}
                refreshAll={refreshAll}
            />

            {payTargetSale && (
                <PayDueSheet
                    isOpen={paySheetOpen}
                    onClose={() => setPaySheetOpen(false)}
                    sale={payTargetSale}
                    onPaid={refreshAll}
                />
            )}

            {payTargetSale && (
                <ReturnJarSheet
                    isOpen={returnSheetOpen}
                    onClose={() => setReturnSheetOpen(false)}
                    sale={payTargetSale}
                    refreshData={refreshAll}
                />
            )}

            {/* // ONLY THE UPDATED onSaved SECTION — rest of file remains EXACTLY the same */}

            <AddCustomerSheet
                isOpen={addSheetOpen}
                onClose={() => setAddSheetOpen(false)}
                prefillName={convertWalkInName || ""}
                onSaved={async (result) => {
                    // result = { mode: "add" | "convert", data: payload }

                    if (result.mode === "convert") {
                        // directly convert — no extra customer create
                        try {
                            await api.post(Endpoints.convertWalkin, result.data);
                            toast.success("Walk-in converted!");
                        } catch (err: any) {
                            toast.error(err.response?.data?.detail || "Conversion failed");
                            return;
                        }
                    } else {
                        toast.success("Customer added!");
                    }

                    await refreshAll();
                }}
            />


            {/* ✅ Profile Popup */}
            {profileOpen && selectedCustomer && (
                <ProfilePopup
                    key={selectedCustomer.id}
                    isOpen={profileOpen}
                    onClose={async () => {
                        setProfileOpen(false);
                        await refreshAll();

                        if (selectedCustomer?.id) {
                            const fresh = customers.find(c => c.id === selectedCustomer.id);
                            if (fresh) setSelectedCustomer({ ...fresh });
                        }
                    }}
                    customer={{ ...selectedCustomer }}
                    refreshAll={refreshAll}

                    // ⭐ NEW FIX — pass updated data back
                    onUpdateCustomerFromPopup={(updated) => {
                        setSelectedCustomer((prev: Customer | null) => ({
                            ...prev!,
                            ...updated,
                        }));
                    }}

                    onPayDueClick={(cust) => {
                        setProfileOpen(false);

                        const dueSale = sales
                            .filter(
                                (s) =>
                                    (cust.id
                                        ? s.customer_id === cust.id
                                        : s.customer_name === cust.name) &&
                                    s.due_amount > 0
                            )
                            .sort(
                                (a, b) =>
                                    new Date(b.date).getTime() -
                                    new Date(a.date).getTime()
                            )[0];

                        if (dueSale) {
                            setPayTargetSale(dueSale);
                            setPaySheetOpen(true);
                        } else {
                            alert("No pending due found for this customer.");
                        }
                    }}
                />
            )}
            {walkinBillOpen && walkinBillCustomer && (
                <ProfilePopup
                    key={walkinBillCustomer.name}

                    isOpen={walkinBillOpen}
                    onClose={() => setWalkinBillOpen(false)}

                    // Walk-in data (read only)
                    customer={{ ...walkinBillCustomer }}

                    // Disable saving/editing actions
                    disableEdit={true}

                    // Required props but disabled
                    refreshAll={refreshAll}
                    onUpdateCustomerFromPopup={() => { }}

                    onPayDueClick={(cust) => {
                        setWalkinBillOpen(false);

                        const dueSale = sales
                            .filter(s =>
                                !s.customer_id &&
                                s.customer_name === cust.name &&
                                s.due_amount > 0
                            )
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                        if (dueSale) {
                            setPayTargetSale(dueSale);
                            setPaySheetOpen(true);
                        } else {
                            alert("No pending dues for this walk-in customer.");
                        }
                    }}
                />
            )}

        </main>
    );
}
