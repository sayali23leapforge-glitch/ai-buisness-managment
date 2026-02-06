# Billing & Plan System Setup Guide

## Overview
This is a complete Stripe Checkout integration with:
- Frontend React/TypeScript billing page
- Node.js/Express backend for Stripe
- Webhook handling for subscription events
- Dark theme UI matching your design

## Frontend Setup

### 1. Update `.env` file

Copy the pricing from `.env.billing` into your main `.env`:

```
VITE_STRIPE_PRICE_GROWTH_MONTHLY=price_xxx
VITE_STRIPE_PRICE_GROWTH_YEARLY=price_xxx
VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxx
VITE_STRIPE_PRICE_PRO_YEARLY=price_xxx
VITE_API_URL=http://localhost:4242
```

### 2. Get Stripe Price IDs

1. Go to https://dashboard.stripe.com/products
2. Create 4 recurring prices:
   - **Growth Monthly**: $99/month
   - **Growth Yearly**: $990/year
   - **Pro Monthly**: $249/month
   - **Pro Yearly**: $2490/year
3. Copy the price IDs (they look like `price_1QyXXxXXXXXXXXXX`)
4. Paste them into your `.env` file

### 3. Frontend Route

The BillingPlan page is already added to `src/App.tsx` at route `/billing-plan`

Access it at: `http://localhost:3000/billing-plan`

## Backend Setup

### 1. Install Dependencies

```bash
cd server
npm install express stripe dotenv cors
```

### 2. Create `.env` file in `/server`

```bash
cp .env.example .env
```

Then edit with your Stripe keys:

```
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
CLIENT_DOMAIN=http://localhost:3000
PORT=4242
```

### 3. Get Stripe Keys

1. **Secret Key**: https://dashboard.stripe.com/apikeys
   - Copy the "Secret key" (starts with `sk_test_`)

2. **Webhook Secret**: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `http://localhost:4242/webhook`
   - Events: Select:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the "Signing secret" (starts with `whsec_`)

### 4. Start Backend Server

```bash
cd server
node index.js
```

You should see:
```
🚀 Stripe server running on http://localhost:4242
📝 Webhook endpoint: http://localhost:4242/webhook
```

## Testing

### 1. Start both servers

**Terminal 1** (Frontend):
```bash
npm run dev
```

**Terminal 2** (Backend):
```bash
cd server
node index.js
```

### 2. Navigate to Billing Page

Open: `http://localhost:3000/billing-plan`

### 3. Test Checkout

1. Click "Upgrade to Growth" or "Upgrade to Pro"
2. You'll be redirected to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
4. Any future date and any CVC
5. Complete the payment

### 4. Check Webhook Logs

The backend will log events like:
```
✅ Checkout session completed: { sessionId: '...', customerId: '...', ... }
✅ Invoice payment succeeded: { ... }
✅ Subscription created: { ... }
```

## File Structure

```
src/
  pages/
    BillingPlan.tsx          # Main billing page component
  styles/
    BillingPlan.css          # Styling

server/
  index.js                   # Express server + Stripe integration
  .env.example               # Environment variables template
  .env                       # Your actual keys (not in git)

.env.billing                 # Frontend pricing config template
```

## API Endpoints

### POST /create-checkout-session

Creates a Stripe Checkout session.

**Request:**
```json
{
  "priceId": "price_xxx",
  "customerEmail": "user@example.com",
  "successUrl": "http://localhost:3000/billing-success",
  "cancelUrl": "http://localhost:3000/billing-plan"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST /webhook

Handles Stripe webhook events. No request body needed - Stripe sends events automatically.

**Events Handled:**
- `checkout.session.completed` - Payment processed
- `invoice.payment_succeeded` - Recurring payment received
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

## Features

✅ Three pricing tiers: Free, Growth, Pro
✅ Monthly/Yearly toggle with 17% discount
✅ "Most Popular" badge on Growth
✅ Growth plan highlighted with gold border
✅ Responsive design
✅ Dark theme with gold accents
✅ Stripe Checkout integration
✅ Webhook event logging
✅ FAQ section
✅ Loading states

## Next Steps

After confirming webhook delivery:

1. **Save Subscriptions to Database**
   - In `server/index.js`, update the webhook handlers
   - Create database records for new subscriptions
   - Store `customerId`, `subscriptionId`, `priceId`, `status`

2. **Add Success Page**
   - Create `/billing-success` route to confirm payment
   - Show "Welcome to Growth/Pro plan!"

3. **Add Subscription Management**
   - Let users view current plan
   - Add "Manage Subscription" button (links to Stripe portal)
   - Show usage metrics

4. **Email Confirmations**
   - Send welcome email after successful upgrade
   - Use EmailJS or SendGrid

## Troubleshooting

**Port 4242 already in use:**
```bash
# Kill the process
lsof -i :4242
kill -9 <PID>
```

**Webhook not receiving events:**
1. Make sure backend is running on `http://localhost:4242`
2. Check Stripe dashboard → Webhooks → View logs
3. Verify signing secret is correct in `.env`

**Checkout redirecting to wrong URL:**
- Check `VITE_API_URL` in frontend `.env`
- Check `CLIENT_DOMAIN` in backend `.env`
- Both should match your domain

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Support

For issues with Stripe integration, see:
- https://stripe.com/docs/payments/checkout
- https://stripe.com/docs/webhooks
- https://stripe.com/docs/testing
