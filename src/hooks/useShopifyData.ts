/**
 * useShopifyData Hook
 * Custom React hook for managing Shopify data integration across Nayance
 * 
 * Usage:
 * const { shopifyData, loading, error, refetch } = useShopifyData();
 * 
 * This hook handles:
 * - Fetching real Shopify data
 * - Transforming it into dashboard-compatible formats
 * - Caching and state management
 * - Error handling
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getShopifyCredentials } from "../utils/shopifyStore";
import {
  syncAllShopifyData,
  transformToFinancialData,
  transformToInventoryData,
  transformToProductList,
  generateAIInsights,
} from "../utils/shopifySync";
import type {
  SyncedShopifyData,
  DashboardFinancialData,
  DashboardInventoryData,
} from "../utils/shopifyTypes";

interface UseShopifyDataReturn {
  shopifyData: SyncedShopifyData | null;
  financialData: DashboardFinancialData | null;
  inventoryData: DashboardInventoryData | null;
  productList: Array<{ id: string; name: string; price: number; sku: string }> | null;
  aiInsights: any | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refetch: () => Promise<void>;
}

export const useShopifyData = (): UseShopifyDataReturn => {
  const { user } = useAuth();
  const [shopifyData, setShopifyData] = useState<SyncedShopifyData | null>(null);
  const [financialData, setFinancialData] = useState<DashboardFinancialData | null>(null);
  const [inventoryData, setInventoryData] = useState<DashboardInventoryData | null>(null);
  const [productList, setProductList] = useState<Array<{ id: string; name: string; price: number; sku: string }> | null>(null);
  const [aiInsights, setAiInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      // Check if Shopify is connected
      const credentials = await getShopifyCredentials(user.uid);
      if (!credentials) {
        setIsConnected(false);
        return;
      }

      setIsConnected(true);

      // Fetch all Shopify data
      const data = await syncAllShopifyData(
        credentials.shopName,
        credentials.accessToken
      );

      if (data.syncStatus === "failed") {
        setError("Failed to sync Shopify data");
        return;
      }

      // Set raw data
      setShopifyData(data);

      // Transform data for different dashboard views
      const financial = transformToFinancialData(data);
      const inventory = transformToInventoryData(data);
      const products = transformToProductList(data);
      const insights = generateAIInsights(data);

      setFinancialData(financial);
      setInventoryData(inventory);
      setProductList(products);
      setAiInsights(insights);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error fetching Shopify data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [user?.uid, fetchData]);

  return {
    shopifyData,
    financialData,
    inventoryData,
    productList,
    aiInsights,
    loading,
    error,
    isConnected,
    refetch: fetchData,
  };
};

export default useShopifyData;
