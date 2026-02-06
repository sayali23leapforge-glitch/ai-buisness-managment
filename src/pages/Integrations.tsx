import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  QrCode, Sparkles, ReceiptText, Banknote, Link as LinkIcon,
  Users, CreditCard, Settings, Zap, CheckCircle, Check, RefreshCw, Trash2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import ConnectShopify from "../components/ConnectShopify";
import ConnectQuickBooks from "../components/ConnectQuickBooks";
import { disconnectShopify } from "../utils/shopifyStore";
import { getQuickBooksCredentials, disconnectQuickBooks } from "../utils/quickbooksStore";
import { formatLastSyncTime } from "../utils/shopifySync";
import { syncAllQuickBooksData } from "../utils/quickbooksSync";
import { fetchShopifyStatus, syncShopifyToLocalStorageWithAuth } from "../utils/shopifyDataFetcher";
import "../styles/Dashboard.css";
import "../styles/Integrations.css";

// This will be populated with real sync history from actual syncs
let syncHistory: Array<{ app: string; action: string; status: string; time: string }> = [];

const integrationsList = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync products, orders, and inventory with your Shopify store",
    icon: ShoppingCart,
    connected: false,
    lastSync: "",
    category: "Connected",
    features: ["Product Sync", "Inventory Updates", "Order Import", "Customer Data"],
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Auto-sync financial data, invoices, and expenses",
    icon: ReceiptText,
    connected: false,
    lastSync: "",
    category: "Accounting",
    features: ["Financial Statements", "Expense Tracking", "Invoice Export", "Tax Reports"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Process payments and sync transaction data automatically",
    icon: CreditCard,
    connected: false,
    category: "Payments",
    features: [],
  },
  {
    id: "square",
    name: "Square",
    description: "Integrate POS sales and payment processing",
    icon: Banknote,
    connected: false,
    category: "Payments",
    features: [],
  },
];

const Integrations = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    const saved = localStorage.getItem("autoSyncEnabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [activeTab, setActiveTab] = useState("all");
  const sidebarNavRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyData, setShopifyData] = useState<{ shopName: string; lastSync: string } | null>(null);
  const [quickbooksConnected, setQuickbooksConnected] = useState(false);
  const [quickbooksData, setQuickbooksData] = useState<{ realmId: string; lastSync: string } | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showConnectQBModal, setShowConnectQBModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingQB, setSyncingQB] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [integrations, setIntegrations] = useState(integrationsList);

  // Save auto-sync preference to localStorage
  useEffect(() => {
    localStorage.setItem("autoSyncEnabled", JSON.stringify(autoSyncEnabled));
  }, [autoSyncEnabled]);

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

  useEffect(() => {
    if (sidebarNavRef.current) {
      const activeItem = sidebarNavRef.current.querySelector(".nav-item.active");
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    // Load user profile
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }

    // Load Shopify status if user is logged in
    if (user?.uid) {
      loadShopifyStatus();
      loadQuickBooksStatus();

      const params = new URLSearchParams(window.location.search);
      const shopifyParam = params.get("shopify");
      if (shopifyParam === "connected") {
        handleConnectShopifySuccess();
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [user?.uid]);

  const loadShopifyStatus = async () => {
    if (!user?.uid) return;
    const status = await fetchShopifyStatus();
    if (status?.connected) {
      const lastSyncValue = typeof status.lastSync === "number" ? status.lastSync : 0;
      setShopifyConnected(true);
      setShopifyData({
        shopName: status.shopName,
        lastSync: formatLastSyncTime(lastSyncValue),
      });
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === "shopify"
            ? {
                ...item,
                connected: true,
                lastSync: formatLastSyncTime(lastSyncValue),
              }
            : item
        )
      );
    } else {
      setShopifyConnected(false);
      setShopifyData(null);
    }
  };

  const loadQuickBooksStatus = async () => {
    if (!user?.uid) return;
    const credentials = await getQuickBooksCredentials(user.uid);
    if (credentials) {
      setQuickbooksConnected(true);
      setQuickbooksData({
        realmId: credentials.realmId,
        lastSync: formatLastSyncTime(credentials.lastSync),
      });
      // Update integrations state
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === "quickbooks"
            ? {
                ...item,
                connected: true,
                lastSync: formatLastSyncTime(credentials.lastSync),
              }
            : item
        )
      );
    }
  };

  const handleSyncShopify = async () => {
    if (!user?.uid) return;
    setSyncing(true);
    try {
      const syncResult = await syncShopifyToLocalStorageWithAuth();
      await loadShopifyStatus();

      const productCount = syncResult.success ? syncResult.productCount || 0 : 0;
      syncHistory.unshift({
        app: "Shopify",
        action: syncResult.success
          ? `Products synced - ${productCount} items`
          : "Sync failed",
        status: syncResult.success ? "Success" : "Failed",
        time: "just now",
      });
      if (syncHistory.length > 10) syncHistory.pop();
    } catch (error) {
      console.error("Sync failed:", error);
      syncHistory.unshift({
        app: "Shopify",
        action: "Sync failed",
        status: "Failed",
        time: "just now"
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectShopify = async () => {
    if (!user?.uid) return;
    if (confirm("Are you sure you want to disconnect Shopify?")) {
      try {
        await disconnectShopify(user.uid);
        setShopifyConnected(false);
        setShopifyData(null);
        
        // Clear localStorage Shopify data
        localStorage.removeItem("shopifyConnected");
        localStorage.removeItem("shopifyProducts");
        localStorage.removeItem("shopifySales");
        localStorage.removeItem("shopifyLastSyncTime");
        
        setIntegrations((prev) =>
          prev.map((item) =>
            item.id === "shopify"
              ? { ...item, connected: false, lastSync: "" }
              : item
          )
        );
      } catch (error) {
        console.error("Disconnect failed:", error);
      }
    }
  };

  const handleSyncQuickBooks = async () => {
    if (!user?.uid) return;
    setSyncingQB(true);
    try {
      const result = await syncAllQuickBooksData(user.uid);
      if (result.success) {
        loadQuickBooksStatus();
        
        // Add to sync history
        syncHistory.unshift({
          app: "QuickBooks",
          action: `Financial data synced`,
          status: "Success",
          time: "just now"
        });
        // Keep only last 10 syncs
        if (syncHistory.length > 10) syncHistory.pop();
      }
    } catch (error) {
      console.error("QB Sync failed:", error);
      syncHistory.unshift({
        app: "QuickBooks",
        action: "Sync failed",
        status: "Failed",
        time: "just now"
      });
    } finally {
      setSyncingQB(false);
    }
  };

  const handleDisconnectQuickBooks = async () => {
    if (!user?.uid) return;
    if (confirm("Are you sure you want to disconnect QuickBooks?")) {
      try {
        await disconnectQuickBooks(user.uid);
        setQuickbooksConnected(false);
        setQuickbooksData(null);
        setIntegrations((prev) =>
          prev.map((item) =>
            item.id === "quickbooks"
              ? { ...item, connected: false, lastSync: "" }
              : item
          )
        );
      } catch (error) {
        console.error("QB Disconnect failed:", error);
      }
    }
  };

  const handleConnectShopifySuccess = async () => {
    setShowConnectModal(false);
    localStorage.setItem("shopifyConnected", "true");
    await loadShopifyStatus();

    setTimeout(() => {
      navigate("/ai-insights");
    }, 1500);
  };

  const handleConnectQuickBooksSuccess = (realmId: string) => {
    setShowConnectQBModal(false);
    setQuickbooksData({
      realmId,
      lastSync: "Just now",
    });
    setQuickbooksConnected(true);
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === "quickbooks"
          ? {
              ...item,
              connected: true,
              lastSync: "Just now",
            }
          : item
      )
    );
  };

  const formatLastSyncTime = (timestamp: number): string => {
    if (timestamp === 0) return "Never";
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins === 0) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const makeRoute = (label: string) =>
    "/" +
    label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-").replace(/-/g, "-");

  const getFilteredIntegrations = () => {
    switch (activeTab) {
      case "connected":
        return integrations.filter(app => app.connected);
      case "ecommerce":
        return integrations.filter(app => app.category === "Connected");
      case "accounting":
        return integrations.filter(app => app.category === "Accounting");
      case "payments":
        return integrations.filter(app => app.category === "Payments");
      default:
        return integrations;
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo-icon">N</div>
          {sidebarOpen && <span className="company-name">Golden Goods Inc.</span>}
        </div>

        <nav className="sidebar-nav" ref={sidebarNavRef}>
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={idx}
                to={makeRoute(item.label)}
                className={`nav-item ${item.label === "Integrations" ? "active" : ""}`}
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
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="scrollable-content">
          <div className="integrations-container">
            {/* Header */}
            <div className="integrations-header">
              <h1>Integrations</h1>
              <p>Connect Nayance with your favorite business tools</p>
            </div>

            {/* Connected Apps Stats */}
            <div className="connected-stats">
              <div className="stat-card">
                <div className="stat-label">Connected Apps</div>
                <div className="stat-value">{integrations.filter(app => app.connected).length} of {integrations.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Auto-Sync</div>
                <div className="stat-toggle">
                  <input 
                    type="checkbox" 
                    id="auto-sync-toggle"
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  />
                  <label htmlFor="auto-sync-toggle"></label>
                  <span>{autoSyncEnabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Last Sync</div>
                <div className="stat-value">
                  {shopifyData?.lastSync ? shopifyData.lastSync : (quickbooksData?.lastSync ? quickbooksData.lastSync : "--")}
                </div>
              </div>
            </div>

            {/* AI-Powered Sync Engine */}
            <div className="sync-engine-info">
              <div className="engine-icon">⚙️</div>
              <div className="engine-content">
                <h3>AI-Powered Sync Engine Active</h3>
                <p>Nayance's AI continuously monitors your connected apps and intelligently syncs data to prevent duplicates, resolve conflicts, and ensure accuracy across all platforms.</p>
                <div className="engine-tags">
                  <span className="tag">Real-time Sync</span>
                  <span className="tag">Conflict Resolution</span>
                  <span className="tag">Smart Mapping</span>
                </div>
              </div>
            </div>

            {/* Integration Categories Tabs */}
            <div className="integration-tabs">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Apps
              </button>
              <button 
                className={`tab-btn ${activeTab === 'connected' ? 'active' : ''}`}
                onClick={() => setActiveTab('connected')}
              >
                Connected
              </button>
              <button 
                className={`tab-btn ${activeTab === 'ecommerce' ? 'active' : ''}`}
                onClick={() => setActiveTab('ecommerce')}
              >
                E-commerce
              </button>
              <button 
                className={`tab-btn ${activeTab === 'accounting' ? 'active' : ''}`}
                onClick={() => setActiveTab('accounting')}
              >
                Accounting
              </button>
              <button 
                className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                onClick={() => setActiveTab('payments')}
              >
                Payments
              </button>
            </div>

            {/* Integration Cards */}
            <div className="integration-cards-grid">
              {getFilteredIntegrations().map((integration) => {
                const IconComponent = integration.icon;

                // Special handling for Shopify card
                if (integration.id === "shopify") {
                  return (
                    <div
                      key={integration.id}
                      className={`integration-card ${
                        shopifyConnected ? "connected" : ""
                      }`}
                    >
                      <div className="card-icon">
                        <IconComponent size={32} />
                      </div>
                      <div className="card-header">
                        <h3>{integration.name}</h3>
                        {shopifyConnected && (
                          <span className="connected-badge">Connected</span>
                        )}
                      </div>
                      <p className="card-description">
                        {integration.description}
                      </p>
                      {shopifyConnected && shopifyData && (
                        <>
                          <div className="card-shopify-info">
                            <div className="shopify-store-name">
                              <strong>Store:</strong> {shopifyData.shopName}
                            </div>
                            <div className="card-sync-info">
                              Last sync: {shopifyData.lastSync}
                            </div>
                          </div>
                          <div className="card-shopify-actions">
                            <button
                              className="card-btn sync-btn"
                              onClick={handleSyncShopify}
                              disabled={syncing}
                            >
                              <RefreshCw
                                size={14}
                                className={syncing ? "spinning" : ""}
                              />
                              {syncing ? "Syncing..." : "Re-sync"}
                            </button>
                            <button
                              className="card-btn disconnect-btn"
                              onClick={handleDisconnectShopify}
                            >
                              <Trash2 size={14} />
                              Disconnect
                            </button>
                          </div>
                        </>
                      )}
                      {!shopifyConnected && (
                        <>
                          {integration.features && integration.features.length > 0 && (
                            <div className="card-features">
                              <div className="card-features-label">
                                Features:
                              </div>
                              <ul>
                                {integration.features.map((feature, idx) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            className="card-btn connect"
                            onClick={() => setShowConnectModal(true)}
                          >
                            Connect
                          </button>
                        </>
                      )}
                    </div>
                  );
                }

                // Special handling for QuickBooks card
                if (integration.id === "quickbooks") {
                  return (
                    <div
                      key={integration.id}
                      className={`integration-card ${
                        quickbooksConnected ? "connected" : ""
                      }`}
                    >
                      <div className="card-icon">
                        <IconComponent size={32} />
                      </div>
                      <div className="card-header">
                        <h3>{integration.name}</h3>
                        {quickbooksConnected && (
                          <span className="connected-badge">Connected</span>
                        )}
                      </div>
                      <p className="card-description">
                        {integration.description}
                      </p>
                      {quickbooksConnected && quickbooksData && (
                        <>
                          <div className="card-qb-info">
                            <div className="qb-realm-id">
                              <strong>Realm ID:</strong> {quickbooksData.realmId}
                            </div>
                            <div className="card-sync-info">
                              Last sync: {quickbooksData.lastSync}
                            </div>
                          </div>
                          <div className="card-qb-actions">
                            <button
                              className="card-btn sync-btn"
                              onClick={handleSyncQuickBooks}
                              disabled={syncingQB}
                            >
                              <RefreshCw
                                size={14}
                                className={syncingQB ? "spinning" : ""}
                              />
                              {syncingQB ? "Syncing..." : "Re-sync"}
                            </button>
                            <button
                              className="card-btn disconnect-btn"
                              onClick={handleDisconnectQuickBooks}
                            >
                              <Trash2 size={14} />
                              Disconnect
                            </button>
                          </div>
                        </>
                      )}
                      {!quickbooksConnected && (
                        <>
                          {integration.features && integration.features.length > 0 && (
                            <div className="card-features">
                              <div className="card-features-label">
                                Features:
                              </div>
                              <ul>
                                {integration.features.map((feature, idx) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            className="card-btn connect"
                            onClick={() => setShowConnectQBModal(true)}
                          >
                            Connect
                          </button>
                        </>
                      )}
                    </div>
                  );
                }

                // Standard card for other integrations
                return (
                  <div
                    key={integration.id}
                    className={`integration-card ${
                      integration.connected ? "connected" : ""
                    }`}
                  >
                    <div className="card-icon">
                      <IconComponent size={32} />
                    </div>
                    <div className="card-header">
                      <h3>{integration.name}</h3>
                      {integration.connected && (
                        <span className="connected-badge">Connected</span>
                      )}
                    </div>
                    <p className="card-description">
                      {integration.description}
                    </p>
                    {integration.connected && (
                      <div className="card-sync-info">
                        Last sync: {integration.lastSync}
                      </div>
                    )}
                    {integration.features && integration.features.length > 0 && (
                      <div className="card-features">
                        <div className="card-features-label">Features:</div>
                        <ul>
                          {integration.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      className={`card-btn ${
                        integration.connected ? "configure" : "connect"
                      }`}
                    >
                      {integration.connected ? (
                        <>
                          <Check size={16} /> Configure
                        </>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sync History Section */}
            <div className="sync-history-section">
              <div className="sync-history-header">
                <div>
                  <h1>Sync History</h1>
                  <p>Recent synchronization activity</p>
                </div>
              </div>

              <div className="sync-history-list">
                {syncHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
                    <div>No sync history yet. Connect an app and sync to see activity.</div>
                  </div>
                ) : (
                  syncHistory.map((item, idx) => (
                    <div key={idx} className="sync-history-item">
                      <div className="sync-item-icon">
                        <CheckCircle size={20} className="sync-success-icon" />
                      </div>
                      <div className="sync-item-content">
                        <h4>{item.app}</h4>
                        <p>{item.action}</p>
                      </div>
                      <div className="sync-item-status">
                        <span className="status-badge">{item.status}</span>
                        <span className="sync-time">{item.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sync Preferences Section */}
            <div className="sync-preferences-section">
              <h2>Sync Preferences</h2>
              <p>Control how and when data is synchronized</p>

              <div className="preferences-item">
                <div className="preference-content">
                  <h4>Automatic Sync</h4>
                  <p>Sync data automatically in real-time</p>
                </div>
                <div className="toggle-switch">
                  <input type="checkbox" defaultChecked id="auto-sync" />
                  <label htmlFor="auto-sync"></label>
                </div>
              </div>

              <div className="preferences-item">
                <div className="preference-content">
                  <h4>Conflict Resolution</h4>
                  <p>Let AI resolve data conflicts automatically</p>
                </div>
                <div className="toggle-switch">
                  <input type="checkbox" defaultChecked id="conflict" />
                  <label htmlFor="conflict"></label>
                </div>
              </div>

              <div className="preferences-item">
                <div className="preference-content">
                  <h4>Sync Notifications</h4>
                  <p>Get notified when sync completes or fails</p>
                </div>
                <div className="toggle-switch">
                  <input type="checkbox" defaultChecked id="notifications" />
                  <label htmlFor="notifications"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Connect Shopify Modal */}
      <ConnectShopify
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectShopifySuccess}
      />

      {/* Connect QuickBooks Modal */}
      <ConnectQuickBooks
        isOpen={showConnectQBModal}
        onClose={() => setShowConnectQBModal(false)}
        onSuccess={() => {
          handleConnectQuickBooksSuccess("QB_REALM_ID");
        }}
      />
    </div>
  );
};

export default Integrations;
