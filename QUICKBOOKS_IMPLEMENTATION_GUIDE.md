# QuickBooks Integration - Implementation Guide

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage Examples](#usage-examples)
4. [API Reference](#api-reference)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)

## Installation

### 1. Install Dependencies

All required packages are already in `package.json`. They include:
- `axios` - HTTP client for API calls
- `firebase-admin` - Backend Firebase operations
- `firebase` - Frontend Firebase operations
- `express` - Backend server

### 2. File Setup

All files have been created:
```
✓ src/utils/quickbooksTypes.ts
✓ src/utils/quickbooksStore.ts
✓ src/utils/quickbooksSync.ts
✓ src/hooks/useQuickBooksData.ts
✓ src/components/ConnectQuickBooks.tsx
✓ src/styles/ConnectQuickBooks.css
✓ server/routes/quickbooksRoutes.js
```

### 3. Update Server

Already updated in `server/index.js`:
```javascript
const quickbooksRoutes = require("./routes/quickbooksRoutes");
app.use("/api/quickbooks", quickbooksRoutes);
```

## Configuration

### Environment Variables (.env)

```bash
# QuickBooks OAuth
QB_CLIENT_ID=your-client-id
QB_CLIENT_SECRET=your-client-secret

# Firebase
FIREBASE_API_KEY=your-key
FIREBASE_AUTH_DOMAIN=your-domain
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Server
PORT=4242
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

### Firebase Setup

1. Create Firestore collection: `quickbooksIntegrations`
2. Set security rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quickbooksIntegrations/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## Usage Examples

### Example 1: Using in a React Component

```typescript
import { useQuickBooksData } from '@/hooks/useQuickBooksData';

export const FinancialDashboard = () => {
  const {
    financialData,
    invoiceData,
    expenseData,
    loading,
    syncing,
    connected,
    manualSync
  } = useQuickBooksData({ autoSync: true });

  if (loading) return <div>Loading...</div>;
  if (!connected) return <div>QuickBooks not connected</div>;

  return (
    <div>
      <h1>Financial Overview</h1>
      
      {/* Assets/Liabilities */}
      <div className="financial-cards">
        <Card>
          <h3>Total Assets</h3>
          <p>${financialData?.totalAssets}</p>
        </Card>
        <Card>
          <h3>Total Liabilities</h3>
          <p>${financialData?.totalLiabilities}</p>
        </Card>
        <Card>
          <h3>Net Worth</h3>
          <p>${financialData?.netWorth}</p>
        </Card>
      </div>

      {/* Invoices */}
      <div className="invoice-cards">
        <Card>
          <h3>Total Revenue</h3>
          <p>${invoiceData?.totalRevenue}</p>
        </Card>
        <Card>
          <h3>Unpaid Invoices</h3>
          <p>${invoiceData?.unpaidAmount}</p>
        </Card>
      </div>

      {/* Manual Sync */}
      <button onClick={manualSync} disabled={syncing}>
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
};
```

### Example 2: Connecting QuickBooks

```typescript
import { ConnectQuickBooks } from '@/components/ConnectQuickBooks';
import { useState } from 'react';

export const IntegrationsPage = () => {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = (realmId: string) => {
    console.log('QB Connected! Realm ID:', realmId);
    // Refresh data, update UI, etc.
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Connect QuickBooks
      </button>

      <ConnectQuickBooks
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};
```

### Example 3: Manual Data Sync

```typescript
import { syncAllQuickBooksData } from '@/utils/quickbooksSync';
import { useAuth } from '@/context/AuthContext';

export const ManualSyncButton = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await syncAllQuickBooksData(user.uid);
      if (result.success) {
        console.log('Sync complete!');
        console.log('Financial Data:', result.financial);
        console.log('Invoice Data:', result.invoices);
      } else {
        console.error('Sync failed:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSync} disabled={loading}>
      {loading ? 'Syncing...' : 'Sync QuickBooks Data'}
    </button>
  );
};
```

### Example 4: Check Connection Status

```typescript
import { getQuickBooksCredentials, isTokenExpired } from '@/utils/quickbooksStore';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export const ConnectionStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      const credentials = await getQuickBooksCredentials(user.uid);
      
      if (!credentials) {
        setStatus('NOT_CONNECTED');
        return;
      }

      if (isTokenExpired(credentials)) {
        setStatus('TOKEN_EXPIRED');
      } else {
        setStatus('CONNECTED');
      }
    };

    checkStatus();
  }, [user.uid]);

  const statusColors = {
    CONNECTED: 'green',
    NOT_CONNECTED: 'gray',
    TOKEN_EXPIRED: 'orange'
  };

  return (
    <div style={{ color: statusColors[status] }}>
      {status}
    </div>
  );
};
```

## API Reference

### Frontend Utils

#### quickbooksStore.ts

```typescript
// Save credentials after OAuth
await saveQuickBooksCredentials(
  userId: string,
  realmId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<QuickBooksCredentials>

// Get stored credentials
await getQuickBooksCredentials(userId: string): Promise<QuickBooksCredentials | null>

// Update last sync time and tokens
await updateQuickBooksSync(
  userId: string,
  timestamp: number,
  newAccessToken?: string,
  newRefreshToken?: string,
  newExpiresAt?: number
): Promise<void>

// Remove credentials
await disconnectQuickBooks(userId: string): Promise<void>

// Check if connected
await isQuickBooksConnected(userId: string): Promise<boolean>

// Check token expiry
isTokenExpired(credentials: QuickBooksCredentials): boolean

// Get all connected integrations (admin)
await getAllConnectedQuickBooks(): Promise<QuickBooksCredentials[]>
```

#### quickbooksSync.ts

```typescript
// Refresh OAuth token
await refreshQuickBooksToken(
  userId: string,
  refreshToken: string
): Promise<{ accessToken, refreshToken, expiresIn } | null>

// Fetch accounts
await fetchQuickBooksAccounts(userId: string): Promise<QBAccount[]>

// Fetch invoices
await fetchQuickBooksInvoices(userId: string): Promise<QBInvoice[]>

// Fetch expenses
await fetchQuickBooksExpenses(userId: string): Promise<QBExpense[]>

// Fetch customers
await fetchQuickBooksCustomers(userId: string): Promise<QBCustomer[]>

// Transform accounts to financial data
transformAccountsToFinancial(accounts: QBAccount[]): QBFinancialData

// Transform invoices for dashboard
transformInvoicesToData(invoices: QBInvoice[]): QBInvoiceData

// Transform expenses for dashboard
transformExpensesToData(expenses: QBExpense[]): QBExpenseData

// Transform customers for dashboard
transformCustomersToData(customers: QBCustomer[]): QBCustomerData

// Main sync function
await syncAllQuickBooksData(userId: string): Promise<SyncResult>

// Get sync status
await getQuickBooksStatus(userId: string): Promise<StatusResult>
```

#### useQuickBooksData Hook

```typescript
const {
  financialData,      // QBFinancialData | null
  invoiceData,        // QBInvoiceData | null
  expenseData,        // QBExpenseData | null
  customerData,       // QBCustomerData | null
  invoices,           // QBInvoice[]
  customers,          // QBCustomer[]
  loading,            // boolean
  syncing,            // boolean
  error,              // string | null
  connected,          // boolean
  lastSync,           // number | null
  manualSync,         // async function
  checkConnection     // async function
} = useQuickBooksData({ autoSync: true, syncInterval: 300000 })
```

### Backend API Routes

#### GET /api/quickbooks/status
Get connection status
```bash
curl -H "X-User-ID: userId" http://localhost:4242/api/quickbooks/status
```

#### POST /api/quickbooks/refresh-token
Refresh OAuth token
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"uid","refreshToken":"token"}' \
  http://localhost:4242/api/quickbooks/refresh-token
```

#### GET /api/quickbooks/accounts
Get chart of accounts
```bash
curl -H "X-User-ID: userId" http://localhost:4242/api/quickbooks/accounts
```

#### GET /api/quickbooks/invoices
Get invoices
```bash
curl -H "X-User-ID: userId" http://localhost:4242/api/quickbooks/invoices
```

#### GET /api/quickbooks/expenses
Get expenses
```bash
curl -H "X-User-ID: userId" http://localhost:4242/api/quickbooks/expenses
```

#### GET /api/quickbooks/customers
Get customers
```bash
curl -H "X-User-ID: userId" http://localhost:4242/api/quickbooks/customers
```

#### GET /api/quickbooks/vendors
Get vendors
```bash
curl -H "X-User-ID: userId" http://localhost:4242/api/quickbooks/vendors
```

#### POST /api/quickbooks/oauth-callback
Handle OAuth callback
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"uid","code":"authcode","realmId":"123"}' \
  http://localhost:4242/api/quickbooks/oauth-callback
```

#### POST /api/quickbooks/disconnect
Disconnect QB
```bash
curl -X POST \
  -H "X-User-ID: userId" \
  http://localhost:4242/api/quickbooks/disconnect
```

## Advanced Usage

### Custom Data Transformation

```typescript
// In quickbooksSync.ts
export const customFinancialTransform = (accounts: QBAccount[]) => {
  const byType = accounts.reduce((acc, account) => {
    const type = account.accountType;
    acc[type] = (acc[type] || 0) + account.currentBalance;
    return acc;
  }, {});

  return {
    byType,
    total: Object.values(byType).reduce((a, b) => a + b, 0)
  };
};
```

### Auto-Sync with Custom Interval

```typescript
const { manualSync } = useQuickBooksData({
  autoSync: true,
  syncInterval: 600000 // 10 minutes instead of 5
});
```

### Error Recovery

```typescript
const handleSyncWithRetry = async (userId: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await syncAllQuickBooksData(userId);
      if (result.success) return result;
      
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
};
```

### Batch Operations

```typescript
// Sync multiple users' QB data
const syncAllUsers = async (userIds: string[]) => {
  const results = await Promise.allSettled(
    userIds.map(uid => syncAllQuickBooksData(uid))
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`Synced ${successful.length}/${userIds.length} users`);
  return { successful, failed };
};
```

## Troubleshooting

### Issue: Token Expired Error

```typescript
// Check token expiry
const credentials = await getQuickBooksCredentials(userId);
if (isTokenExpired(credentials)) {
  // Refresh automatically (happens in fetchQuickBooks* functions)
  // Or manually:
  const refreshed = await refreshQuickBooksToken(
    userId,
    credentials.refreshToken
  );
}
```

### Issue: No Data Returned

```typescript
// Check if QB account has data
const accounts = await fetchQuickBooksAccounts(userId);
console.log('Accounts found:', accounts.length);

// Check API response
// Add logging in server/routes/quickbooksRoutes.js
console.log('QB API Response:', response.data);
```

### Issue: OAuth Not Working

```typescript
// Verify credentials in environment
console.log('Client ID set:', !!process.env.QB_CLIENT_ID);
console.log('Client Secret set:', !!process.env.QB_CLIENT_SECRET);

// Check redirect URI matches exactly
// In Developer Portal: http://localhost:3000/quickbooks-callback
// In code: Should match exactly
```

### Issue: Firestore Permissions

```firestore
// Add to security rules if getting permission denied
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quickbooksIntegrations/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

**Last Updated**: January 2024  
**Status**: Production Ready
