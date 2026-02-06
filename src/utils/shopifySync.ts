/**
 * Shopify Data Sync Service
 * Handles fetching and transforming Shopify data into Nayance-compatible structures
 */

import type {
  ShopifyProduct,
  ShopifyOrder,
  ShopifyCustomer,
  ShopifyInventoryLevel,
  SyncedShopifyData,
  DashboardFinancialData,
  DashboardInventoryData,
} from "./shopifyTypes";

// API Version to use
const API_VERSION = "2023-10";

/**
 * Fetch products from Shopify
 */
export const fetchShopifyProducts = async (
  shopName: string,
  accessToken: string
): Promise<ShopifyProduct[]> => {
  try {
    const url = `https://${shopName}/admin/api/${API_VERSION}/products.json`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    throw error;
  }
};

/**
 * Fetch orders from Shopify
 */
export const fetchShopifyOrders = async (
  shopName: string,
  accessToken: string,
  status: string = "any"
): Promise<ShopifyOrder[]> => {
  try {
    const url = `https://${shopName}/admin/api/${API_VERSION}/orders.json?status=${status}&limit=250`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error("Error fetching Shopify orders:", error);
    throw error;
  }
};

/**
 * Fetch customers from Shopify
 */
export const fetchShopifyCustomers = async (
  shopName: string,
  accessToken: string
): Promise<ShopifyCustomer[]> => {
  try {
    const url = `https://${shopName}/admin/api/${API_VERSION}/customers.json?limit=250`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.customers || [];
  } catch (error) {
    console.error("Error fetching Shopify customers:", error);
    throw error;
  }
};

/**
 * Fetch inventory levels from Shopify
 */
export const fetchShopifyInventoryLevels = async (
  shopName: string,
  accessToken: string
): Promise<ShopifyInventoryLevel[]> => {
  try {
    const url = `https://${shopName}/admin/api/${API_VERSION}/inventory_levels.json?limit=250`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.inventory_levels || [];
  } catch (error) {
    console.error("Error fetching Shopify inventory levels:", error);
    throw error;
  }
};

/**
 * Comprehensive sync function - fetches all Shopify data
 */
export const syncAllShopifyData = async (
  shopName: string,
  accessToken: string
): Promise<SyncedShopifyData> => {
  try {
    const [products, orders, customers, inventoryLevels] = await Promise.all([
      fetchShopifyProducts(shopName, accessToken),
      fetchShopifyOrders(shopName, accessToken),
      fetchShopifyCustomers(shopName, accessToken),
      fetchShopifyInventoryLevels(shopName, accessToken),
    ]);

    return {
      products,
      orders,
      customers,
      inventoryLevels,
      lastSyncTime: Date.now(),
      syncStatus: "success",
    };
  } catch (error) {
    console.error("Error syncing Shopify data:", error);
    return {
      products: [],
      orders: [],
      customers: [],
      inventoryLevels: [],
      lastSyncTime: Date.now(),
      syncStatus: "failed",
    };
  }
};

/**
 * Transform Shopify data into financial dashboard format
 */
export const transformToFinancialData = (
  syncedData: SyncedShopifyData
): DashboardFinancialData => {
  const orders = syncedData.orders;

  // Calculate total revenue from all orders
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.totalPrice || "0"),
    0
  );

  // Calculate revenue by month
  const revenueByMonth: { [key: string]: number } = {};
  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const monthKey = date.toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + parseFloat(order.totalPrice || "0");
  });

  // Build month array (last 6 months)
  const monthArray = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    monthArray.push({
      month: date.toLocaleString("default", { month: "short" }),
      revenue: revenueByMonth[monthKey] || 0,
      expenses: 0, // Placeholder - would need additional data source
    });
  }

  // Estimate costs and taxes
  const estimatedExpenseRatio = 0.4; // Assume 40% of revenue as expenses
  const totalExpenses = totalRevenue * estimatedExpenseRatio;
  const taxRate = 0.12; // 12% tax rate
  const taxOwed = totalRevenue * taxRate;
  const netProfit = totalRevenue - totalExpenses - taxOwed;

  const costData = [
    { name: "Operations", value: 35, color: "#facc15" },
    { name: "Salaries", value: 40, color: "#ffd700" },
    { name: "Marketing", value: 15, color: "#ffed4e" },
    { name: "Other", value: 10, color: "#888888" },
  ];

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    taxRate,
    taxOwed,
    revenueByMonth: monthArray,
    costBreakdown: costData,
  };
};

/**
 * Transform Shopify data into inventory dashboard format
 */
export const transformToInventoryData = (
  syncedData: SyncedShopifyData
): DashboardInventoryData => {
  const products = syncedData.products.map((product) => {
    const firstVariant = product.variants[0];
    const firstImage = product.images[0];

    return {
      id: product.id,
      name: product.title,
      sku: firstVariant?.sku || "N/A",
      quantity: firstVariant?.inventoryQuantity || 0,
      price: parseFloat(firstVariant?.price || "0"),
      image: firstImage?.src || "",
    };
  });

  const lowStockItems = products.filter((p) => p.quantity < 10).length;

  return {
    products,
    totalProducts: products.length,
    lowStockItems,
  };
};

/**
 * Transform Shopify orders for record sale dropdown
 */
export const transformToProductList = (
  syncedData: SyncedShopifyData
): Array<{ id: string; name: string; price: number; sku: string }> => {
  return syncedData.products.map((product) => {
    const firstVariant = product.variants[0];
    return {
      id: product.id,
      name: product.title,
      price: parseFloat(firstVariant?.price || "0"),
      sku: firstVariant?.sku || "N/A",
    };
  });
};

/**
 * Calculate AI Insights from Shopify data
 */
export const generateAIInsights = (syncedData: SyncedShopifyData) => {
  const orders = syncedData.orders;
  const products = syncedData.products;

  // Top selling products
  const productSales: { [key: string]: number } = {};
  orders.forEach((order) => {
    order.lineItems.forEach((item) => {
      productSales[item.productId] =
        (productSales[item.productId] || 0) + item.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([productId]) => {
      const product = products.find((p) => p.id === productId);
      return {
        name: product?.title || "Unknown",
        sales: productSales[productId],
      };
    });

  // Low stock warnings
  const lowStockProducts = products.filter(
    (p) => p.variants[0]?.inventoryQuantity < 10
  );

  // Recent orders trend
  const recentOrders = orders.slice(0, 10);

  return {
    topProducts,
    lowStockWarnings: lowStockProducts,
    recentOrdersTrend: recentOrders,
    totalOrdersLastMonth: orders.length,
    averageOrderValue:
      orders.length > 0
        ? orders.reduce(
            (sum, order) => sum + parseFloat(order.totalPrice || "0"),
            0
          ) / orders.length
        : 0,
  };
};

/**
 * Format time since last sync
 */
export const formatLastSyncTime = (lastSyncTime: number): string => {
  const now = Date.now();
  const diffMs = now - lastSyncTime;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins === 0) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};
