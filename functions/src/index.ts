import * as functions from "firebase-functions";
import * as sgMail from "@sendgrid/mail";
import * as cors from "cors";

const corsHandler = cors({ origin: true });

// Initialize SendGrid with API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export const sendInviteEmail = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Only allow POST
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { email, inviteId, inviteLink, role } = req.body;

      // Validate inputs
      if (!email || !inviteId || !inviteLink) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Prepare email
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@nayance.com",
        subject: "You're Invited to Join Nayance",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px; text-align: center; border-radius: 8px;">
              <div style="background: #000; border: 2px solid #d4af37; border-radius: 8px; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 28px; font-weight: 700; color: #d4af37; line-height: 1;">N</span>
              </div>
              <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Nayance</h1>
              <p style="color: #888; margin: 8px 0 0 0; font-size: 13px;">Financial Management Platform</p>
            </div>

            <div style="background: #f9fafb; padding: 40px; border-radius: 8px; margin-top: 20px;">
              <h2 style="color: #111; margin: 0 0 20px 0; font-size: 24px;">You're Invited!</h2>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Hello,
              </p>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                You have been invited to join the <strong>Nayance</strong> team as a <strong>${role}</strong>.
              </p>

              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Click the button below to accept your invitation and get started with managing your business finances:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="background: linear-gradient(180deg, #d4af37, #b7871a); color: #000; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 15px; border: none;">
                  Accept Invitation →
                </a>
              </div>

              <div style="background: #f0f0f0; border-left: 4px solid #d4af37; padding: 12px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  <strong>Or copy this link:</strong><br/>
                  <code style="color: #d4af37; word-break: break-all;">${inviteLink}</code>
                </p>
              </div>

              <p style="color: #888; font-size: 13px; margin: 24px 0 0 0;">
                This invitation will expire in 7 days. If you have any questions, please contact the Nayance team.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #999; font-size: 11px;">
              <p style="margin: 0;">© 2025 Nayance. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      // Send email
      await sgMail.send(msg as sgMail.MailDataRequired);

      return res.status(200).json({
        success: true,
        message: `Invite sent to ${email}`,
      });
    } catch (error: any) {
      console.error("SendGrid Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to send email",
      });
    }
  });
});
