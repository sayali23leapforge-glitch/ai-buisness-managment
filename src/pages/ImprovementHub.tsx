import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  QrCode, Sparkles, ReceiptText, Banknote, Link as LinkIcon,
  Users, CreditCard, Settings, Zap, Globe, Wifi, Users2, 
  Shield, BookOpen, Bell, TrendingUp
} from "lucide-react";
import TopBar from "../components/TopBar";
import "../styles/Dashboard.css";
import "../styles/ImprovementHub.css";

const improvements = [
  {
    title: "Multi-Currency Support",
    desc: "Handle transactions in multiple currencies with automatic conversion rates and regional pricing.",
    tag: "Pro",
    icon: Globe,
  },
  {
    title: "Offline-First Mode",
    desc: "Continue working without internet. Auto-sync when you're back online.",
    tag: "Pro",
    icon: Wifi,
  },
  {
    title: "Payroll Integration",
    desc: "Manage employee salaries, deductions, and generate payslips automatically.",
    tag: "Pro",
    icon: Users2,
  },
  {
    title: "Bank/API Integration",
    desc: "Connect EcoCash, Paystack, Flutterwave, and your bank for automatic transaction sync.",
    tag: "Pro",
    icon: LinkIcon,
  },
  {
    title: "Fraud/Anomaly Detection",
    desc: "AI-powered monitoring to detect unusual patterns and potential fraud in real-time.",
    tag: "Pro",
    icon: Shield,
  },
  {
    title: "Community & Learning Hub",
    desc: "Access tutorials, best practices, and connect with other business owners.",
    tag: "Coming Soon",
    icon: BookOpen,
  },
  {
    title: "Smart Notifications",
    desc: "Customizable alerts for low stock, upcoming payments, tax deadlines, and more.",
    tag: "Growth",
    icon: Bell,
  },
  {
    title: "Advanced Analytics",
    desc: "Deep dive into your business metrics with customizable dashboards and AI insights.",
    tag: "Growth",
    icon: TrendingUp,
  },
];

const ImprovementHub = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const sidebarNavRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (sidebarNavRef.current) {
      const activeItem = sidebarNavRef.current.querySelector(".nav-item.active");
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, []);

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

        <nav className="sidebar-nav" ref={sidebarNavRef}>
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={idx}
                to={makeRoute(item.label)}
                className={`nav-item ${item.label === "Improvement Hub" ? "active" : ""}`}
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
          <div className="improvement-hub-container">
          <div className="improvement-header">
            <h1>Improvements Hub</h1>
            <p>Explore powerful features designed to scale your business operations and streamline workflows.</p>
          </div>

          <div className="improvements-grid">
            {improvements.map((improvement, idx) => {
              const IconComponent = improvement.icon;
              return (
                <div key={idx} className="improvement-card">
                  <div className="card-header">
                    <div className="icon-wrapper">
                      <IconComponent size={28} className="improvement-icon" />
                    </div>
                    <span className={`badge ${improvement.tag.toLowerCase().replace(/\s+/g, '-')}`}>
                      {improvement.tag}
                    </span>
                  </div>

                  <h3>{improvement.title}</h3>
                  <p>{improvement.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="improvements-footer">
            <div className="upgrade-cta">
              <h2>Ready to unlock all features?</h2>
              <p>Upgrade to Pro and get access to all premium features including multi-currency support, offline mode, payroll, bank integrations, and advanced fraud detection.</p>
              <Link to="/billing-plan" className="upgrade-button">View Pricing Plans</Link>
            </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ImprovementHub;
