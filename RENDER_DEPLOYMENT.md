# Render Deployment Guide

This guide will help you deploy your AI Business Management application to Render with both frontend and backend on a single URL.

## Prerequisites

1. A [Render account](https://render.com) (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Push Your Code to Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repository-url>
git push -u origin main
```

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Configure the service:

   - **Name:** `ai-business-management` (or your preferred name)
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Build Command:** 
     ```
     npm install && npm run build && cd server && npm install
     ```
   - **Start Command:** 
     ```
     cd server && node index.js
     ```
   - **Instance Type:** Free (or choose paid for better performance)

### 3. Add Environment Variables

In the Render dashboard, add these environment variables (get values from your `.env` files):

#### Stripe (Required for billing)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

#### Firebase (Required for authentication & database)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### QuickBooks (Optional - if using QuickBooks integration)
- `QUICKBOOKS_CLIENT_ID`
- `QUICKBOOKS_CLIENT_SECRET`
- `QUICKBOOKS_REDIRECT_URI` - Set this to `https://your-app-name.onrender.com/api/quickbooks/callback`

#### Shopify (Optional - if using Shopify integration)
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`

#### Other
- `NODE_ENV` - Set to `production`
- `CLIENT_DOMAIN` - Set to `https://your-app-name.onrender.com`

### 4. Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your application
3. Wait for the build to complete (usually 5-10 minutes)
4. Your app will be available at `https://your-app-name.onrender.com`

## After Deployment

### Update Stripe Webhook URL

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add a new webhook endpoint: `https://your-app-name.onrender.com/webhook`
3. Select the events you want to listen to
4. Copy the webhook signing secret and update the `STRIPE_WEBHOOK_SECRET` environment variable in Render

### Update QuickBooks Redirect URI

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com/)
2. Update your app's redirect URI to: `https://your-app-name.onrender.com/api/quickbooks/callback`

### Update Shopify App URL

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Update your app's URL to: `https://your-app-name.onrender.com`

## Troubleshooting

### Build Fails

- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build`

### App Doesn't Load

- Check the service logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure the PORT environment variable is not hardcoded

### API Routes Not Working

- Verify API routes start with `/api/`
- Check CORS settings in `server/index.js`
- Check server logs for errors

### Free Tier Limitations

- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Upgrade to paid tier for always-on service

## Monitoring

- **Logs:** View real-time logs in Render dashboard
- **Metrics:** Monitor CPU, memory, and bandwidth usage
- **Health Check:** Configure health check endpoint at `/health`

## Custom Domain (Optional)

1. Go to your service settings in Render
2. Click **"Custom Domains"**
3. Add your domain
4. Update DNS records as instructed by Render

## Updating Your App

Render automatically redeploys when you push to your main branch:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

## Cost

- **Free Tier:** Good for testing and small projects
  - 750 hours/month free
  - Service spins down after 15 min of inactivity
  - 512 MB RAM, 0.1 CPU

- **Paid Tier ($7/month):** For production apps
  - Always on
  - More resources
  - Better performance

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
