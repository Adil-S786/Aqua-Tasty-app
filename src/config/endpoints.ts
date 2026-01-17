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
  paymentById: (id: number) => `/payments/${id}`,

  // Walk-in Bills
  walkinBill: "/walkin/bill",

  // Summary (full data)
  summary: "/summary",

  // ⭐ NEW Dashboard Filter API
  dashboardStats: "/dashboard/stats",


  //⭐ REMINDER ENDPOINTS
  reminders: "/reminders",
  reminderById: (id: number) => `/reminders/${id}`,
  remindersDueToday: "/reminders/due/today",
  remindersOverdue: "/reminders/overdue",
  reminderComplete: (id: number) => `/reminders/${id}/complete`,
  markReminderStatus: (id: number) => `/reminders/${id}/status`,
  advanceReminder: (id: number) => `/reminders/${id}/advance`,
  generateSmartReminders: "/reminders/generate-smart",
  autoAdvanceOverdue: "/reminders/auto-advance-overdue",
  customerPattern: (id: number) => `/reminders/customer-pattern/${id}`,
};
