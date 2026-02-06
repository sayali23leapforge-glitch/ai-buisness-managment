# Setup Email Invitations with SendGrid + Firebase Cloud Functions

## Step 1: Get SendGrid API Key
1. Go to https://sendgrid.com
2. Sign up (free account available)
3. Create an API key: Settings → API Keys → Create API Key
4. Copy your API key (keep it safe!)

## Step 2: Verify Sender Email
1. In SendGrid dashboard: Sender Authentication
2. Verify a domain or single sender email address
3. Use this email in the Cloud Function (line: `from: 'your-email@domain.com'`)

## Step 3: Set Up Firebase Cloud Functions

### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### Configure Cloud Function
1. In your project folder, add the SendGrid function
2. Update `functions/package.json`:
```json
{
  "dependencies": {
    "firebase-functions": "^4.0.0",
    "firebase-admin": "^11.0.0",
    "@sendgrid/mail": "^7.7.0"
  }
}
```

3. Install dependencies:
```bash
cd functions
npm install
```

### Set SendGrid API Key
```bash
firebase functions:config:set sendgrid.key="your-sendgrid-api-key"
```

### Deploy
```bash
firebase deploy --only functions
```

This will give you a URL like:
```
https://us-central1-ai-buisness-managment-d90e0.cloudfunctions.net/sendInviteEmail
```

## Step 4: Update Your React App

Add to your `.env` file:
```
REACT_APP_EMAIL_SERVICE_URL=https://us-central1-ai-buisness-managment-d90e0.cloudfunctions.net/sendInviteEmail
```

Then restart your dev server:
```bash
npm run dev
```

## Step 5: Test
1. Open Team Management page
2. Click "Add Employee"
3. Enter email and role
4. Click "Send Invite"
5. Check the email inbox (or spam folder)

The invite email will contain a professional card with:
- Nayance branding
- Role information
- Accept button with invite link
- Link to manually copy and paste

---

## Alternative: Use Simple Email Service (No Setup Required)

If you want to test without SendGrid, you can use:
- **Mailgun** (free tier available)
- **Resend** (modern email API)
- **AWS SES** (through Firebase)

Contact support if you need help setting up any of these!
