
const https = require('https');

const API_URL = 'https://api.jup.ag/price/v3';
const IDS = 'So11111111111111111111111111111111111111112';
const API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || '168af430-77b6-4fe0-b528-b12b28dfc728';

console.log(`Testing Jupiter V3 API...`);
console.log(`URL: ${API_URL}?ids=${IDS}`);
console.log(`Key: ${API_KEY.substring(0, 8)}...`);

const options = {
    method: 'GET',
    headers: {
        'x-api-key': API_KEY
    }
};

const req = https.request(`${API_URL}?ids=${IDS}`, options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:');
        console.log(data);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
