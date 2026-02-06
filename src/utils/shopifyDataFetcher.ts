/**
 * Shopify Real Data Fetcher
 * Fetches real data from Shopify API through the backend
 */

import { auth } from "../config/firebase";

// Try to detect which port the backend is on
let BACKEND_PORT = "4242";
const detectBackendPort = async () => {
  for (const port of ["5000", "4242", "3001"]) {
    try {
      const response = await fetch(`http://localhost:${port}/api/shopify/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopUrl: "test", accessToken: "test" }),
      });
      if (response.status !== 404) {
        BACKEND_PORT = port;
        console.log("✅ Backend detected on port:", port);
        return;
      }
    } catch (e) {
      // Port not responding
    }
  }
  console.log("⚠️ Could not detect backend port, using default 5000");
};

// Auto-detect on module load
detectBackendPort();

const getBackendBaseUrl = () => import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? `http://localhost:${BACKEND_PORT}` : typeof window !== 'undefined' ? window.location.origin : `http://localhost:${BACKEND_PORT}`);

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.getIdToken();
};

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  image?: {
    src: string;
  };
  images?: Array<{
    src: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    cost?: string;
  }>;
}

interface ShopifyOrder {
  id: string;
  order_number: number;
  total_price: string;
  created_at: string;
  line_items: Array<{
    id: string;
    product_id: string;
    title: string;
    quantity: number;
    price: string;
  }>;
}

/**
 * Fetch inventory from Shopify via backend
 */
export const fetchShopifyInventory = async (
  shopUrl: string,
  accessToken: string
) => {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/shopify/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shopUrl, accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch inventory");
    }

    return data.inventory || [];
  } catch (error) {
    console.error("Error fetching Shopify inventory:", error);
    return [];
  }
};

/**
 * Fetch products from Shopify via backend
 * Supports pagination for stores with >250 products
 */
export const fetchShopifyProducts = async (
  shopUrl: string,
  accessToken: string
) => {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/shopify/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shopUrl, accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch products");
    }

    // Backend now returns paginated results - total count available
    console.log(`📦 Fetched ${data.products?.length || 0} products from Shopify`);
    return data.products || [];
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    return [];
  }
};

/**
 * Fetch orders from Shopify via backend
 * Supports pagination for stores with >250 orders
 */
export const fetchShopifyOrders = async (
  shopUrl: string,
  accessToken: string
) => {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/shopify/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shopUrl, accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch orders");
    }

    // Backend now returns paginated results - total count available
    console.log(`📋 Fetched ${data.orders?.length || 0} orders from Shopify`);
    return data.orders || [];
  } catch (error) {
    console.error("Error fetching Shopify orders:", error);
    return [];
  }
};

/**
 * Convert Shopify products to internal product format
 */
export const convertShopifyProducts = (shopifyProducts: ShopifyProduct[]) => {
  return shopifyProducts.map((product, index) => {
    // Get image URL from product - Shopify can have image at top level or in images array
    let imageUrl: string | null = null;
    
    // Try different image locations in Shopify product object
    if (product.image?.src) {
      imageUrl = product.image.src;
    } else if (product.images && product.images.length > 0) {
      imageUrl = product.images[0].src;
    }
    
    // Ensure HTTPS for Shopify CDN images
    if (imageUrl && !imageUrl.startsWith('https://')) {
      imageUrl = imageUrl.replace('http://', 'https://');
    }
    
    // Get real stock from Shopify variant data
    let stock = 0;
    let price = 0;
    let cost = 0;
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      stock = variant.inventory_quantity ?? variant.stock ?? 0;
      // Ensure price is properly converted to number
      if (variant.price) {
        price = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
      }
      if (variant.cost) {
        cost = typeof variant.cost === 'string' ? parseFloat(variant.cost) : variant.cost;
      }
    }

    console.log(`💰 ${product.title}: price=$${price}, cost=$${cost}, stock=${stock}, image=${imageUrl ? "✓" : "✗"}`);

    return {
      id: product.id,
      name: product.title,
      category: product.productType || "General", // Use actual product type from Shopify
      description: `Imported from Shopify store`,
      handle: product.handle,
      price: price, // Real price from API
      cost: cost,   // Real cost from API
      stock: stock,
      image: imageUrl,
      barcode: product.handle,
      createdAt: Date.now(),
    };
  });
};

/**
 * Convert Shopify orders to internal sales format
 */
export const convertShopifyOrders = (shopifyOrders: ShopifyOrder[]) => {
  return shopifyOrders.flatMap((order) =>
    order.line_items.map((item) => ({
      id: item.id,
      productName: item.title,
      amount: parseFloat(item.price) * item.quantity,
      timestamp: order.created_at,
      quantity: item.quantity,
      orderNumber: order.order_number,
    }))
  );
};

/**
 * Fetch Shopify connection status from backend (OAuth flow)
 */
export const fetchShopifyStatus = async () => {
  try {
    const idToken = await getAuthToken();
    const response = await fetch(`${getBackendBaseUrl()}/api/shopify/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch Shopify status");
    }

    return data;
  } catch (error) {
    console.error("Error fetching Shopify status:", error);
    return { connected: false };
  }
};

/**
 * Sync Shopify data using OAuth (no API key in browser)
 */
export const syncShopifyToLocalStorageWithAuth = async () => {
  try {
    const idToken = await getAuthToken();
    const response = await fetch(`${getBackendBaseUrl()}/api/shopify/sync`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to sync Shopify data");
    }

    const products = data.products || [];
    const orders = data.orders || [];
    const inventoryLevels = data.inventoryLevels || [];

    const convertedProducts = convertShopifyProducts(products);
    const convertedOrders = convertShopifyOrders(orders);

    localStorage.setItem("shopifyProducts", JSON.stringify(convertedProducts));
    localStorage.setItem("shopifySales", JSON.stringify(convertedOrders));
    localStorage.setItem("shopifyInventory", JSON.stringify(inventoryLevels));
    localStorage.setItem("shopifyConnected", "true");
    localStorage.setItem("shopifyLastSyncTime", String(data.lastSyncTime || Date.now()));

    return {
      success: true,
      productCount: convertedProducts.length,
      orderCount: convertedOrders.length,
    };
  } catch (error) {
    console.error("Error syncing Shopify data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Sync all Shopify data and store in localStorage
 */
export const syncShopifyToLocalStorage = async (
  shopUrl: string,
  accessToken: string
) => {
  try {
    // Fetch products, orders, and inventory in parallel
    const [products, orders, inventory] = await Promise.all([
      fetchShopifyProducts(shopUrl, accessToken),
      fetchShopifyOrders(shopUrl, accessToken),
      fetchShopifyInventory(shopUrl, accessToken),
    ]);

    console.log("Raw Shopify products fetched:", products);
    console.log("Raw Shopify inventory fetched:", inventory);

    // Convert to internal formats
    const convertedProducts = convertShopifyProducts(products);
    const convertedOrders = convertShopifyOrders(orders);

    console.log("Converted products with images:", convertedProducts);

    // Store in localStorage
    localStorage.setItem(
      "shopifyProducts",
      JSON.stringify(convertedProducts)
    );
    localStorage.setItem("shopifySales", JSON.stringify(convertedOrders));
    localStorage.setItem("shopifyInventory", JSON.stringify(inventory));

    // Mark Shopify as active & store credentials
    localStorage.setItem("shopifyConnected", "true");
    localStorage.setItem("shopifyUrl", shopUrl);

    console.log(
      `Synced ${convertedProducts.length} products and ${convertedOrders.length} orders from Shopify`
    );
    console.log("✅ Shopify credentials stored for future API calls");

    return {
      success: true,
      productCount: convertedProducts.length,
      orderCount: convertedOrders.length,
    };
  } catch (error) {
    console.error("Error syncing Shopify data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get Shopify products from localStorage
 */
export const getShopifyProductsFromStorage = () => {
  const data = localStorage.getItem("shopifyProducts");
  const parsed = data ? JSON.parse(data) : [];
  console.log("🏪 getShopifyProductsFromStorage:", parsed.length > 0 ? `${parsed.length} products` : "empty");
  return parsed;
};

/**
 * Refresh Shopify products from API
 */
export const refreshShopifyProducts = async () => {
  try {
    if (!isShopifyConnected()) {
      console.log("❌ Shopify not connected, cannot refresh");
      return { success: false, message: "Shopify not connected" };
    }

    const idToken = await getAuthToken();

    console.log("🔄 Refreshing Shopify products from API...");

    const response = await fetch(`${getBackendBaseUrl()}/api/shopify/products`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch products");
    }

    const freshProducts = data.products || [];

    if (freshProducts && freshProducts.length > 0) {
      const converted = convertShopifyProducts(freshProducts);
      localStorage.setItem("shopifyProducts", JSON.stringify(converted));
      console.log("✅ Refreshed", freshProducts.length, "products from Shopify API");
      return { success: true, count: freshProducts.length };
    } else {
      console.log("⚠️ No products found in Shopify store");
      return { success: true, count: 0 };
    }
  } catch (error) {
    console.error("❌ Error refreshing Shopify products:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

/**
 * Get Shopify sales from localStorage
 */
export const getShopifySalesFromStorage = () => {
  const data = localStorage.getItem("shopifySales");
  const parsed = data ? JSON.parse(data) : [];
  console.log("💳 getShopifySalesFromStorage:", parsed.length > 0 ? `${parsed.length} sales` : "empty");
  return parsed;
};

/**
 * Check if Shopify is connected
 */
export const isShopifyConnected = () => {
  const connected = localStorage.getItem("shopifyConnected") === "true";
  console.log("🔌 isShopifyConnected:", connected);
  return connected;
};

/**
 * Get connected Shopify URL
 */
export const getConnectedShopifyUrl = () => {
  return localStorage.getItem("shopifyUrl") || null;
};

/**
 * Disconnect Shopify
 */
export const disconnectShopify = () => {
  localStorage.removeItem("shopifyProducts");
  localStorage.removeItem("shopifySales");
  localStorage.removeItem("shopifyConnected");
  localStorage.removeItem("shopifyUrl");
  localStorage.removeItem("shopifyAccessToken");
  localStorage.removeItem("shopifyLastSyncTime");
};

/**
 * Add product to Shopify store
 */
export const addProductToShopify = async (product: any) => {
  if (!isShopifyConnected()) {
    console.log("❌ Shopify not connected, saving locally only");
    return { success: false, message: "Shopify not connected" };
  }

  try {
    const idToken = await getAuthToken();

    console.log("Using OAuth credentials");

    // Create new product object in Shopify format
    const newShopifyProduct = {
      id: `gid://shopify/Product/${Date.now()}`,
      title: product.name,
      handle: product.name.toLowerCase().replace(/\s+/g, "-"),
      productType: product.category || "Uncategorized",
      vendor: "Store",
      bodyHtml: `<p>${product.description || ""}</p>`,
      variants: [
        {
          id: `gid://shopify/ProductVariant/${Date.now()}`,
          title: "Default",
          price: String(product.price),
          sku: product.barcode || `${product.name}-${Date.now()}`,
          cost: String(product.cost),
        },
      ],
      images: product.image ? [{ src: product.image }] : [],
      metafields: [
        {
          namespace: "custom",
          key: "stock_quantity",
          value: String(product.stock),
          valueType: "integer",
        },
      ],
    };

    // Create payload for backend API - format as Shopify REST API expects
    const shopifyProduct = {
      product: {
        title: product.name,
        productType: product.category || "Uncategorized",
        vendor: "Store",
        bodyHtml: `<p>${product.description || ""}</p>`,
        handle: product.name.toLowerCase().replace(/\s+/g, "-"),
        variants: [
          {
            title: "Default",
            price: String(product.price),
            sku: product.barcode || `${product.name}-${Date.now()}`,
            cost: String(product.cost),
            weight: 0,
          },
        ],
      },
    };

    console.log("� Product to add:", product.name);
    console.log("🔄 Attempting to create product in Shopify...");

    // Try multiple ports to find the backend (4242 is primary)
    const ports = [4242, 5000, 3001];
    let lastError = null;

    for (const port of ports) {
      try {
        console.log(`🌐 Trying port ${port}...`);
        const response = await fetch(`http://localhost:${port}/api/shopify/create-product`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            product: shopifyProduct,
          }),
        });

        console.log(`📡 Response from port ${port}:`, response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log("✅ SUCCESS! Product created in Shopify:", result);

          // Add to local cache
          const currentProducts = getShopifyProductsFromStorage();
          currentProducts.push(newShopifyProduct);
          localStorage.setItem("shopifyProducts", JSON.stringify(currentProducts));
          console.log("✅ Product cached locally");

          return { success: true, message: `Product created on Shopify (port ${port})`, product: result.product || newShopifyProduct };
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log(`⚠️ Port ${port} error:`, errorData);
          lastError = errorData;
        }
      } catch (portError) {
        console.log(`⚠️ Port ${port} not reachable:`, (portError as Error).message);
        lastError = portError;
      }
    }

    // Backend didn't respond, but cache the product
    console.log("⚠️ Backend not responding, caching product locally");
    const currentProducts = getShopifyProductsFromStorage();
    currentProducts.push(newShopifyProduct);
    localStorage.setItem("shopifyProducts", JSON.stringify(currentProducts));

    return {
      success: true,
      message: "⚠️ Product cached locally (start backend: cd server && node index.js)",
      product: newShopifyProduct,
    };
  } catch (error) {
    console.error("❌ Error adding product to Shopify:", error);

    // Still try to add to cache even if request fails
    try {
      const currentProducts = getShopifyProductsFromStorage();
      const cachedProduct = {
        id: `gid://shopify/Product/${Date.now()}`,
        title: product.name,
        handle: product.name.toLowerCase().replace(/\s+/g, "-"),
        productType: product.category || "Uncategorized",
        vendor: "Store",
        bodyHtml: `<p>${product.description || ""}</p>`,
        variants: [
          {
            id: `gid://shopify/ProductVariant/${Date.now()}`,
            title: "Default",
            price: String(product.price),
            sku: product.barcode || `${product.name}-${Date.now()}`,
            cost: String(product.cost),
          },
        ],
        images: product.image ? [{ src: product.image }] : [],
      };
      currentProducts.push(cachedProduct);
      localStorage.setItem("shopifyProducts", JSON.stringify(currentProducts));
      return { success: true, message: "Product cached locally", product: cachedProduct };
    } catch (cacheError) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
};
