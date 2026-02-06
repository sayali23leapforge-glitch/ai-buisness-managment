import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  QrCode, Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  ReceiptText, Banknote, LinkIcon, Users, CreditCard, Settings,
  TrendingUp, BarChart3, Lightbulb, Sparkles, Zap
} from "lucide-react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { getAIInsights, AIInsight } from "../utils/aiInsightsService";
import { isShopifyConnected } from "../utils/shopifyDataFetcher";
import "../styles/AIInsights.css";

type Insight = AIInsight;

// No fallback insights - only real data from API is displayed
const EMPTY_INSIGHTS: Insight[] = [];

export default function AIInsights() {
  const [selected, setSelected] = useState<Insight | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) setUserProfile(JSON.parse(storedProfile));
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

  // Load AI insights from REAL DATA ONLY
  useEffect(() => {
    const loadInsights = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("🚀 Loading AI insights for user:", user.uid);
        
        // Always check fresh connection status
        const isConnected = localStorage.getItem("shopifyConnected") === "true";
        console.log("📡 Fresh Shopify connected check:", isConnected);
        setShopifyConnected(isConnected);
        
        const aiInsights = await getAIInsights(user.uid);
        
        if (aiInsights.length > 0) {
          console.log(`✅ Loaded ${aiInsights.length} real AI insights`);
          setInsights(aiInsights);
          setError(null);
        } else {
          console.warn("⚠️ No real insights generated from data");
          setInsights([]);
          if (!isConnected) {
            setError("No insights available. Add products and record sales to generate insights.");
          }
        }
      } catch (err) {
        console.error("❌ Error loading AI insights:", err);
        setError("Failed to generate insights from real data.");
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();

    // Poll for Shopify connection every 1 second for more responsive updates
    const pollInterval = setInterval(() => {
      const currentStatus = localStorage.getItem("shopifyConnected") === "true";
      setShopifyConnected(prevStatus => {
        if (currentStatus !== prevStatus) {
          console.log("📡 Shopify status changed to:", currentStatus);
          loadInsights();
        }
        return currentStatus;
      });
    }, 1000);

    // Also listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "shopifyConnected" || e.key === "shopifyProducts") {
        console.log("📡 Storage change detected:", e.key, e.newValue);
        setTimeout(() => loadInsights(), 100);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, forceRefresh]);

  const makeRoute = (label: string) =>
    "/" +
    label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-").replace(/-/g, "-");

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h1 className="logo-text">AIPM</h1>
        </div>

        <nav className="nav-menu">
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = idx === 6;

            return (
              <Link
                key={idx}
                to={makeRoute(item.label)}
                className={`nav-item ${isActive ? "active" : ""}`}
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
        />

        <div className="scrollable-content">
          <div className="ai-page">
      <div className="ai-header">
        <div>
          <h2>AI Insights</h2>
          <p className="ai-sub">Smart recommendations powered by AI analysis</p>
        </div>

        <div className="ai-badge">
          <Sparkles size={14} color="#d4af37" />
          <span>{loading ? "Loading..." : `${insights.length} New`}</span>
        </div>
      </div>

      {error && (
        <div style={{ 
          background: "#e0f2fe", 
          border: "1px solid #0ea5e9", 
          borderRadius: "8px", 
          padding: "12px 16px", 
          marginBottom: "16px",
          color: "#0369a1",
          fontSize: "14px"
        }}>
          ℹ️ {error} <br />
          <Link to="/integrations" style={{ color: "#0369a1", textDecoration: "underline", fontWeight: "bold" }}>
            Connect Shopify →
          </Link>
        </div>
      )}



      {loading && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px",
          color: "#888"
        }}>
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>Generating AI insights...</div>
          <div style={{ fontSize: "14px" }}>Analyzing your business data with OpenAI</div>
        </div>
      )}

      {/* AI ANALYSIS ACTIVE */}
      <div className="ai-active-card">
        <div className="ai-active-left">
          <div className="ai-active-icon">✨</div>
          <div>
            <div className="ai-active-title">AI Analysis Active</div>
            <div className="ai-active-desc">
              Your inventory is being monitored 24/7 for optimization opportunities
            </div>
          </div>
        </div>
        <div className="ai-active-right">
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "94%" }} />
            </div>
            <div className="progress-value">94%</div>
          </div>
        </div>
      </div>

      {/* INSIGHT CARDS */}
      <div className="insights-list">
        {!loading && insights.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#666",
            fontSize: "16px"
          }}>
            <div style={{ marginBottom: "20px", fontSize: "48px" }}>📊</div>
            <div style={{ marginBottom: "10px", fontSize: "18px", fontWeight: 600 }}>No AI Insights Available</div>
            <div style={{ marginBottom: "20px" }}>Connect Shopify or record your first sale to generate AI-powered recommendations</div>
            {!shopifyConnected && (
              <Link to="/integrations" style={{ 
                color: "#0ea5e9", 
                textDecoration: "underline", 
                fontWeight: "bold",
                fontSize: "14px"
              }}>
                Connect Shopify →
              </Link>
            )}
          </div>
        )}

        {!loading && insights.map((ins) => (
          <div className="insight-card" key={ins.id} style={ins.category === "financial" ? { borderLeft: `4px solid ${ins.levelColor}` } : {}}>
            <div className="insight-top">
              <div className="insight-icon">{ins.icon}</div>
              <div className="insight-title">{ins.title}</div>
              <div
                className="insight-pill"
                style={{ background: `${ins.levelColor}22`, color: ins.levelColor }}
              >
                {ins.level}
              </div>
            </div>

            <div className="insight-body">
              <p>{ins.description}</p>

              {/* Financial Breakdown Display */}
              {ins.breakdown && ins.breakdown.length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #333" }}>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px", textTransform: "uppercase", fontWeight: 600 }}>
                    Financial Breakdown
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {ins.breakdown.map((item, idx) => (
                      <div key={idx} style={{ background: "#1a1a1a", padding: "10px", borderRadius: "6px", border: "1px solid #222" }}>
                        <div style={{ fontSize: "12px", color: "#888" }}>{item.label}</div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginTop: "4px" }}>
                          ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        {item.percentage !== undefined && (
                          <div style={{ fontSize: "11px", color: "#d4af37", marginTop: "4px" }}>
                            {item.percentage.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Details - Predictions and Actions */}
            {expandedId === ins.id && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #333" }}>
                {ins.predictions && ins.predictions.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                      Predictions ({ins.predictions.length})
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "20px", listStyle: "disc" }}>
                      {ins.predictions.map((pred, idx) => (
                        <li key={idx} style={{ fontSize: "13px", color: "#ccc", marginBottom: "6px", lineHeight: "1.4" }}>
                          {pred}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ins.actionsTaken && ins.actionsTaken.length > 0 && (
                  <div>
                    <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                      Actions Taken ({ins.actionsTaken.length})
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "20px", listStyle: "disc" }}>
                      {ins.actionsTaken.map((action, idx) => (
                        <li key={idx} style={{ fontSize: "13px", color: "#ccc", marginBottom: "6px", lineHeight: "1.4" }}>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="insight-footer">
              <div className="insight-meta">
                <span className="meta-dot" />
                <span className="meta-text">Confidence: {ins.confidence}%</span>
                <span className="meta-sep">•</span>
                <span className="meta-text">{ins.category}</span>
              </div>

              <button
                className="view-details"
                onClick={() => setExpandedId(expandedId === ins.id ? null : ins.id)}
              >
                {expandedId === ins.id ? "Hide Details ↑" : "View Details →"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* STATS CARDS */}
      <div className="ai-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon optimization">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="stat-card-label">Optimization Score</div>
          <div className="stat-card-value">
            {insights.length > 0 
              ? `${Math.round(insights.reduce((sum, ins) => sum + (ins.optimizationScore || 0), 0) / insights.length)}/100`
              : "N/A"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon predictions">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="stat-card-label">Predictions Made</div>
          <div className="stat-card-value">
            {insights.reduce((count, ins) => count + (ins.predictions?.length || 0), 0)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon actions">
              <Lightbulb size={24} />
            </div>
          </div>
          <div className="stat-card-label">Actions Taken</div>
          <div className="stat-card-value">
            {insights.reduce((count, ins) => count + (ins.actionsTaken?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selected && (
        <div
          className="insight-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="insight-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>{selected.title}</h3>
              <div
                className="modal-badge"
                style={{ background: `${selected.levelColor}22`, color: selected.levelColor }}
              >
                {selected.level}
              </div>
            </div>

            <div className="modal-body">
              <p className="modal-desc">{selected.details}</p>

              {/* Optimization Score */}
              {selected.optimizationScore !== undefined && (
                <div style={{ marginTop: "20px", padding: "16px", background: "#1a1a1a", borderRadius: "8px", border: "1px solid #222" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#d4af37" }}>Optimization Score</h4>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#10b981" }}>
                    {selected.optimizationScore}/100
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    {selected.optimizationScore > 80 ? "Excellent optimization" : selected.optimizationScore > 60 ? "Good optimization" : "Needs improvement"}
                  </div>
                </div>
              )}

              {/* Financial Breakdown in Modal */}
              {selected.breakdown && selected.breakdown.length > 0 && (
                <div style={{ marginTop: "20px", padding: "16px", background: "#1a1a1a", borderRadius: "8px", border: "1px solid #222" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#d4af37" }}>Financial Breakdown</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {selected.breakdown.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #222" }}>
                        <div style={{ fontSize: "13px", color: "#aaa" }}>{item.label}</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                          ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predictions */}
              {selected.predictions && selected.predictions.length > 0 && (
                <div style={{ marginTop: "20px", padding: "16px", background: "#1a1a1a", borderRadius: "8px", border: "1px solid #222" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#d4af37" }}>📈 Predictions</h4>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {selected.predictions.map((pred, idx) => (
                      <li key={idx} style={{ fontSize: "13px", color: "#aaa", marginBottom: "8px", paddingLeft: "16px", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: "#d4af37" }}>→</span>
                        {pred}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions Taken */}
              {selected.actionsTaken && selected.actionsTaken.length > 0 && (
                <div style={{ marginTop: "20px", padding: "16px", background: "#1a1a1a", borderRadius: "8px", border: "1px solid #222" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#d4af37" }}>✅ Actions Taken</h4>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {selected.actionsTaken.map((action, idx) => (
                      <li key={idx} style={{ fontSize: "13px", color: "#aaa", marginBottom: "8px", paddingLeft: "16px", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: "#10b981" }}>✓</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-stats">
                <div>
                  <div className="stat-label">Confidence</div>
                  <div className="stat-value">{selected.confidence}%</div>
                </div>

                <div>
                  <div className="stat-label">Recommended action</div>
                  <div className="stat-value">Review & Optimize</div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelected(null)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => {
                // placeholder action — you can hook this to reorder flow
                alert("Open reorder workflow (not implemented)");
              }}>
                Take Action
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </main>
    </div>
  );
}
