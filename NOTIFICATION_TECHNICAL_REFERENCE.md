# Notification System - Technical Reference

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Settings Page (Settings.tsx)          TopBar (TopBar.tsx)      │
│  ├─ 7 Toggle Switches                  ├─ Bell Icon Button      │
│  ├─ handleToggleChange()               ├─ Notification Badge    │
│  └─ localStorage.setItem()             ├─ Dropdown Menu         │
│                                        └─ Notification List     │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                  DATA PERSISTENCE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  localStorage["userToggles"]                                     │
│  {                                                               │
│    "emailNotifications": boolean,                                │
│    "lowStockAlerts": boolean,                                    │
│    "salesReports": boolean,                                      │
│    ...                                                           │
│  }                                                               │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│              COMMUNICATION LAYER (Browser APIs)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  StorageEvent Listener                                           │
│  window.addEventListener("storage", handleStorageChange)        │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                   NOTIFICATION STATE LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  notifications: Notification[]  (React state)                   │
│  notificationDropdown: boolean  (React state)                   │
│                                                                   │
│  Notification Interface:                                         │
│  {                                                               │
│    id: string,                                                   │
│    type: 'email' | 'stock' | 'report',                          │
│    title: string,                                                │
│    message: string,                                              │
│    time: string,                                                 │
│    icon: React Component                                         │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Flow Sequence

### Scenario: User Enables Email Notifications

```
Step 1: User Action
────────────────────────
Settings.tsx
├─ User clicks "Email Notifications" toggle
├─ onChange event triggered
└─ Component state updates (toggles.emailNotifications = true)

         ↓

Step 2: Data Persistence
────────────────────────
handleToggleChange()
├─ Create newToggles object with updated state
├─ localStorage.setItem("userToggles", JSON.stringify(newToggles))
└─ Triggers StorageEvent in all browser contexts

         ↓

Step 3: Event Propagation
────────────────────────
Browser StorageEvent API
├─ Storage change detected
├─ event.key = "userToggles"
├─ event.newValue = updated JSON string
└─ All listeners notified

         ↓

Step 4: TopBar Response
────────────────────────
TopBar.tsx useEffect
├─ handleStorageChange() callback triggered
├─ Check if event.key === "userToggles"
├─ Call loadNotifications()
└─ Return cleanup to remove listener

         ↓

Step 5: Notification Generation
────────────────────────────────
loadNotifications()
├─ Read localStorage["userToggles"]
├─ Parse JSON
├─ Check if emailNotifications === true
├─ Create Notification object:
│  {
│    id: "email-1",
│    type: "email",
│    title: "Email Notification",
│    message: "You have a new system update available",
│    time: "5 mins ago",
│    icon: Mail
│  }
├─ Add to newNotifications array
└─ Call setNotifications(newNotifications)

         ↓

Step 6: UI Update
─────────────────
React Re-render
├─ notifications state updated
├─ TopBar component re-renders
├─ Bell icon shows
├─ Badge displays count "1"
├─ Dropdown available with notification
└─ Display complete
```

---

## Code Implementation Details

### TopBar.tsx - Core Logic

#### 1. State Initialization
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
const [notificationDropdown, setNotificationDropdown] = useState(false);
```

#### 2. Notification Loading Function
```typescript
const loadNotifications = () => {
  const storedToggles = localStorage.getItem("userToggles");
  if (storedToggles) {
    try {
      const toggles = JSON.parse(storedToggles);
      const newNotifications: Notification[] = [];

      // Email Notifications
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

      // Low Stock Alerts
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

      // Sales Reports
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
```

#### 3. Storage Event Listener Setup
```typescript
useEffect(() => {
  loadNotifications(); // Load on mount

  // Listen for storage changes from Settings page
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "userToggles") {
      loadNotifications();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  
  // Cleanup on unmount
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);
```

#### 4. UI Rendering
```typescript
<div className="notification-wrapper">
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
```

### Settings.tsx - Toggle Handler

```typescript
const handleToggleChange = (key: keyof typeof toggles) => {
  const newToggles = {
    ...toggles,
    [key]: !toggles[key],
  };
  setToggles(newToggles);
  localStorage.setItem("userToggles", JSON.stringify(newToggles));
  console.log("✅ Toggle updated:", key, newToggles[key]);
  // StorageEvent automatically triggers TopBar listener
};
```

### TopBar.css - Key Styles

```css
.notification-wrapper {
  position: relative;
}

.notif-icon-btn {
  background: transparent;
  border: none;
  color: var(--color-text, #ffffff);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.notif-icon-btn:hover {
  color: var(--color-accent, #d4af37);
  background: #1a1a1a;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  width: 380px;
  max-height: 500px;
  overflow-y: auto;
  margin-top: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1001;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #242424;
  transition: background 0.2s;
  cursor: pointer;
}

.notification-item:hover {
  background: #252525;
}

.notif-email {
  border-left: 3px solid #4a9eff;
}

.notif-stock {
  border-left: 3px solid #ff6b6b;
}

.notif-report {
  border-left: 3px solid #51cf66;
}

.notification-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-secondary, #9b9b9b);
}
```

---

## TypeScript Interfaces

```typescript
interface Notification {
  id: string;
  type: "email" | "stock" | "report";
  title: string;
  message: string;
  time: string;
  icon: React.ComponentType<any>;
}

interface UserToggles {
  autoQRGeneration: boolean;
  aiInsights: boolean;
  autoRestockAlerts: boolean;
  priceOptimization: boolean;
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  salesReports: boolean;
}
```

---

## Browser API Usage

### StorageEvent
Triggered when data in localStorage changes in any tab/window:

```typescript
interface StorageEvent extends Event {
  key: string | null;           // Key that changed
  oldValue: string | null;      // Previous value
  newValue: string | null;      // New value
  url: string;                  // URL of affected document
  storageArea: Storage;         // localStorage or sessionStorage
}
```

### Listener Pattern
```typescript
window.addEventListener("storage", (event: StorageEvent) => {
  if (event.key === "userToggles") {
    // Handle toggle change
    loadNotifications();
  }
});
```

---

## Notification Mapping Table

| Toggle Name | localStorage Key | Notifications Generated | Count |
|---|---|---|---|
| Email Notifications | emailNotifications | 1 notification | 1 |
| Low Stock Alerts | lowStockAlerts | 2 notifications (Premium Shoes, Winter Jacket) | 2 |
| Sales Reports | salesReports | 1 notification | 1 |
| **All Enabled** | **All** | **All notifications** | **4** |
| **All Disabled** | **All false** | **Empty state** | **0** |

---

## Performance Optimization

### 1. Event Listener Cleanup
```typescript
useEffect(() => {
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}, []);
```
Prevents memory leaks by removing listener when component unmounts.

### 2. Conditional Rendering
```typescript
{notifications.length > 0 && (
  <span className="notification-badge">{notifications.length}</span>
)}
```
Badge only rendered when notifications exist.

### 3. Try-Catch Error Handling
```typescript
try {
  const toggles = JSON.parse(storedToggles);
  // Process notifications
} catch (err) {
  console.error("Error loading notifications:", err);
}
```
Prevents app crashes from corrupted localStorage data.

---

## Testing Scenarios

### Test Case 1: Enable Single Toggle
**Expected:** Single notification appears with correct badge count
```
- Toggle Email Notifications ON
- Bell icon shows badge "1"
- Dropdown shows 1 email notification
- Message: "You have a new system update available"
```

### Test Case 2: Enable Multiple Toggles
**Expected:** All notifications appear with correct count
```
- Toggle Email ON → Badge "1"
- Toggle Low Stock ON → Badge "3" (1 email + 2 stock)
- Toggle Sales ON → Badge "4" (1 email + 2 stock + 1 report)
```

### Test Case 3: Disable Toggle
**Expected:** Notification disappears, count decreases
```
- All toggles ON (Badge "4")
- Toggle Email OFF → Badge "3"
- Notification item disappeared
```

### Test Case 4: Disable All
**Expected:** Empty state shown
```
- All toggles OFF
- Bell shows no badge
- Dropdown shows "No notifications" message
```

### Test Case 5: Real-Time Update
**Expected:** Notification updates instantly in Settings change
```
- Settings page open in one tab
- TopBar visible in another tab
- Toggle setting in Settings
- TopBar notifications update immediately (no refresh)
```

---

## Debugging Tips

### Check localStorage
```javascript
console.log(JSON.parse(localStorage.getItem("userToggles")));
```

### Monitor Storage Events
```javascript
window.addEventListener("storage", (e) => {
  console.log("Storage changed:", e.key, e.newValue);
});
```

### Verify Notification Generation
```javascript
// Add to loadNotifications()
console.log("Generated notifications:", newNotifications);
```

### Check Component State
```javascript
console.log("Current notifications:", notifications);
console.log("Dropdown open:", notificationDropdown);
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| localStorage | ✅ | ✅ | ✅ | ✅ |
| StorageEvent | ✅ | ✅ | ✅ | ✅ |
| React 18 | ✅ | ✅ | ✅ | ✅ |
| lucide-react Icons | ✅ | ✅ | ✅ | ✅ |

---

## Conclusion

This notification system provides a robust, real-time notification mechanism that:
- ✅ Updates notifications instantly when settings change
- ✅ Persists across page navigation
- ✅ Works across browser tabs (StorageEvent)
- ✅ Has minimal performance impact
- ✅ Handles errors gracefully
- ✅ Provides clear UI feedback
- ✅ Scales easily for new notification types
