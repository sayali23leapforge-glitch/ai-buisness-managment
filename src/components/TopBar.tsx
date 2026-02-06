import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut, User as UserIcon, AlertCircle, TrendingUp, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import "../styles/TopBar.css";

interface TopBarProps {
  onMenuClick: () => void;
  onRoleChange?: (role: string) => void;
}

interface Notification {
  id: string;
  type: "email" | "stock" | "report";
  title: string;
  message: string;
  time: string;
  icon: any;
}

export default function TopBar({ onMenuClick, onRoleChange }: TopBarProps) {
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Owner (Full Access)");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const roles = [
    "Owner (Full Access)",
    "Accountant",
    "Manager",
    "Employee"
  ];

  // Function to load and update notifications from toggles
  const loadNotifications = () => {
    const storedToggles = localStorage.getItem("userToggles");
    if (storedToggles) {
      try {
        const toggles = JSON.parse(storedToggles);
        const newNotifications: Notification[] = [];

        // Generate notifications based on enabled toggles
        if (toggles.emailNotifications) {
          newNotifications.push({
            id: "email-1",
            type: "email",
            title: "Email Notification",
            message: "You have a new system update available",
            time: "5 mins ago",
            icon: Mail
          });
        }

        if (toggles.lowStockAlerts) {
          newNotifications.push({
            id: "stock-1",
            type: "stock",
            title: "Low Stock Alert",
            message: "Product 'Premium Shoes' stock is running low (5 units)",
            time: "12 mins ago",
            icon: AlertCircle
          });
          newNotifications.push({
            id: "stock-2",
            type: "stock",
            title: "Low Stock Alert",
            message: "Product 'Winter Jacket' needs reordering (2 units)",
            time: "1 hour ago",
            icon: AlertCircle
          });
        }

        if (toggles.salesReports) {
          newNotifications.push({
            id: "report-1",
            type: "report",
            title: "Weekly Sales Report",
            message: "Your weekly sales summary is ready: $4,250 in revenue",
            time: "2 hours ago",
            icon: TrendingUp
          });
        }

        setNotifications(newNotifications);
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    }
  };

  // Load notifications on mount and listen for toggle changes
  useEffect(() => {
    loadNotifications();

    // Listen for storage changes (when toggles change in Settings)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userToggles") {
        loadNotifications();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdown(false);
      }
    };

    if (notificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notificationDropdown]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "no-email@example.com";

  return (
    <div className="top-bar">
      <button className="sidebar-toggle" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="topbar-right">
        <div className="role-dropdown-wrapper">
          <button className="switch-role-btn" onClick={() => setRoleDropdown(!roleDropdown)}>
            Switch Role
          </button>
          {roleDropdown && (
            <div className="role-dropdown-menu">
              {roles.map((role, idx) => (
                <div
                  key={idx}
                  className={`role-option ${role === selectedRole ? "active" : ""}`}
                  onClick={() => {
                    setSelectedRole(role);
                    setRoleDropdown(false);
                    onRoleChange?.(role);
                  }}
                >
                  {role}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="user-menu">
          <div className="notification-wrapper" ref={notificationRef}>
            <button 
              className="notif-icon-btn"
              onClick={() => setNotificationDropdown(!notificationDropdown)}
              title="Notifications"
            >
              <Bell size={20} className="notif-icon" />
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>

            {notificationDropdown && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {notifications.length > 0 && (
                    <span className="notification-count">{notifications.length}</span>
                  )}
                </div>
                
                {notifications.length > 0 ? (
                  <div className="notification-list">
                    {notifications.map((notif) => {
                      const Icon = notif.icon;
                      return (
                        <div key={notif.id} className={`notification-item notif-${notif.type}`}>
                          <div className="notif-icon-container">
                            <Icon size={18} />
                          </div>
                          <div className="notif-content">
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-message">{notif.message}</div>
                            <div className="notif-time">{notif.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="notification-empty">
                    <Bell size={32} className="empty-icon" />
                    <p>No notifications</p>
                    <small>Enable toggles in Settings to receive notifications</small>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="user-menu-wrapper">
            <button
              className="user-profile-btn"
              onClick={() => setUserDropdown(!userDropdown)}
            >
              <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{userName}</div>
                <div className="user-role">{selectedRole}</div>
              </div>
            </button>

            {userDropdown && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <div className="user-avatar-large">{userName.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="dropdown-user-name">{userName}</div>
                    <div className="dropdown-user-email">{userEmail}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={() => {
                  navigate("/settings");
                  setUserDropdown(false);
                }}>
                  <UserIcon size={16} />
                  Profile Settings
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
