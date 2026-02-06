import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  QrCode, Sparkles, ReceiptText, Banknote, Link as LinkIcon,
  Users, CreditCard, Settings, Zap, Check, X
} from "lucide-react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import "../styles/BillingPlan.css";

// TODO: Replace with client's Stripe API keys - Real Stripe integration
// const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
// const STRIPE_PRICE_GROWTH_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_GROWTH_MONTHLY || "";

// MOCK: Temporary mock functions for development
const createMockCheckoutSession = async (
  priceId: string,
  email?: string | null
): Promise<{ sessionId: string; success: boolean }> => {
  console.log("🎭 MOCK: Creating checkout session for price:", priceId, "email:", email);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        sessionId: `mock_session_${Date.now()}`,
        success: true,
      });
    }, 500);
  });
};

interface ModalState {
  isOpen: boolean;
  planName: string;
  amount: number;
  period: "monthly" | "yearly";
}

const BillingPlan = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [_selectedRole, setSelectedRole] = useState("Owner (Full Access)");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) setUserProfile(JSON.parse(storedProfile));
  }, []);
  const [successModal, setSuccessModal] = useState<ModalState>({
    isOpen: false,
    planName: "",
    amount: 0,
    period: "monthly",
  });

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

  const plans = [
    {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: "Perfect for getting started",
      features: [
        "Core dashboard",
        "Manual transactions",
        "Basic reports",
        "Up to 100 products",
        "Single user access",
      ],
      button: "Current Plan",
      buttonClass: "disabled",
      priceIdMonthly: "",
      priceIdYearly: "",
    },
    {
      id: "growth",
      name: "Growth",
      monthlyPrice: 99,
      yearlyPrice: 990,
      description: "Best for growing businesses",
      features: [
        "Everything in Free",
        "Regional Tax Center",
        "Advanced Reports & Export",
        "Priority support",
        "Up to 1,000 products",
        "Multi-user access (5 users)",
        "Email support",
      ],
      button: "Upgrade to Growth",
      buttonClass: "primary",
      isPopular: true,
      // TODO: Replace with client's Stripe API key: process.env.VITE_STRIPE_PRICE_GROWTH_MONTHLY
      priceIdMonthly: "price_growth_monthly",
      // TODO: Replace with client's Stripe API key: process.env.VITE_STRIPE_PRICE_GROWTH_YEARLY
      priceIdYearly: "price_growth_yearly",
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 249,
      yearlyPrice: 2490,
      description: "For enterprise organizations",
      features: [
        "Everything in Growth",
        "Payroll Integration",
        "Bank/API integrations",
        "Fraud/Anomaly Detection",
        "Offline Mode sync",
        "Multi-currency support",
        "Unlimited products",
        "Unlimited users",
        "24/7 Priority support",
      ],
      button: "Upgrade to Pro",
      buttonClass: "secondary",
      // TODO: Replace with client's Stripe API key: process.env.VITE_STRIPE_PRICE_PRO_MONTHLY
      priceIdMonthly: "price_pro_monthly",
      // TODO: Replace with client's Stripe API key: process.env.VITE_STRIPE_PRICE_PRO_YEARLY
      priceIdYearly: "price_pro_yearly",
    },
  ];

  const makeRoute = (label: string) =>
    "/" +
    label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-").replace(/-/g, "-");

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (plan.id === "free") return;

    setLoading(true);

    try {
      // TODO: Replace with client's Stripe API keys - Uncomment real Stripe integration
      /*
      const priceId = billingCycle === "monthly" ? plan.priceIdMonthly : plan.priceIdYearly;
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4242";

      const response = await fetch(`${apiUrl}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          customerEmail: user?.email,
          successUrl: `${window.location.origin}/billing-success`,
          cancelUrl: `${window.location.origin}/billing-plan`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
      */

      // MOCK: Temporary mock upgrade flow for development
      console.log("🎭 MOCK: Upgrading to", plan.name, "Plan");
      const amount = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

      const sessionData = await createMockCheckoutSession(
        billingCycle === "monthly" ? plan.priceIdMonthly : plan.priceIdYearly,
        user?.email
      );

      if (sessionData.success) {
        // Show mock success modal instead of redirecting to Stripe
        setSuccessModal({
          isOpen: true,
          planName: plan.name,
          amount,
          period: billingCycle,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error initiating upgrade. Please try again.");
    } finally {
      setLoading(false);
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

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={idx}
                to={makeRoute(item.label)}
                className={`nav-item ${item.label === "Billing & Plan" ? "active" : ""}`}
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
          <div className="billing-container">
            {/* Header */}
            <div className="billing-header">
              <h1 className="billing-title">Billing & Plan</h1>
              <p className="billing-subtitle">Choose the perfect plan for your business</p>
            </div>

            {/* Controls - Top Right */}
            <div className="billing-controls-top">
              <div className="currency-selector">
                <select className="currency-dropdown" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                </select>
              </div>

              <div className="billing-toggle">
                <button
                  className={`toggle-btn ${billingCycle === "monthly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`toggle-btn ${billingCycle === "yearly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("yearly")}
                >
                  Yearly {billingCycle === "yearly" && <span className="yearly-badge">Save 17%</span>}
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="plans-grid">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${plan.isPopular ? "popular" : ""}`}
                >
                  {plan.isPopular && <div className="popular-badge">Most Popular</div>}

                  <div className="plan-header">
                    <h2 className="plan-name">{plan.name}</h2>
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <div className="plan-price">
                    <span className="currency">$</span>
                    <span className="amount">
                      {billingCycle === "monthly"
                        ? Math.floor(plan.monthlyPrice)
                        : Math.floor(plan.yearlyPrice)}
                    </span>
                    <span className="period">
                      {billingCycle === "monthly" ? "/month" : "/year"}
                    </span>
                  </div>

                  {billingCycle === "yearly" && plan.id !== "free" && (
                    <div className="plan-save-badge">Save 17%</div>
                  )}

                  <button
                    className={`plan-button ${plan.buttonClass}`}
                    onClick={() => handleUpgrade(plan)}
                    disabled={plan.id === "free" || loading}
                  >
                    {loading && plan.id !== "free" ? "Processing..." : plan.button}
                  </button>

                  <div className="features-divider"></div>

                  <div className="plan-features">
                    <h3 className="features-title">Includes:</h3>
                    <ul className="features-list">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="feature-item">
                          <Check size={16} className="feature-icon" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Why Upgrade Section */}
            <div className="billing-faq">
              <h3 className="faq-title">Why upgrade?</h3>
              <div className="faq-items">
                <div className="faq-item">
                  <div className="faq-icon">📊</div>
                  <div className="faq-content">
                    <h4>Advanced Analytics</h4>
                    <p>Get deeper insights into your business with advanced reports and export capabilities.</p>
                  </div>
                </div>
                <div className="faq-item">
                  <div className="faq-icon">🔒</div>
                  <div className="faq-content">
                    <h4>Enhanced Security</h4>
                    <p>Fraud detection, anomaly alerts, and enterprise-grade security features.</p>
                  </div>
                </div>
                <div className="faq-item">
                  <div className="faq-icon">⚡</div>
                  <div className="faq-content">
                    <h4>Priority Support</h4>
                    <p>Get help when you need it with priority email and 24/7 support on Pro.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal - Mock Checkout */}
        {successModal.isOpen && (
          <div className="modal-overlay">
            <div className="success-modal">
              <button
                className="modal-close"
                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
              >
                <X size={24} />
              </button>

              <div className="modal-checkmark">
                <div className="checkmark-circle">
                  <Check size={48} />
                </div>
              </div>

              <h2 className="modal-title">Upgrade Successful!</h2>

              <div className="modal-details">
                <p className="modal-detail-item">
                  <span className="detail-label">Plan:</span>
                  <span className="detail-value">{successModal.planName}</span>
                </p>
                <p className="modal-detail-item">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">
                    ${successModal.amount}/{successModal.period === "monthly" ? "month" : "year"}
                  </span>
                </p>
                <p className="modal-detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value" style={{ color: "#22c55e" }}>Active</span>
                </p>
              </div>

              <p className="modal-message">
                Your subscription has been activated. You now have access to all {successModal.planName} features.
              </p>

              <button
                className="modal-button"
                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
              >
                Continue to Dashboard
              </button>

              <p className="modal-footer">
                A confirmation email has been sent to {user?.email}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BillingPlan;
