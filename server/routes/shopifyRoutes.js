/**
 * Shopify Backend API Endpoints
 * NodeJS/Express backend routes for Shopify integration
 * 
 * These endpoints handle:
 * - Secure credential storage (backend processing)
 * - Server-side Shopify API calls
 * - Data transformation and caching
 * - Rate limiting and error handling
 */

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("firebase-admin");
const crypto = require("crypto");

dotenv.config();

const router = express.Router();

// Initialize Firebase Admin (if not already done in main server)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || {}),
  });
}

const db = admin.firestore();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES =
  process.env.SHOPIFY_SCOPES ||
  "read_products,read_orders,read_customers,read_inventory";
const SHOPIFY_APP_URL =
  process.env.SHOPIFY_APP_URL ||
  process.env.APP_URL ||
  `http://localhost:${process.env.PORT || 4242}`;
const SHOPIFY_REDIRECT_URI =
  process.env.SHOPIFY_REDIRECT_URI ||
  `${SHOPIFY_APP_URL}/api/shopify/oauth/callback`;

const OAUTH_STATE_COLLECTION = "shopifyOAuthStates";

const normalizeShop = (shop) => {
  let cleaned = String(shop || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (cleaned && !cleaned.includes(".myshopify.com")) {
    if (!cleaned.includes(".")) {
      cleaned = `${cleaned}.myshopify.com`;
    }
  }
  return cleaned;
};

const isValidShop = (shop) =>
  /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);

const buildQueryString = (params) =>
  Object.keys(params)
    .sort()
    .map((key) => {
      const value = Array.isArray(params[key])
        ? params[key].join(",")
        : params[key];
      return `${key}=${value}`;
    })
    .join("&");

const verifyShopifyHmac = (query) => {
  if (!SHOPIFY_API_SECRET) return false;
  const { hmac, signature, ...rest } = query;
  const message = buildQueryString(rest);
  const digest = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");
  const provided = String(hmac || "");
  return (
    provided.length === digest.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(digest))
  );
};

/**
 * Shopify OAuth start
 * GET /api/shopify/oauth/start?shop={shop}&userId={firebaseUserId}
 */
router.get("/oauth/start", async (req, res) => {
  try {
    const shop = normalizeShop(req.query.shop);
    const userId = String(req.query.userId || "");

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      return res.status(500).json({ error: "Shopify OAuth not configured" });
    }

    if (!shop || !isValidShop(shop)) {
      return res.status(400).json({ error: "Invalid shop domain" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const state = crypto.randomBytes(16).toString("hex");
    await db.collection(OAUTH_STATE_COLLECTION).doc(state).set({
      userId,
      shop,
      createdAt: Date.now(),
    });

    const authQuery = new URLSearchParams({
      client_id: SHOPIFY_API_KEY,
      scope: SHOPIFY_SCOPES,
      redirect_uri: SHOPIFY_REDIRECT_URI,
      state,
      "grant_options[]": "per-user",
    });

    const authUrl = `https://${shop}/admin/oauth/authorize?${authQuery.toString()}`;
    res.json({ url: authUrl });
  } catch (error) {
    console.error("OAuth start error:", error);
    res.status(500).json({ error: "Failed to start OAuth" });
  }
});

/**
 * Shopify OAuth callback
 * GET /api/shopify/oauth/callback
 */
router.get("/oauth/callback", async (req, res) => {
  try {
    const { shop, code, state, hmac, timestamp } = req.query;
    const normalizedShop = normalizeShop(shop);

    if (!shop || !code || !state || !hmac || !timestamp) {
      return res.status(400).json({ error: "Missing OAuth parameters" });
    }

    if (!isValidShop(normalizedShop)) {
      return res.status(400).json({ error: "Invalid shop domain" });
    }

    if (!verifyShopifyHmac(req.query)) {
      return res.status(400).json({ error: "HMAC validation failed" });
    }

    const stateDoc = await db.collection(OAUTH_STATE_COLLECTION).doc(state).get();
    if (!stateDoc.exists) {
      return res.status(400).json({ error: "Invalid OAuth state" });
    }

    const { userId, shop: storedShop, createdAt } = stateDoc.data();
    if (storedShop !== normalizedShop) {
      return res.status(400).json({ error: "Shop mismatch" });
    }

    if (Date.now() - createdAt > 10 * 60 * 1000) {
      return res.status(400).json({ error: "OAuth state expired" });
    }

    const tokenResponse = await axios.post(
      `https://${normalizedShop}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      return res.status(500).json({ error: "Missing access token" });
    }

    await db.collection("shopifyIntegrations").doc(userId).set({
      shopName: normalizedShop,
      accessToken: access_token,
      userId,
      connectedAt: Date.now(),
      lastSync: 0,
      updatedAt: Date.now(),
    });

    await db.collection(OAUTH_STATE_COLLECTION).doc(state).delete();

    const clientBase = process.env.CLIENT_DOMAIN || "http://localhost:3000";
    res.redirect(`${clientBase}/integrations?shopify=connected`);
  } catch (error) {
    console.error("OAuth callback error:", error.response?.data || error.message);
    const clientBase = process.env.CLIENT_DOMAIN || "http://localhost:3000";
    res.redirect(`${clientBase}/integrations?shopify=error`);
  }
});

/**
 * Get all Shopify data for a user
 * GET /api/shopify/sync
 * Headers: Authorization: Bearer {idToken}
 */
router.get("/sync", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get Shopify credentials from Firestore
    const credentialsDoc = await db
      .collection("shopifyIntegrations")
      .doc(userId)
      .get();

    if (!credentialsDoc.exists) {
      return res.status(404).json({ error: "Shopify not connected" });
    }

    const { shopName, accessToken } = credentialsDoc.data();

    // Fetch all data in parallel
    const products = await fetchShopifyData(
      `https://${shopName}/admin/api/2023-10/products.json?limit=250`,
      accessToken
    );
    const orders = await fetchShopifyDataSafe(
      `https://${shopName}/admin/api/2023-10/orders.json?status=any&limit=250`,
      accessToken,
      [403]
    );
    const customers = await fetchShopifyDataSafe(
      `https://${shopName}/admin/api/2023-10/customers.json?limit=250`,
      accessToken,
      [403]
    );
    const inventoryLevels = await fetchShopifyDataSafe(
      `https://${shopName}/admin/api/2023-10/inventory_levels.json?limit=250`,
      accessToken,
      [422]
    );

    res.json({
      products,
      orders,
      customers,
      inventoryLevels,
      lastSyncTime: Date.now(),
      syncStatus: "success",
    });
  } catch (error) {
    console.error("Shopify sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get products only
 * GET /api/shopify/products
 */
router.get("/products", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const credentialsDoc = await db
      .collection("shopifyIntegrations")
      .doc(userId)
      .get();

    if (!credentialsDoc.exists) {
      return res.status(404).json({ error: "Shopify not connected" });
    }

    const { shopName, accessToken } = credentialsDoc.data();
    const products = await fetchShopifyData(
      `https://${shopName}/admin/api/2023-10/products.json?limit=250`,
      accessToken
    );

    res.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get products with direct credentials (POST)
 * POST /api/shopify/products
 * Body: { shopUrl, accessToken }
 */
router.post("/products", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;
    
    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    console.log("📦 Fetching products from:", shopUrl);
    const products = await fetchShopifyData(
      `https://${shopUrl}/admin/api/2023-10/products.json?limit=250`,
      accessToken
    );

    console.log("✅ Fetched", products.length, "products");
    res.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: error.message, details: error.message });
  }
});

/**
 * Get orders only
 * GET /api/shopify/orders
 */
router.get("/orders", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const credentialsDoc = await db
      .collection("shopifyIntegrations")
      .doc(userId)
      .get();

    if (!credentialsDoc.exists) {
      return res.status(404).json({ error: "Shopify not connected" });
    }

    const { shopName, accessToken } = credentialsDoc.data();
    const orders = await fetchShopifyData(
      `https://${shopName}/admin/api/2023-10/orders.json?status=any&limit=250`,
      accessToken
    );

    res.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get orders with direct credentials (POST)
 * POST /api/shopify/orders
 * Body: { shopUrl, accessToken }
 */
router.post("/orders", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;
    
    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    console.log("📋 Fetching orders from:", shopUrl);
    const orders = await fetchShopifyData(
      `https://${shopUrl}/admin/api/2023-10/orders.json?status=any&limit=250`,
      accessToken
    );

    console.log("✅ Fetched", orders.length, "orders");
    res.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: error.message, details: error.message });
  }
});

/**
 * Get customers only
 * GET /api/shopify/customers
 */
router.get("/customers", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const credentialsDoc = await db
      .collection("shopifyIntegrations")
      .doc(userId)
      .get();

    if (!credentialsDoc.exists) {
      return res.status(404).json({ error: "Shopify not connected" });
    }

    const { shopName, accessToken } = credentialsDoc.data();
    const customers = await fetchShopifyData(
      `https://${shopName}/admin/api/2023-10/customers.json?limit=250`,
      accessToken
    );

    res.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get inventory levels
 * GET /api/shopify/inventory
 */
router.get("/inventory", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const credentialsDoc = await db
      .collection("shopifyIntegrations")
      .doc(userId)
      .get();

    if (!credentialsDoc.exists) {
      return res.status(404).json({ error: "Shopify not connected" });
    }

    const { shopName, accessToken } = credentialsDoc.data();
    const inventoryLevels = await fetchShopifyData(
      `https://${shopName}/admin/api/2023-10/inventory_levels.json?limit=250`,
      accessToken
    );

    res.json({ inventoryLevels });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get inventory with direct credentials (POST)
 * POST /api/shopify/inventory
 * Body: { shopUrl, accessToken }
 */
router.post("/inventory", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;
    
    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    console.log("📦 Fetching inventory from:", shopUrl);
    const inventory = await fetchShopifyData(
      `https://${shopUrl}/admin/api/2023-10/inventory_levels.json?limit=250`,
      accessToken
    );

    console.log("✅ Fetched", inventory.length, "inventory items");
    res.json({ inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error.message);
    res.status(500).json({ error: error.message, details: error.message });
  }
});

/**
 * Check Shopify connection status
 * GET /api/shopify/status
 */
router.get("/status", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const credentialsDoc = await db
      .collection("shopifyIntegrations")
      .doc(userId)
      .get();

    if (!credentialsDoc.exists) {
      return res.json({ connected: false });
    }

    const { shopName, lastSync } = credentialsDoc.data();
    res.json({
      connected: true,
      shopName,
      lastSync,
    });
  } catch (error) {
    console.error("Error checking status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test Shopify connection with direct credentials (POST)
 * POST /api/shopify/test
 * Body: { shopUrl, accessToken }
 */
router.post("/test", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;
    
    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    console.log("🧪 Testing Shopify connection:", shopUrl);
    
    // Try to fetch products as a test
    const products = await fetchShopifyData(
      `https://${shopUrl}/admin/api/2023-10/products.json?limit=1`,
      accessToken
    );

    console.log("✅ Connection test successful");
    res.json({ 
      success: true, 
      message: "Connected to Shopify successfully",
      productsFound: products ? 1 : 0
    });
  } catch (error) {
    console.error("Connection test failed:", error.message);
    res.status(401).json({ 
      error: "Failed to connect to Shopify",
      details: error.message 
    });
  }
});

/**
 * Helper function to fetch data from Shopify API
 */
async function fetchShopifyData(url, accessToken) {
  try {
    let allData = [];
    let nextUrl = url;
    let pageCount = 0;

    // Handle pagination
    while (nextUrl) {
      pageCount++;
      console.log(`📄 Fetching page ${pageCount}: ${nextUrl}`);

      const response = await axios.get(nextUrl, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      // Extract the main data key from response (products, orders, customers, etc)
      const dataKey = Object.keys(response.data).find(
        (key) => key !== "errors" && Array.isArray(response.data[key])
      );

      const pageData = response.data[dataKey] || [];
      allData = allData.concat(pageData);
      console.log(`✅ Page ${pageCount}: ${pageData.length} items (total: ${allData.length})`);

      // Check for next page in Link header
      const linkHeader = response.headers.link;
      nextUrl = null;
      
      if (linkHeader) {
        const links = linkHeader.split(",");
        for (const link of links) {
          if (link.includes('rel="next"')) {
            // Extract URL from Link header: <URL>; rel="next"
            const match = link.match(/<([^>]+)>/);
            if (match) {
              nextUrl = match[1];
              break;
            }
          }
        }
      }
    }

    console.log(`✅ Fetched total of ${allData.length} items from Shopify`);
    return allData;
  } catch (error) {
    console.error(`Error fetching from Shopify: ${url}`, error.message);
    throw error;
  }
}

async function fetchShopifyDataSafe(url, accessToken, ignoreStatuses = []) {
  try {
    return await fetchShopifyData(url, accessToken);
  } catch (error) {
    const status = error.response?.status;
    if (status && ignoreStatuses.includes(status)) {
      console.warn(`Shopify API skipped (${status}): ${url}`);
      return [];
    }
    throw error;
  }
}

/**
 * Create a new product in Shopify
 * POST /api/shopify/create-product
 * Body: { shopUrl, accessToken, product }
 */
router.post("/create-product", async (req, res) => {
  try {
    let { shopUrl, accessToken, product } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if ((!shopUrl || !accessToken) && token) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const credentialsDoc = await db
        .collection("shopifyIntegrations")
        .doc(userId)
        .get();

      if (credentialsDoc.exists) {
        const credentials = credentialsDoc.data();
        shopUrl = credentials.shopName;
        accessToken = credentials.accessToken;
      }
    }

    if (!shopUrl || !accessToken || !product) {
      return res
        .status(400)
        .json({ error: "Missing required fields: shopUrl, accessToken, product" });
    }

    console.log("🚀 Creating product in Shopify:", product.product?.title);

    // Call Shopify API to create product
    const response = await axios.post(
      `https://${shopUrl}/admin/api/2023-10/products.json`,
      product,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const createdProduct = response.data.product;
    console.log("✅ Product created successfully:", createdProduct.id);

    res.json({
      success: true,
      message: "Product created successfully",
      product: createdProduct,
    });
  } catch (error) {
    console.error("❌ Error creating product:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create product",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
