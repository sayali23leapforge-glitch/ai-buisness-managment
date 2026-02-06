import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  syncAllQuickBooksData,
  fetchQuickBooksInvoices,
  fetchQuickBooksCustomers,
  getQuickBooksStatus,
} from "../utils/quickbooksSync";
import type {
  QBFinancialData,
  QBInvoiceData,
  QBExpenseData,
  QBCustomerData,
  QBInvoice,
  QBCustomer,
} from "../utils/quickbooksTypes";

interface UseQuickBooksDataOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

interface QuickBooksDataState {
  financialData: QBFinancialData | null;
  invoiceData: QBInvoiceData | null;
  expenseData: QBExpenseData | null;
  customerData: QBCustomerData | null;
  invoices: QBInvoice[];
  customers: QBCustomer[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  connected: boolean;
  lastSync: number | null;
}

/**
 * Custom hook for QuickBooks data
 * Provides financial data, invoices, expenses, and customers
 */
export const useQuickBooksData = (options: UseQuickBooksDataOptions = {}) => {
  const { user } = useAuth();
  const { autoSync = true, syncInterval = 300000 } = options; // 5 minutes default

  const [state, setState] = useState<QuickBooksDataState>({
    financialData: null,
    invoiceData: null,
    expenseData: null,
    customerData: null,
    invoices: [],
    customers: [],
    loading: true,
    syncing: false,
    error: null,
    connected: false,
    lastSync: null,
  });

  // Check connection status
  const checkConnection = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const status = await getQuickBooksStatus(user.uid);
      setState((prev) => ({
        ...prev,
        connected: status.connected,
      }));
      return status.connected;
    } catch (error) {
      console.error("Error checking QB connection:", error);
      return false;
    }
  }, [user?.uid]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.uid) {
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
        return;
      }

      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        const isConnected = await checkConnection();

        if (isConnected) {
          const result = await syncAllQuickBooksData(user.uid);
          if (result.success) {
            const [invoices, customers] = await Promise.all([
              fetchQuickBooksInvoices(user.uid),
              fetchQuickBooksCustomers(user.uid),
            ]);

            setState((prev) => ({
              ...prev,
              financialData: result.financial || null,
              invoiceData: result.invoices || null,
              expenseData: result.expenses || null,
              customerData: result.customers || null,
              invoices,
              customers,
              lastSync: result.timestamp || null,
              error: null,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              error: result.error || "Failed to sync data",
            }));
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      } finally {
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    };

    loadInitialData();
  }, [user?.uid, checkConnection]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync || !user?.uid || !state.connected) return;

    const interval = setInterval(async () => {
      await manualSync();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, user?.uid, state.connected, syncInterval]);

  // Manual sync function
  const manualSync = useCallback(async () => {
    if (!user?.uid || !state.connected) return;

    try {
      setState((prev) => ({
        ...prev,
        syncing: true,
        error: null,
      }));

      const result = await syncAllQuickBooksData(user.uid);

      if (result.success) {
        const [invoices, customers] = await Promise.all([
          fetchQuickBooksInvoices(user.uid),
          fetchQuickBooksCustomers(user.uid),
        ]);

        setState((prev) => ({
          ...prev,
          financialData: result.financial || null,
          invoiceData: result.invoices || null,
          expenseData: result.expenses || null,
          customerData: result.customers || null,
          invoices,
          customers,
          lastSync: result.timestamp || null,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || "Failed to sync data",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    } finally {
      setState((prev) => ({
        ...prev,
        syncing: false,
      }));
    }
  }, [user?.uid, state.connected]);

  return {
    ...state,
    manualSync,
    checkConnection,
  };
};
