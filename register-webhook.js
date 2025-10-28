const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔗 Paystack Webhook Registration Tool\n');

// Get user inputs
rl.question('Enter your Paystack Secret Key (sk_test_...): ', (secretKey) => {
    rl.question('Enter your webhook URL (e.g., https://abc123.ngrok.io/payments/webhook): ', (webhookUrl) => {

        console.log('\n📝 Registering webhook...');
        console.log(`Secret Key: ${secretKey.substring(0, 10)}...`);
        console.log(`Webhook URL: ${webhookUrl}\n`);

        const data = JSON.stringify({
            url: webhookUrl,
            events: ['charge.success', 'charge.failed', 'transfer.success', 'transfer.failed']
        });

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/webhook',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            console.log(`🌐 HTTP Status: ${res.statusCode}`);

            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk.toString();
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseBody);

                    if (res.statusCode === 200 || res.statusCode === 201) {
                        console.log('✅ Webhook registered successfully!');
                        console.log('📋 Response:', JSON.stringify(result, null, 2));

                        if (result.data && result.data.id) {
                            console.log(`\n🆔 Webhook ID: ${result.data.id}`);
                            console.log(`🔗 Webhook URL: ${result.data.url}`);
                            console.log(`📅 Events: ${result.data.events.join(', ')}`);
                        }
                    } else {
                        console.log('❌ Failed to register webhook');
                        console.log('📋 Response:', JSON.stringify(result, null, 2));
                    }
                } catch (error) {
                    console.log('❌ Failed to parse response');
                    console.log('Raw response:', responseBody);
                }

                rl.close();
            });
        });

        req.on('error', (error) => {
            console.error('❌ Network Error:', error.message);
            rl.close();
        });

        req.write(data);
        req.end();
    });
});

// Handle Ctrl+C
rl.on('SIGINT', () => {
    console.log('\n👋 Registration cancelled');
    process.exit(0);
});