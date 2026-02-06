/**
 * Example: Dashboard with Real Shopify Data
 * 
 * This is an example of how to integrate useShopifyData into your existing Dashboard.
 * Copy the useShopifyData() hook call and data-fetching logic into your actual Dashboard.
 * 
 * The hook automatically:
 * - Fetches Shopify data
 * - Transforms it for financial views
 * - Handles loading and errors
 * - Provides refetch capability
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import {
  Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  QrCode, Sparkles, ReceiptText, Banknote, Link as LinkIcon,
  Users, CreditCard, Settings, Zap, RefreshCw
} from "lucide-react";

import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useShopifyData } from "../hooks/useShopifyData"; // ← NEW: Import Shopify hook
import "../styles/Dashboard.css";

export default function DashboardWithShopify() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [_selectedRole, setSelectedRole] = useState("Owner (Full Access)");
  const { user } = useAuth();
  
  // ← NEW: Fetch real Shopify data
  const { 
    financialData, 
    isConnected, 
    loading, 
    error,
    refetch 
  } = useShopifyData();

  // Fallback data for when Shopify is not connected
  const defaultRevenueData = [
    { month: "Jan", revenue: 90000, expenses: 55000 },
    { month: "Feb", revenue: 92000, expenses: 58000 },
    { month: "Mar", revenue: 88000, expenses: 57000 },
    { month: "Apr", revenue: 100000, expenses: 60000 },
    { month: "May", revenue: 95000, expenses: 58000 },
    { month: "Jun", revenue: 120000, expenses: 65000 },
  ];

  const defaultCostData = [
    { name: "Operations", value: 35, color: "#facc15" },
    { name: "Salaries", value: 40, color: "#ffd700" },
    { name: "Marketing", value: 15, color: "#ffed4e" },
    { name: "Other", value: 10, color: "#888888" },
  ];

  // Use real data from Shopify if available, otherwise use defaults
  const revenueData = financialData?.revenueByMonth || defaultRevenueData;
  const costData = financialData?.costBreakdown || defaultCostData;

  const summaryCards = [
    { 
      label: "Total Revenue", 
      value: financialData 
        ? `$${financialData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : "$0.00", 
      change: "+18.2% from last month", 
      color: "gold" 
    },
    { 
      label: "Total Expenses", 
      value: financialData 
        ? `$${financialData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : "$0.00", 
      change: "+5.7% from last month", 
      color: "red" 
    },
    { 
      label: "Net Profit (After Tax)", 
      value: financialData 
        ? `$${financialData.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : "$0.00", 
      change: "+22.4% from last month", 
      color: "green" 
    },
    { 
      label: "Tax Owed", 
      value: financialData 
        ? `$${financialData.taxOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : "$0.00", 
      change: `${financialData?.taxRate ? (financialData.taxRate * 100).toFixed(0) : "12"}% tax rate`, 
      color: "orange" 
    },
  ];

  const menuItems = [
    { icon: Wallet, label: "Finance Overview" },
    { icon: Boxes, label: "Inventory Dashboard" },
    { icon: ShoppingCart, label: "Record Sale" },
    { icon: BarChart2, label: "Inventory Manager" },
    { icon: PlusSquare, label: "Add Product" },
    { icon: QrCode, label: "QR & Barcodes" },
    { icon: Sparkles, label: "AI Insights" },
    { icon: ReceiptText, label: "Financial Reports" },
    { icon: Banknote, label: "Tax Center" },
    { icon: LinkIcon, label: "Integrations" },
    { icon: Users, label: "Team Management" },
    { icon: CreditCard, label: "Billing & Plan" },
    { icon: Zap, label: "Improvement Hub" },
    { icon: Settings, label: "Settings" },
  ];

  const upcoming = [
    { title: "Q3 Corporate Tax Filing", date: "Due Oct 15, 2025" },
  ];

  const cashFlowItems = [
    { title: "Strong positive cash flow", value: 42.1 },
  ];

  const makeRoute = (label: string) =>
    "/" +
    label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-").replace(/-/g, "-");

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo-icon">N</div>
          {sidebarOpen && <span className="company-name">Golden Goods Inc.</span>}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={idx}
                to={makeRoute(item.label)}
                className={`nav-item ${idx === 0 ? "active" : ""}`}
              >
                <IconComponent size={18} className="nav-icon" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="location-main">Toronto, Ontario</div>
          <div className="location-sub">Top tables under restaurants</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <TopBar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onRoleChange={(role) => setSelectedRole(role)}
        />

        <div className="scrollable-content">
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              color: '#aaa'
            }}>
              <p>Loading Shopify data...</p>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              color: '#ff8888',
              padding: '16px',
              borderRadius: '6px',
              margin: '20px',
              fontSize: '14px'
            }}>
              Error loading data: {error}
            </div>
          )}

          {!isConnected && !loading && (
            <div style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#daa520',
              padding: '16px',
              borderRadius: '6px',
              margin: '20px',
              fontSize: '14px'
            }}>
              <strong>Note:</strong> Shopify is not connected. Go to{' '}
              <Link to="/integrations" style={{ color: '#d4af37', textDecoration: 'underline' }}>
                Integrations
              </Link>
              {' '}to connect your Shopify store for real data.
            </div>
          )}

          <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
              <div>
                <h1>Finance Overview</h1>
                <p>
                  {isConnected ? "Real Shopify data" : "Demo data - Connect Shopify for real data"}
                  {isConnected && (
                    <button
                      onClick={refetch}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: '8px',
                        color: '#d4af37',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Refresh data"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
              {summaryCards.map((card, idx) => (
                <div key={idx} className={`summary-card ${card.color}`}>
                  <div className="card-label">{card.label}</div>
                  <div className="card-value">{card.value}</div>
                  <div className="card-change">{card.change}</div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="charts-section">
              {/* Revenue Chart */}
              <div className="chart-card">
                <h2>Revenue & Expenses</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#d4af37"
                      strokeWidth={2}
                      dot={{ fill: "#d4af37", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ff6b6b"
                      strokeWidth={2}
                      dot={{ fill: "#ff6b6b", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Breakdown Chart */}
              <div className="chart-card">
                <h2>Cost Breakdown</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }}
                      labelStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="dashboard-bottom">
              {/* Upcoming Dates */}
              <div className="section-card">
                <h2>Upcoming Dates</h2>
                <ul className="upcoming-list">
                  {upcoming.map((item, idx) => (
                    <li key={idx}>
                      <span className="upcoming-title">{item.title}</span>
                      <span className="upcoming-date">{item.date}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cash Flow */}
              <div className="section-card">
                <h2>Cash Flow Health</h2>
                <div className="cash-flow-indicator">
                  <div className="indicator-bar" style={{ width: "42%" }}></div>
                </div>
                <ul className="cash-flow-list">
                  {cashFlowItems.map((item, idx) => (
                    <li key={idx}>
                      <span>{item.title}</span>
                      <span className="cash-flow-value">{item.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Replace your existing Dashboard.tsx with this component
 *    OR copy the useShopifyData() hook and logic into your existing file
 * 
 * 2. The hook provides:
 *    - financialData: Real Shopify revenue/expense data
 *    - isConnected: Whether Shopify is connected
 *    - loading: Loading state
 *    - error: Error messages
 *    - refetch: Manual refresh function
 * 
 * 3. Use financialData to display:
 *    - Total Revenue
 *    - Total Expenses
 *    - Net Profit
 *    - Monthly breakdown for charts
 * 
 * 4. The component automatically shows:
 *    - Warning if Shopify not connected
 *    - Loading state while fetching
 *    - Real data if connected
 *    - Demo data as fallback
 * 
 * 5. To use in your existing Dashboard:
 *    - Import the hook: import { useShopifyData } from "../hooks/useShopifyData";
 *    - Call it: const { financialData, isConnected, loading, error, refetch } = useShopifyData();
 *    - Replace hardcoded data with financialData values
 *    - Add loading and error states
 */
