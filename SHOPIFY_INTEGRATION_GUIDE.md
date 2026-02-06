# Shopify Integration Guide

This document explains how to use real Shopify data throughout the Nayance application.

## Overview

The Shopify integration in Nayance uses the **Shopify Admin API** with a **private access token**. This approach:

✅ Requires NO OAuth setup  
✅ No user login with Shopify  
✅ Users only login to Nayance (Firebase Auth)  
✅ Shopify is a pure data source  
✅ Perfect for MVP and rapid iteration  
✅ Easy to extend for other integrations (QuickBooks, Xero, Stripe, etc)  

---

## Architecture

### Frontend Flow

```
User (Nayance) → Integrations Page → Connect Shopify Modal
                    ↓
        Enter Store URL + API Token
                    ↓
        Save to Firestore (encrypted)
                    ↓
    Fetch Real Shopify Data via Frontend/Backend
                    ↓
    Transform Data for Dashboard Views
                    ↓
    Display in Financial, Inventory, AI Insights, etc
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Nayance Frontend                       │
├──────────────────┬──────────────────┬──────────────────┤
│ Dashboard        │ Integrations     │ Other Pages      │
│ (Financial)      │ (Management)     │ (Inventory, etc) │
└──────────────────┴──────────────────┴──────────────────┘
                          ↑
                          │
              useShopifyData Hook
                          │
                ┌─────────┴─────────┐
                ↓                   ↓
        Frontend API Calls    Firebase Firestore
        (Direct)             (Credentials)
                │                   │
                └─────────┬─────────┘
                          ↓
          Shopify Admin API (2023-10)
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
    Products           Orders           Customers
    Inventory Levels   Variants         Financial Data
```

---

## File Structure

```
src/
├── components/
│   └── ConnectShopify.tsx              # Modal for connecting Shopify
├── hooks/
│   └── useShopifyData.ts               # Custom hook for Shopify data
├── utils/
│   ├── shopifyTypes.ts                 # TypeScript interfaces
│   ├── shopifyStore.ts                 # Firestore CRUD operations
│   └── shopifySync.ts                  # API calls & data transformation
├── pages/
│   └── Integrations.tsx                # Updated with Shopify UI
└── styles/
    └── ConnectShopify.css              # Modal styling

server/
└── routes/
    └── shopifyRoutes.js                # Backend API endpoints
```

---

## Key Components

### 1. ConnectShopify Modal (`src/components/ConnectShopify.tsx`)

The modal that users interact with to connect their Shopify store.

**Features:**
- Form for store URL and access token
- Validates credentials before saving
- Shows loading state
- Success confirmation
- Help text with step-by-step instructions

**Usage:**
```tsx
<ConnectShopify
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(shopName) => console.log("Connected to:", shopName)}
/>
```

### 2. Shopify Data Hook (`src/hooks/useShopifyData.ts`)

The main hook for accessing Shopify data throughout the app.

**Usage:**
```tsx
import { useShopifyData } from "../hooks/useShopifyData";

export default function Dashboard() {
  const { 
    shopifyData,      // Raw Shopify data
    financialData,    // Transformed for financial dashboard
    inventoryData,    // Transformed for inventory view
    productList,      // For dropdowns, record sale, etc
    aiInsights,       // For AI Insights page
    loading,
    error,
    isConnected,
    refetch            // Manual refresh
  } = useShopifyData();

  if (loading) return <div>Loading...</div>;
  if (!isConnected) return <div>Connect Shopify first</div>;

  // Use the data
  return (
    <div>
      <h1>Total Revenue: ${financialData?.totalRevenue}</h1>
      <h2>Total Products: {inventoryData?.totalProducts}</h2>
    </div>
  );
}
```

### 3. Shopify Store (`src/utils/shopifyStore.ts`)

Handles all Firestore operations for storing credentials.

**Functions:**
- `saveShopifyCredentials(userId, shopName, accessToken)` - Save connection
- `getShopifyCredentials(userId)` - Get stored credentials
- `updateLastSyncTime(userId, timestamp)` - Update sync timestamp
- `disconnectShopify(userId)` - Remove connection
- `isShopifyConnected(userId)` - Check if connected

### 4. Shopify Sync Service (`src/utils/shopifySync.ts`)

Fetches and transforms Shopify API data.

**Main Functions:**

#### Fetch Functions
- `fetchShopifyProducts()` - Get products
- `fetchShopifyOrders()` - Get orders
- `fetchShopifyCustomers()` - Get customers
- `fetchShopifyInventoryLevels()` - Get inventory

#### Sync Function
- `syncAllShopifyData()` - Fetch all data at once

#### Transform Functions
- `transformToFinancialData()` - Convert to financial dashboard format
- `transformToInventoryData()` - Convert to inventory dashboard format
- `transformToProductList()` - Convert to dropdown list
- `generateAIInsights()` - Create AI insights data

#### Utility Functions
- `formatLastSyncTime()` - Format sync timestamp

---

## How to Integrate into Dashboard Pages

### Example 1: Financial Dashboard (Real Revenue)

**Before (Hardcoded):**
```tsx
const revenueData = [
  { month: "Jan", revenue: 90000, expenses: 55000 },
  { month: "Feb", revenue: 92000, expenses: 58000 },
  // ... hardcoded data
];
```

**After (Shopify Data):**
```tsx
import { useShopifyData } from "../hooks/useShopifyData";

export default function Dashboard() {
  const { financialData, loading } = useShopifyData();

  if (loading) return <div>Loading...</div>;
  if (!financialData) return <div>No data available</div>;

  return (
    <div>
      <h2>Total Revenue: ${financialData.totalRevenue.toFixed(2)}</h2>
      <LineChart data={financialData.revenueByMonth}>
        {/* Chart will now show real data */}
      </LineChart>
      <p>Net Profit: ${financialData.netProfit.toFixed(2)}</p>
      <p>Tax Owed: ${financialData.taxOwed.toFixed(2)}</p>
    </div>
  );
}
```

### Example 2: Inventory Dashboard (Real Stock Levels)

```tsx
import { useShopifyData } from "../hooks/useShopifyData";

export default function InventoryDashboard() {
  const { inventoryData, loading } = useShopifyData();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total Products: {inventoryData?.totalProducts}</h2>
      <h3>Low Stock Items: {inventoryData?.lowStockItems}</h3>
      
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {inventoryData?.products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>{product.quantity}</td>
              <td>${product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 3: Record Sale (Real Product Dropdown)

```tsx
import { useShopifyData } from "../hooks/useShopifyData";

export default function RecordSale() {
  const { productList } = useShopifyData();

  return (
    <select>
      <option>Select a product...</option>
      {productList?.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} - ${product.price} (SKU: {product.sku})
        </option>
      ))}
    </select>
  );
}
```

### Example 4: AI Insights (Real Trends)

```tsx
import { useShopifyData } from "../hooks/useShopifyData";

export default function AIInsights() {
  const { aiInsights } = useShopifyData();

  return (
    <div>
      <h2>Top Selling Products</h2>
      <ul>
        {aiInsights?.topProducts.map((product) => (
          <li key={product.name}>
            {product.name} - {product.sales} sales
          </li>
        ))}
      </ul>

      <h2>Low Stock Warnings</h2>
      <ul>
        {aiInsights?.lowStockWarnings.map((product) => (
          <li key={product.id}>
            {product.title} - {product.variants[0]?.inventoryQuantity} units
          </li>
        ))}
      </ul>

      <p>Average Order Value: ${aiInsights?.averageOrderValue.toFixed(2)}</p>
    </div>
  );
}
```

---

## Backend Setup

### 1. Install Dependencies

```bash
npm install axios firebase-admin
```

### 2. Add to Server (`server/index.js`)

```javascript
const shopifyRoutes = require('./routes/shopifyRoutes');

// Add middleware
app.use(express.json());
app.use(cors());

// Register routes
app.use('/api/shopify', shopifyRoutes);
```

### 3. Available Backend Endpoints

- `GET /api/shopify/sync` - Fetch all data
- `GET /api/shopify/products` - Fetch products only
- `GET /api/shopify/orders` - Fetch orders only
- `GET /api/shopify/customers` - Fetch customers only
- `GET /api/shopify/inventory` - Fetch inventory levels
- `GET /api/shopify/status` - Check connection status

All endpoints require `Authorization: Bearer {idToken}` header.

---

## Integration Checklist

- [x] Create ConnectShopify modal component
- [x] Create Shopify data hook (useShopifyData)
- [x] Create Shopify store (Firestore CRUD)
- [x] Create Shopify sync service (API calls & transforms)
- [x] Create backend API routes
- [ ] Update Dashboard with real revenue data
- [ ] Update Inventory Dashboard with real products
- [ ] Update Record Sale with real product list
- [ ] Update AI Insights with real trends
- [ ] Update Financial Reports with real data
- [ ] Add error handling & retry logic
- [ ] Add data caching (localStorage)
- [ ] Add scheduled sync (background jobs)

---

## Extending to Other Services

The same pattern can be used for other integrations:

### QuickBooks Integration

```tsx
// Same pattern!
const { 
  quickBooksData,
  financialData,
  invoices,
  expenses
} = useQuickBooksData();
```

### Xero Integration

```tsx
const { 
  xeroData,
  financialData,
  reports
} = useXeroData();
```

### Stripe Integration

```tsx
const { 
  stripeData,
  paymentData,
  transactions
} = useStripeData();
```

---

## Security Notes

✅ API tokens stored securely in Firestore with user ID isolation  
✅ No tokens exposed in frontend code or localStorage  
✅ Backend validates Firebase Auth token on each request  
✅ All API calls use HTTPS  
✅ Shopify credentials never logged or exposed  

**⚠️ WARNING:** Never commit `.env` files or credential files to git!

---

## Testing the Integration

1. **Go to Integrations Page**
   - Click "Connect Shopify"
   - Enter your test store URL (e.g., `teststore.myshopify.com`)
   - Paste your Admin API access token

2. **Verify Connection**
   - Modal should show "Successfully Connected!"
   - Shopify card shows "Connected" badge
   - Shows store name and last sync time

3. **Test Data Fetch**
   - Open browser DevTools
   - Check that Firestore has credentials saved
   - Check that products, orders, etc. are available

4. **Test in Components**
   - Add `useShopifyData()` hook to Dashboard
   - Verify financial data displays
   - Verify inventory data displays

---

## Troubleshooting

### "Invalid Shopify credentials" Error
- Check store URL format: `example.myshopify.com`
- Verify API token is valid and not expired
- Ensure token has required scopes:
  - `read_products`
  - `read_orders`
  - `read_inventory`
  - `read_customers`

### Firestore Permission Denied
- Check Firebase Firestore rules
- Ensure user UID matches credential document ID
- Verify Firebase Admin SDK is initialized in backend

### Slow Data Fetching
- Shopify API has rate limits (2 req/sec)
- Consider adding caching/pagination
- Use `Promise.all()` for parallel requests (already done in sync service)

### Data Not Updating
- Manual refresh: Click "Re-sync" button
- Check browser console for errors
- Verify Shopify store has data (products, orders, etc.)

---

## Performance Notes

- Initial sync fetches up to **250 products, 250 orders, 250 customers**
- For larger stores, add pagination
- Consider implementing incremental sync (fetch only changes)
- Cache data locally for offline access
- Lazy load images from Shopify CDN

---

## Next Steps

1. ✅ **Implement in Dashboard** - Show real financial data
2. ✅ **Implement in Inventory** - Show real products and stock
3. ✅ **Implement in Record Sale** - Use real product list
4. ✅ **Implement in AI Insights** - Real trends and warnings
5. ✅ **Add background sync** - Keep data fresh automatically
6. ✅ **Add data refresh UI** - Show sync status to users
7. ✅ **Add QuickBooks** - Same pattern as Shopify
8. ✅ **Add Stripe** - Payment transaction data

---

## Support

For questions or issues:
1. Check `src/utils/shopifySync.ts` for available data transformations
2. Check `src/hooks/useShopifyData.ts` for hook usage
3. Check backend API in `server/routes/shopifyRoutes.js`
4. Review Shopify API docs: https://shopify.dev/docs/admin-api

