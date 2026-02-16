
const https = require('https');

const API_KEY = '168af430-77b6-4fe0-b528-b12b28dfc728';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

function test(name, url) {
    console.log(`\n🔍 Testing ${name}...`);
    console.log(`URL: ${url}`);

    const options = {
        headers: {
            'x-api-key': API_KEY,
            'Origin': 'http://localhost:3000'
        }
    };

    const req = https.get(url, options, (res) => {
        console.log(`[${name}] Status: ${res.statusCode}`);
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log(`[${name}] ✅ Success!`);
                console.log(`[${name}] Body Sample: ${data.substring(0, 100)}`);
            } else {
                console.log(`[${name}] ❌ Failed.`);
                console.log(`[${name}] Body: ${data}`);
            }
        });
    });

    req.on('error', e => console.error(`[${name}] Error: ${e.message}`));
}

// 1. V2 Public (No Key - Control)
// test('V2_Public', `https://api.jup.ag/price/v2?ids=${SOL_MINT}`);

// 2. V2 With Key
test('V2_Key', `https://api.jup.ag/price/v2?ids=${SOL_MINT}`);

// 3. V3 With Key
test('V3_Key', `https://api.jup.ag/price/v3?ids=${SOL_MINT}`);
