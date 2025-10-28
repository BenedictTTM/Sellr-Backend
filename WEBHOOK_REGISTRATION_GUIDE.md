# How to Register Webhook with Paystack - Step by Step Guide

## Method 1: Using Paystack Dashboard (Recommended for Development)

### Step 1: Access Paystack Dashboard

1. Go to [https://dashboard.paystack.com](https://dashboard.paystack.com)
2. Log in with your Paystack account
3. Make sure you're in the correct environment (Test/Live)

### Step 2: Navigate to Webhook Settings

1. Click on **Settings** in the left sidebar
2. Click on **Webhooks**
3. You'll see the webhook configuration page

### Step 3: Add Your Webhook URL

1. Click **"Add Endpoint"** or **"+"** button
2. Enter your webhook URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/payments/webhook`
   - **Production**: `https://your-domain.com/payments/webhook`
3. Select the events you want to receive:
   - ✅ `charge.success` (when payment succeeds)
   - ✅ `charge.failed` (when payment fails)
   - ✅ `transfer.success` (optional, for refunds)
   - ✅ `transfer.failed` (optional, for refunds)

### Step 4: Save and Test

1. Click **"Save"**
2. You'll see your webhook listed with a status indicator
3. Test it using the "Send Test Event" button

## Method 2: Using Paystack API (Programmatic)

### Step 1: Create Registration Script

Create a file called `register-webhook.js` in your Backend folder:

```javascript
const https = require('https');

const PAYSTACK_SECRET = 'sk_test_your_secret_key_here'; // Replace with your actual secret key
const WEBHOOK_URL = 'https://your-ngrok-url.ngrok.io/payments/webhook'; // Replace with your URL

const data = JSON.stringify({
  url: WEBHOOK_URL,
  events: ['charge.success', 'charge.failed'],
});

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/webhook',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  res.on('data', (chunk) => {
    console.log('Response:', chunk.toString());
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
```

### Step 2: Run the Registration Script

```bash
node register-webhook.js
```

## Method 3: Using Your NestJS Backend (Advanced)

### Step 1: Add Webhook Registration Service

```typescript
// src/payment/webhook-registration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PaystackService } from './paystack.service';

@Injectable()
export class WebhookRegistrationService {
  private readonly logger = new Logger(WebhookRegistrationService.name);

  constructor(private readonly paystackService: PaystackService) {}

  async registerWebhook(url: string) {
    try {
      const response = await fetch('https://api.paystack.co/webhook', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          events: ['charge.success', 'charge.failed'],
        }),
      });

      const result = await response.json();
      this.logger.log('Webhook registration result:', result);
      return result;
    } catch (error) {
      this.logger.error('Failed to register webhook:', error);
      throw error;
    }
  }
}
```

## Testing Your Webhook Setup

### Step 1: Use ngrok to Expose Your Local Server

```bash
# Install ngrok if you haven't already
# Download from https://ngrok.com/download

# Expose your backend (running on port 3001)
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### Step 2: Register the ngrok URL

Use the ngrok HTTPS URL + `/payments/webhook` in the Paystack dashboard:

```
https://abc123.ngrok.io/payments/webhook
```

### Step 3: Test End-to-End

1. Start your backend: `npm run start:dev`
2. Start ngrok: `ngrok http 3001`
3. Register webhook URL in Paystack dashboard
4. Make a test purchase through your frontend
5. Complete payment with test card: `4084084084084081`
6. Check your backend logs for webhook receipt

## Common Issues and Solutions

### Issue: "Webhook URL not reachable"

**Solution**:

- Ensure your server is running
- Use HTTPS (ngrok provides this)
- Check firewall settings

### Issue: "Invalid signature"

**Solution**:

- Ensure you're using the correct secret key
- Check that raw body parsing is working
- Verify the signature verification logic

### Issue: "No webhook received"

**Solution**:

- Double-check the URL registration
- Ensure you selected the correct events
- Check Paystack dashboard for webhook delivery logs

## Environment Variables Needed

Make sure these are in your `.env` file:

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

## Production Deployment

When deploying to production:

1. Get your live API keys from Paystack
2. Update webhook URL to your production domain
3. Enable signature verification (already implemented)
4. Set up monitoring and alerting
5. Test thoroughly with real (small) transactions

## Verification Commands

### Check if webhook is registered:

```bash
curl -H "Authorization: Bearer sk_test_your_key" \
     https://api.paystack.co/webhook
```

### Delete webhook (if needed):

```bash
curl -X DELETE \
     -H "Authorization: Bearer sk_test_your_key" \
     https://api.paystack.co/webhook/WEBHOOK_ID
```
