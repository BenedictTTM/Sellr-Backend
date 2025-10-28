# Webhook Setup Guide - CRITICAL for Production

## Why Webhooks Are Essential

Without webhooks, your slot purchase system has these critical flaws:

- Users pay money but never receive their slots
- No way to know when payments succeed/fail
- Manual intervention required for every transaction
- Poor user experience and potential revenue loss

## 1. Register Webhook with Paystack

### Development Setup:

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-backend-domain.com/payments/webhook`
3. Select events: `charge.success`, `charge.failed`

### Production Setup:

```bash
# Use ngrok for local testing
ngrok http 3001
# Copy the https URL and add /payments/webhook to it
```

## 2. Environment Variables Needed

```env
# In your .env file
PAYSTACK_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  # or pk_live_xxxxx for production
```

## 3. Test Webhook Locally

```bash
# Terminal 1: Start your backend
cd Backend
npm run start:dev

# Terminal 2: Expose with ngrok
ngrok http 3001

# Use the ngrok URL in Paystack webhook settings
# Example: https://abc123.ngrok.io/payments/webhook
```

## 4. Webhook Event Flow

```
User clicks "Buy Slots"
    ↓
Frontend redirects to Paystack
    ↓
User completes payment
    ↓
Paystack sends webhook to your backend
    ↓
Backend verifies signature
    ↓
Backend updates payment status
    ↓
Backend credits slots to user
    ↓
User sees slots in their account
```

## 5. Testing the Complete Flow

1. Create a test purchase via your frontend
2. Complete payment on Paystack (use test card: 4084084084084081)
3. Check your backend logs for webhook receipt
4. Verify slots were credited to the user

## 6. Production Checklist

- [ ] Webhook URL registered with Paystack
- [ ] HTTPS endpoint (required by Paystack)
- [ ] Signature verification enabled in production
- [ ] Error handling and logging
- [ ] Database backup strategy
- [ ] Monitoring for failed webhooks
