# QuickBooks Online Integration Guide

## Overview

This guide explains the complete QuickBooks Online integration for Nayance. The integration enables automatic synchronization of financial data, invoices, expenses, customers, and more.

## Key Differences from Shopify

| Aspect | Shopify | QuickBooks |
|--------|---------|-----------|
| Auth Method | API Tokens | OAuth 2.0 |
| Token Expiry | None | Yes (expires in 60 minutes) |
| Refresh Needed | No | Yes |
| Data Types | Products, Orders, Customers | Accounts, Invoices, Expenses, Customers |
| API Type | REST API | REST API (Query Language) |

## Architecture

```
User Logs in (Firebase)
    ↓
Clicks "Connect QuickBooks"
    ↓
Redirects to Intuit OAuth (not shown in modal)
    ↓
Exchanged for Access Token & Refresh Token
    ↓
Tokens stored in Firestore (encrypted by Firebase)
    ↓
Backend uses tokens to fetch QB data
    ↓
Data cached locally and displayed in dashboards
```

## File Structure

### Frontend Files

1. **`src/utils/quickbooksTypes.ts`** (180 lines)
   - TypeScript interfaces for all QB data structures
   - Credentials, accounts, invoices, expenses, customers, vendors
   - Financial statement types (income statement, balance sheet)

2. **`src/utils/quickbooksStore.ts`** (170 lines)
   - Firestore CRUD operations for QB credentials
   - Functions: `saveQuickBooksCredentials`, `getQuickBooksCredentials`
   - Token expiry checks: `isTokenExpired`
   - Disconnect: `disconnectQuickBooks`

3. **`src/utils/quickbooksSync.ts`** (300+ lines)
   - OAuth token refresh logic
   - API fetch functions: `fetchQuickBooksAccounts`, `fetchQuickBooksInvoices`, etc.
   - Data transformation functions
   - Main sync function: `syncAllQuickBooksData`

4. **`src/hooks/useQuickBooksData.ts`** (200+ lines)
   - Custom React hook for QB data
   - Provides: financial data, invoices, expenses, customers
   - Auto-sync every 5 minutes
   - Manual sync capability

5. **`src/components/ConnectQuickBooks.tsx`** (300 lines)
   - Modal component for OAuth flow
   - Step-by-step instructions
   - Credential input form
   - Success/processing states

6. **`src/styles/ConnectQuickBooks.css`** (400 lines)
   - Dark theme styling matching Nayance design
   - Modal animations (slide, spin, pop)
   - Form input styling
   - Success/error states

7. **`src/pages/Integrations.tsx`** (UPDATED)
   - QuickBooks card with connection status
   - Sync/disconnect buttons
   - Modal integration

8. **`src/styles/Integrations.css`** (UPDATED)
   - QB-specific card styling
   - Blue color scheme (#60a5fa)

### Backend Files

1. **`server/routes/quickbooksRoutes.js`** (350+ lines)
   - 6 API endpoints:
     - `GET /status` - Connection status
     - `POST /refresh-token` - Token refresh
     - `GET /accounts` - Chart of accounts
     - `GET /invoices` - Invoices list
     - `GET /expenses` - Expenses list
     - `GET /customers` - Customers list
     - `GET /vendors` - Vendors list
     - `POST /oauth-callback` - OAuth callback handler
     - `POST /disconnect` - Disconnect QB
   - OAuth token exchange
   - Automatic token refresh
   - Firebase token verification

2. **`server/index.js`** (UPDATED)
   - QuickBooks route imports
   - Middleware setup

## How to Connect QuickBooks

### User Steps

1. Go to **Integrations** page
2. Find **QuickBooks** card
3. Click **Connect** button
4. Modal opens with instructions
5. Follow OAuth flow (not directly in modal)
6. Tokens automatically saved to Firestore
7. Data syncs automatically

### Developer Setup

1. Create app at [developer.intuit.com](https://developer.intuit.com)
2. Get Client ID and Client Secret
3. Set redirect URI: `http://localhost:3000/quickbooks-callback`
4. Add to `.env`:
   ```
   QB_CLIENT_ID=your-client-id
   QB_CLIENT_SECRET=your-client-secret
   QB_REALM_ID=your-realm-id (optional, can be user-provided)
   ```

## Data Flow

### Initial Connection

```
User → ConnectQuickBooks Modal
  ↓
OAuth redirect to Intuit
  ↓
Authorization code returned
  ↓
Backend exchanges for tokens
  ↓
Tokens saved to Firestore
  ↓
Success modal shown
```

### Data Synchronization

```
User clicks "Re-sync"
  ↓
syncAllQuickBooksData() called
  ↓
4 Parallel API calls:
  - fetchQuickBooksAccounts()
  - fetchQuickBooksInvoices()
  - fetchQuickBooksExpenses()
  - fetchQuickBooksCustomers()
  ↓
Transform to dashboard format:
  - transformAccountsToFinancial()
  - transformInvoicesToData()
  - transformExpensesToData()
  - transformCustomersToData()
  ↓
Display in dashboards
  ↓
Auto-sync every 5 minutes
```

### Token Refresh

```
API call attempted
  ↓
Check if token expired (tokenExpiresAt)
  ↓
If expired:
  ↓
refreshAccessToken() called
  ↓
Exchange refresh token for new access token
  ↓
Update tokenExpiresAt in Firestore
  ↓
Retry original API call
```

## Data Transformation

### Accounts → Financial Data

```TypeScript
{
  totalAssets: 150000,
  totalLiabilities: 50000,
  totalEquity: 100000,
  netWorth: 100000,
  accountCount: 25,
  lastUpdated: timestamp
}
```

### Invoices → Invoice Data

```TypeScript
{
  totalInvoices: 45,
  totalRevenue: 125000,
  paidAmount: 100000,
  unpaidAmount: 25000,
  recentInvoices: 8,
  averageInvoiceAmount: 2777,
  topInvoices: [...],
  lastUpdated: timestamp
}
```

### Expenses → Expense Data

```TypeScript
{
  totalExpenses: 45000,
  expenseCount: 120,
  last30Days: 8000,
  last90Days: 25000,
  byCategory: { "Utilities": 2000, "Supplies": 1500, ... },
  topExpenses: [...],
  lastUpdated: timestamp
}
```

## Security Considerations

1. **OAuth 2.0**: Industry standard for QuickBooks
2. **Token Encryption**: Firebase securely stores credentials
3. **User Isolation**: Each user's data is isolated by Firebase UID
4. **Token Refresh**: Automatic refresh prevents expired token issues
5. **Backend Proxy**: Frontend never calls QB API directly
6. **HTTPS Only**: All token exchanges over HTTPS

## Error Handling

### Token Expiration

```
API call fails with 401
  ↓
Check tokenExpiresAt
  ↓
Call refreshAccessToken()
  ↓
Update credentials in Firestore
  ↓
Retry with new token
  ↓
If refresh fails → User must reconnect
```

### Sync Failures

- Auto-retry on network errors
- Error message displayed to user
- Last known data still available
- Manual sync button available

## Dashboard Integration

QuickBooks data is automatically available in:

1. **Financial Reports Page**
   - Account balances
   - Income statement data
   - Balance sheet data

2. **Dashboard Overview**
   - Recent invoices
   - Expense summaries
   - Customer financial status

3. **Accounting Views**
   - Full account list
   - Invoice details
   - Expense tracking

## Testing

### Local Testing

1. Start both servers:
   ```bash
   npm run dev      # Frontend
   npm start        # Backend
   ```

2. Go to Integrations page
3. Click Connect QuickBooks
4. Test OAuth flow
5. Verify tokens saved in Firestore
6. Test sync with re-sync button

### Test Data

Use QuickBooks sandbox account:
- Provides test company with sample data
- No real financial impact
- Can modify freely for testing

## Troubleshooting

### "Not connected" error
- Check Firestore for credentials
- Verify token hasn't expired
- Try reconnecting with valid credentials

### Sync failures
- Check backend logs for API errors
- Verify QB API credentials
- Check network connectivity
- Try manual sync button

### Missing data
- Check QB account has data in that category
- Verify correct Realm ID
- Try full page refresh

## Performance Optimization

1. **Parallel Data Fetching**: 4 API calls in parallel
2. **Auto-Sync Interval**: 5 minutes (configurable)
3. **Caching**: Data cached until next sync
4. **Lazy Loading**: Data loaded on-demand per dashboard

## Future Enhancements

1. **Multi-QB Support**: Connect multiple QB accounts
2. **Transaction Details**: Drill-down into specific transactions
3. **Custom Reports**: Build custom QB reports
4. **Reconciliation**: Bank reconciliation features
5. **Budget vs Actual**: Compare budgets to actual expenses
6. **Forecasting**: Financial forecasting
7. **Alerts**: Alerts for unusual transactions

## Related Documentation

- [QuickBooks API Docs](https://developer.intuit.com/app/developer/qbo/docs)
- [OAuth 2.0 Flow](https://developer.intuit.com/docs/oauth)
- [Query Language](https://developer.intuit.com/docs/api/accounting/latest-objects)
- [Error Handling](https://developer.intuit.com/docs/api/accounting/latest-objects#error)
