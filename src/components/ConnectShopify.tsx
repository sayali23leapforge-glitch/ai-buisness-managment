/**
 * ConnectShopify Modal Component
 * Modal form for users to connect their Shopify store to Nayance
 */

import { useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "../styles/ConnectShopify.css";

interface ConnectShopifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConnectShopify({
  isOpen,
  onClose,
}: ConnectShopifyProps) {
  const { user } = useAuth();
  const [shopUrl, setShopUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "redirecting">("form");

  const formatShopUrl = (url: string): string => {
    // Remove https:// or http://
    let cleaned = url.replace(/^https?:\/\//, "");
    // Remove trailing slash
    cleaned = cleaned.replace(/\/$/, "");
    // Ensure it ends with .myshopify.com
    if (!cleaned.includes(".myshopify.com")) {
      if (!cleaned.includes(".")) {
        // If just the store name is provided, add the domain
        cleaned = `${cleaned}.myshopify.com`;
      }
    }
    return cleaned;
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopUrl.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!user?.uid) {
      setError("You must be logged in to connect Shopify");
      return;
    }

    setLoading(true);
    setError("");
    setStep("redirecting");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:4242' : window.location.origin);
      
      // Detect backend port first (only for localhost)
      let backendPort = "4242";
      if (!import.meta.env.VITE_API_URL) {
        for (const port of ["4242", "5000", "3001"]) {
          try {
            const test = await fetch(`http://localhost:${port}/health`);
            if (test.status !== 404) {
              backendPort = port;
              break;
            }
          } catch (e) {}
        }
      }

      const formattedShopUrl = formatShopUrl(shopUrl);

      const baseUrl = import.meta.env.VITE_API_URL || `http://localhost:${backendPort}`;
      const startResponse = await fetch(
        `${baseUrl}/api/shopify/oauth/start?shop=${encodeURIComponent(
          formattedShopUrl
        )}&userId=${encodeURIComponent(user.uid)}`
      );

      const startData = await startResponse.json();

      if (!startResponse.ok || !startData.url) {
        throw new Error(startData.error || "Failed to start Shopify OAuth");
      }

      window.location.href = startData.url;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect to Shopify";
      setError(errorMessage);
      setStep("form");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShopUrl("");
    setError("");
    setStep("form");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container shopify-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Connect Your Shopify Store</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Form - Step 1 */}
        {step === "form" && (
          <>
            <div className="modal-body">
              <p className="modal-subtitle">
                Link your Shopify store to sync products, orders, and inventory in real-time.
              </p>

              <form onSubmit={handleConnect}>
                <div className="form-group">
                  <label htmlFor="shop-url">
                    <span>Shopify Store URL</span>
                    <span className="form-required">*</span>
                  </label>
                  <input
                    id="shop-url"
                    type="text"
                    placeholder="example.myshopify.com or just 'example'"
                    value={shopUrl}
                    onChange={(e) => {
                      setShopUrl(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                  />
                  <p className="form-hint">
                    Your Shopify store's URL. You can find this in your Shopify admin.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading || !shopUrl.trim()}
                >
                  {loading ? "Connecting..." : "Connect Shopify"}
                </button>
              </form>

              {/* Help Text */}
              <div className="modal-info-box">
                <h4>How this works:</h4>
                <ol>
                  <li>Enter your store URL and click Connect</li>
                  <li>You’ll be redirected to Shopify to approve access</li>
                  <li>After approval, you’ll return here automatically</li>
                </ol>
              </div>
            </div>
          </>
        )}

        {/* Redirecting - Step 2 */}
        {step === "redirecting" && (
          <div className="modal-body modal-center">
            <div className="loading-state">
              <Loader className="spinner" size={48} />
              <h3>Redirecting to Shopify...</h3>
              <p>Approve access to complete the connection</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
