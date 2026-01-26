export const Endpoints = {
  // Customers
  customers: "/customers",
  customerById: (id: number) => `/customers/${id}`,
  checkCustomerName: "/customers/check-name",
  convertWalkin: "/customers/convert-walkin",
  linkCustomer: (customerId: number, parentId: number) => `/customers/${customerId}/link?parent_id=${parentId}`,
  unlinkCustomer: (customerId: number) => `/customers/${customerId}/unlink`,
  linkedAccounts: (customerId: number) => `/customers/${customerId}/linked-accounts`,
  combinedBill: (customerId: number) => `/customers/${customerId}/combined-bill`,

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
  totalJars: "/jartracking/total-jars",

  // Payments
  payments: "/payments",
  paymentById: (id: number) => `/payments/${id}`,
  createBackdatedPayment: "/payments/create",

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
  reminderDone: (id: number) => `/reminders/${id}/done`,
  markReminderStatus: (id: number) => `/reminders/${id}/status`,
  advanceReminder: (id: number) => `/reminders/${id}/advance`,
  moveReminderTomorrow: (id: number) => `/reminders/${id}/move-tomorrow`,
  advanceOverdueReminders: "/reminders/advance-overdue",
  generateSmartReminders: "/reminders/generate-smart",
  customerPattern: (id: number) => `/reminders/customer-pattern/${id}`,
};
