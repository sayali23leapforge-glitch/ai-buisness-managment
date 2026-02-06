import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, DollarSign, CreditCard, Square, Zap, TrendingUp, Check
} from "lucide-react";
import { getIntegrations, addIntegration } from "../utils/integrationStore";
import "../styles/ConnectBusiness.css";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export default function ConnectBusiness() {
  const navigate = useNavigate();
  const [connectedApps, setConnectedApps] = useState<string[]>(getIntegrations());
  const [showModal, setShowModal] = useState(false);

  const integrations: Integration[] = [
    {
      id: "shopify",
      name: "Shopify",
      description: "Connect to import orders, products and financial data",
      icon: <ShoppingCart size={24} />,
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Connect to import orders, products and financial data",
      icon: <DollarSign size={24} />,
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Connect to import orders, products and financial data",
      icon: <CreditCard size={24} />,
    },
    {
      id: "square",
      name: "Square",
      description: "Connect to import orders, products and financial data",
      icon: <Square size={24} />,
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      description: "Connect to import orders, products and financial data",
      icon: <Zap size={24} />,
    },
    {
      id: "xero",
      name: "Xero",
      description: "Connect to import orders, products and financial data",
      icon: <TrendingUp size={24} />,
    },
  ];

  const handleConnect = (integration: Integration) => {
    addIntegration(integration.id);
    setShowModal(true);
    setConnectedApps(getIntegrations());
  };

  const handleContinue = () => {
    if (connectedApps.length > 0) {
      navigate("/dashboard");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="connect-business-wrapper">
      <div className="connect-business-container">
        {/* Header */}
        <div className="connect-header">
          <h1 className="connect-title">Connect Your Business Data</h1>
          <p className="connect-subtitle">
            Choose a business app to get started. You can change this anytime.
          </p>
        </div>

        {/* Integration Cards Grid */}
        <div className="integrations-grid">
          {integrations.map((integration) => {
            const isConnected = connectedApps.includes(integration.id);
            return (
              <div
                key={integration.id}
                className={`integration-card ${isConnected ? "connected" : ""}`}
              >
                <div className="card-icon">{integration.icon}</div>

                <div className="card-header">
                  <h3 className="card-name">{integration.name}</h3>
                  {isConnected && <div className="connected-badge">Connected</div>}
                </div>

                <p className="card-description">{integration.description}</p>

                <button
                  className={`connect-btn ${isConnected ? "connected" : ""}`}
                  onClick={() => handleConnect(integration)}
                  disabled={isConnected}
                >
                  {isConnected ? "Connected" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="continue-btn-container">
          <button
            className="continue-btn"
            onClick={handleContinue}
            disabled={connectedApps.length === 0}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-checkmark">
              <Check size={32} />
            </div>
            <p className="modal-message">
              Connected successfully (demo)
            </p>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
