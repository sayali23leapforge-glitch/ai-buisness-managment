import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { getIntegrations } from '../utils/integrationStore';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user has any connected integrations
      const connected = getIntegrations();
      
      if (connected.length === 0) {
        // No integrations connected, send to setup page
        navigate('/connect-business');
      } else {
        // Has integrations, send to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Card */}
        <div className="login-card">
          {/* Logo */}
          <div className="logo-container">
            <div className="logo-box">
              <span className="logo-icon">N</span>
            </div>
            <span className="logo-text">NAYANCE</span>
          </div>

          {/* Title */}
          <h1 className="login-title">
            Think Finance. Think Nayance.
          </h1>
          <p className="login-subtitle">
            Financial management platform for businesses
          </p>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ marginBottom: '1.5rem' }}>
            {/* Email Input */}
            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M15.171 11.586a4 4 0 111.414-1.414l2.121 2.121a1 1 0 11-1.414 1.414l-2.121-2.121z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="forgot-password">
              <button
                type="button"
                className="forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={loading}
              className="continue-button"
            >
              {loading ? 'Logging in...' : 'Continue'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          {/* Sign Up Section */}
          <div className="signup-section">
            <p className="no-account-text">
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="signup-button"
            >
              Create an Account
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="footer-text">
          © 2025 Nayance. All rights reserved.
        </p>
      </div>
    </div>
  );
}
