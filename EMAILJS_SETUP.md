# EmailJS Setup Guide - Complete Instructions

## Step 1: Create EmailJS Account & Get API Keys

1. **Go to EmailJS:** https://www.emailjs.com
2. **Sign Up** (free account available)
3. **Verify your email**
4. **In Dashboard:**
   - Go to **Account** → **API Keys**
   - Copy your **Public Key** (starts with `_`)
   - Save it somewhere safe

## Step 2: Add an Email Provider

EmailJS connects to your email provider. Choose one:

### Option A: Gmail (Easiest)
1. In EmailJS Dashboard, click **Email Services** → **Add New Service**
2. Select **Gmail**
3. Click **Connect Gmail Account**
4. Authorize the connection
5. Name it something like `gmail_service`
6. Copy the **Service ID** (example: `service_ab123cd`)

### Option B: Other Email Providers
- Outlook, Yahoo, SendGrid, Mailgun, etc.
- Follow similar process in EmailJS dashboard

## Step 3: Create an Email Template

1. In EmailJS Dashboard, go to **Email Templates**
2. Click **Create New Template**
3. Name it `team_invite_template`
4. **Subject:** `You're Invited to Join Nayance`
5. **HTML Content:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px; text-align: center; border-radius: 8px;">
    <div style="background: #000; border: 2px solid #d4af37; border-radius: 8px; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
      <span style="font-size: 28px; font-weight: 700; color: #d4af37;">N</span>
    </div>
    <h1 style="color: #d4af37; margin: 0;">Nayance</h1>
  </div>

  <div style="background: #f9fafb; padding: 40px; border-radius: 8px; margin-top: 20px;">
    <h2 style="color: #111;">You're Invited!</h2>
    
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      You have been invited to join <strong>Nayance</strong> as a <strong>{{role}}</strong>.
    </p>

    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Click the button below to accept your invitation:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invite_link}}" style="background: linear-gradient(180deg, #d4af37, #b7871a); color: #000; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="color: #888; font-size: 12px;">
      Or copy this link: <br>
      <a href="{{invite_link}}" style="color: #d4af37;">{{invite_link}}</a>
    </p>

    <p style="color: #888; font-size: 12px; margin-top: 30px;">
      This invitation expires in 7 days.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>© 2025 Nayance. All rights reserved.</p>
  </div>
</div>
```

6. **Template Variables:** Make sure these are in your template:
   - `{{role}}` - Employee role
   - `{{invite_link}}` - Invite acceptance link
   - `{{to_email}}` - Recipient email

7. **Test Variables:**
   - role: `Accountant`
   - invite_link: `https://yourapp.com/accept-invite/test123`

8. Save the template
9. Copy the **Template ID** (example: `template_abc123def`)

## Step 4: Update Your React App Environment Variables

1. Create a `.env` file in your project root:
```
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_from_step_1
REACT_APP_EMAILJS_SERVICE_ID=service_id_from_step_2
REACT_APP_EMAILJS_TEMPLATE_ID=template_id_from_step_3
```

2. **Example:**
```
REACT_APP_EMAILJS_PUBLIC_KEY=_Ux9K4pL5mN6oP7qR8s
REACT_APP_EMAILJS_SERVICE_ID=service_gmail_123abc
REACT_APP_EMAILJS_TEMPLATE_ID=template_invite_xyz789
```

3. Save the file
4. **Restart your development server:** `npm run dev`

## Step 5: Test the System

1. Open your app at `http://localhost:3000`
2. Log in to your account
3. Go to **Team Management**
4. Click **Add Employee**
5. Enter:
   - Email: (test email you have access to)
   - Role: `Accountant`
6. Click **Send Invite**
7. Check your email inbox (or spam folder)
8. You should receive the invitation email!
9. Click the link to test the accept invite page

## Step 6: Customize (Optional)

- **Change email template** in EmailJS dashboard
- **Change sender email** through Gmail/provider settings
- **Add company branding** to the email HTML

## Troubleshooting

### "Email not received"
- Check spam/junk folder
- Verify email address is correct
- Check EmailJS Service is active
- Verify Gmail authentication (if using Gmail provider)

### "Failed to send email" error
- Check console for error message
- Verify all 3 environment variables are set correctly
- Make sure template variables are: `{{role}}`, `{{invite_link}}`, `{{to_email}}`
- Check EmailJS account quotas (free account has 200/month)

### "Missing environment variables" warning
- Ensure `.env` file is in project root
- Restart dev server after adding `.env`
- Check variable names are exact (case-sensitive)

## Production Deployment

When deploying to production:
1. Add environment variables to your hosting platform (Vercel, Netlify, etc.)
2. Update `invite_link` in code if your domain changes
3. Monitor EmailJS usage quota
4. Consider upgrading EmailJS plan if needed

---

**That's it!** Your team invite system with real emails is now ready! 🎉
