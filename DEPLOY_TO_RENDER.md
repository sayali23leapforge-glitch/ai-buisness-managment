# 🚀 Deploy to Render - Complete Guide

This project is configured to deploy on **Render** with both **frontend** (React) and **backend** (Express) served from a **single URL**.

## 📋 What You'll Need

1. ✅ A [Render](https://render.com) account (free tier available)
2. ✅ Your code in a Git repository (GitHub, GitLab, or Bitbucket)
3. ✅ Environment variables from your `.env` files
4. ✅ Firebase service account JSON file

## 🎯 Quick Start (3 Steps)

### Step 1: Prepare Firebase Service Account

Run this script to convert your Firebase credentials:

**Windows:**
```bash
prepare-firebase-for-render.bat
```

**Mac/Linux:**
```bash
chmod +x prepare-firebase-for-render.sh
./prepare-firebase-for-render.sh
```

Copy the output - you'll need it in Step 3.

### Step 2: Push to Git

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 3: Deploy on Render

#### Option A: Using Render Dashboard (Easier)

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Configure:
   - **Name:** `ai-business-management`
   - **Environment:** `Node`
   - **Build Command:** 
     ```
     npm install && npm run build && cd server && npm install
     ```
   - **Start Command:**
     ```
     cd server && node index.js
     ```

5. Add environment variables (see "Environment Variables" section below)
6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment

#### Option B: Using Blueprint (Faster)

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render auto-detects `render.yaml`
5. Add environment variables
6. Click **"Deploy"**

## 🔐 Environment Variables

Add these in Render dashboard under "Environment" tab:

### Required - Stripe

| Variable | Where to Find | Example |
|----------|---------------|---------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Set up after deployment (see Post-Deployment) | `whsec_...` |

### Required - Firebase

| Variable | Where to Find |
|----------|---------------|
| `FIREBASE_SERVICE_ACCOUNT` | Output from `prepare-firebase-for-render` script |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web App |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings |

### Optional - QuickBooks (if using)

| Variable | Value |
|----------|-------|
| `QUICKBOOKS_CLIENT_ID` | From QuickBooks Developer Portal |
| `QUICKBOOKS_CLIENT_SECRET` | From QuickBooks Developer Portal |
| `QUICKBOOKS_REDIRECT_URI` | `https://your-app.onrender.com/api/quickbooks/callback` |

### Optional - Shopify (if using)

| Variable | Value |
|----------|-------|
| `SHOPIFY_API_KEY` | From Shopify Partners Dashboard |
| `SHOPIFY_API_SECRET` | From Shopify Partners Dashboard |

### Other

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `CLIENT_DOMAIN` | `https://your-app.onrender.com` |

## ✅ Post-Deployment Setup

After your app is deployed, update these external services:

### 1. Stripe Webhooks

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://your-app.onrender.com/webhook`
4. **Events to send:** Select all events or specific ones you need
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update `STRIPE_WEBHOOK_SECRET` in Render environment variables
8. Redeploy your Render service

### 2. QuickBooks (if using)

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com/)
2. Select your app
3. Go to **"Keys & OAuth"**
4. Update **Redirect URI:** `https://your-app.onrender.com/api/quickbooks/callback`
5. Save changes

### 3. Shopify (if using)

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Select your app
3. Update **App URL:** `https://your-app.onrender.com`
4. Save changes

## 🧪 Testing Your Deployment

1. **Visit your app:** `https://your-app.onrender.com`
2. **Check health endpoint:** `https://your-app.onrender.com/health`
3. **Test login/signup**
4. **Test integrations** (QuickBooks, Shopify)
5. **Check browser console** for any errors

## 🔍 Troubleshooting

### Build Fails

**Check:**
- Build logs in Render dashboard
- All dependencies in `package.json`
- Build command is correct

**Fix:**
```bash
# Test locally first
npm run build
```

### App Doesn't Load

**Check:**
- Runtime logs in Render dashboard
- All environment variables are set
- Firebase credentials are correct

**Fix:**
- Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON
- Check all `VITE_` prefixed variables are set
- Ensure `NODE_ENV=production`

### API Routes Not Working

**Check:**
- Routes should start with `/api/`
- CORS settings in `server/index.js`
- Server logs for errors

### Slow First Load

**This is normal for free tier:**
- Service sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds (cold start)
- Upgrade to paid tier ($7/month) for always-on service

## 💰 Pricing

### Free Tier
- ✅ 750 hours/month free
- ✅ Perfect for testing and small projects
- ⚠️ Service sleeps after 15 min inactivity
- ⚠️ 512 MB RAM, 0.1 CPU

### Paid Tier ($7/month)
- ✅ Always on (no cold starts)
- ✅ Better performance
- ✅ More resources (512 MB+ RAM)
- ✅ Production-ready

## 🔄 Auto-Deploy

Render automatically redeploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 🌐 Custom Domain (Optional)

1. Go to your Render service settings
2. Click **"Custom Domains"**
3. Add your domain
4. Update DNS records as instructed
5. SSL certificate auto-generated

## 📊 Monitoring

View in Render dashboard:
- **Logs:** Real-time application logs
- **Metrics:** CPU, memory, bandwidth usage
- **Events:** Deployment history
- **Health:** Service status

## 📚 Additional Resources

- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Quick overview
- [RENDER_CHECKLIST.md](./RENDER_CHECKLIST.md) - Detailed checklist
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)

## 🎉 You're Live!

Once deployed, your app will be available at:
**`https://your-app-name.onrender.com`**

Both frontend and backend are served from this single URL:
- Frontend: `https://your-app-name.onrender.com/`
- API: `https://your-app-name.onrender.com/api/*`
- Health: `https://your-app-name.onrender.com/health`

---

Need help? Check [Render's documentation](https://render.com/docs) or the troubleshooting section above.
