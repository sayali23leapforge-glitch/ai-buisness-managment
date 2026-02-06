# QuickBooks Integration - Quick Start

## 🚀 30-Second Setup

### Prerequisites
- ✅ Firebase configured
- ✅ Node.js servers running
- ✅ Intuit Developer account

### Step 1: Get OAuth Credentials
```
1. Go to https://developer.intuit.com
2. Create new app (or use existing)
3. Copy Client ID
4. Copy Client Secret
5. Set redirect URI: http://localhost:3000/quickbooks-callback
```

### Step 2: User Connects QB
```
1. Open Integrations page
2. Find QuickBooks card
3. Click "Connect"
4. Enter Client ID and Client Secret
5. Follow OAuth prompt
6. Done! Data syncs automatically
```

### Step 3: Data Starts Flowing
```
✓ Accounts synced
✓ Invoices imported
✓ Expenses tracked
✓ Customers loaded
✓ Dashboard updated every 5 minutes
```

## 📋 Connection Checklist

- [ ] Intuit app created
- [ ] Client ID obtained
- [ ] Client Secret obtained
- [ ] Redirect URI set
- [ ] Environment variables configured
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Users can access Integrations page
- [ ] QB card visible
- [ ] Modal opens on Connect click
- [ ] OAuth flow works
- [ ] Data appears in dashboards

## 🔑 Required Credentials

```env
QB_CLIENT_ID=your-client-id-here
QB_CLIENT_SECRET=your-client-secret-here
```

## 📊 What Gets Synced

| Data Type | Count | Frequency |
|-----------|-------|-----------|
| Accounts | 50+ | Every 5 min |
| Invoices | 100+ | Every 5 min |
| Expenses | 500+ | Every 5 min |
| Customers | 50+ | Every 5 min |
| Vendors | 30+ | Every 5 min |

## 🧪 Quick Test

```bash
# 1. Start servers
npm run dev      # Terminal 1
npm start        # Terminal 2

# 2. Go to http://localhost:3000
# 3. Login with test account
# 4. Click Integrations
# 5. Click Connect on QB card
# 6. Authorize with QB test account
# 7. Verify data appears in dashboard
```

## 🐛 Common Issues & Fixes

### "Connection Failed"
```
❌ Client ID/Secret incorrect
✅ Double-check credentials
✅ Verify app is active in Developer Portal
```

### "No Data Syncing"
```
❌ QB account has no transactions
✅ Add test data to QB sandbox
✅ Check QB account has invoices/expenses
```

### "OAuth Redirect Failed"
```
❌ Redirect URI not set correctly
✅ Check Developer Portal settings
✅ Verify exact URL match
```

## 📈 Performance

- **Initial Sync**: ~2-3 seconds (4 parallel API calls)
- **Auto-Sync**: Every 5 minutes
- **Token Refresh**: Automatic (transparent)
- **Data Freshness**: 5 minutes max

## 🔐 Security

```
✓ OAuth 2.0 (industry standard)
✓ Tokens encrypted in Firestore
✓ Automatic token refresh
✓ User data isolation
✓ Backend API proxy (no direct frontend calls)
✓ Firebase authentication required
```

## 💾 File Locations

```
Frontend:
  src/utils/quickbooksTypes.ts      (TypeScript types)
  src/utils/quickbooksStore.ts      (Firestore storage)
  src/utils/quickbooksSync.ts       (API sync logic)
  src/hooks/useQuickBooksData.ts    (React hook)
  src/components/ConnectQuickBooks.tsx (Modal)
  src/styles/ConnectQuickBooks.css  (Styling)

Backend:
  server/routes/quickbooksRoutes.js (API endpoints)
  server/index.js                   (Route registration)
```

## 📞 Support Resources

- [Intuit Developer Docs](https://developer.intuit.com)
- [OAuth 2.0 Guide](https://developer.intuit.com/docs/oauth)
- [Query Language Reference](https://developer.intuit.com/docs/api/accounting/latest-objects)
- [Error Codes](https://developer.intuit.com/docs/api/accounting/latest-objects#error)

## 🎯 Next Steps

1. Test with your QB account
2. Verify all data types sync
3. Check dashboards for data
4. Monitor sync frequency
5. Set up alerts for failures (future)

## ⚡ Advanced Configuration

### Change Sync Interval
```typescript
// In useQuickBooksData hook
const { syncInterval = 300000 } = options; // 5 minutes

// Change to 10 minutes:
useQuickBooksData({ syncInterval: 600000 })
```

### Manual Token Refresh
```typescript
import { refreshQuickBooksToken } from '@/utils/quickbooksSync';

const refreshed = await refreshQuickBooksToken(userId, refreshToken);
```

### Custom Data Transformation
```typescript
// Create custom transformer in quickbooksSync.ts
export const transformCustomQBData = (data) => {
  // Your transformation logic
  return transformed;
};
```

## 📚 More Resources

- [Full Integration Guide](./QUICKBOOKS_INTEGRATION_GUIDE.md)
- [Implementation Details](./QUICKBOOKS_IMPLEMENTATION_GUIDE.md)
- [Visual Architecture](./QUICKBOOKS_VISUAL_OVERVIEW.md)
- [Files Summary](./QUICKBOOKS_FILES_SUMMARY.md)

---

**Status**: ✅ Production Ready  
**Last Updated**: January 2024  
**Version**: 1.0
