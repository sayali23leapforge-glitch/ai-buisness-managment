// Firebase Cloud Function - Send Invite Email
// Deploy this to Firebase Cloud Functions
// Run: firebase deploy --only functions

import * as functions from 'firebase-functions';
import * as sgMail from '@sendgrid/mail';

// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export const sendInviteEmail = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { email, inviteId, inviteLink, role } = req.body;

    if (!email || !inviteId) {
      return res.status(400).json({ error: 'Email and inviteId required' });
    }

    const msg = {
      to: email,
      from: 'noreply@nayance.com', // Change this to your verified sender
      subject: 'You\'re Invited to Join Nayance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px; text-align: center; border-radius: 8px;">
            <div style="background: #000; border: 2px solid #d4af37; border-radius: 8px; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 28px; font-weight: 700; color: #d4af37;">N</span>
            </div>
            <h1 style="color: #d4af37; margin: 0 0 20px 0;">Nayance</h1>
          </div>

          <div style="background: #f9fafb; padding: 40px; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #111; margin-top: 0;">You're Invited!</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Hello,
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              You have been invited to join <strong>Nayance</strong> as a <strong>${role}</strong>.
            </p>

            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Click the button below to accept your invitation and get started:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background: linear-gradient(180deg, #d4af37, #b7871a); color: #000; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #888; font-size: 12px;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #d4af37; word-break: break-all; font-size: 12px;">
              ${inviteLink}
            </p>

            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              This invitation will expire in 7 days.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>© 2025 Nayance. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

    res.status(200).json({
      success: true,
      message: `Invite sent to ${email}`
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email'
    });
  }
});
