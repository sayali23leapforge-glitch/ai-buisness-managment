import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package, AlertTriangle, Sparkles, LineChart, Barcode, Plus, 
  ShoppingCart, Wallet, Boxes, BarChart2, PlusSquare,
  QrCode, ReceiptText, Banknote, LinkIcon, Users, CreditCard, Settings, Zap
} from "lucide-react";

import TopBar from "../components/TopBar";
import { getProducts, Product } from "../utils/localProductStore";
import { 
  isShopifyConnected, 
  getShopifyProductsFromStorage 
} from "../utils/shopifyDataFetcher";
import "../styles/InventoryDashboard.css";
import { ResponsiveContainer, LineChart as ReLineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

export default function InventoryDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("Owner (Full Access)");
  const [products, setProducts] = useState<Product[]>([]);

  // Load products on mount - Show ONLY Shopify products when connected
  useEffect(() => {
    let allProducts: Product[] = [];

    // Check if Shopify is connected
    if (isShopifyConnected()) {
      const shopifyProducts = getShopifyProductsFromStorage();
      if (shopifyProducts && shopifyProducts.length > 0) {
        console.log("📦 Showing Shopify products in Inventory Dashboard:", shopifyProducts.length);
        allProducts = shopifyProducts;
      }
    } else {
      // When Shopify not connected, show nothing
      console.log("❌ Shopify not connected - no products to show");
      allProducts = [];
    }

    setProducts(allProducts);
    
    // Load user profile
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) setUserProfile(JSON.parse(storedProfile));
  }, []);

  // Listen for Shopify connection/disconnection and local product changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "shopifyConnected" || e.key === "shopifyProducts") {
        console.log("🔄 Shopify connection changed in Inventory Dashboard, reloading");
        let allProducts: Product[] = [];

        if (isShopifyConnected()) {
          const shopifyProducts = getShopifyProductsFromStorage();
          if (shopifyProducts && shopifyProducts.length > 0) {
            allProducts = shopifyProducts;
          }
        }

        setProducts(allProducts);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  // Auto-route generator
  const makeRoute = (label: string) =>
    "/" +
    label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-").replace(/-/g, "-");

  // Calculate real data from products
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock < 10).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  
  // Group products by category for chart
  const categoryMap = new Map<string, number>();
  products.forEach(p => {
    const category = p.category || "Uncategorized";
    categoryMap.set(category, (categoryMap.get(category) || 0) + p.stock);
  });
  let categoryData = Array.from(categoryMap).map(([name, value]) => ({ name, value }));
  
  // If no data, show placeholder
  if (categoryData.length === 0) {
    categoryData = [{ name: "No products", value: 0 }];
  }
  
  console.log("📊 Category Data for chart:", { totalProducts, categoryData, rawData: categoryMap });

  // Demo sales trend (this could be pulled from sales history)
  const salesTrend = [
    { day: "Mon", value: 50 },
    { day: "Tue", value: 55 },
    { day: "Wed", value: 60 },
    { day: "Thu", value: 48 },
    { day: "Fri", value: 75 },
    { day: "Sat", value: 90 },
    { day: "Sun", value: 65 }
  ];

  // Recent transactions from products (show recently added/modified products)
  const recentTransactions = products.slice(-3).reverse().map((p, i) => ({
    id: i,
    name: p.name,
    time: "Recently added",
    amount: `+$${(p.price * p.stock).toFixed(2)}`
  }));

  const connectedApps = [
    { id: 1, name: "Shopify", time: "Synced 2 min ago", status: "Active", color: "#96C34A" },
    { id: 2, name: "QuickBooks", time: "Synced 15 min ago", status: "Active", color: "#5CB85C" },
    { id: 3, name: "Stripe", time: "Not connected", status: "Disconnected", color: "#5469D4" },
  ];

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
                className={`nav-item ${idx === 1 ? "active" : ""}`}
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

      {/* HEADER */}
      <div className="inv-header">
        <div>
          <h2>Welcome to Nayance</h2>
          <p>Manage your inventory and business operations</p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="inv-action-row">
        <button className="gold-btn"><ShoppingCart size={18}/> Record Sale</button>
        <Link to="/qr-&-barcodes" className="dark-btn" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Barcode size={18}/> Scan Code
        </Link>
        <Link to="/add-product" className="dark-btn" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Plus size={18}/> Add Product
        </Link>
        <Link to="/finance-overview" className="dark-btn" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <LineChart size={18}/> View Reports
        </Link>
      </div>

      {/* SUMMARY CARDS */}
      <div className="inv-summary-grid">
        
        <div className="inv-card">
          <div className="inv-card-top">
            <h4>Total Products</h4>
            <Package size={18}/>
          </div>
          <div className="inv-card-value">{totalProducts}</div>
          <div className="inv-card-change positive">in inventory</div>
        </div>

        <div className="inv-card">
          <div className="inv-card-top">
            <h4>Items Low Stock</h4>
            <AlertTriangle size={18} color="#d4af37"/>
          </div>
          <div className="inv-card-value red">{lowStockItems}</div>
          <div className="inv-card-change red">{lowStockItems > 0 ? 'Requires attention' : 'All stocked!'}</div>
        </div>

        <div className="inv-card">
          <div className="inv-card-top">
            <h4>Inventory Value</h4>
            <Sparkles size={18}/>
          </div>
          <div className="inv-card-value">${totalInventoryValue.toFixed(0)}</div>
          <div className="inv-card-change link">View breakdown</div>
        </div>

        <div className="inv-card">
          <div className="inv-card-top">
            <h4>Total SKUs</h4>
            <LineChart size={18}/>
          </div>
          <div className="inv-card-value">{products.length}</div>
          <div className="inv-card-change positive">products tracked</div>
        </div>

      </div>

      {/* SALES TRENDS */}
      <div className="inv-charts-container">
        
        <div className="inv-chart-large">
          <h3>Sales Trends</h3>

          <ResponsiveContainer width="100%" height={250}>
            <ReLineChart data={salesTrend}>
              <CartesianGrid stroke="#222"/>
              <XAxis dataKey="day" stroke="#aaa"/>
              <YAxis stroke="#aaa"/>
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333"}}/>
              <Line type="monotone" dataKey="value" stroke="#d4af37" strokeWidth={2}/>
            </ReLineChart>
          </ResponsiveContainer>

        </div>

        <div className="inv-chart-small">
          <h3>Inventory by Category</h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid stroke="#222"/>
              <XAxis dataKey="name" stroke="#aaa"/>
              <YAxis stroke="#aaa"/>
              <Bar dataKey="value" fill="#d4af37" />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* RECENT TRANSACTIONS & CONNECTED APPS */}
      <div className="inv-bottom-section">
        
        {/* Recent Transactions */}
        <div className="inv-recent-transactions">
          <div className="inv-section-header">
            <h3>Recent Transactions</h3>
            <a href="#" className="view-all-link">View All →</a>
          </div>

          <div className="inv-transactions-list">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="inv-transaction-item">
                <div className="transaction-icon">
                  <ShoppingCart size={20} />
                </div>
                <div className="transaction-info">
                  <div className="transaction-name">{transaction.name}</div>
                  <div className="transaction-time">{transaction.time}</div>
                </div>
                <div className="transaction-amount">{transaction.amount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Apps */}
        <div className="inv-connected-apps">
          <div className="inv-section-header">
            <h3>Connected Apps</h3>
            <Link to="/integrations" className="manage-link" style={{textDecoration: 'none'}}>Manage →</Link>
          </div>

          <div className="inv-apps-list">
            {connectedApps.map((app) => (
              <div key={app.id} className="inv-app-item">
                <div className="app-icon" style={{ background: app.color + "20" }}>
                  <div style={{ width: 20, height: 20, background: app.color, borderRadius: 4 }}></div>
                </div>
                <div className="app-info">
                  <div className="app-name">{app.name}</div>
                  <div className="app-time">{app.time}</div>
                </div>
                <div className={`app-status ${app.status.toLowerCase().replace(" ", "-")}`}>
                  {app.status === "Active" ? (
                    <span className="status-active">● {app.status}</span>
                  ) : (
                    <span className="status-disconnected">{app.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
        </div>

      </main>
    </div>
  );
}
