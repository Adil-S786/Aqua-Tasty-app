export const Endpoints = {
  // Customers
  customers: "/customers",
  customerById: (id: number) => `/customers/${id}`,
  checkCustomerName: "/customers/check-name",
  convertWalkin: "/customers/convert-walkin",

  // Sales
  sales: "/sales",
  saleById: (id: number) => `/sales/${id}`,
  salesProfiled: "/sales/profiled",
  salesHistory: (customerId: number) => `/sales/history/${customerId}`,
  payDue: "/sales/paydue",
  totalDue: "/sales/total-due",

  // Expenses
  expenses: "/expenses",
  expenseById: (id: number) => `/expenses/${id}`,

  // Jar Tracking
  jarTracking: "/jartracking",
  jarReturn: "/jartracking/return",

  // Payments
  payments: "/payments",

  // Walk-in Bills
  walkinBill: "/walkin/bill",

  // Summary (full data)
  summary: "/summary",

  // ⭐ NEW Dashboard Filter API
  dashboardStats: "/dashboard/stats",


  //⭐ FINAL REMINDER ENDPOINTS — FIXED
  // in Endpoints
  reminders: "/reminders",
  reminderById: (id: number) => `/reminders/${id}`,
  upcomingReminders: "/reminders/upcoming",
  remindersByCustomer: (id: number) => `/reminders/customer/${id}`,
  markReminderStatus: (id: number) => `/reminders/${id}/status`, // POST {status}
  advanceReminder: (id: number) => `/reminders/${id}/advance`,   // POST

};
