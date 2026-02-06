const express = require("express");
const stripe = require("stripe");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const path = require("path");
const quickbooksRoutes = require("./routes/quickbooksRoutes");
const shopifyRoutes = require("./routes/shopifyRoutes");
require("./firebase"); // Initialize Firebase

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4242;

// Try to use PORT, if it fails try another
const server = app.listen(PORT, () => {
  console.log(`🚀 Stripe server running on http://localhost:${PORT}`);
  console.log(`📝 Webhook endpoint: http://localhost:${PORT}/webhook`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use, trying port 5000...`);
    app.listen(5000, () => {
      console.log(`🚀 Stripe server running on http://localhost:5000`);
      console.log(`📝 Webhook endpoint: http://localhost:5000/webhook`);
    });
  }
});

// Stripe initialization
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow all localhost ports and specified domains
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin === process.env.CLIENT_DOMAIN) {
      callback(null, true);
    } else {
      callback(null, true); // Allow for development - can be more restrictive in production
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Body parser middleware - important for webhook
app.use(express.json());

// Store raw body for webhook verification
app.use((req, res, next) => {
  if (req.path === "/webhook") {
    let rawBody = "";
    req.setEncoding("utf8");
    req.on("data", chunk => {
      rawBody += chunk;
    });
    req.on("end", () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// QuickBooks routes
app.use("/api/quickbooks", quickbooksRoutes);

// Shopify routes
app.use("/api/shopify", shopifyRoutes);

// Test Shopify connection endpoint
app.post("/api/shopify/test", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;

    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    // Format shop URL
    let formattedShopUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!formattedShopUrl.includes(".myshopify.com") && !formattedShopUrl.includes(".")) {
      formattedShopUrl = `${formattedShopUrl}.myshopify.com`;
    }

    console.log("Testing Shopify connection for:", formattedShopUrl);

    // Test the connection by fetching shop info (works with valid token, no special scope needed)
    const response = await axios.get(
      `https://${formattedShopUrl}/admin/api/2024-01/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Shopify connection successful for:", response.data.shop?.name);
    res.json({
      success: true,
      shop: response.data.shop,
      message: "Shopify connection successful",
    });
  } catch (error) {
    const statusCode = error.response?.status || 401;
    const errorMsg = error.response?.data?.errors || error.message;
    
    console.error("Shopify test error:", {
      status: statusCode,
      message: errorMsg,
      url: error.config?.url,
    });
    
    res.status(statusCode).json({
      error: "Failed to connect to Shopify. Please verify your store URL and access token.",
      details: errorMsg,
    });
  }
});

// Fetch Shopify Products endpoint (with pagination support)
app.post("/api/shopify/products", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;

    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    let formattedShopUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!formattedShopUrl.includes(".myshopify.com") && !formattedShopUrl.includes(".")) {
      formattedShopUrl = `${formattedShopUrl}.myshopify.com`;
    }

    let allProducts = [];
    let cursor = null;
    let hasNextPage = true;

    // Fetch all products with pagination
    while (hasNextPage) {
      let url = `https://${formattedShopUrl}/admin/api/2024-01/products.json?limit=250&fields=id,title,handle,bodyHtml,vendor,productType,createdAt,updatedAt,publishedAt,image,images,variants`;
      if (cursor) {
        url += `&after=${cursor}`;
      }

      const response = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      const products = response.data.products || [];
      
      // Fetch inventory levels for each product's variants
      for (const product of products) {
        if (product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            try {
              const inventoryUrl = `https://${formattedShopUrl}/admin/api/2024-01/variants/${variant.id}.json`;
              const inventoryResponse = await axios.get(inventoryUrl, {
                headers: {
                  "X-Shopify-Access-Token": accessToken,
                  "Content-Type": "application/json",
                },
              });
              const variantData = inventoryResponse.data.variant;
              variant.inventory_quantity = variantData.inventory_quantity || 0;
              variant.stock = variantData.inventory_quantity || 0;
              variant.price = variantData.price || 0;
              variant.cost = variantData.cost || 0;
              console.log(`📦 Variant ${variant.id}: price=$${variant.price}, inventory=${variant.inventory_quantity}`);
            } catch (inventoryError) {
              console.error(`Failed to fetch inventory for variant ${variant.id}:`, inventoryError.message);
              variant.inventory_quantity = 0;
              variant.stock = 0;
            }
          }
        }
      }
      
      allProducts = allProducts.concat(products);

      // Check if there's a next page
      const linkHeader = response.headers.link || "";
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      
      if (nextMatch) {
        const nextUrl = nextMatch[1];
        const afterMatch = nextUrl.match(/after=([^&]+)/);
        cursor = afterMatch ? afterMatch[1] : null;
        hasNextPage = !!cursor;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`✅ Fetched ${allProducts.length} products from Shopify (with pagination)`);
    
    // Log all products with real data
    allProducts.forEach((product, idx) => {
      const variant = product.variants?.[0];
      console.log(`[${idx + 1}] ${product.title}: Price=$${variant?.price || 0}, Stock=${variant?.inventory_quantity || variant?.stock || 0}, Cost=$${variant?.cost || 0}`);
    });

    res.json({
      success: true,
      products: allProducts,
    });
  } catch (error) {
    const statusCode = error.response?.status || 401;
    console.error("Shopify products fetch error:", error.message);
    res.status(statusCode).json({
      error: "Failed to fetch products from Shopify",
      details: error.message,
    });
  }
});

// Fetch Shopify Orders endpoint (with pagination support)
app.post("/api/shopify/orders", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;

    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    let formattedShopUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!formattedShopUrl.includes(".myshopify.com") && !formattedShopUrl.includes(".")) {
      formattedShopUrl = `${formattedShopUrl}.myshopify.com`;
    }

    let allOrders = [];
    let cursor = null;
    let hasNextPage = true;

    // Fetch all orders with pagination
    while (hasNextPage) {
      let url = `https://${formattedShopUrl}/admin/api/2024-01/orders.json?status=any&limit=250`;
      if (cursor) {
        url += `&after=${cursor}`;
      }

      const response = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      const orders = response.data.orders || [];
      allOrders = allOrders.concat(orders);

      // Check if there's a next page
      const linkHeader = response.headers.link || "";
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      
      if (nextMatch) {
        const nextUrl = nextMatch[1];
        const afterMatch = nextUrl.match(/after=([^&]+)/);
        cursor = afterMatch ? afterMatch[1] : null;
        hasNextPage = !!cursor;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`✅ Fetched ${allOrders.length} orders from Shopify (with pagination)`);

    res.json({
      success: true,
      orders: allOrders,
    });
  } catch (error) {
    const statusCode = error.response?.status || 401;
    console.error("Shopify orders fetch error:", error.message);
    res.status(statusCode).json({
      error: "Failed to fetch orders from Shopify",
      details: error.message,
    });
  }
});

// Fetch Shopify Inventory endpoint (with pagination support)
app.post("/api/shopify/inventory", async (req, res) => {
  try {
    const { shopUrl, accessToken } = req.body;

    if (!shopUrl || !accessToken) {
      return res.status(400).json({ error: "Missing shopUrl or accessToken" });
    }

    let formattedShopUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!formattedShopUrl.includes(".myshopify.com") && !formattedShopUrl.includes(".")) {
      formattedShopUrl = `${formattedShopUrl}.myshopify.com`;
    }

    let allInventory = [];
    let cursor = null;
    let hasNextPage = true;

    // Fetch all inventory levels with pagination
    while (hasNextPage) {
      let url = `https://${formattedShopUrl}/admin/api/2024-01/inventory_levels.json?limit=250`;
      if (cursor) {
        url += `&after=${cursor}`;
      }

      const response = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      const inventory = response.data.inventory_levels || [];
      allInventory = allInventory.concat(inventory);

      // Check if there's a next page
      const linkHeader = response.headers.link || "";
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      
      if (nextMatch) {
        const nextUrl = nextMatch[1];
        const afterMatch = nextUrl.match(/after=([^&]+)/);
        cursor = afterMatch ? afterMatch[1] : null;
        hasNextPage = !!cursor;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`✅ Fetched ${allInventory.length} inventory items from Shopify (with pagination)`);

    res.json({
      success: true,
      inventory: allInventory,
    });
  } catch (error) {
    const statusCode = error.response?.status || 401;
    console.error("Shopify inventory fetch error:", error.message);
    res.status(statusCode).json({
      error: "Failed to fetch inventory from Shopify",
      details: error.message,
    });
  }
});

// Create checkout session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId, customerEmail, successUrl, cancelUrl } = req.body;

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: "Missing required fields: priceId, successUrl, cancelUrl",
      });
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({
      error: error.message || "Failed to create checkout session",
    });
  }
});

// Webhook handler
app.post("/webhook", async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const rawBody = req.rawBody;

    if (!sig || !rawBody) {
      return res.status(400).json({ error: "Missing signature or body" });
    }

    let event;

    try {
      event = stripeClient.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ Checkout session completed:", {
          sessionId: event.data.object.id,
          customerId: event.data.object.customer,
          email: event.data.object.customer_email,
          amount: event.data.object.amount_total,
        });
        // TODO: Update user subscription status in database
        break;

      case "invoice.payment_succeeded":
        console.log("✅ Invoice payment succeeded:", {
          invoiceId: event.data.object.id,
          customerId: event.data.object.customer,
          amount: event.data.object.amount_paid,
        });
        // TODO: Log payment in database
        break;

      case "customer.subscription.created":
        console.log("✅ Subscription created:", {
          subscriptionId: event.data.object.id,
          customerId: event.data.object.customer,
          status: event.data.object.status,
          planId: event.data.object.items.data[0].price.id,
        });
        // TODO: Save subscription to database
        break;

      case "customer.subscription.updated":
        console.log("✅ Subscription updated:", {
          subscriptionId: event.data.object.id,
          customerId: event.data.object.customer,
          status: event.data.object.status,
        });
        // TODO: Update subscription in database
        break;

      case "customer.subscription.deleted":
        console.log("✅ Subscription deleted:", {
          subscriptionId: event.data.object.id,
          customerId: event.data.object.customer,
        });
        // TODO: Cancel subscription in database
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../dist")));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Serve React app for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});
