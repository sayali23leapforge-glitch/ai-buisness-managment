import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  QrCode, Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  ReceiptText, Banknote, LinkIcon, Users, CreditCard, Settings,
  Calendar, Download, FileText, DollarSign, Zap, Sparkles
} from "lucide-react";
import TopBar from "../components/TopBar";
import { getProducts } from "../utils/localProductStore";
import { useAuth } from "../context/AuthContext";
import { isShopifyConnected, getShopifyProductsFromStorage, getShopifySalesFromStorage } from "../utils/shopifyDataFetcher";
import "../styles/TaxCenter.css";

function fmt(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function readSalesData(): any[] {
  // ONLY return Shopify data when connected
  if (!isShopifyConnected()) {
    return [];
  }

  try {
    const shopifySales = getShopifySalesFromStorage();
    if (shopifySales && shopifySales.length > 0) {
      // Transform Shopify sales to match expected format
      return shopifySales.map((sale: any) => ({
        ...sale,
        items: sale.lineItems || [{ productId: sale.productId, quantity: sale.quantity, price: sale.amount }]
      }));
    }
  } catch (err) {
    console.error("Error reading Shopify sales:", err);
  }
  
  return [];
}

export default function TaxCenter() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth() as any;
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile for location
  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
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

  // tax rates (persisted)
  const [corporateRate, setCorporateRate] = useState<number>(() => {
    const r = localStorage.getItem("tax_corporate");
    return r ? Number(r) : 12;
  });
  const [salesTaxRate, setSalesTaxRate] = useState<number>(() => {
    const r = localStorage.getItem("tax_sales");
    return r ? Number(r) : 13;
  });
  const [, setDataRefresh] = useState(0); // Trigger re-render on data changes

  // Listen for Shopify connection/disconnection
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "shopifyConnected" || e.key === "shopifyProducts" || e.key === "shopifySales") {
        console.log("🔄 Shopify data changed in TaxCenter, refreshing");
        setDataRefresh(prev => prev + 1); // Trigger re-render
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // load data sources - use Shopify if connected, otherwise local
  const products = isShopifyConnected() ? getShopifyProductsFromStorage() : getProducts();
  const sales = readSalesData();

  // calculate net income before tax from sales and product cost (COGS)
  const { netIncomeBeforeTax } = useMemo(() => {
    let totalRevenue = 0;
    let totalCOGS = 0;

    for (const sale of sales) {
      const items = Array.isArray(sale.items) ? sale.items : [];
      for (const it of items) {
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);
        totalRevenue += price * qty;

        const prod = products.find((p: any) => p.id === it.productId);
        const costPrice = prod ? Number(prod.cost || 0) : price * 0.5;
        totalCOGS += costPrice * qty;
      }
    }

    const netBeforeTax = Math.round(totalRevenue - totalCOGS);
    return { netIncomeBeforeTax: netBeforeTax };
  }, [products, sales]);

  // compute tax totals (ensure tax can't be negative)
  const totalTax = useMemo(() => {
    const base = Math.max(netIncomeBeforeTax, 0);
    return Math.round((base * corporateRate) / 100);
  }, [netIncomeBeforeTax, corporateRate]);

  // quarterly breakdown — array of 4 quarters with status based on current month
  const quarters = useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0..11
    // determine current quarter index (0..3)
    const currentQuarter = Math.floor(month / 3); // 0 = Q1, 1 = Q2 ...
    const perQuarter = Math.round(totalTax / 4);

    return [0, 1, 2, 3].map((q) => {
      let status: "Paid" | "Due Soon" | "Upcoming" = "Upcoming";
      if (q < currentQuarter) status = "Paid";
      else if (q === currentQuarter) status = "Due Soon";
      else status = "Upcoming";

      // label like Q1 2025 (use current year, but if quarter < currentQuarter maybe same year)
      const year = now.getFullYear();
      const label = `Q${q + 1} ${year}`;

      return {
        quarterIndex: q,
        label,
        amount: perQuarter,
        status,
      };
    });
  }, [totalTax]);

  useEffect(() => {
    localStorage.setItem("tax_corporate", String(corporateRate));
  }, [corporateRate]);

  useEffect(() => {
    localStorage.setItem("tax_sales", String(salesTaxRate));
  }, [salesTaxRate]);

  function handleGenerateTaxReport() {
    // quick export — open print dialog
    window.print();
  }

  function handleDownloadTaxSummary() {
    // Generate and download tax summary as PDF/CSV
    const taxData = {
      reportDate: new Date().toLocaleDateString(),
      totalRevenue: Math.round(netIncomeBeforeTax + (netIncomeBeforeTax * corporateRate / 100)),
      netIncome: netIncomeBeforeTax,
      totalTax: totalTax,
      corporateRate: corporateRate,
      salesTaxRate: salesTaxRate,
      quarters: quarters
    };

    const csvContent = [
      ["Tax Summary Report"],
      ["Report Date:", taxData.reportDate],
      [""],
      ["Total Revenue", fmt(taxData.totalRevenue)],
      ["Net Income Before Tax", fmt(taxData.netIncome)],
      ["Total Tax", fmt(taxData.totalTax)],
      ["Corporate Rate", `${taxData.corporateRate}%`],
      ["Sales Tax Rate", `${taxData.salesTaxRate}%`]
    ]
      .map((row) => row.join(","))
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute("download", "tax-summary.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function handleGenerateQuarterlyReport() {
    // Generate quarterly report
    const reportContent = [
      ["Quarterly Tax Payment Schedule"],
      ["Generated:", new Date().toLocaleDateString()],
      [""],
      ["Quarter", "Amount", "Status", "Due Date"],
      ...quarters.map((q) => [
        q.label,
        fmt(q.amount),
        q.status,
        `${new Date(new Date().getFullYear(), (q.quarterIndex + 1) * 3 - 1, 15).toLocaleDateString()}`
      ])
    ]
      .map((row) => row.join(","))
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(reportContent)
    );
    element.setAttribute("download", "quarterly-report.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function handleViewPaymentHistory() {
    // Show payment history - for now, alert with payment info
    const paymentInfo = quarters
      .map((q) => `${q.label}: ${fmt(q.amount)} - ${q.status}`)
      .join("\n");
    alert(
      "Payment History:\n\n" +
        paymentInfo +
        "\n\nNote: Track your payments here. Contact support for manual payment records."
    );
  }

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
            const isActive = idx === 8;

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
      <div className="tax-header">
        <div>
          <h2>Tax Center</h2>
          <p className="tax-sub">Automated tax calculation based on your region</p>
        </div>

        <div className="tax-actions">
          <button className="btn-generate" onClick={handleGenerateTaxReport}>
            Generate Tax Report
          </button>
        </div>
      </div>

      {/* Regional summary */}
      <div className="tax-card region-card">
        <div className="region-title">
          <strong>Regional Tax Summary</strong>
        </div>

        <div className="region-row">
          <div>
            <div className="region-label">Business Location</div>
            <div className="region-value">
              {userProfile?.city && userProfile?.province 
                ? `${userProfile.city}, ${userProfile.province}` 
                : "Toronto, Ontario"}
            </div>
          </div>

          <div className="auto-detected">Auto-Detected</div>
        </div>

        <div className="tax-rate-row">
          <div className="tax-box">
            <div className="tax-box-icon">%</div>
            <div className="tax-box-body">
              <div className="tax-box-title">Corporate Tax Rate</div>
              <div className="tax-box-value">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={corporateRate}
                  onChange={(e) => setCorporateRate(Number(e.target.value))}
                />
                <span className="percent">%</span>
              </div>
              <div className="muted">Applied to net income before tax</div>
            </div>
          </div>

          <div className="tax-box">
            <div className="tax-box-icon">$</div>
            <div className="tax-box-body">
              <div className="tax-box-title">Sales Tax (HST)</div>
              <div className="tax-box-value">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={salesTaxRate}
                  onChange={(e) => setSalesTaxRate(Number(e.target.value))}
                />
                <span className="percent">%</span>
              </div>
              <div className="muted">Applied to customer purchases</div>
            </div>
          </div>
        </div>

        <div className="auto-tax-note">
          <strong>Automatic Tax Adjustment</strong>
          <div className="muted">
            Nayance automatically adjusts tax rates based on your business location. Tax rates are updated quarterly to reflect current regulations.
          </div>
        </div>
      </div>

      {/* Totals + Quarter breakdown */}
      <div className="tax-grid">
        <div className="tax-card total-card">
          <div className="card-title">Total Tax Owed (Annual)</div>

          <div className="fr-line">
            <div className="fr-left">Net Income Before Tax</div>
            <div className="fr-right">{isShopifyConnected() ? fmt(netIncomeBeforeTax) : "$0"}</div>
          </div>

          <div className="fr-line">
            <div className="fr-left">Tax Rate</div>
            <div className="fr-right">{corporateRate}%</div>
          </div>

          <div className="section-divider" />

          <div className="fr-line total">
            <div className="fr-left">Total Tax</div>
            <div className="fr-right positive tax-total">{isShopifyConnected() ? fmt(totalTax) : "$0"}</div>
          </div>

          <div className="muted small">
            {isShopifyConnected() ? "Based on current year-to-date income" : "Connect Shopify to see tax data"}
          </div>
        </div>

        <div className="tax-card quarter-card">
          <div className="card-title">Quarterly Tax Breakdown</div>
          <div className="quarter-list">
            {isShopifyConnected() ? quarters.map((q) => {
              const colorMap: { [key: number]: string } = {
                0: "#22c55e", // Q1 - Green
                1: "#d4af37", // Q2 - Golden
                2: "#f59e0b", // Q3 - Amber
                3: "#6b7280", // Q4 - Gray
              };
              const statusIconBg = colorMap[q.quarterIndex] || "#6b7280";

              return (
                <div key={q.quarterIndex} className="quarter-row">
                  <div className="quarter-left">
                    <div className="quarter-badge" style={{ backgroundColor: statusIconBg }}>
                      {q.label.substring(0, 2)}
                    </div>
                    <div>
                      <div className="quarter-label">{q.label}</div>
                      <div className="muted small">{q.status}</div>
                    </div>
                  </div>
                  <div className="quarter-right">{fmt(q.amount)}</div>
                </div>
              );
            }) : (
              <div className="muted" style={{ padding: "16px", textAlign: "center" }}>
                Connect Shopify to see quarterly breakdown
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Tax Deadlines */}
      <div className="tax-card deadlines-card">
        <div className="card-title">Upcoming Tax Deadlines</div>
        <div className="deadlines-list">
          <div className="deadline-item">
            <div className="deadline-icon red">
              <Calendar size={20} />
            </div>
            <div className="deadline-info">
              <div className="deadline-title">Q3 Corporate Tax Filing</div>
              <div className="deadline-date">October 31, 2025</div>
            </div>
            <div className="deadline-badge red">14 days</div>
          </div>

          <div className="deadline-item">
            <div className="deadline-icon gold">
              <Calendar size={20} />
            </div>
            <div className="deadline-info">
              <div className="deadline-title">Q4 Estimated Tax Payment</div>
              <div className="deadline-date">December 15, 2025</div>
            </div>
            <div className="deadline-badge gold">50 days</div>
          </div>

          <div className="deadline-item">
            <div className="deadline-icon blue">
              <Calendar size={20} />
            </div>
            <div className="deadline-info">
              <div className="deadline-title">Annual Tax Return</div>
              <div className="deadline-date">April 30, 2026</div>
            </div>
            <div className="deadline-badge blue">195 days</div>
          </div>
        </div>
      </div>

      {/* Export Tax Documents */}
      <div className="tax-card export-card">
        <div className="card-title">Export Tax Documents</div>
        <div className="export-buttons">
          <button className="export-btn" onClick={handleDownloadTaxSummary}>
            <Download size={16} />
            Download Tax Summary (PDF)
          </button>
          <button className="export-btn" onClick={handleGenerateQuarterlyReport}>
            <FileText size={16} />
            Generate Quarterly Report
          </button>
          <button className="export-btn" onClick={handleViewPaymentHistory}>
            <DollarSign size={16} />
            View Payment History
          </button>
        </div>
      </div>

      {/* small footer + controls */}
      <div className="tax-footer muted small">
        Tip: Update corporate & sales tax rates here. For full compliance, consult a tax professional.
      </div>
        </div>
      </main>
    </div>
  );
}
