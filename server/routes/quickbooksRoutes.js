const express = require("express");
const router = express.Router();
const axios = require("axios");
const { admin, db } = require("../firebase");

// QuickBooks OAuth Configuration
const QB_CLIENT_ID = process.env.QB_CLIENT_ID || "your-client-id";
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET || "your-client-secret";
const QB_REALM_ID = process.env.QB_REALM_ID || "your-realm-id";
const QB_REDIRECT_URI = `${process.env.APP_URL || "http://localhost:3000"}/quickbooks-callback`;
const QB_API_BASE = "https://quickbooks.api.intuit.com/v2/company";

/**
 * Middleware to verify Firebase token
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    if (token) {
      try {
        await admin.auth().verifyIdToken(token);
      } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

router.use(verifyFirebaseToken);

/**
 * Get QuickBooks status
 * GET /api/quickbooks/status
 */
router.get("/status", async (req, res) => {
  try {
    const { userId } = req;
    const docRef = db.collection("quickbooksIntegrations").doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists()) {
      return res.json({
        connected: false,
        error: "Not connected",
      });
    }

    const credentials = docSnap.data();
    const isExpired = Date.now() > credentials.tokenExpiresAt;

    if (isExpired) {
      // Attempt token refresh
      const refreshed = await refreshAccessToken(userId, credentials.refreshToken);
      if (!refreshed) {
        return res.json({
          connected: false,
          error: "Token expired and refresh failed",
        });
      }
    }

    res.json({
      connected: true,
      realmId: credentials.realmId,
      lastSync: credentials.lastSync || null,
      connectedAt: credentials.connectedAt,
    });
  } catch (error) {
    console.error("Error getting QB status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Refresh OAuth token
 * POST /api/quickbooks/refresh-token
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const { userId, refreshToken } = req.body;

    const refreshed = await refreshAccessToken(userId, refreshToken);
    if (!refreshed) {
      return res.status(400).json({ error: "Token refresh failed" });
    }

    res.json(refreshed);
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get QB Accounts (Chart of Accounts)
 * GET /api/quickbooks/accounts
 */
router.get("/accounts", async (req, res) => {
  try {
    const { userId } = req;
    const credentials = await getCredentials(userId);

    if (!credentials) {
      return res.status(400).json({ error: "QuickBooks not connected" });
    }

    const query = `SELECT * FROM Account`;
    const accounts = await queryQuickBooks(credentials, query);

    res.json({
      accounts: accounts || [],
    });
  } catch (error) {
    console.error("Error fetching QB accounts:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get QB Invoices
 * GET /api/quickbooks/invoices
 */
router.get("/invoices", async (req, res) => {
  try {
    const { userId } = req;
    const credentials = await getCredentials(userId);

    if (!credentials) {
      return res.status(400).json({ error: "QuickBooks not connected" });
    }

    const query = `SELECT * FROM Invoice ORDER BY TxnDate DESC MAXRESULTS 100`;
    const invoices = await queryQuickBooks(credentials, query);

    res.json({
      invoices: invoices || [],
    });
  } catch (error) {
    console.error("Error fetching QB invoices:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get QB Expenses
 * GET /api/quickbooks/expenses
 */
router.get("/expenses", async (req, res) => {
  try {
    const { userId } = req;
    const credentials = await getCredentials(userId);

    if (!credentials) {
      return res.status(400).json({ error: "QuickBooks not connected" });
    }

    const query = `SELECT * FROM Purchase ORDER BY TxnDate DESC MAXRESULTS 100`;
    const expenses = await queryQuickBooks(credentials, query);

    res.json({
      expenses: expenses || [],
    });
  } catch (error) {
    console.error("Error fetching QB expenses:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get QB Customers
 * GET /api/quickbooks/customers
 */
router.get("/customers", async (req, res) => {
  try {
    const { userId } = req;
    const credentials = await getCredentials(userId);

    if (!credentials) {
      return res.status(400).json({ error: "QuickBooks not connected" });
    }

    const query = `SELECT * FROM Customer`;
    const customers = await queryQuickBooks(credentials, query);

    res.json({
      customers: customers || [],
    });
  } catch (error) {
    console.error("Error fetching QB customers:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get QB Vendors
 * GET /api/quickbooks/vendors
 */
router.get("/vendors", async (req, res) => {
  try {
    const { userId } = req;
    const credentials = await getCredentials(userId);

    if (!credentials) {
      return res.status(400).json({ error: "QuickBooks not connected" });
    }

    const query = `SELECT * FROM Vendor`;
    const vendors = await queryQuickBooks(credentials, query);

    res.json({
      vendors: vendors || [],
    });
  } catch (error) {
    console.error("Error fetching QB vendors:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * OAuth callback handler
 * POST /api/quickbooks/oauth-callback
 */
router.post("/oauth-callback", async (req, res) => {
  try {
    const { userId, code, realmId } = req.body;

    if (!code || !realmId) {
      return res.status(400).json({ error: "Missing authorization code or realm ID" });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://oauth.platform.intuit.com/oauth2/tokens/bearer",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: QB_REDIRECT_URI,
      }),
      {
        auth: {
          username: QB_CLIENT_ID,
          password: QB_CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Save credentials to Firestore
    const credentialsRef = db.collection("quickbooksIntegrations").doc(userId);
    await credentialsRef.set({
      realmId,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: Date.now() + expires_in * 1000,
      connectedAt: Date.now(),
      lastSync: 0,
      userId,
    });

    res.json({
      success: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    });
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disconnect QuickBooks
 * POST /api/quickbooks/disconnect
 */
router.post("/disconnect", async (req, res) => {
  try {
    const { userId } = req;
    const docRef = db.collection("quickbooksIntegrations").doc(userId);
    await docRef.delete();

    res.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting QB:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper Functions

/**
 * Get QB credentials from Firestore
 */
async function getCredentials(userId) {
  try {
    const docRef = db.collection("quickbooksIntegrations").doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists()) {
      return null;
    }

    const credentials = docSnap.data();

    // Check if token is expired
    if (Date.now() > credentials.tokenExpiresAt) {
      const refreshed = await refreshAccessToken(userId, credentials.refreshToken);
      if (!refreshed) {
        return null;
      }
      return { ...credentials, accessToken: refreshed.accessToken };
    }

    return credentials;
  } catch (error) {
    console.error("Error getting credentials:", error);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(userId, refreshToken) {
  try {
    const response = await axios.post(
      "https://oauth.platform.intuit.com/oauth2/tokens/bearer",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        auth: {
          username: QB_CLIENT_ID,
          password: QB_CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Update in Firestore
    const docRef = db.collection("quickbooksIntegrations").doc(userId);
    await docRef.update({
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: Date.now() + expires_in * 1000,
    });

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Query QuickBooks using Query Language
 */
async function queryQuickBooks(credentials, query) {
  try {
    const response = await axios.get(`${QB_API_BASE}/${credentials.realmId}/query`, {
      params: { query },
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        Accept: "application/json",
      },
    });

    return response.data.QueryResponse;
  } catch (error) {
    console.error("QB Query Error:", error.response?.data || error.message);
    return null;
  }
}

module.exports = router;
