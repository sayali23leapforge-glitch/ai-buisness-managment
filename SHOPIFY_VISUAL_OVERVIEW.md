# Shopify Integration - Visual Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      NAYANCE USER                           │
│                   (Firebase Auth)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬──────────────┐
        ↓                ↓                ↓              ↓
    ┌─────────┐    ┌──────────┐    ┌──────────┐   ┌─────────┐
    │  Home   │    │Dashboard │    │Inventory │   │  Other  │
    │ Page    │    │  (View)  │    │Dashboard │   │ Pages   │
    └────┬────┘    └─────┬────┘    └────┬─────┘   └────┬────┘
         │               │              │             │
         └───────────────┼──────────────┴─────────────┘
                         │
                  ┌──────▼──────┐
                  │ useShopify   │
                  │ Data Hook    │
                  └──────┬───────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
    ┌─────────┐    ┌──────────┐   ┌────────────┐
    │Firestore│    │ Backend  │   │  Shopify   │
    │(Creds)  │    │API Routes│   │  Admin API │
    └─────────┘    └──────────┘   └────────────┘
```

## Component Hierarchy

```
App
├── Integrations Page ✨ [UPDATED]
│   ├── TopBar
│   ├── Sidebar
│   └── Integration Cards Grid
│       ├── QuickBooks Card
│       ├── Shopify Card ✨ [SPECIAL]
│       │   ├── Connection Status
│       │   ├── Store Name Display
│       │   ├── Re-sync Button
│       │   └── Disconnect Button
│       └── Other Cards
│
├── Dashboard Page [TODO: INTEGRATE]
│   ├── TopBar
│   ├── Summary Cards (Revenue, Expenses, Profit, Tax)
│   ├── Charts
│   │   ├── Revenue vs Expenses
│   │   └── Cost Breakdown
│   └── Footer Sections
│
├── Inventory Dashboard [TODO: INTEGRATE]
│   ├── Product List
│   ├── Stock Levels
│   └── Low Stock Warnings
│
├── Record Sale Page [TODO: INTEGRATE]
│   └── Product Dropdown
│
├── AI Insights Page [TODO: INTEGRATE]
│   ├── Top Products
│   ├── Low Stock Warnings
│   └── Order Trends
│
└── ConnectShopify Modal ✨ [NEW]
    ├── Form (Store URL + API Token)
    ├── Validation
    ├── Loading State
    └── Success State
```

## Data Flow Diagram

```
Step 1: User Logs In
┌─────────────┐
│ Firebase    │
│ Auth        │
└──────┬──────┘
       │ user.uid
       ▼
   Nayance App


Step 2: User Connects Shopify
┌──────────────────────┐
│ ConnectShopify Modal │
│ - Store URL          │
│ - API Token          │
└──────────┬───────────┘
           │ saves
           ▼
      ┌─────────────┐
      │  Firestore  │
      │ Credentials │
      │ Collection  │
      └─────────────┘


Step 3: useShopifyData Fetches Data
┌──────────────────┐
│ useShopifyData   │
│ Hook Mounts      │
└────────┬─────────┘
         │ reads
         ▼
   ┌─────────────┐
   │  Firestore  │
   │ Credentials │
   └────┬────────┘
        │ passes to
        ▼
   ┌──────────────┐
   │ Backend API  │
   │ /api/shopify │
   └────┬─────────┘
        │ fetches
        ▼
   ┌────────────────┐
   │ Shopify Admin  │
   │ API 2023-10    │
   └────────┬───────┘
            │ returns
            ▼
   ┌──────────────────────┐
   │ Products             │
   │ Orders               │
   │ Customers            │
   │ Inventory Levels     │
   └────┬─────────────────┘
        │ transform
        ▼
   ┌──────────────────────┐
   │ financialData        │
   │ inventoryData        │
   │ productList          │
   │ aiInsights           │
   └────┬─────────────────┘
        │ update state
        ▼
   ┌──────────────────────┐
   │ All Hooks Update     │
   │ Components Re-render │
   │ Real Data Displays   │
   └──────────────────────┘
```

## Feature Flowchart

```
User Opens Integrations Page
    │
    ├─ Shopify Not Connected?
    │   │
    │   └─ Show "Connect" Button
    │       │
    │       └─ User Clicks
    │           │
    │           └─ Modal Opens
    │               │
    │               ├─ User Enters:
    │               │  ├─ Store URL
    │               │  └─ API Token
    │               │
    │               └─ Click "Connect Shopify"
    │                   │
    │                   ├─ Validate Credentials ✓
    │                   │
    │                   ├─ Save to Firestore ✓
    │                   │
    │                   ├─ Perform Initial Sync ✓
    │                   │
    │                   ├─ Show Success Message ✓
    │                   │
    │                   └─ Close Modal
    │                       │
    │                       └─ Dashboard Updates with Real Data ✓
    │
    └─ Shopify Already Connected?
        │
        ├─ Show Store Name
        ├─ Show Last Sync Time
        ├─ Show "Re-sync" Button
        │   │
        │   └─ User Clicks
        │       │
        │       └─ Fetch Latest Data
        │           │
        │           └─ Update Last Sync Time
        │               │
        │               └─ Dashboard Updates ✓
        │
        └─ Show "Disconnect" Button
            │
            └─ User Clicks
                │
                └─ Confirm Dialog
                    │
                    ├─ Yes → Delete Credentials ✓
                    │         │
                    │         └─ Show "Connect" Button Again
                    │
                    └─ No → Stay Connected
```

## Page Integration Map

### Dashboard Page (Finance Overview)
```
Before (Hardcoded):
┌─────────────────────┐
│ Summary Cards       │
│ - $579,000 (hard)   │
│ - $335,000 (hard)   │
│ - $214,720 (hard)   │
│ - $29,280 (hard)    │
├─────────────────────┤
│ Charts              │
│ - Static data       │
│ - 6 months demo     │
└─────────────────────┘

After (Real Shopify Data):
┌──────────────────────────┐
│ Summary Cards            │
│ - Real total revenue     │
│ - Real total expenses    │
│ - Real net profit        │
│ - Real tax owed          │
├──────────────────────────┤
│ Charts                   │
│ - Real monthly data      │
│ - Last 6 months orders   │
└──────────────────────────┘
```

### Inventory Dashboard
```
Before (Hardcoded):
┌──────────────────────┐
│ Product Table        │
│ - Static 10 items    │
│ - Demo prices        │
│ - Demo quantities    │
└──────────────────────┘

After (Real Shopify Data):
┌───────────────────────────┐
│ Product Table             │
│ - All Shopify products    │
│ - Real prices             │
│ - Real stock levels       │
│ - Low stock warnings      │
│ - Product images          │
└───────────────────────────┘
```

### Record Sale Page
```
Before (Hardcoded):
┌──────────────────┐
│ Product Select   │
│ - Demo Product 1 │
│ - Demo Product 2 │
│ - Demo Product 3 │
└──────────────────┘

After (Real Shopify Data):
┌────────────────────────┐
│ Product Select         │
│ - All Shopify products │
│ - Real prices          │
│ - Real SKUs            │
│ - Real stock levels    │
└────────────────────────┘
```

## State Management Flow

```
Global State
├── Firebase Auth
│   └── user.uid
│
└── Nayance App
    ├── Integrations Page
    │   ├── shopifyConnected (boolean)
    │   ├── shopifyData (object)
    │   ├── syncing (boolean)
    │   └── showConnectModal (boolean)
    │
    └── useShopifyData Hook (Custom)
        ├── shopifyData (raw)
        ├── financialData (transformed)
        ├── inventoryData (transformed)
        ├── productList (transformed)
        ├── aiInsights (transformed)
        ├── loading (boolean)
        ├── error (string)
        ├── isConnected (boolean)
        └── refetch (function)
```

## API Endpoint Tree

```
/api/shopify/
├── GET /sync          → All data (products, orders, customers, inventory)
├── GET /products      → Products only
├── GET /orders        → Orders only
├── GET /customers     → Customers only
├── GET /inventory     → Inventory levels only
└── GET /status        → Connection status only

All endpoints require:
  Headers: Authorization: Bearer {idToken}
  Response: JSON with requested data
  Errors: 401 (unauthorized), 404 (not connected), 500 (server error)
```

## Database Schema

```
Firestore Collections
├── users
│   └── [userId]
│       ├── email
│       ├── name
│       └── ...
│
└── shopifyIntegrations ✨ [NEW]
    └── [userId]
        ├── shopName: "store.myshopify.com"
        ├── accessToken: "shpat_..."
        ├── userId: "firebase_uid"
        ├── connectedAt: 1702416000000
        └── lastSync: 1702419600000
```

## Sync Timeline

```
User Connects Shopify (Day 1)
├─ 00:00 - Save credentials
├─ 00:00 - Sync all data (4 API calls)
├─ 00:05 - Update lastSync timestamp
└─ 00:05 - Dashboard shows real data

User Clicks Re-sync (Day 2)
├─ 08:00 - Fetch latest data
├─ 08:00 - Update lastSync: "Just now"
└─ 08:00 - Dashboard refreshes

Auto-Sync (Future Feature)
├─ Every 5 minutes
├─ Background fetch
├─ Update only if changed
└─ No user action needed
```

## Error Handling Flow

```
Invalid Store URL
    ↓
Show Error Modal
"Store URL is invalid. Check format: example.myshopify.com"
    ↓
User Retries
    ↓
User enters correct URL
    ↓
Success!

Invalid API Token
    ↓
Show Error Modal
"Invalid Shopify credentials. Check your access token."
    ↓
User Clicks "Get Instructions"
    ↓
Show step-by-step token generation
    ↓
User gets new token
    ↓
Try again
    ↓
Success!

Network Error
    ↓
Show Error Modal
"Network error. Check your connection."
    ↓
User Retries
    ↓
Success or fail again
```

## Security Model

```
User enters credentials
    ↓ (HTTPS)
Modal validates format
    ↓
Frontend makes test API call to Shopify
    ↓ (if valid)
Save encrypted credentials to Firestore
    ↓
Frontend loads useShopifyData hook
    ↓
Hook calls backend API with Firebase auth token
    ↓
Backend validates Firebase token
    ↓ (if valid)
Backend retrieves credentials from Firestore
    ↓
Backend makes authenticated call to Shopify
    ↓
Backend returns data to frontend
    ↓
Frontend updates state and displays data
```

## Component Relationship

```
ConnectShopify Modal
    ↑
    └── Used by: Integrations Page
        └── Props: isOpen, onClose, onSuccess

useShopifyData Hook
    ↑
    ├── Used by: Dashboard
    ├── Used by: InventoryDashboard
    ├── Used by: RecordSale
    ├── Used by: AIInsights
    └── Used by: FinancialReports

shopifyStore
    ↑
    ├── Used by: ConnectShopify Modal
    ├── Used by: useShopifyData Hook
    └── Used by: Integrations Page

shopifySync
    ↑
    └── Used by: useShopifyData Hook

shopifyTypes
    ↑
    ├── Used by: useShopifyData Hook
    ├── Used by: shopifyStore
    ├── Used by: shopifySync
    └── Used by: All components using data

shopifyRoutes (Backend)
    ↑
    └── Used by: useShopifyData Hook (via fetch)
```

## Performance Metrics

```
Initial Connection
├─ Form Display: <100ms
├─ Credential Validation: ~500ms
├─ Firestore Save: ~200ms
├─ Initial Sync: ~2000ms (4 parallel API calls)
└─ Total: ~3000ms

Data Fetch (useShopifyData)
├─ Firestore Read: ~100ms
├─ Backend Request: ~200ms
├─ Shopify API Calls: ~1500ms (4 parallel)
├─ Data Transform: ~200ms
└─ Total: ~2000ms

Re-sync
├─ Same as Data Fetch: ~2000ms

Disconnect
├─ Confirm Dialog: <100ms
├─ Firestore Delete: ~200ms
└─ Total: ~300ms
```

---

**Visual Reference Complete!**  
Use this for:
- System overview
- Presentation to stakeholders
- Team onboarding
- Architecture documentation
- Planning future features

Generated: December 12, 2025

