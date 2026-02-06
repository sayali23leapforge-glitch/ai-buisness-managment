/**
 * Shopify Integration Types
 * Handles type definitions for Shopify API responses and internal data structures
 */

export interface ShopifyCredentials {
  shopName: string; // e.g., "teststore.myshopify.com"
  accessToken: string; // e.g., "shpat_*****"
  userId: string; // Firebase user ID
  connectedAt: number; // Timestamp
  lastSync: number; // Timestamp of last sync
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  bodyHtml: string;
  vendor: string;
  productType: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  tags: string[];
  status: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventoryQuantity: number;
  weight: string;
  weightUnit: string;
}

export interface ShopifyImage {
  id: string;
  alt: string;
  position: number;
  productId: string;
  createdAt: string;
  updatedAt: string;
  src: string;
}

export interface ShopifyInventoryLevel {
  inventoryItemId: string;
  locationId: string;
  available: number;
  updated: string;
}

export interface ShopifyOrder {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  currency: string;
  currentTotalPrice: string;
  currentTotalTax: string;
  totalPrice: string;
  totalTax: string;
  subtotalPrice: string;
  totalShippingPrice: string;
  totalDiscounts: string;
  lineItems: ShopifyLineItem[];
  customer: ShopifyCustomer;
  fulfillmentStatus: string;
  paymentStatus: string;
  financial_status: string;
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  price: string;
  sku: string;
  variantId: string;
  productId: string;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  numberOfOrders: number;
  totalSpent: string;
}

export interface SyncedShopifyData {
  products: ShopifyProduct[];
  orders: ShopifyOrder[];
  customers: ShopifyCustomer[];
  inventoryLevels: ShopifyInventoryLevel[];
  lastSyncTime: number;
  syncStatus: "success" | "failed" | "syncing";
}

export interface DashboardFinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  taxRate: number;
  taxOwed: number;
  revenueByMonth: Array<{ month: string; revenue: number; expenses: number }>;
  costBreakdown: Array<{ name: string; value: number; color: string }>;
}

export interface DashboardInventoryData {
  products: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  totalProducts: number;
  lowStockItems: number;
}
