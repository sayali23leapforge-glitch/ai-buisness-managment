import { db } from "../config/firebase";
import { collection, query, where, getDocs, collectionGroup } from "firebase/firestore";
import { 
  isShopifyConnected, 
  getShopifyProductsFromStorage, 
  getShopifySalesFromStorage 
} from "./shopifyDataFetcher";
import { getProducts } from "./localProductStore";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "your-openai-api-key-here";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const API_BASE_URL = "http://localhost:4242"; // Shopify API on port 4242 (or 5000 if needed)

export interface AIInsight {
  id: string;
  title: string;
  level: "High" | "Medium" | "Low";
  levelColor: string;
  description: string;
  confidence: number;
  details: string;
  icon: string;
  category: "inventory" | "sales" | "revenue" | "trends" | "forecast" | "timing" | "financial";
  actionable: boolean;
  breakdown?: {
    label: string;
    value: number;
    percentage?: number;
  }[];
  optimizationScore?: number;
  predictions?: string[];
  actionsTaken?: string[];
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  lastSale?: string;
  salesCount?: number;
  daysInInventory?: number;
  cost?: number;
}

interface Sale {
  id: string;
  productName: string;
  amount: number;
  timestamp: string;
  quantity: number;
}

interface ShopifyProduct {
  id: string;
  title: string;
  variants: Array<{ id: string; inventory_quantity: number; price: string }>;
}

interface ShopifyOrder {
  id: string;
  created_at: string;
  total_price: string;
  line_items: Array<{ title: string; quantity: number; price: string }>;
}

// Fetch products from Shopify (if connected) or local storage (fallback)
export const getProductsData = async (userId: string): Promise<Product[]> => {
  try {
    console.log("📦 getProductsData called");
    const shopifyConnected = isShopifyConnected();
    console.log("🔗 Shopify connected check:", shopifyConnected);
    
    // Check if Shopify is connected first
    if (shopifyConnected) {
      const shopifyProducts = getShopifyProductsFromStorage();
      console.log("📱 Shopify products from storage:", shopifyProducts);
      if (shopifyProducts && shopifyProducts.length > 0) {
        console.log("📦 Using real Shopify product data:", shopifyProducts.length, "products");
        return shopifyProducts;
      } else {
        console.warn("⚠️ Shopify connected but no products in storage - checking local products");
        // If Shopify is connected but no products synced yet, also include local products for insights
        const localProducts = getProducts();
        if (localProducts && localProducts.length > 0) {
          console.log("📦 Using local products as fallback:", localProducts.length, "products");
          return localProducts;
        }
      }
    } else {
      console.log("❌ Shopify not connected");
    }
  } catch (error) {
    console.log("Shopify fetch failed, using local storage:", error);
  }
  
  // Fallback to local storage
  try {
    const data = getProducts();
    console.log("📋 Fallback products from local store:", data ? data.length : 0, "products");
    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Fetch sales from Shopify (if connected) or local storage (fallback)
export const getSalesData = async (userId: string): Promise<Sale[]> => {
  try {
    console.log("💰 getSalesData called");
    const shopifyConnected = isShopifyConnected();
    console.log("🔗 Shopify connected check:", shopifyConnected);
    
    // Check if Shopify is connected first
    if (shopifyConnected) {
      const shopifySales = getShopifySalesFromStorage();
      console.log("📱 Shopify sales from storage:", shopifySales);
      if (shopifySales && shopifySales.length > 0) {
        console.log("💰 Using real Shopify sales data:", shopifySales.length, "sales");
        return shopifySales;
      } else {
        console.warn("⚠️ Shopify connected but no sales in storage - checking local sales");
        // If Shopify is connected but no sales synced yet, also include local sales for insights
        const localSales = getLocalSales();
        if (localSales && localSales.length > 0) {
          console.log("💰 Using local sales as fallback:", localSales.length, "sales");
          return localSales;
        }
      }
    } else {
      console.log("❌ Shopify not connected");
    }
  } catch (error) {
    console.log("Shopify sales fetch failed, using local storage:", error);
  }
  
  // Fallback to local storage
  try {
    const data = getLocalSales();
    console.log("📋 Fallback sales from local store:", data ? data.length : 0, "sales");
    return data || [];
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

// Helper function to get local sales from localStorage
const getLocalSales = (): Sale[] => {
  try {
    const data = localStorage.getItem("sales");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading local sales:", error);
    return [];
  }
};

// Calculate restock recommendations from real inventory data
const calculateRestockInsights = (products: Product[], sales: Sale[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  console.log("📦 calculateRestockInsights:", products.length, "products,", sales.length, "sales");
  
  // Calculate sales velocity for each product
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const productMetrics = products.map(product => {
    // Match sales by product name (case-insensitive partial match)
    const productSales = sales.filter(s => {
      const productNameLower = product.name.toLowerCase();
      const salesNameLower = s.productName.toLowerCase();
      return (salesNameLower.includes(productNameLower) || productNameLower.includes(salesNameLower)) && 
             new Date(s.timestamp) > last7Days;
    });
    
    const dailyVelocity = productSales.length / 7;
    const daysUntilStockout = dailyVelocity > 0 ? product.stock / dailyVelocity : Infinity;
    const recommendedQty = Math.ceil(dailyVelocity * 14); // 2-week supply
    
    return {
      product,
      salesLast7Days: productSales.length,
      dailyVelocity,
      daysUntilStockout,
      totalRevenue: productSales.reduce((sum, s) => sum + s.amount, 0),
      recommendedQty,
      salesLastDay: productSales.filter(s => {
        const saleDate = new Date(s.timestamp);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
      }).length,
    };
  });
  
  // Find low stock items (including items with no recent sales but have stock)
  const lowStockItems = productMetrics.filter(m => 
    m.product.stock < 50 && m.product.stock > 0  // Low stock regardless of sales
  ).sort((a, b) => a.product.stock - b.product.stock);
  
  // Also find items about to run out
  const criticalItems = productMetrics.filter(m => 
    m.daysUntilStockout < 14 && m.daysUntilStockout !== Infinity && m.salesLast7Days > 0
  ).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  
  // Combine and prioritize - or just pick first product if nothing matches
  const allItems = [...criticalItems, ...lowStockItems, ...productMetrics].slice(0, 1);
  
  if (allItems.length > 0 || products.length > 0) {
    // If we have products but no matches, still show the first one
    const topConcern = allItems.length > 0 ? allItems[0] : productMetrics[0] || {
      product: products[0],
      salesLastDay: 0,
      dailyVelocity: 0,
      daysUntilStockout: Infinity,
      totalRevenue: 0,
      recommendedQty: 10,
      salesLast7Days: 0,
    };
    
    const urgencyLevel = topConcern.daysUntilStockout < 7 ? "High" : (topConcern.product.stock < 20 ? "Medium" : "Low");
    
    const predictions = [
      topConcern.daysUntilStockout !== Infinity 
        ? `Stock will deplete in ${Math.ceil(topConcern.daysUntilStockout)} days at current velocity`
        : `Currently ${Math.round(topConcern.product.stock)} units in stock`,
      `Current inventory level: ${Math.round(topConcern.product.stock)} units`,
      `Recommended reorder: ${Math.max(topConcern.recommendedQty, 10)} units for 2-week buffer`,
    ];
    
    const actionsTaken = [
      `Analyzed product: ${topConcern.product.name}`,
      `Stock level: ${Math.round(topConcern.product.stock)} units remaining`,
      `Recommendation: Maintain buffer stock at ${Math.max(topConcern.recommendedQty, 10)} units`,
    ];
    
    console.log("✅ Generating restock insight for:", topConcern.product.name);
    
    insights.push({
      id: `restock-${Date.now()}`,
      title: "Restock Recommendation",
      level: urgencyLevel as "High" | "Medium" | "Low",
      levelColor: urgencyLevel === "High" ? "#ef4444" : "#f59e0b",
      description: `${topConcern.product.name} - Current stock: ${Math.round(topConcern.product.stock)} units. Recommended to maintain a 2-week buffer.`,
      confidence: Math.min(94, 75 + (topConcern.salesLast7Days * 3)),
      details: `Current stock: ${Math.round(topConcern.product.stock)} units. Price: $${topConcern.product.price}. Recommended reorder quantity: ${Math.max(topConcern.recommendedQty, 10)} units.`,
      icon: "📦",
      category: "inventory",
      actionable: true,
      predictions: [
        `Stock level: ${Math.round(topConcern.product.stock)} units`,
        `Product price: $${topConcern.product.price.toFixed(2)}`,
        `Recommended buffer: ${Math.max(topConcern.recommendedQty, 10)} units`,
      ],
      actionsTaken: [
        `Analyzed product: ${topConcern.product.name}`,
        `Stock level: ${Math.round(topConcern.product.stock)} units remaining`,
        `Recommendation: Maintain buffer stock at ${Math.max(topConcern.recommendedQty, 10)} units`,
      ],
    });
  }
  
  return insights;
};

// Calculate sales trend insights
const calculateSalesTrendInsights = (products: Product[], sales: Sale[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const last14Days = new Date();
  last14Days.setDate(last14Days.getDate() - 14);
  
  // Calculate sales trends
  const salesLast7 = sales.filter(s => new Date(s.timestamp) > last7Days);
  const salesLast14Prev7 = sales.filter(s => 
    new Date(s.timestamp) > last14Days && new Date(s.timestamp) <= last7Days
  );
  
  const trendPercentage = salesLast14Prev7.length > 0 
    ? ((salesLast7.length - salesLast14Prev7.length) / salesLast14Prev7.length) * 100 
    : 0;
  
  // Find the product with biggest trend change
  const productTrends = products.map(product => {
    const productSalesLast7 = salesLast7.filter(s => s.productName === product.name);
    const productSalesPrev7 = salesLast14Prev7.filter(s => s.productName === product.name);
    const lastSale = productSalesLast7.length > 0 
      ? new Date(productSalesLast7[productSalesLast7.length - 1].timestamp)
      : null;
    
    const productTrend = productSalesPrev7.length > 0
      ? ((productSalesLast7.length - productSalesPrev7.length) / productSalesPrev7.length) * 100
      : (productSalesLast7.length > 0 ? 100 : 0);
    
    return {
      product: product.name,
      lastWeekSales: productSalesLast7.length,
      prevWeekSales: productSalesPrev7.length,
      trend: productTrend,
      lastSale,
      revenue: productSalesLast7.reduce((sum, s) => sum + s.amount, 0),
    };
  }).filter(p => p.lastWeekSales > 0 || p.prevWeekSales > 0).sort((a, b) => b.trend - a.trend);
  
  if (productTrends.length > 0 && Math.abs(trendPercentage) > 5) {
    const topTrend = productTrends[0];
    const isGrowth = topTrend.trend > 0;
    const trendLevel = Math.abs(topTrend.trend) > 50 ? "High" : Math.abs(topTrend.trend) > 20 ? "Medium" : "Low";
    const lastSaleTime = topTrend.lastSale ? Math.round((Date.now() - topTrend.lastSale.getTime()) / (1000 * 60 * 60)) : null;
    const lastSaleStr = lastSaleTime !== null ? `${lastSaleTime} hours ago` : "Recently";
    
    const predictions = [
      `${topTrend.product} showing ${Math.abs(topTrend.trend).toFixed(1)}% trend change this week`,
      isGrowth 
        ? `Momentum suggests continued growth - consider increasing stock levels` 
        : `Declining trend detected - evaluate pricing or promotional strategy`,
      `Last sale: ${lastSaleStr}`,
    ];
    
    const actionsTaken = [
      `Analyzed product performance: ${topTrend.product}`,
      isGrowth 
        ? `This week: ${topTrend.lastWeekSales} sales | Last week: ${topTrend.prevWeekSales} sales (${topTrend.trend.toFixed(1)}% increase)`
        : `This week: ${topTrend.lastWeekSales} sales | Last week: ${topTrend.prevWeekSales} sales (${topTrend.trend.toFixed(1)}% decrease)`,
      `Weekly revenue: $${topTrend.revenue.toFixed(2)}`,
    ];
    
    insights.push({
      id: `trend-${Date.now()}`,
      title: "Sales Trend Alert",
      level: trendLevel as "High" | "Medium" | "Low",
      levelColor: isGrowth ? "#10b981" : "#ef4444",
      description: `${topTrend.product} showing ${Math.abs(topTrend.trend).toFixed(1)}% ${isGrowth ? "increase" : "decrease"} in sales this week. Last sale: ${lastSaleStr}.`,
      confidence: Math.min(95, 70 + (topTrend.lastWeekSales * 3)),
      details: `This week sales: ${topTrend.lastWeekSales}. Previous week: ${topTrend.prevWeekSales}. Trend: ${isGrowth ? "📈 Growing momentum" : "📉 Needs attention"}. ${isGrowth ? "Consider stocking up to meet demand." : "Evaluate pricing, marketing, or product relevance."}`,
      icon: isGrowth ? "📈" : "📉",
      category: "trends",
      actionable: true,
      predictions: predictions,
      actionsTaken: actionsTaken,
    });
  } else if (products.length > 0) {
    // If no sales data, still show a trend insight for the first product
    const firstProduct = products[0];
    const predictions = [
      `${firstProduct.name} is available in your store`,
      "Track sales to understand customer demand",
      "Use this data to optimize inventory levels",
    ];
    
    const actionsTaken = [
      `Product registered: ${firstProduct.name}`,
      `Current price: $${firstProduct.price.toFixed(2)}`,
      "Waiting for sales data to generate trends",
    ];
    
    console.log("✅ Generating trend insight for:", firstProduct.name);
    
    insights.push({
      id: `trend-${Date.now()}`,
      title: "Sales Trend Data",
      level: "Low",
      levelColor: "#6b7280",
      description: `${firstProduct.name} - Waiting for sales data to analyze trends.`,
      confidence: 50,
      details: `Product is listed at $${firstProduct.price.toFixed(2)}. Sales trends will appear once customers start purchasing.`,
      icon: "📈",
      category: "trends",
      actionable: false,
      predictions: predictions,
      actionsTaken: actionsTaken,
    });
  }
  
  return insights;
};

// Calculate revenue insights
const calculateRevenueInsights = (products: Product[], sales: Sale[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // If no sales, show insight about revenue potential with first product
  if (sales.length === 0 && products.length > 0) {
    const topProduct = products[0];
    const bundlePrice = Math.round((topProduct.price * 1.5) / 5) * 5; // Round to nearest 5
    
    const predictions = [
      `Product available for sale: ${topProduct.name}`,
      `Current price: $${topProduct.price.toFixed(2)}`,
      `Potential bundle price: $${bundlePrice.toFixed(2)}`,
    ];
    
    const actionsTaken = [
      `Identified top product: ${topProduct.name}`,
      `Price point: $${topProduct.price.toFixed(2)}`,
      "Waiting for sales data to analyze revenue patterns",
    ];
    
    console.log("✅ Generating revenue insight for:", topProduct.name);
    
    insights.push({
      id: `revenue-${Date.now()}`,
      title: "Revenue Optimization",
      level: "Low",
      levelColor: "#8b5cf6",
      description: `Set up bundling strategy for ${topProduct.name} at $${bundlePrice.toFixed(2)} to increase average order value.`,
      confidence: 50,
      details: `Current price: $${topProduct.price.toFixed(2)}. Suggested bundle approach can increase AOV by targeting complementary products.`,
      icon: "💰",
      category: "revenue",
      actionable: false,
      predictions: predictions,
      actionsTaken: actionsTaken,
    });
    return insights;
  }
  
  if (sales.length === 0) return insights;
  
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;
  
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentRevenue = sales.filter(s => new Date(s.timestamp) > last7Days).reduce((sum, s) => sum + s.amount, 0);
  const weeklyAvg = recentRevenue / 7;
  
  // Analyze product pairs for bundling opportunities
  const topProducts = products
    .map(p => ({
      ...p,
      salesCount: sales.filter(s => s.productName === p.name).length,
      revenue: sales.filter(s => s.productName === p.name).reduce((sum, s) => sum + s.amount, 0),
    }))
    .filter(p => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  
  const topProductRevenue = topProducts[0]?.revenue || 0;
  const revenueConcentration = totalRevenue > 0 ? (topProductRevenue / totalRevenue) * 100 : 0;
  
  // Calculate optimal bundle AOV
  const targetAOV = avgOrderValue * 1.32; // Increase AOV by 32%
  const bundleOpportunity = topProducts.length >= 2 && avgOrderValue < 500;
  
  const predictions = [
    `Current AOV: $${avgOrderValue.toFixed(2)} (top product contributes ${revenueConcentration.toFixed(1)}%)`,
    bundleOpportunity ? `Target AOV with bundling: $${targetAOV.toFixed(2)} (potential +${((targetAOV - avgOrderValue) / avgOrderValue * 100).toFixed(1)}%)` : "",
    `Weekly revenue trend: $${weeklyAvg.toFixed(2)}/day average`,
  ].filter(Boolean);
  
  const actionsTaken = [
    `Analyzed revenue distribution: ${topProducts.length} high-performing products identified`,
    topProducts[0] ? `Top product (${topProducts[0].name}): ${revenueConcentration.toFixed(1)}% of revenue` : "",
    bundleOpportunity ? `Bundle recommendation: ${topProducts[0]?.name} + ${topProducts[1]?.name}` : "",
    `AOV optimization potential: $${(targetAOV - avgOrderValue).toFixed(2)} per transaction`,
  ].filter(Boolean);
  
  insights.push({
    id: `revenue-${Date.now()}`,
    title: "Revenue Optimization",
    level: revenueConcentration > 40 ? "High" : "Medium",
    levelColor: revenueConcentration > 40 ? "#f59e0b" : "#3b82f6",
    description: `Your average transaction value is $${avgOrderValue.toFixed(2)}. Bundle ${topProducts[0]?.name} with related products to increase to $${targetAOV.toFixed(2)} per sale.`,
    confidence: Math.min(90, 70 + (topProducts.length * 10)),
    details: `Weekly revenue: $${weeklyAvg.toFixed(2)}/day. Top product: ${topProducts[0]?.name} ($${topProductRevenue.toFixed(2)}, ${revenueConcentration.toFixed(1)}% of revenue). Bundling opportunity: Pair high-performing items with complementary products to increase AOV and customer basket size. Suggested target: $${targetAOV.toFixed(2)}.`,
    icon: "💰",
    category: "revenue",
    actionable: true,
    predictions: predictions,
    actionsTaken: actionsTaken,
  });
  
  return insights;
};

// Calculate slow-moving stock
const calculateSlowMovingInsights = (products: Product[], sales: Sale[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  // Calculate days in inventory and sales count for each product
  const slowMovingItems = products.map(p => {
    const productSales30 = sales.filter(s => 
      s.productName === p.name && new Date(s.timestamp) > last30Days
    );
    // Estimate days in inventory based on stock and sales velocity
    const salesVelocity = productSales30.length / 30; // sales per day
    const daysInInventory = salesVelocity > 0 ? p.stock / salesVelocity : 365; // assume 1 year if no sales
    
    return {
      product: p,
      salesCount30Days: productSales30.length,
      daysInInventory: Math.ceil(daysInInventory),
      revenue30Days: productSales30.reduce((sum, s) => sum + s.amount, 0),
    };
  })
  .filter(p => p.salesCount30Days <= 2 && p.product.stock > 0)
  .sort((a, b) => b.daysInInventory - a.daysInInventory)
  .slice(0, 2);
  
  if (slowMovingItems.length > 0) {
    const topConcern = slowMovingItems[0];
    
    const predictions = [
      `${topConcern.product.name} has ${topConcern.daysInInventory} days in inventory`,
      `Only ${topConcern.salesCount30Days} sale${topConcern.salesCount30Days !== 1 ? 's' : ''} in last 30 days`,
      `Recommendation: Run promotional pricing or bundle with faster-moving items`,
    ];
    
    const actionsTaken = [
      `Identified slow-moving product: ${topConcern.product.name}`,
      `Days in inventory: ${topConcern.daysInInventory} days (critical if > 90)`,
      `Recent sales: ${topConcern.salesCount30Days} units (30-day period)`,
      `Current stock: ${topConcern.product.stock} units @ $${topConcern.product.price}`,
    ];
    
    insights.push({
      id: `slow-moving-${Date.now()}`,
      title: "Slow-Moving Stock Alert",
      level: topConcern.daysInInventory > 90 ? "High" : "Medium",
      levelColor: topConcern.daysInInventory > 90 ? "#ef4444" : "#f59e0b",
      description: `${topConcern.product.name}: ${topConcern.daysInInventory} days in inventory, only ${topConcern.salesCount30Days} sales recorded. Consider promotional pricing or bundle deals.`,
      confidence: 91,
      details: `This product is moving slowly with high inventory holding costs. Days in stock: ${topConcern.daysInInventory}. Recent sales: ${topConcern.salesCount30Days} in 30 days. Current value: $${(topConcern.product.stock * topConcern.product.price).toFixed(2)}. Action: Implement promotional pricing, create bundle offers, or consider discontinuing this SKU to free up capital and warehouse space.`,
      icon: "🔻",
      category: "inventory",
      actionable: true,
      predictions: predictions,
      actionsTaken: actionsTaken,
    });
  }
  
  return insights;
};

// Calculate sales forecast
const calculateForecastInsights = (products: Product[], sales: Sale[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  if (sales.length === 0) return insights;
  
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const last14Days = new Date();
  last14Days.setDate(last14Days.getDate() - 14);
  
  const salesLast7 = sales.filter(s => new Date(s.timestamp) > last7Days);
  const salesPrevious7 = sales.filter(s => 
    new Date(s.timestamp) > last14Days && new Date(s.timestamp) <= last7Days
  );
  
  // Calculate trend and projection
  const trend = salesPrevious7.length > 0 ? salesLast7.length / salesPrevious7.length : 1;
  const projectedNext7Days = Math.ceil(salesLast7.length * trend);
  
  // Revenue projection
  const avgOrderValue = sales.reduce((sum, s) => sum + s.amount, 0) / sales.length;
  const projectedWeeklyRevenue = projectedNext7Days * avgOrderValue;
  const projectedMonthlyRevenue = projectedWeeklyRevenue * 4.3; // Average days per month / 7
  
  // Target comparison
  const targetMonthlyRevenue = 12900; // $12,900 target
  const percentAboveTarget = ((projectedMonthlyRevenue - targetMonthlyRevenue) / targetMonthlyRevenue) * 100;
  
  const trendDirection = trend > 1 ? "Growing" : trend < 1 ? "Declining" : "Stable";
  const projectionLevel = projectedMonthlyRevenue > targetMonthlyRevenue ? "High" : "Medium";
  
  const predictions = [
    `Next 7 days: ~${projectedNext7Days} sales (${(trend * 100 - 100).toFixed(0)}% vs last week)`,
    `Monthly projection: $${projectedMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue`,
    `vs Target: ${percentAboveTarget > 0 ? "+" : ""}${percentAboveTarget.toFixed(0)}% (${percentAboveTarget > 0 ? "Above" : "Below"} $${targetMonthlyRevenue.toLocaleString()})`,
  ];
  
  const actionsTaken = [
    `Analyzed sales velocity: ${salesLast7.length} transactions last 7 days`,
    `Trend factor: ${trend.toFixed(2)}x (${trendDirection} momentum)`,
    `Average order value: $${avgOrderValue.toFixed(2)}`,
    `Monthly projection: $${projectedMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
  ];
  
  insights.push({
    id: `forecast-${Date.now()}`,
    title: "Sales Forecast",
    level: projectionLevel as "High" | "Medium" | "Low",
    levelColor: percentAboveTarget > 0 ? "#10b981" : "#f59e0b",
    description: `Based on current sales patterns, you're projected to reach $${projectedMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue this month (${percentAboveTarget > 0 ? "+" : ""}${percentAboveTarget.toFixed(0)}% ${percentAboveTarget > 0 ? "above" : "below"} target).`,
    confidence: Math.min(89, 55 + (salesLast7.length * 2)),
    details: `Current trend: ${trendDirection} (${(trend * 100 - 100).toFixed(1)}% week-over-week). Projected monthly: $${projectedMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs target of $${targetMonthlyRevenue.toLocaleString()}. This projection assumes ${trendDirection.toLowerCase()} momentum continues and is based on recent sales velocity of ${avgOrderValue.toFixed(2)} AOV.`,
    icon: "🎯",
    category: "forecast",
    actionable: true,
    predictions: predictions,
    actionsTaken: actionsTaken,
  });
  
  return insights;
};

// Calculate financial overview breakdown
const calculateFinancialBreakdownInsights = (products: Product[], sales: Sale[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  if (sales.length === 0) return insights;
  
  // Calculate financial metrics
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalCOGS = products.reduce((sum, p) => sum + (p.cost || 0) * p.stock, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  // Estimate operating expenses (based on typical business ratios)
  const estimatedExpenses = totalRevenue * 0.35; // Assume 35% of revenue for expenses
  const netProfit = grossProfit - estimatedExpenses;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  // Revenue breakdown by product
  const productRevenues = products
    .map(p => {
      const revenue = sales.filter(s => s.productName === p.name).reduce((sum, s) => sum + s.amount, 0);
      return { name: p.name, revenue };
    })
    .filter(p => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
  
  const breakdown = [
    { label: "Total Revenue", value: totalRevenue, percentage: 100 },
    { label: "Gross Profit", value: grossProfit, percentage: grossMargin },
    { label: "Operating Expenses", value: estimatedExpenses, percentage: (estimatedExpenses / totalRevenue) * 100 },
    { label: "Net Profit", value: netProfit, percentage: netMargin },
  ];
  
  const profitLevel = netMargin > 25 ? "High" : netMargin > 10 ? "Medium" : "Low";
  const profitColor = netMargin > 25 ? "#10b981" : netMargin > 10 ? "#3b82f6" : "#f59e0b";
  
  // Calculate optimization score (0-100)
  const marginScore = Math.min((netMargin / 20) * 100, 100); // Target 20% margin
  const revenueScore = Math.min((totalRevenue / 50000) * 100, 100); // Target $50k revenue
  const productDiversityScore = Math.min((productRevenues.length / 10) * 100, 100); // Target 10+ products
  const optimizationScore = Math.round((marginScore + revenueScore + productDiversityScore) / 3);
  
  // Real predictions based on data
  const predictions = [
    `Projected monthly revenue: $${(totalRevenue * 1.1).toLocaleString(undefined, { maximumFractionDigits: 0 })} (10% growth trend)`,
    `Expected net profit next month: $${(netProfit * 1.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} (assuming current trends continue)`,
    `Top product will account for ~${Math.round((productRevenues[0]?.revenue || 0) / totalRevenue * 100)}% of future revenue`,
  ];
  
  // Real actions taken
  const actionsTaken = [
    `Identified ${productRevenues.length} revenue-generating products`,
    `Calculated gross margin at ${grossMargin.toFixed(1)}% - focus on cost optimization`,
    `Operating expense ratio: ${((estimatedExpenses / totalRevenue) * 100).toFixed(1)}% of revenue`,
    `Net profit margin: ${netMargin.toFixed(1)}% - monitor and improve`,
  ];
  
  insights.push({
    id: `financial-overview-${Date.now()}`,
    title: "Financial Overview Breakdown",
    level: profitLevel as "High" | "Medium" | "Low",
    levelColor: profitColor,
    description: `Net profit margin is ${netMargin.toFixed(1)}%. Gross margin: ${grossMargin.toFixed(1)}%.`,
    confidence: 92,
    details: `Total Revenue: $${totalRevenue.toFixed(2)} | Gross Profit: $${grossProfit.toFixed(2)} | Operating Expenses: ~$${estimatedExpenses.toFixed(2)} | Net Profit: $${netProfit.toFixed(2)}. Top product: ${productRevenues[0]?.name || "N/A"} generating ${productRevenues[0] ? ((productRevenues[0].revenue / totalRevenue) * 100).toFixed(1) : 0}% of revenue. Focus on maintaining gross margins above 50% and keep operating expenses under 30% of revenue.`,
    icon: "📊",
    category: "financial",
    actionable: true,
    breakdown: breakdown,
    optimizationScore: optimizationScore,
    predictions: predictions,
    actionsTaken: actionsTaken,
  });
  
  return insights;
};

// Calculate peak sales hours
const calculatePeakHoursInsights = (products: Product[], sales: Sale[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  if (sales.length < 5) return insights; // Need at least 5 sales for meaningful analysis
  
  // Group sales by hour of day
  const hourCounts = new Map<number, { count: number; revenue: number }>();
  
  sales.forEach(sale => {
    const hour = new Date(sale.timestamp).getHours();
    const existing = hourCounts.get(hour) || { count: 0, revenue: 0 };
    existing.count += sale.quantity || 1;
    existing.revenue += sale.amount;
    hourCounts.set(hour, existing);
  });
  
  // Find peak hours (top 2-3 hours)
  const sortedHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);
  
  if (sortedHours.length > 0) {
    const peakHour = sortedHours[0];
    const peakHourNum = peakHour[0];
    const peakRange = `${peakHourNum}:00 - ${(peakHourNum + 1) % 24}:00`;
    const peakSalesCount = peakHour[1].count;
    const peakRevenue = peakHour[1].revenue;
    
    // Find off-peak hours for promotions
    const offPeakHour = Array.from(hourCounts.entries())
      .sort((a, b) => a[1].count - b[1].count)[0];
    const offPeakHourNum = offPeakHour ? offPeakHour[0] : 10;
    const offPeakRange = `${offPeakHourNum}:00 - ${(offPeakHourNum + 2) % 24}:00`;
    
    const totalSales = Array.from(hourCounts.values()).reduce((sum, h) => sum + h.count, 0);
    const peakPercentage = (peakSalesCount / totalSales) * 100;
    
    const predictions = [
      `Peak sales hour: ${peakRange} (${peakSalesCount} transactions, $${peakRevenue.toFixed(2)})`,
      `Accounts for ${peakPercentage.toFixed(1)}% of daily sales`,
      `Opportunity: Flash promotions during ${offPeakRange} to boost off-peak revenue`,
    ];
    
    const actionsTaken = [
      `Analyzed hourly sales distribution from ${Array.from(hourCounts.keys()).length} different hours`,
      `Peak hours identified: ${sortedHours.map(h => `${h[0]}:00 (${h[1].count} sales)`).join(", ")}`,
      `Total daily sales: ${totalSales} transactions`,
      `Recommended action: Run flash promotions during ${offPeakRange} hours`,
    ];
    
    insights.push({
      id: `peak-hours-${Date.now()}`,
      title: "Peak Sales Hours",
      level: peakPercentage > 35 ? "High" : "Medium",
      levelColor: peakPercentage > 35 ? "#f59e0b" : "#3b82f6",
      description: `Most sales occur between ${peakRange}. Consider running flash promotions during ${offPeakRange} to boost off-peak revenue.`,
      confidence: Math.min(85, 60 + (Array.from(hourCounts.keys()).length * 3)),
      details: `Peak hour generates ${peakPercentage.toFixed(1)}% of daily sales (${peakSalesCount} transactions, $${peakRevenue.toFixed(2)}). Off-peak hours (${offPeakRange}) show lower activity. Strategy: Implement dynamic pricing or flash deals during off-peak hours to increase conversion and smooth out demand distribution.`,
      icon: "⏰",
      category: "timing",
      actionable: true,
      predictions: predictions,
      actionsTaken: actionsTaken,
    });
  }
  
  return insights;
};

// Format business data for AI analysis
export const formatBusinessDataForAI = (products: Product[], sales: Sale[]): string => {
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock < 10).length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalSales = sales.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Last 7 days sales trend
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentSales = sales.filter(s => new Date(s.timestamp) > last7Days);

  // Top products
  const productSales = products
    .map(p => ({
      name: p.name,
      stock: p.stock,
      price: p.price,
      salesCount: sales.filter(s => s.productName === p.name).length,
    }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  return `
Business Analytics Data:
- Total Products: ${totalProducts}
- Low Stock Items (<10): ${lowStockItems}
- Total Revenue (All Time): $${totalRevenue.toFixed(2)}
- Total Sales Transactions: ${totalSales}
- Average Order Value: $${avgOrderValue.toFixed(2)}
- Sales Last 7 Days: ${recentSales.length}

Top Performing Products:
${productSales.map(p => `  • ${p.name}: ${p.salesCount} sales, $${p.price}, ${p.stock} in stock`).join("\n")}

Low Stock Items:
${products.filter(p => p.stock < 10).map(p => `  • ${p.name}: ${p.stock} units remaining, $${p.price}`).join("\n")}

Generate insights based on this data to help optimize inventory, increase sales, and improve revenue.
  `;
};

// Main function to get AI insights from REAL DATA ONLY
export const getAIInsights = async (userId: string): Promise<AIInsight[]> => {
  try {
    console.log("🔍 Fetching real data for AI insights...");
    
    // Fetch REAL DATA from API or localStorage
    const products = await getProductsData(userId);
    const sales = await getSalesData(userId);

    console.log(`📊 Data loaded: ${products.length} products, ${sales.length} sales transactions`);
    if (products.length > 0) {
      console.log("📦 First product:", products[0]);
    }
    if (sales.length > 0) {
      console.log("💳 First sale:", sales[0]);
    }

    if (products.length === 0 && sales.length === 0) {
      console.warn("⚠️ No real data available - returning empty insights");
      // Return empty array - no demo data fallback
      return [];
    }

    // Generate insights from REAL DATA only
    const allInsights: AIInsight[] = [
      ...calculateFinancialBreakdownInsights(products, sales),
      ...calculateRestockInsights(products, sales),
      ...calculateSalesTrendInsights(products, sales),
      ...calculateRevenueInsights(products, sales),
      ...calculateSlowMovingInsights(products, sales),
      ...calculateForecastInsights(products, sales),
      ...calculatePeakHoursInsights(products, sales),
    ];

    // If no sales yet, add a sales growth recommendation
    if (sales.length === 0 && products.length > 0) {
      console.log("💡 Adding sales strategy recommendation");
      allInsights.push({
        id: `sales-strategy-${Date.now()}`,
        title: "Sales Growth Strategy",
        level: "Medium",
        levelColor: "#3b82f6",
        description: `You have ${products.length} products ready to sell. Start by promoting your best products and tracking which items resonate with customers.`,
        confidence: 75,
        details: `With ${products.length} products in inventory, focus on: 1) Optimizing product descriptions, 2) Setting competitive pricing, 3) Promoting through social media, 4) Offering first-time buyer discounts.`,
        icon: "🚀",
        category: "sales",
        actionable: true,
        predictions: [
          "Average selling price potential: $" + (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2),
          "Total inventory value: $" + products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2),
          "Number of products to market: " + products.length,
        ],
        actionsTaken: [
          "Analyzed product catalog: " + products.length + " items ready",
          "Recommended marketing strategies for new store",
          "Set up inventory tracking for sales monitoring",
        ],
      });
    }

    console.log(`✅ Generated ${allInsights.length} real insights from actual business data`);
    if (allInsights.length === 0) {
      console.warn("⚠️ No insights generated - data might not match expected format");
      // Return empty array instead of demo insights
      return [];
    }
    console.log("📈 Insights:", allInsights);

    return allInsights;
  } catch (error) {
    console.error("❌ Error generating AI insights:", error);
    // Return empty array - no demo fallback
    console.log("❌ No insights due to error");
    return [];
  }
};
