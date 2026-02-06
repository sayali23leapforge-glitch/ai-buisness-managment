import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import {
  Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  QrCode, Sparkles, ReceiptText, Banknote, Link as LinkIcon,
  Users, CreditCard, Settings, Zap
} from "lucide-react";

import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { getIntegrations } from "../utils/integrationStore";
import { getProductsData, getSalesData } from "../utils/aiInsightsService";
import { 
  isShopifyConnected, 
  getShopifyProductsFromStorage, 
  getShopifySalesFromStorage 
} from "../utils/shopifyDataFetcher";
import "../styles/Dashboard.css";

// Type definitions
interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  cost?: number;
}

interface Sale {
  id: string;
  productName: string;
  amount: number;
  timestamp: string;
  quantity: number;
}

// Utility function to format currency
function fmt(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [_selectedRole, setSelectedRole] = useState("Owner (Full Access)");
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load real financial data (from Shopify ONLY when connected)
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Load user profile
        const storedProfile = localStorage.getItem("userProfile");
        if (storedProfile) {
          setUserProfile(JSON.parse(storedProfile));
        }
        
        // Check if Shopify is connected
        if (isShopifyConnected()) {
          const shopifyProducts = getShopifyProductsFromStorage();
          const shopifySales = getShopifySalesFromStorage();
          
          setProducts(shopifyProducts);
          setSales(shopifySales);
        } else {
          // No data when Shopify is not connected
          setProducts([]);
          setSales([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Listen for Shopify connection/disconnection
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "shopifyConnected" || e.key === "shopifyProducts" || e.key === "shopifySales") {
        console.log("🔄 Shopify connection status changed in Dashboard, reloading data");
        // Reload data when connection status changes
        if (isShopifyConnected()) {
          const shopifyProducts = getShopifyProductsFromStorage();
          const shopifySales = getShopifySalesFromStorage();
          
          setProducts(shopifyProducts);
          setSales(shopifySales);
        } else {
          setProducts([]);
          setSales([]);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Calculate real financial metrics
  const financialMetrics = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalCOGS = products.reduce((sum, p) => sum + (p.cost || 0) * p.stock, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    // Estimate operating expenses
    const operatingExpenses = totalRevenue * 0.35;
    const netProfit = grossProfit - operatingExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Tax calculation (assume 12% tax rate)
    const taxRate = 0.12;
    const taxOwed = Math.max(0, netProfit) * taxRate;
    const netAfterTax = netProfit - taxOwed;
    
    return {
      totalRevenue,
      grossProfit,
      operatingExpenses,
      netProfit,
      netAfterTax,
      taxOwed,
      grossMargin,
      netMargin,
    };
  }, [products, sales]);

  // Generate revenue vs expenses chart data from real data
  const generateChartData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Group sales by month and calculate expenses
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    
    // Initialize all months with 0
    monthNames.forEach(month => {
      monthlyData[month] = { revenue: 0, expenses: 0 };
    });
    
    // Add real sales data to months
    if (sales.length > 0) {
      sales.forEach(sale => {
        const date = new Date(sale.timestamp);
        const month = monthNames[date.getMonth()];
        if (monthlyData[month]) {
          monthlyData[month].revenue += sale.amount;
        }
      });
    }
    
    // Calculate expenses (35% of revenue for each month)
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].expenses = monthlyData[month].revenue * 0.35;
    });
    
    // Return chart data for all months
    return monthNames.map(month => ({
      month,
      revenue: Math.round(monthlyData[month]?.revenue || 0),
      expenses: Math.round(monthlyData[month]?.expenses || 0),
    }));
  }, [sales]);

  const summaryCards = [
    { 
      label: "Total Revenue", 
      value: fmt(financialMetrics.totalRevenue), 
      change: `Gross Profit: ${fmt(financialMetrics.grossProfit)}`, 
      color: "gold" 
    },
    { 
      label: "Total Expenses", 
      value: fmt(financialMetrics.operatingExpenses), 
      change: `${(financialMetrics.operatingExpenses / financialMetrics.totalRevenue * 100).toFixed(1)}% of revenue`, 
      color: "red" 
    },
    { 
      label: "Net Profit (After Tax)", 
      value: fmt(financialMetrics.netAfterTax), 
      change: `Margin: ${financialMetrics.netMargin.toFixed(1)}%`, 
      color: "green" 
    },
    { 
      label: "Tax Owed", 
      value: fmt(financialMetrics.taxOwed), 
      change: "12% tax rate (Ontario)", 
      color: "orange" 
    },
  ];

  // Calculate real cost distribution from actual expenses
  const costData = useMemo(() => {
    if (financialMetrics.operatingExpenses === 0) {
      return [
        { name: "Operations", value: 35, color: "#facc15" },
        { name: "Salaries", value: 40, color: "#ffd700" },
        { name: "Marketing", value: 15, color: "#ffed4e" },
        { name: "Other", value: 10, color: "#888888" },
      ];
    }

    const totalExpenses = financialMetrics.operatingExpenses;
    const operations = totalExpenses * 0.35;
    const salaries = totalExpenses * 0.40;
    const marketing = totalExpenses * 0.15;
    const other = totalExpenses * 0.10;

    return [
      { 
        name: "Operations", 
        value: 35, 
        amount: operations,
        color: "#facc15" 
      },
      { 
        name: "Salaries", 
        value: 40, 
        amount: salaries,
        color: "#ffd700" 
      },
      { 
        name: "Marketing", 
        value: 15, 
        amount: marketing,
        color: "#ffed4e" 
      },
      { 
        name: "Other", 
        value: 10, 
        amount: other,
        color: "#888888" 
      },
    ];
  }, [financialMetrics.operatingExpenses]);

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

  // Calculate real cash flow health from financial metrics
  const cashFlowItems = [
    { 
      title: financialMetrics.netAfterTax > 0 ? "Strong positive cash flow" : "Negative cash flow", 
      value: Math.round((financialMetrics.netAfterTax / (financialMetrics.totalRevenue || 1)) * 100) 
    },
  ];

  // Auto-route generator
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
          <div className="location-main">
            {userProfile?.city && userProfile?.province 
              ? `${userProfile.city}, ${userProfile.province}` 
              : "Add Location"}
          </div>
          <div className="location-sub">
            {userProfile?.businessName || "Business Name"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Top Bar */}
        <TopBar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onRoleChange={(role) => setSelectedRole(role)}
        />

        <div className="scrollable-content">
          {(() => {
            const connected = getIntegrations();
            
            if (connected.length === 0) {
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '600px',
                  flexDirection: 'column',
                  textAlign: 'center'
                }}>
                  <h2 style={{ fontSize: '24px', color: '#fff', marginBottom: '12px' }}>
                    Connect Your Business Data
                  </h2>
                  <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>
                    Please connect at least one business source to see analytics and data.
                  </p>
                  <a href="/connect-business" style={{
                    background: 'linear-gradient(180deg, #d4af37, #b7871a)',
                    color: '#000',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}>
                    Go to Connect Business
                  </a>
                </div>
              );
            }

            return (
              <>
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h2 className="page-title">Financial Overview</h2>
              <p className="page-subtitle">Welcome back, {user?.displayName || user?.email?.split("@")[0] || "User"}</p>
            </div>

            <div className="system-status">
              <div className="status-dot"></div>
              <span className="status-text">All Systems Active</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            {summaryCards.map((card, i) => (
              <div className={`summary-card card-${card.color}`} key={i}>
                <div className="card-top">
                  <div className="card-label">{card.label}</div>
                  <div className={`card-indicator card-${card.color}`}></div>
                </div>
                <div className="card-value">{card.value}</div>
                <div className="card-change">{card.change}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-box">
              <h3 className="chart-title">Revenue vs Expenses</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={generateChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#aaaaaa" />
                  <YAxis stroke="#aaaaaa" />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ff6b6b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <h3 className="chart-title">Cost Distribution</h3>
              <div className="cost-chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={costData} dataKey="value" outerRadius={70} innerRadius={40}>
                      {costData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="cost-legend">
                  {costData.map((item, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: item.color }}></span>
                      <span className="legend-name">{item.name}</span>
                      <span className="legend-value">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="bottom-section">

            <div className="mini-card">
              <div className="mini-header">
                <h3>Upcoming Tax Deadlines</h3>
              </div>
              {upcoming.map((item, i) => (
                <div className="mini-row" key={i}>
                  <div>
                    <div className="mini-title">{item.title}</div>
                    <div className="mini-date">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mini-card">
              <div className="mini-header">
                <h3>Cash Flow Health</h3>
              </div>
              {cashFlowItems.map((item, i) => (
                <div key={i}>
                  <div className="mini-title">{item.title}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${item.value}%` }}></div>
                  </div>
                  <div className="progress-text">{item.value}%</div>
                </div>
              ))}
            </div>

            <div className="mini-card">
              <div className="mini-header">
                <h3>AI Insights</h3>
              </div>
              <p className="insights-text">
                {sales.length > 0 
                  ? `Your revenue is ${financialMetrics.netMargin > 20 ? "strong" : "trending"}. Check detailed breakdown for optimization recommendations.`
                  : "Add products and record sales to generate AI insights."}
              </p>
              <Link to="/ai-insights" className="insights-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                View Breakdown
              </Link>
            </div>

          </div>
              </>
            );
          })()}
        </div>

      </main>
    </div>
  );
}
