import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { saveQuickBooksCredentials } from "../utils/quickbooksStore";
import "../styles/ConnectQuickBooks.css";

interface ConnectQuickBooksProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConnectQuickBooks: React.FC<ConnectQuickBooksProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"instructions" | "processing" | "success">(
    "instructions"
  );
  const [companyId, setCompanyId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuthFlow = async () => {
    if (!companyId || !clientId || !clientSecret) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("processing");

    try {
      // In a real implementation, this would redirect to OAuth
      // For now, we're simulating the flow
      const oauthUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(
        `${window.location.origin}/quickbooks-callback`
      )}&state=${user?.uid}`;

      // Store OAuth state in sessionStorage
      sessionStorage.setItem(
        "qb_oauth_state",
        JSON.stringify({
          userId: user?.uid,
          companyId,
          clientId,
          clientSecret,
        })
      );

      // Redirect to OAuth
      window.location.href = oauthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStep("instructions");
      setLoading(false);
    }
  };

  const handleManualTokenEntry = async () => {
    if (!companyId || !clientId || !clientSecret) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("processing");

    try {
      if (!user?.uid) throw new Error("User not authenticated");

      // In production, exchange code for tokens via backend
      // For demo, we'll simulate the process
      const response = await fetch("http://localhost:4242/api/quickbooks/oauth-callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          companyId,
          clientId,
          clientSecret,
          code: "", // Would come from OAuth redirect
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to authenticate with QuickBooks");
      }

      const data = await response.json();

      // Save credentials to Firestore
      await saveQuickBooksCredentials(
        user.uid,
        companyId,
        data.accessToken,
        data.refreshToken,
        data.expiresIn
      );

      setStep("success");
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStep("instructions");
      setLoading(false);
    }
  };

  return (
    <div className="qb-modal-overlay" onClick={onClose}>
      <div className="qb-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="qb-modal-close" onClick={onClose}>
          ✕
        </button>

        {step === "instructions" && (
          <>
            <h2>Connect QuickBooks Online</h2>
            <div className="qb-instructions">
              <div className="qb-info-box">
                <h3>📋 Prerequisites</h3>
                <ul>
                  <li>Active QuickBooks Online account</li>
                  <li>Admin access to your company file</li>
                  <li>OAuth credentials from Intuit Developer Portal</li>
                </ul>
              </div>

              <div className="qb-form-section">
                <h3>Step 1: Get Your OAuth Credentials</h3>
                <ol>
                  <li>Go to <a href="https://developer.intuit.com" target="_blank" rel="noreferrer">developer.intuit.com</a></li>
                  <li>Create an app in the Developer Portal</li>
                  <li>Copy your Client ID and Client Secret</li>
                  <li>Find your Company ID (Realm ID) in your QB account</li>
                </ol>
              </div>

              <div className="qb-form-section">
                <h3>Step 2: Enter Your Credentials</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleManualTokenEntry();
                  }}
                >
                  <div className="form-group">
                    <label>Company ID (Realm ID)*</label>
                    <input
                      type="text"
                      placeholder="e.g., 1234567890"
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Client ID*</label>
                    <input
                      type="password"
                      placeholder="Your OAuth Client ID"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Client Secret*</label>
                    <input
                      type="password"
                      placeholder="Your OAuth Client Secret"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  {error && <div className="qb-error">{error}</div>}

                  <button
                    type="submit"
                    className="qb-btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Connecting..." : "Connect QuickBooks"}
                  </button>
                </form>
              </div>

              <div className="qb-info-box qb-security-note">
                <h4>🔒 Security Note</h4>
                <p>
                  Your credentials are encrypted and stored securely in your account.
                  We never display them again after this step.
                </p>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="qb-processing">
            <div className="qb-spinner"></div>
            <h2>Connecting to QuickBooks...</h2>
            <p>Please wait while we authenticate your account</p>
          </div>
        )}

        {step === "success" && (
          <div className="qb-success">
            <div className="qb-success-icon">✓</div>
            <h2>Successfully Connected!</h2>
            <p>Your QuickBooks account is now linked to Nayance</p>
            <p className="qb-success-detail">
              Your financial data will sync automatically every 5 minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectQuickBooks;
