import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  QrCode, Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  ReceiptText, Banknote, LinkIcon, Users, CreditCard, Settings,
  Download, Share2, Printer, Zap, Sparkles
} from "lucide-react";
import TopBar from "../components/TopBar";
import "../styles/QRManager.css";

export default function QRManager() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("qr");
  const [products, setProducts] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("products") || "[]");
    setProducts(stored);
    
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
            const isActive = idx === 5;

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
          <h2 className="page-title">QR & Barcode Manager</h2>
          <p className="page-subtitle">Manage your QR codes and linked barcodes</p>

          {/* Tabs */}
          <div className="qr-tabs">
            <button
              className={activeTab === "qr" ? "tab active" : "tab"}
              onClick={() => setActiveTab("qr")}
            >
              <QrCode size={16} /> QR Codes
            </button>

            <button
              className={activeTab === "barcode" ? "tab active" : "tab"}
              onClick={() => setActiveTab("barcode")}
            >
              <span className="barcode-icon">|||</span> Linked Barcodes
            </button>
          </div>

          {/* SCAN BARCODE SECTION - ALWAYS VISIBLE */}
          {activeTab === "barcode" && !showScanner && (
            <div className="barcode-empty-state">
              <div className="barcode-icon-large">
                <QrCode size={48} color="#d4af37" />
              </div>
              <h3>Scan Barcode</h3>
              <p>Use your camera to scan existing barcodes from other businesses and link them to your products</p>
              <button 
                className="scan-btn-large"
                onClick={() => setShowScanner(true)}
              >
                <QrCode size={16} /> Open Scanner
              </button>
            </div>
          )}

          {/* SCANNER VIEW */}
          {activeTab === "barcode" && showScanner && (
            <div className="scanner-container">
              <div className="scanner-header">
                <h3>Camera Scanner</h3>
                <button 
                  className="close-scanner"
                  onClick={() => setShowScanner(false)}
                >
                  ✕
                </button>
              </div>
              <div className="scanner-view">
                <p>Camera access would be enabled here</p>
              </div>
              <button 
                className="cancel-scan-btn"
                onClick={() => setShowScanner(false)}
              >
                Cancel
              </button>
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="qr-grid">

            {products.length === 0 && (
              <div className="empty-state">No products found. Add a product first.</div>
            )}

            {activeTab === "qr" &&
              products.map((p: any) => (
                <div key={p.id} className="qr-card">

                  <div className="qr-card-header">
                    <span className="qr-product-name">{p.name}</span>
                    <span className="qr-small-icon">QR</span>
                  </div>

                  <div className="qr-code-box">
                    <QRCodeCanvas
                      value={p.qrCodeData || p.name}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#d4af37"
                      level="H"
                    />
                  </div>

                  <div className="qr-code-label">Code: {p.qrCodeData || p.name}</div>
                  <div className="qr-code-date">Generated: {new Date().toISOString().split('T')[0]}</div>

                  <div className="qr-actions">
                    <button className="action-btn" title="Download">
                      <Download size={16} />
                    </button>
                    <button className="action-btn" title="Share">
                      <Share2 size={16} />
                    </button>
                    <button className="action-btn" title="Print">
                      <Printer size={16} />
                    </button>
                  </div>
                </div>
              ))}

            {activeTab === "barcode" &&
              products.length === 0 ? (
                <div className="barcode-empty-state">
                  <div className="barcode-icon-large">
                    <QrCode size={48} color="#d4af37" />
                  </div>
                  <h3>Scan Barcode</h3>
                  <p>Use your camera to scan existing barcodes from other businesses and link them to your products</p>
                  <button className="scan-btn-large">
                    <QrCode size={16} /> Open Scanner
                  </button>
                </div>
              ) : (
                <div className="barcode-list">
                  {products.map((p: any) => (
                    <div key={p.id} className="barcode-item">
                      <div className="barcode-info">
                        <h4 className="barcode-product-name">{p.name}</h4>
                        <p className="barcode-code">{p.barcode || "No barcode linked"}</p>
                        <p className="barcode-date">Linked: {new Date().toISOString().split('T')[0]}</p>
                      </div>
                      <div className="barcode-actions">
                        <button className="barcode-action-btn">View</button>
                        <button className="barcode-action-btn">Unlink</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            

          </div>
        </div>
      </main>
    </div>
  );
}
