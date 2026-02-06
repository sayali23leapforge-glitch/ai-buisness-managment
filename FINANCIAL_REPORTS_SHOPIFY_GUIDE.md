# Financial Reports with Real Shopify Data

## Overview
The Financial Reports page now displays **real data from your Shopify store** including:
- **Revenue**: From all Shopify orders
- **Products**: From your Shopify product catalog
- **Cost of Goods Sold (COGS)**: Calculated from product costs
- **Inventory Value**: Based on product stock and costs

## How to Use

### Step 1: Connect Shopify
1. Go to **Integrations** menu
2. Click **Connect to Shopify**
3. Enter your Shopify store URL and API access token
4. The app will sync all products and orders

### Step 2: View Financial Reports
1. Navigate to **Financial Reports** menu
2. You'll see:
   - ✅ **Green banner**: Shopify is connected with real data
   - **Order count**: Number of orders from Shopify
   - **Product count**: Number of products in your store
   - **Last sync time**: When data was last refreshed

### Step 3: Refresh Data
1. Click the **🔄 Refresh Shopify Data** button (visible only when Shopify is connected)
2. The app will fetch all latest products and orders
3. Income Statement will recalculate with new data

## Key Features

### Real Data Calculations
- **Revenue**: Sum of all Shopify order totals
- **COGS**: Calculated from product cost × quantity sold
- **Gross Profit**: Revenue - COGS
- **Operating Expenses**: Customizable expenses (Salaries, Rent, Marketing, etc.)
- **Net Profit**: After all expenses and taxes

### Three Statement Views
1. **Income Statement**: Revenue, expenses, and net profit
2. **Balance Sheet**: Assets, liabilities, and equity
3. **Cash Flow Statement**: Operating, investing, and financing activities

### Export Options
- **Generate Report**: Print or save as PDF
- **Export as CSV**: Spreadsheet format for further analysis
- **View Tax Summary**: See tax calculations and effective rate

## Data Synchronization

### Automatic Sync
- Data is fetched through our backend server
- Supports **pagination** for stores with >250 products or orders
- All data is stored locally in browser storage

### Manual Refresh
- Click "🔄 Refresh Shopify Data" button anytime
- Fetches latest orders and products from Shopify
- Updates all financial calculations

## Monthly Revenue Tracking
The reports include monthly revenue breakdown for:
- Tracking seasonal trends
- Monthly profit margin analysis
- Year-over-year comparisons

## Customizable Operating Expenses
Adjust your operating expenses in the settings:
- Salaries
- Rent
- Marketing
- Utilities
- Other

## FAQs

**Q: Why don't I see real data?**
A: Make sure Shopify is connected in Integrations. If connected, click "Refresh Shopify Data" to sync latest orders and products.

**Q: Does it include deleted or archived products?**
A: The system fetches all products from your Shopify store. Make sure products are published and not archived.

**Q: How often should I refresh?**
A: Refresh whenever you want the latest data. Many users refresh daily or after large order volumes.

**Q: Can I export historical data?**
A: Yes! Use the "Export as CSV" option to export all financial data for further analysis in Excel or Google Sheets.

**Q: Is my data secure?**
A: Your Shopify credentials are stored locally in your browser. We never store them on our servers beyond API processing.

## Troubleshooting

### No data showing
1. Check that Shopify is connected (green banner with data count)
2. Click "Refresh Shopify Data" button
3. Make sure your Shopify API token has proper permissions
4. Check browser console for error messages

### Products not appearing
1. Ensure products are published in Shopify (not archived)
2. Try refreshing the data
3. Check that product variants have pricing information

### Orders not appearing
1. Make sure orders exist in your Shopify store
2. Click refresh to get latest orders
3. Verify API token has access to orders

## Backend API Details

The app uses a backend server (running on port 5000) that:
- Handles Shopify API authentication securely
- Implements pagination for large data sets
- Transforms Shopify data into financial formats
- Returns complete datasets (not limited to 250 items)

### Pagination Handling
- Products: Fetches all products (no limit)
- Orders: Fetches all orders (no limit)
- Supports Shopify Link headers for multi-page results

## Next Steps

1. **Connect Shopify** if you haven't already
2. **View Financial Reports** to see your real business metrics
3. **Export data** for accounting and tax preparation
4. **Monitor trends** using monthly revenue tracking
5. **Adjust expenses** to match your actual business costs
