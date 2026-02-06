import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  QrCode, Sparkles, ReceiptText, Banknote, Link as LinkIcon,
  Users, CreditCard, Settings as SettingsIcon, Zap, Menu, X,
  Download, Lock, KeyRound, User, Building2, Bell, Database, Shield, Trash2
} from "lucide-react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import "../styles/Settings.css";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  industry: string;
  taxId: string;
  country?: string;
  province?: string;
  city?: string;
}

const Settings: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    businessName: "",
    industry: "",
    taxId: "",
  });

  // Toggle states
  const [toggles, setToggles] = useState({
    autoQRGeneration: true,
    aiInsights: true,
    autoRestockAlerts: true,
    priceOptimization: false,
    emailNotifications: true,
    lowStockAlerts: true,
    salesReports: false,
  });
  
  const { user } = useAuth();

  const menuItems = [
    { icon: Wallet, label: "Finance Overview", href: "/dashboard" },
    { icon: Boxes, label: "Inventory Dashboard", href: "/inventory" },
    { icon: ShoppingCart, label: "Record Sale", href: "/record-sale" },
    { icon: BarChart2, label: "Financial Reports", href: "/reports" },
    { icon: PlusSquare, label: "Add Product", href: "/add-product" },
    { icon: QrCode, label: "QR Manager", href: "/qr-manager" },
    { icon: Sparkles, label: "AI Insights", href: "/ai-insights" },
    { icon: ReceiptText, label: "Tax Center", href: "/tax" },
    { icon: Banknote, label: "Billing Plan", href: "/billing" },
    { icon: LinkIcon, label: "Integrations", href: "/integrations" },
    { icon: Users, label: "Team Management", href: "/team" },
    { icon: CreditCard, label: "Connect Business", href: "/connect" },
    { icon: Zap, label: "Improvement Hub", href: "/improvement" },
    { icon: SettingsIcon, label: "Settings", href: "/settings" },
  ];

  // Auto-fetch and load user data when logged in
  useEffect(() => {
    if (!user?.email) {
      console.log("⚠️ No logged-in user");
      return;
    }

    console.log("🔄 Fetching data for user:", user.email);
    
    // Load user's saved profile from localStorage
    const storedProfile = localStorage.getItem("userProfile");
    
    if (storedProfile) {
      try {
        const userData = JSON.parse(storedProfile);
        // Always ensure email matches current logged-in user
        userData.email = user.email;
        console.log("✅ Auto-loaded user profile:", userData);
        setProfile(userData);
      } catch (e) {
        console.error("❌ Failed to parse profile:", e);
        // Fallback to empty profile with current email
        setProfile({
          firstName: "",
          lastName: "",
          email: user.email,
          businessName: "",
          industry: "",
          taxId: "",
        });
      }
    } else {
      // No profile saved yet - show empty form with email
      console.log("ℹ️ No saved profile for this user");
      setProfile({
        firstName: "",
        lastName: "",
        email: user.email,
        businessName: "",
        industry: "",
        taxId: "",
      });
    }

    // Load stored photo
    const storedPhoto = localStorage.getItem("userPhoto");
    if (storedPhoto) {
      setPhotoUrl(storedPhoto);
    }

    // Load toggle settings
    const storedToggles = localStorage.getItem("userToggles");
    if (storedToggles) {
      try {
        setToggles(JSON.parse(storedToggles));
      } catch (e) {
        console.error("Error loading toggles:", e);
      }
    }
  }, [user?.email]);

  // Set default profile data
  const setDefaultProfile = () => {
    const defaultUser = {
      firstName: "TEST",
      lastName: "USER",
      email: "test@example.com",
      businessName: "Test Business",
      industry: "Testing",
      taxId: "TEST-123",
    };
    setProfile(defaultUser);
    console.log("Set default profile:", defaultUser);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Toggle handler
  const handleToggleChange = (key: keyof typeof toggles) => {
    const newToggles = {
      ...toggles,
      [key]: !toggles[key],
    };
    setToggles(newToggles);
    localStorage.setItem("userToggles", JSON.stringify(newToggles));
    console.log("✅ Toggle updated:", key, newToggles[key]);
  };

  // Change Photo Handler
  const handleChangePhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const imageData = event.target.result;
          // Save to localStorage
          localStorage.setItem("userPhoto", imageData);
          setPhotoUrl(imageData);
          alert(`✅ Photo uploaded: ${file.name}`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Delete Photo Handler
  const handleDeletePhoto = () => {
    if (confirm("Are you sure you want to delete your profile photo?")) {
      localStorage.removeItem("userPhoto");
      setPhotoUrl(null);
      alert("✅ Photo deleted successfully!");
    }
  };

  // Save Changes Handler
  const handleSaveChanges = () => {
    // Save profile data to localStorage (with current user's email)
    const profileToSave = {
      ...profile,
      email: user?.email || profile.email, // Always use current logged-in email
    };
    localStorage.setItem("userProfile", JSON.stringify(profileToSave));
    console.log("✅ Saved profile to localStorage:", profileToSave);
    alert("✅ Profile changes saved successfully!");
  };

  // Cancel Handler
  const handleCancel = () => {
    // Reset to stored profile or default
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      try {
        const userData = JSON.parse(storedProfile);
        setProfile(userData);
      } catch (e) {
        setDefaultProfile();
      }
    } else {
      setDefaultProfile();
    }
    alert("Changes cancelled");
  };

  // Export Handlers
  const handleExportProducts = () => {
    // Get products from localStorage
    const products = JSON.parse(localStorage.getItem("products") || "[]");
    const csvContent = [
      ["Name", "Price", "Stock", "Category"],
      ...products.map((p: any) => [p.name, p.price, p.stock, p.category])
    ]
      .map(row => row.join(","))
      .join("\n");
    
    downloadFile(csvContent, "products.csv", "text/csv");
  };

  const handleExportSales = () => {
    // Get sales from localStorage
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");
    const csvContent = [
      ["Date", "Product", "Quantity", "Amount"],
      ...sales.map((s: any) => [s.timestamp, s.productName, s.quantity, s.amount])
    ]
      .map(row => row.join(","))
      .join("\n");
    
    downloadFile(csvContent, "sales.csv", "text/csv");
  };

  const handleExportQRCodes = () => {
    alert("📥 Exporting QR codes as ZIP file...\nThis feature would package all QR codes.");
    // In real app: Generate ZIP file of QR codes
  };

  // Download File Utility
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    alert(`✅ ${filename} downloaded successfully!`);
  };

  // Security Handlers
  const handleChangePassword = () => {
    const newPassword = prompt("Enter new password:");
    if (newPassword) {
      localStorage.setItem("userPassword", newPassword);
      alert("✅ Password changed successfully!");
    }
  };

  const handleEnable2FA = () => {
    alert("🔐 Two-Factor Authentication\nThis feature would enable 2FA for your account.");
    // In real app: Setup 2FA with authenticator app
  };

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo-icon">N</div>
          {sidebarOpen && <span className="company-name">Settings</span>}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                to={item.href}
                className={`nav-item ${item.label === "Settings" ? "active" : ""}`}
              >
                <Icon size={18} className="nav-icon" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="location-main">
            {profile.city && profile.province ? `${profile.city}, ${profile.province}` : "Add Location"}
          </div>
          <div className="location-sub">
            {profile.businessName || "Business Name"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <TopBar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Scrollable Content */}
        <div className="scrollable-content">
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">
              Manage your account and preferences
            </p>

      {/* PROFILE SECTION */}
      <div className="settings-card">
        <div className="card-header">
          <User size={18} className="icon-yellow" />
          <div>
            <h3>Profile</h3>
            <p>Update your personal information</p>
          </div>
        </div>

        <div className="profile-row">
          <div className="avatar" style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : {}}>
            {!photoUrl && "JD"}
            {photoUrl && (
              <button 
                className="delete-photo-btn"
                onClick={handleDeletePhoto}
                title="Delete photo"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button className="upload-btn" onClick={handleChangePhoto}>Change Photo</button>
          <span className="upload-hint">JPG, PNG up to 5MB</span>
        </div>

        <div className="form-grid">
          <div>
            <label>First Name</label>
            <input
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Last Name</label>
            <input
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-full">
          <label>Email</label>
          <input 
            name="email"
            value={profile.email} 
            onChange={handleChange}
          />
        </div>
      </div>

      {/* BUSINESS INFO */}
      <div className="settings-card">
        <div className="card-header">
          <Building2 size={18} className="icon-yellow" />
          <div>
            <h3>Business Information</h3>
            <p>Update your business details</p>
          </div>
        </div>

        <div className="form-full">
          <label>Business Name</label>
          <input
            name="businessName"
            value={profile.businessName}
            onChange={handleChange}
          />
        </div>

        <div className="form-grid">
          <div>
            <label>Industry</label>
            <input
              name="industry"
              value={profile.industry}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Tax ID</label>
            <input
              name="taxId"
              value={profile.taxId}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* LOCATION INFO */}
      <div className="settings-card">
        <div className="card-header">
          <Building2 size={18} className="icon-yellow" />
          <div>
            <h3>Location</h3>
            <p>Your business location</p>
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label>Country</label>
            <input
              name="country"
              value={profile.country || ""}
              onChange={handleChange}
              placeholder="e.g., Canada"
            />
          </div>

          <div>
            <label>Province/State</label>
            <input
              name="province"
              value={profile.province || ""}
              onChange={handleChange}
              placeholder="e.g., Ontario"
            />
          </div>
        </div>

        <div className="form-full">
          <label>City</label>
          <input
            name="city"
            value={profile.city || ""}
            onChange={handleChange}
            placeholder="e.g., Toronto"
          />
        </div>
      </div>

      {/* AI & AUTOMATION SECTION */}
      <div className="settings-card">
        <div className="card-header">
          <Zap size={18} className="icon-yellow" />
          <div>
            <h3>AI & Automation</h3>
            <p>Configure AI-powered features</p>
          </div>
        </div>

        <div className="settings-option">
          <div className="option-content">
            <h4>Auto QR Generation</h4>
            <p>Automatically generate QR codes for new products</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={toggles.autoQRGeneration}
              onChange={() => handleToggleChange('autoQRGeneration')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-option">
          <div className="option-content">
            <h4>AI Insights</h4>
            <p>Receive AI-powered inventory recommendations</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={toggles.aiInsights}
              onChange={() => handleToggleChange('aiInsights')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-option">
          <div className="option-content">
            <h4>Auto Restock Alerts</h4>
            <p>Get notified when items are running low</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={toggles.autoRestockAlerts}
              onChange={() => handleToggleChange('autoRestockAlerts')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-option">
          <div className="option-content">
            <h4>Price Optimization</h4>
            <p>Allow AI to suggest optimal pricing</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={toggles.priceOptimization}
              onChange={() => handleToggleChange('priceOptimization')}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* NOTIFICATIONS SECTION */}
      <div className="settings-card">
        <div className="card-header">
          <Bell size={18} className="icon-yellow" />
          <div>
            <h3>Notifications</h3>
            <p>Manage your notification preferences</p>
          </div>
        </div>

        <div className="settings-option">
          <div className="option-content">
            <h4>Email Notifications</h4>
            <p>Receive updates via email</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={toggles.emailNotifications}
              onChange={() => handleToggleChange('emailNotifications')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-option">
          <div className="option-content">
            <h4>Low Stock Alerts</h4>
            <p>Get notified about low inventory</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={toggles.lowStockAlerts}
              onChange={() => handleToggleChange('lowStockAlerts')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-option">
          <div className="option-content">
            <h4>Sales Reports</h4>
            <p>Weekly sales summary emails</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={toggles.salesReports}
              onChange={() => handleToggleChange('salesReports')}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* DATA & EXPORT SECTION */}
      <div className="settings-card">
        <div className="card-header">
          <Database size={18} className="icon-yellow" />
          <div>
            <h3>Data & Export</h3>
            <p>Export and manage your data</p>
          </div>
        </div>

        <button className="export-full-btn" onClick={handleExportProducts}>
          <Download size={16} />
          Export All Products (CSV)
        </button>

        <button className="export-full-btn" onClick={handleExportSales}>
          <Download size={16} />
          Export Sales Data (Excel)
        </button>

        <button className="export-full-btn" onClick={handleExportQRCodes}>
          <Download size={16} />
          Export QR Codes (ZIP)
        </button>
      </div>

      {/* SECURITY SECTION */}
      <div className="settings-card">
        <div className="card-header">
          <Shield size={18} className="icon-yellow" />
          <div>
            <h3>Security</h3>
            <p>Manage your security settings</p>
          </div>
        </div>

        <button className="security-btn" onClick={handleChangePassword}>
          <KeyRound size={16} />
          Change Password
        </button>

        <button className="security-btn" onClick={handleEnable2FA}>
          <Lock size={16} />
          Enable Two-Factor Authentication
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div className="settings-actions">
        <button className="save-btn" onClick={handleSaveChanges}>Save Changes</button>
        <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
      </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
