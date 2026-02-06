/**
 * QuickBooks Integration Types
 * Handles type definitions for QuickBooks API responses and internal data structures
 */

export interface QuickBooksCredentials {
  realmId: string; // QuickBooks Company ID
  accessToken: string; // OAuth access token
  refreshToken: string; // OAuth refresh token
  userId: string; // Firebase user ID
  connectedAt: number; // Timestamp
  lastSync: number; // Timestamp of last sync
  tokenExpiresAt: number; // When access token expires
}

export interface QBAccount {
  id: string;
  name: string;
  type: string;
  subType: string;
  currentBalance: number;
  active: boolean;
}

export interface QBInvoice {
  id: string;
  docNumber: string;
  customerRef: { value: string; name: string };
  txnDate: string;
  totalAmt: number;
  balance: number;
  status: string;
  lineItems: QBLineItem[];
}

export interface QBLineItem {
  id: string;
  description: string;
  amount: number;
  qty: number;
  unitPrice: number;
}

export interface QBExpense {
  id: string;
  docNumber: string;
  txnDate: string;
  totalAmt: number;
  accountRef: { value: string; name: string };
  entityRef: { value: string; name: string; type: string };
  lineItems: QBLineItem[];
}

export interface QBCustomer {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  active: boolean;
  totalBalance: number;
  notes: string;
}

export interface QBVendor {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  active: boolean;
  accountNumber: string;
}

export interface QBIncomeStatement {
  revenues: number;
  costOfGoods: number;
  expenses: number;
  netIncome: number;
  period: string;
}

export interface QBBalanceSheet {
  assets: number;
  liabilities: number;
  equity: number;
  period: string;
}

export interface SyncedQuickBooksData {
  accounts: QBAccount[];
  invoices: QBInvoice[];
  expenses: QBExpense[];
  customers: QBCustomer[];
  vendors: QBVendor[];
  incomeStatement: QBIncomeStatement;
  balanceSheet: QBBalanceSheet;
  lastSyncTime: number;
  syncStatus: "success" | "failed" | "syncing";
}

export interface DashboardFinancialDataQB {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  taxableIncome: number;
  estimatedTax: number;
  revenueByMonth: Array<{ month: string; revenue: number; expenses: number }>;
  costBreakdown: Array<{ name: string; value: number; color: string }>;
}

export interface DashboardInvoiceData {
  invoices: QBInvoice[];
  totalInvoiced: number;
  totalOutstanding: number;
  overdueInvoices: number;
  averagePaymentDays: number;
}

export interface DashboardExpenseData {
  expenses: QBExpense[];
  totalExpenses: number;
  averageExpense: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
}
