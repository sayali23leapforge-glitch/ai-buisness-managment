import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, AlertCircle, Loader } from 'lucide-react';
import { getInviteById, updateInviteStatus, TeamInvite } from '../utils/teamInviteStore';
import '../styles/AcceptInvite.css';

export default function AcceptInvite() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<TeamInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteId) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      const inviteData = await getInviteById(inviteId);

      if (!inviteData) {
        setError('Invite not found or has expired');
        setLoading(false);
        return;
      }

      if (inviteData.status !== 'pending') {
        setError(`This invite has already been ${inviteData.status}`);
        setLoading(false);
        return;
      }

      setInvite(inviteData);
      setLoading(false);
    };

    loadInvite();
  }, [inviteId]);

  const handleAccept = async () => {
    if (!invite) return;

    setActionLoading(true);
    const result = await updateInviteStatus(invite.id, 'accepted');

    if (result.success) {
      setActionMessage('✓ Invite accepted successfully! Redirecting...');
      setTimeout(() => {
        navigate('/team-management');
      }, 2000);
    } else {
      setActionMessage(`✗ Error: ${result.message}`);
    }
    setActionLoading(false);
  };

  const handleDecline = async () => {
    if (!invite) return;

    setActionLoading(true);
    const result = await updateInviteStatus(invite.id, 'rejected');

    if (result.success) {
      setActionMessage('✓ Invite declined. Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setActionMessage(`✗ Error: ${result.message}`);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="accept-invite-container">
        <div className="accept-invite-card">
          <div className="loading-state">
            <Loader size={40} className="spin-icon" />
            <p>Loading your invite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accept-invite-container">
        <div className="accept-invite-card">
          <div className="error-state">
            <AlertCircle size={48} className="error-icon" />
            <h2>Invite Error</h2>
            <p>{error}</p>
            <button className="action-btn" onClick={() => navigate('/')}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accept-invite-container">
      <div className="accept-invite-card">
        {actionMessage ? (
          <div className={`action-message ${actionMessage.includes('✗') ? 'error' : 'success'}`}>
            {actionMessage}
          </div>
        ) : (
          <>
            <div className="invite-header">
              <div className="logo-box">
                <span className="logo-icon">N</span>
              </div>
              <h1>Nayance</h1>
            </div>

            <div className="invite-content">
              <h2>You've Been Invited!</h2>
              <p className="invite-message">
                You have been invited to join Nayance as a <strong>{invite?.role}</strong>
              </p>

              <div className="invite-details">
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{invite?.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">{invite?.role}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value pending">{invite?.status}</span>
                </div>
              </div>

              <p className="invite-description">
                Accept this invitation to join the Nayance team and start collaborating.
              </p>
            </div>

            <div className="invite-actions">
              <button
                className="action-btn decline-btn"
                onClick={handleDecline}
                disabled={actionLoading}
              >
                <X size={18} />
                Decline
              </button>
              <button
                className="action-btn accept-btn"
                onClick={handleAccept}
                disabled={actionLoading}
              >
                <Check size={18} />
                {actionLoading ? 'Processing...' : 'Accept Invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
