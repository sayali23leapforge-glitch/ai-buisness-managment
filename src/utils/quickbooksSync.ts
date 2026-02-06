import type {
  QuickBooksCredentials,
  QBAccount,
  QBInvoice,
  QBExpense,
  QBCustomer,
  QBVendor,
  QBIncomeStatement,
  QBBalanceSheet,
  QBFinancialData,
  QBInvoiceData,
  QBExpenseData,
  QBCustomerData,
} from "./quickbooksTypes";
import { updateQuickBooksSync } from "./quickbooksStore";

const API_BASE_URL = "http://localhost:4242";

/**
 * Refresh QuickBooks OAuth token
 */
export const refreshQuickBooksToken = async (
  userId: string,
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quickbooks/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, refreshToken }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", await response.text());
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error refreshing QB token:", error);
    return null;
  }
};

/**
 * Fetch accounts from QuickBooks
 */
export const fetchQuickBooksAccounts = async (
  userId: string
): Promise<QBAccount[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quickbooks/accounts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch QB accounts:", error);
      return [];
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error("Error fetching QB accounts:", error);
    return [];
  }
};

/**
 * Fetch invoices from QuickBooks
 */
export const fetchQuickBooksInvoices = async (
  userId: string
): Promise<QBInvoice[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quickbooks/invoices`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch QB invoices:", error);
      return [];
    }

    const data = await response.json();
    return data.invoices || [];
  } catch (error) {
    console.error("Error fetching QB invoices:", error);
    return [];
  }
};

/**
 * Fetch expenses from QuickBooks
 */
export const fetchQuickBooksExpenses = async (
  userId: string
): Promise<QBExpense[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quickbooks/expenses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch QB expenses:", error);
      return [];
    }

    const data = await response.json();
    return data.expenses || [];
  } catch (error) {
    console.error("Error fetching QB expenses:", error);
    return [];
  }
};

/**
 * Fetch customers from QuickBooks
 */
export const fetchQuickBooksCustomers = async (
  userId: string
): Promise<QBCustomer[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quickbooks/customers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch QB customers:", error);
      return [];
    }

    const data = await response.json();
    return data.customers || [];
  } catch (error) {
    console.error("Error fetching QB customers:", error);
    return [];
  }
};

/**
 * Transform QB accounts to financial data
 */
export const transformAccountsToFinancial = (
  accounts: QBAccount[]
): QBFinancialData => {
  const assets = accounts
    .filter((a) => a.classification === "ASSET")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const liabilities = accounts
    .filter((a) => a.classification === "LIABILITY")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const equity = accounts
    .filter((a) => a.classification === "EQUITY")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  return {
    totalAssets: assets,
    totalLiabilities: liabilities,
    totalEquity: equity,
    netWorth: assets - liabilities,
    accountCount: accounts.length,
    lastUpdated: Date.now(),
  };
};

/**
 * Transform QB invoices to dashboard data
 */
export const transformInvoicesToData = (invoices: QBInvoice[]): QBInvoiceData => {
  const total = invoices.reduce((sum, inv) => sum + inv.totalAmt, 0);
  const unpaid = invoices
    .filter((inv) => inv.docStatus === "POSTED")
    .reduce((sum, inv) => sum + inv.totalAmt, 0);
  const paid = total - unpaid;

  const last30Days = invoices.filter(
    (inv) => Date.now() - new Date(inv.txnDate).getTime() < 30 * 24 * 60 * 60 * 1000
  );

  return {
    totalInvoices: invoices.length,
    totalRevenue: total,
    paidAmount: paid,
    unpaidAmount: unpaid,
    recentInvoices: last30Days.length,
    averageInvoiceAmount: invoices.length > 0 ? total / invoices.length : 0,
    topInvoices: invoices
      .sort((a, b) => b.totalAmt - a.totalAmt)
      .slice(0, 5),
    lastUpdated: Date.now(),
  };
};

/**
 * Transform QB expenses to dashboard data
 */
export const transformExpensesToData = (expenses: QBExpense[]): QBExpenseData => {
  const total = expenses.reduce((sum, exp) => sum + exp.totalAmt, 0);

  const byCategory: { [key: string]: number } = {};
  expenses.forEach((exp) => {
    const category = exp.line?.[0]?.description || "Other";
    byCategory[category] = (byCategory[category] || 0) + exp.totalAmt;
  });

  const last30Days = expenses.filter(
    (exp) => Date.now() - new Date(exp.txnDate).getTime() < 30 * 24 * 60 * 60 * 1000
  );

  const last90Days = expenses.filter(
    (exp) => Date.now() - new Date(exp.txnDate).getTime() < 90 * 24 * 60 * 60 * 1000
  );

  return {
    totalExpenses: total,
    expenseCount: expenses.length,
    last30Days: last30Days.reduce((sum, exp) => sum + exp.totalAmt, 0),
    last90Days: last90Days.reduce((sum, exp) => sum + exp.totalAmt, 0),
    byCategory,
    topExpenses: expenses
      .sort((a, b) => b.totalAmt - a.totalAmt)
      .slice(0, 5),
    lastUpdated: Date.now(),
  };
};

/**
 * Transform QB customers to dashboard data
 */
export const transformCustomersToData = (customers: QBCustomer[]): QBCustomerData => {
  const totalRevenue = customers.reduce((sum, cust) => sum + (cust.totalBalance || 0), 0);

  return {
    totalCustomers: customers.length,
    totalRevenue,
    activeCustomers: customers.filter((c) => c.active).length,
    archivedCustomers: customers.filter((c) => !c.active).length,
    averageCustomerValue: customers.length > 0 ? totalRevenue / customers.length : 0,
    topCustomers: customers
      .sort((a, b) => (b.totalBalance || 0) - (a.totalBalance || 0))
      .slice(0, 5),
    lastUpdated: Date.now(),
  };
};

/**
 * Sync all QuickBooks data
 */
export const syncAllQuickBooksData = async (
  userId: string
): Promise<{
  success: boolean;
  financial?: QBFinancialData;
  invoices?: QBInvoiceData;
  expenses?: QBExpenseData;
  customers?: QBCustomerData;
  timestamp?: number;
  error?: string;
}> => {
  try {
    // Fetch all data in parallel
    const [accounts, invoices, expenses, customers] = await Promise.all([
      fetchQuickBooksAccounts(userId),
      fetchQuickBooksInvoices(userId),
      fetchQuickBooksExpenses(userId),
      fetchQuickBooksCustomers(userId),
    ]);

    // Transform to dashboard formats
    const financial = transformAccountsToFinancial(accounts);
    const invoiceData = transformInvoicesToData(invoices);
    const expenseData = transformExpensesToData(expenses);
    const customerData = transformCustomersToData(customers);

    // Update last sync time
    const timestamp = Date.now();
    await updateQuickBooksSync(userId, timestamp);

    return {
      success: true,
      financial,
      invoices: invoiceData,
      expenses: expenseData,
      customers: customerData,
      timestamp,
    };
  } catch (error) {
    console.error("Error syncing QB data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync QB data",
    };
  }
};

/**
 * Get QB sync status
 */
export const getQuickBooksStatus = async (userId: string): Promise<{
  connected: boolean;
  lastSync?: number;
  company?: string;
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quickbooks/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
    });

    if (!response.ok) {
      return { connected: false, error: "Failed to fetch status" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching QB status:", error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Failed to fetch status",
    };
  }
};
