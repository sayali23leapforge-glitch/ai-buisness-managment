import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, Boxes, ShoppingCart, BarChart2, PlusSquare,
  QrCode, Sparkles, ReceiptText, Banknote, Link as LinkIcon,
  Users, CreditCard, Settings, Copy, Check, Trash2, Search,
  Users2, CheckCircle, Lock, Zap
} from "lucide-react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import {
  createTeamInvite,
  subscribeToTeamInvites,
  deleteTeamInvite,
  TeamInvite
} from "../utils/teamInviteStore";
import { sendInviteEmail } from "../utils/sendInviteEmail";
import "../styles/teamManagement.css";

const TeamManagement = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [_selectedRole, setSelectedRole] = useState("Owner (Full Access)");
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) setUserProfile(JSON.parse(storedProfile));
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // Update time every minute to refresh "Last Active" display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
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

  // Subscribe to real-time team invites
  useEffect(() => {
    const unsubscribe = subscribeToTeamInvites((invites) => {
      setTeamInvites(invites);
    });

    return () => unsubscribe();
  }, []);

  const makeRoute = (label: string) =>
    "/" +
    label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-").replace(/-/g, "-");

  const handleSendInvite = async () => {
    if (!email || !role) {
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    try {
      // Create invite in Firestore
      const inviteResult = await createTeamInvite(
        email,
        role,
        `${window.location.origin}/accept-invite/[inviteId]`,
        user?.uid || "admin"
      );

      if (!inviteResult.success || !inviteResult.inviteId) {
        setSuccessMessage(`Error: ${inviteResult.message}`);
        setLoading(false);
        return;
      }

      // Send email invite
      const emailResult = await sendInviteEmail(email, inviteResult.inviteId, role);

      if (emailResult.success) {
        setSuccessMessage(`✓ Invite sent to ${email}`);
        setTimeout(() => {
          setShowModal(false);
          setEmail("");
          setRole("");
          setSuccessMessage("");
        }, 2000);
      } else {
        setSuccessMessage(`✗ Firestore saved but email failed: ${emailResult.message}`);
      }
    } catch (error: any) {
      setSuccessMessage(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "pending";
      case "accepted":
        return "accepted";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const pendingCount = teamInvites.filter((inv) => inv.status === "pending").length;
  const acceptedCount = teamInvites.filter((inv) => inv.status === "accepted").length;
  const rejectedCount = teamInvites.filter((inv) => inv.status === "rejected").length;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate time difference for "Last Active" display
  const getLastActiveTime = (timestamp: any, status: string): string => {
    if (status !== "accepted") {
      return "Not yet";
    }

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = currentTime.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // Show time of day for older timestamps
    const hours = date.getHours();
    const mins = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    return timeStr;
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this invite?")) {
      const result = await deleteTeamInvite(inviteId);
      if (result.success) {
        setSuccessMessage("✓ Invite deleted successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setSuccessMessage(`✗ Failed to delete: ${result.message}`);
      }
    }
  };

  // Filter team invites based on search query
  const filteredInvites = teamInvites.filter(invite => 
    invite.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invite.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                className={`nav-item ${item.label === "Team Management" ? "active" : ""}`}
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
          <div className="team-container">
            <div className="top-bar-row">
              <h2 className="section-title">Team Management</h2>
              <button className="add-employee-btn" onClick={() => setShowModal(true)}>
                ➕ Add Employee
              </button>
            </div>

            <p className="section-subtitle">Manage team members and their access levels</p>

            {/* Team Stats */}
            <div className="team-stats-row">
              <div className="team-stat-card">
                <div>
                  <h3>Total Members</h3>
                  <p>{teamInvites.length}</p>
                </div>
                <div className="stat-icon stat-total">
                  <Users2 size={24} />
                </div>
              </div>
              <div className="team-stat-card">
                <div>
                  <h3>Active Now</h3>
                  <p>{acceptedCount}</p>
                </div>
                <div className="stat-icon stat-active">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="team-stat-card">
                <div>
                  <h3>Accountants</h3>
                  <p>{teamInvites.filter(i => i.role === "Accountant").length}</p>
                </div>
                <div className="stat-icon stat-accountant">
                  <Users size={24} />
                </div>
              </div>
              <div className="team-stat-card">
                <div>
                  <h3>Managers</h3>
                  <p>{teamInvites.filter(i => i.role === "Manager").length}</p>
                </div>
                <div className="stat-icon stat-manager">
                  <Lock size={24} />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="team-search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="team-search-bar"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Team Members Table */}
            {filteredInvites.length === 0 ? (
              <div className="empty-team-table">
                <p>{searchQuery ? "No matching team members found." : "No team members yet. Create your first invite to get started!"}</p>
              </div>
            ) : (
              <div className="team-table-container">
                <table className="team-members-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Last Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvites.map((invite) => {
                      const nameParts = invite.email.split("@")[0].split(".");
                      const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "User";
                      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "";
                      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
                      const initials = (nameParts[0]?.charAt(0) || "U") + (nameParts[1]?.charAt(0) || "");
                      const colors = ["#d4af37", "#4f46e5", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
                      const colorIndex = invite.id.charCodeAt(0) % colors.length;
                      const bgColor = colors[colorIndex];
                      
                      return (
                        <tr key={invite.id}>
                          <td>
                            <div className="member-info">
                              <div className="member-avatar" style={{ backgroundColor: bgColor }}>
                                {initials.toUpperCase()}
                              </div>
                              <span className="member-name">{fullName}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge role-${invite.role.toLowerCase()}`}>
                              {invite.role}
                            </span>
                          </td>
                          <td className="member-email">{invite.email}</td>
                          <td>
                            <span className={`status-badge status-${invite.status === "accepted" ? "active" : "inactive"}`}>
                              {invite.status === "accepted" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="last-active">
                            {getLastActiveTime(invite.createdAt, invite.status)}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn"
                                onClick={() => copyToClipboard(
                                  `${window.location.origin}/accept-invite/${invite.id}`,
                                  invite.id
                                )}
                                title="Copy invite link"
                              >
                                {copiedId === invite.id ? (
                                  <Check size={16} />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                              <button
                                className="action-btn action-delete"
                                onClick={() => handleDeleteInvite(invite.id)}
                                title="Delete invite permanently"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Role Access Levels */}
            <div className="role-access-section">
              <h3 className="role-access-title">Role Access Levels</h3>
              <div className="role-access-grid">
                <div className="role-card role-owner-card">
                  <div className="role-icon-badge role-owner-icon">
                    <Wallet size={20} />
                  </div>
                  <h4>Owner</h4>
                  <p>Full access to all features</p>
                </div>
                <div className="role-card role-accountant-card">
                  <div className="role-icon-badge role-accountant-icon">
                    <BarChart2 size={20} />
                  </div>
                  <h4>Accountant</h4>
                  <p>Manage financials and taxes</p>
                </div>
                <div className="role-card role-manager-card">
                  <div className="role-icon-badge role-manager-icon">
                    <Users size={20} />
                  </div>
                  <h4>Manager</h4>
                  <p>View and manage reports</p>
                </div>
                <div className="role-card role-employee-card">
                  <div className="role-icon-badge role-employee-icon">
                    <Lock size={20} />
                  </div>
                  <h4>Employee</h4>
                  <p>Input data only</p>
                </div>
              </div>
            </div>

      {/* ------------ ADD EMPLOYEE MODAL ------------ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="add-employee-modal">
            {/* HEADER */}
            <div className="modal-header">
              <span className="modal-title">👤 Add Employee</span>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowModal(false);
                  setSuccessMessage("");
                }}
              >
                ✖
              </button>
            </div>

            <p className="modal-subtitle">Invite a new team member</p>

            {successMessage && (
              <div className="modal-message" style={{
                background: successMessage.startsWith("✗") || successMessage.startsWith("Error") 
                  ? "rgba(239, 68, 68, 0.1)" 
                  : "rgba(34, 197, 94, 0.1)",
                border: `1px solid ${
                  successMessage.startsWith("✗") || successMessage.startsWith("Error")
                    ? "#ef4444"
                    : "#22c55e"
                }`,
                color: successMessage.startsWith("✗") || successMessage.startsWith("Error")
                  ? "#fca5a5"
                  : "#86efac",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "16px",
                textAlign: "center"
              }}>
                {successMessage}
              </div>
            )}

            {/* EMAIL FIELD */}
            <label>Email Address</label>
            <input
              type="email"
              className="modal-input"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            {/* ROLE SELECT */}
            <label>Role</label>
            <select
              className="modal-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a role</option>
              <option value="Owner">Owner</option>
              <option value="Accountant">Accountant</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>

            {/* BUTTONS */}
            <div className="modal-button-row">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowModal(false);
                  setSuccessMessage("");
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-send"
                disabled={!email || !role || loading}
                onClick={handleSendInvite}
              >
                {loading ? "Sending..." : "Send Invite"}
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
};

export default TeamManagement;
