
const https = require('https');

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v3';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || 'a338f239-2d73-4caa-a9a5-a691d51a54f2';

function testPrice() {
    console.log(`Fetching from: ${JUPITER_PRICE_API}?ids=${SOL_MINT}`);
    console.log(`Using Key: ${API_KEY ? 'Yes' : 'No'}`);

    const options = {
        headers: {}
    };

    if (API_KEY) {
        options.headers['x-api-key'] = API_KEY;
    }

    const req = https.get(`${JUPITER_PRICE_API}?ids=${SOL_MINT}`, options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`Body: ${data}`);
            try {
                const json = JSON.parse(data);
                const solData = json?.[SOL_MINT] || json?.data?.[SOL_MINT];
                console.log('Parsed SOL Data:', solData);
            } catch (e) {
                console.error('JSON Parse Error:', e.message);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Request Error:', e);
    });
}

testPrice();
