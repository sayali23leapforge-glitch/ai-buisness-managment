import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { getIntegrations } from '../utils/integrationStore';

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    businessName: '',
    businessRole: 'Owner',
    country: '',
    province: '',
    city: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Save user profile data to localStorage
      const userProfile = {
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        businessName: formData.businessName,
        industry: formData.businessRole,
        taxId: '',
        country: formData.country,
        province: formData.province,
        city: formData.city,
      };
      localStorage.setItem("userProfile", JSON.stringify(userProfile));
      console.log("✅ Saved profile to localStorage:", userProfile);
      
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
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Card */}
        <div className="login-card signup-card">
          {/* Logo */}
          <div className="logo-container">
            <div className="logo-box">
              <div className="logo-icon">N</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="login-title">
            Create Your Account
          </h1>
          <p className="login-subtitle">
            Start managing your business finances
          </p>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp} style={{ marginBottom: '0.8rem' }}>
            {/* Full Name & Email - Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <div>
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Business Name & Business Role - Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <div>
                <label className="form-label">Business Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 3h-1a2 2 0 0 0-2 2v4H11V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4H2v10" />
                      <line x1="6" y1="14" x2="6" y2="20" />
                      <line x1="10" y1="14" x2="10" y2="20" />
                      <line x1="14" y1="14" x2="14" y2="20" />
                      <line x1="18" y1="14" x2="18" y2="20" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Business Role</label>
                <div className="input-wrapper">
                  <select
                    name="businessRole"
                    value={formData.businessRole}
                    onChange={handleChange}
                    className="form-input"
                    style={{ paddingLeft: '0.8rem' }}
                  >
                    <option value="Owner">Owner</option>
                    <option value="Manager">Manager</option>
                    <option value="Employee">Employee</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Country & Province/State - Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <div>
                <label className="form-label">Country</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </span>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="form-input"
                    style={{ paddingLeft: '2.8rem' }}
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Province/State</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="form-input"
                    style={{ paddingLeft: '2.8rem' }}
                  >
                    <option value="">Select province/state</option>
                    <option value="Ontario">Ontario</option>
                    <option value="Quebec">Quebec</option>
                    <option value="British Columbia">British Columbia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* City - Full Width */}
            <div style={{ marginBottom: '0.7rem' }}>
              <label className="form-label">City</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Toronto"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Password & Confirm Password - Row 4 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <div>
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
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
              <div>
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg style={{ width: '100%', height: '100%' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? (
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
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="continue-button"
              style={{ marginBottom: '0.6rem' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          {/* Sign In Section */}
          <div className="signup-section">
            <p className="no-account-text">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="signup-button"
              style={{ backgroundColor: '#000000', borderColor: '#000000', color: '#ffffff' }}
            >
              Sign In
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
