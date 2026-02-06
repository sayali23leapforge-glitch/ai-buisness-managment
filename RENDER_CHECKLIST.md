# ✅ Render Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.

## Pre-Deployment

- [ ] All code is tested locally
- [ ] Production build works: `npm run build`
- [ ] Production server works: `./start-production.bat` (or `.sh` on Mac/Linux)
- [ ] All environment variables are documented
- [ ] `.gitignore` is properly configured
- [ ] Firebase service account file is NOT committed (should be in .gitignore)

## Git Repository

- [ ] Code is pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible
- [ ] All sensitive files are ignored (.env, firebase-service-account.json)

## Render Setup

- [ ] Render account created
- [ ] New Web Service created
- [ ] Repository connected to Render
- [ ] Build command set: `npm install && npm run build && cd server && npm install`
- [ ] Start command set: `cd server && node index.js`
- [ ] Environment set to: `Node`

## Environment Variables (Add in Render Dashboard)

### Required - Stripe
- [ ] `STRIPE_SECRET_KEY` - From Stripe Dashboard
- [ ] `STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - Will get after setting up webhook

### Required - Firebase
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

### Optional - QuickBooks (if using)
- [ ] `QUICKBOOKS_CLIENT_ID`
- [ ] `QUICKBOOKS_CLIENT_SECRET`
- [ ] `QUICKBOOKS_REDIRECT_URI` - Set to: `https://your-app.onrender.com/api/quickbooks/callback`

### Optional - Shopify (if using)
- [ ] `SHOPIFY_API_KEY`
- [ ] `SHOPIFY_API_SECRET`

### Other
- [ ] `NODE_ENV` - Set to: `production`
- [ ] `CLIENT_DOMAIN` - Set to: `https://your-app.onrender.com`

## Firebase Admin Setup

Since Firebase service account file can't be committed, you need to either:

**Option A: Use Environment Variables**
- [ ] Convert firebase-service-account.json to environment variable
- [ ] Add `FIREBASE_SERVICE_ACCOUNT` with the JSON content as string

**Option B: Use Firebase Admin with Client Credentials**
- [ ] Configure Firebase Admin to use individual credentials instead of service account file

## Deploy

- [ ] Click "Create Web Service" or "Deploy"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check build logs for errors
- [ ] Verify deployment succeeded

## Post-Deployment

### Test Your App
- [ ] Visit your Render URL: `https://your-app.onrender.com`
- [ ] Test user login/signup
- [ ] Test API endpoints: `/health`, `/api/*`
- [ ] Check browser console for errors

### Update External Services

#### Stripe
- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
- [ ] Add webhook endpoint: `https://your-app.onrender.com/webhook`
- [ ] Select webhook events
- [ ] Copy webhook signing secret
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Render

#### QuickBooks (if using)
- [ ] Go to [QuickBooks Developer Portal](https://developer.intuit.com/)
- [ ] Update redirect URI: `https://your-app.onrender.com/api/quickbooks/callback`

#### Shopify (if using)
- [ ] Go to [Shopify Partners](https://partners.shopify.com/)
- [ ] Update app URL: `https://your-app.onrender.com`

### Monitor
- [ ] Check Render logs for any errors
- [ ] Monitor performance metrics
- [ ] Set up custom domain (optional)

## Troubleshooting

If deployment fails:
1. Check build logs in Render dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check for missing dependencies
5. Verify Node version compatibility

If app doesn't load:
1. Check runtime logs in Render dashboard
2. Verify environment variables are correct
3. Check Firebase configuration
4. Test API health endpoint: `/health`

## Notes

- **Free Tier**: Service sleeps after 15 min inactivity (30-60s cold start)
- **Paid Tier**: Always-on service, better performance ($7/month)
- **Auto-Deploy**: Render auto-deploys when you push to main branch
- **Custom Domain**: Can be added in Render dashboard

## Success! 🎉

When all items are checked, your app is live at: `https://your-app.onrender.com`
