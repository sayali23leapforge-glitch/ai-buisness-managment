import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ConnectBusiness from "./pages/ConnectBusiness";
import AcceptInvite from "./pages/AcceptInvite";

import Dashboard from "./pages/Dashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import InventoryManager from "./pages/InventoryManager";
import RecordSale from "./pages/RecordSale";
import AddProduct from "./pages/AddProduct";
import QRManager from "./pages/QRManager"; 
import AIInsights from "./pages/AIInsights";
import FinancialReports from "./pages/FinancialReports";
import TaxCenter from "./pages/TaxCenter";
import TeamManagement from "./pages/TeamManagement";
import BillingPlan from "./pages/BillingPlan";
import ImprovementHub from "./pages/ImprovementHub";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";

import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* --- PUBLIC ROUTES --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/accept-invite/:inviteId" element={<AcceptInvite />} />
          <Route path="/connect-business" element={<ProtectedRoute><ConnectBusiness /></ProtectedRoute>} />

          {/* --- PROTECTED ROUTES --- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory-dashboard"
            element={
              <ProtectedRoute>
                <InventoryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/record-sale"
            element={
              <ProtectedRoute>
                <RecordSale />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-product"
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory-manager"
            element={
              <ProtectedRoute>
                <InventoryManager />
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW — QR & BARCODE MANAGER */}
          <Route
            path="/qr-barcodes"
            element={
              <ProtectedRoute>
                <QRManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qr-&-barcodes"
            element={
              <ProtectedRoute>
                <QRManager />
              </ProtectedRoute>
            }
          />
          <Route path="/ai-insights" element={<ProtectedRoute><AIInsights/></ProtectedRoute>} />

          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* DEFAULT ROUTE → SEND TO LOGIN */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* WILDCARD ROUTE → ANY UNKNOWN URL */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/financial-reports"
            element={
              <ProtectedRoute>
                <FinancialReports />
              </ProtectedRoute>
            }
          />
           <Route
            path="/tax-center"
            element={
              <ProtectedRoute>
                <TaxCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-management"
            element={
              <ProtectedRoute>
                <TeamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing-plan"
            element={
              <ProtectedRoute>
                <BillingPlan />
              </ProtectedRoute>
            }
          />

          <Route
            path="/improvement-hub"
            element={
              <ProtectedRoute>
                <ImprovementHub />
              </ProtectedRoute>
            }
          />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
