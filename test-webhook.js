const https = require('https');

// Test webhook endpoint
function testWebhook(webhookUrl, secretKey) {
    console.log('🧪 Testing webhook endpoint...\n');

    const testPayload = JSON.stringify({
        event: "charge.success",
        data: {
            reference: "test-payment-" + Date.now(),
            status: "success",
            amount: 100,
            currency: "GHS",
            customer: {
                email: "test@example.com"
            }
        }
    });

    // Parse URL
    const url = new URL(webhookUrl);

    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': testPayload.length,
            'x-paystack-signature': 'test-signature' // In development, your webhook allows invalid signatures
        }
    };

    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
        console.log(`🌐 Status Code: ${res.statusCode}`);

        let responseBody = '';
        res.on('data', (chunk) => {
            responseBody += chunk.toString();
        });

        res.on('end', () => {
            console.log('📋 Response:');
            try {
                const result = JSON.parse(responseBody);
                console.log(JSON.stringify(result, null, 2));
            } catch {
                console.log(responseBody);
            }

            if (res.statusCode === 200) {
                console.log('\n✅ Webhook endpoint is working!');
            } else {
                console.log('\n❌ Webhook endpoint returned an error');
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Connection Error:', error.message);
        console.log('\n💡 Make sure your backend is running and the URL is correct');
    });

    req.write(testPayload);
    req.end();
}

// Get webhook URL from command line or prompt
const webhookUrl = process.argv[2];

if (!webhookUrl) {
    console.log('Usage: node test-webhook.js <webhook-url>');
    console.log('Example: node test-webhook.js https://abc123.ngrok.io/payments/webhook');
    process.exit(1);
}

testWebhook(webhookUrl);