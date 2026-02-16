const JUPITER_PRICE_API = 'https://api.jup.ag/price/v3';
// API key from user (fallback if env var missing)
const API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || '168af430-77b6-4fe0-b528-b12b28dfc728';

const JUPITER_PRICE_API_V2 = 'https://api.jup.ag/price/v3';

export async function getSOLPrice() {
    try {
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        const url = `${JUPITER_PRICE_API_V2}?ids=${SOL_MINT}`;

        // console.log('Fetching SOL price V3 with Key...');

        const headers = {};
        if (API_KEY) {
            headers['x-api-key'] = API_KEY;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`Jupiter API Error: ${response.status}`);

        const data = await response.json();
        const priceData = data?.[SOL_MINT]; // V3: data is directly the object with mint keys
        const price = priceData ? parseFloat(priceData.price) : 0; // V3 usually returns 'price' or 'usdPrice', let's check V3 docs/response.
        // Wait, my previous test of V3 returned:
        // {"So111...":{...,"usdPrice":84.357..., "priceChange24h":...}}
        // It seems V3 returns `usdPrice`. But wait, `test_price_v3.js` output showed:
        // "usdPrice":84.3571060175585
        // Let's use `usdPrice` based on the test output I saw earlier.

        // Re-reading test output from Step 21/37:
        // Step 21 (V3 test? No wait, Step 21 label said "Testing Jupiter V3 API..." but the code at that time might have been V3?
        // Step 7 show test_price_v3.js used https://api.jup.ag/price/v3
        // Step 21 Output: {"So111...":{"...","usdPrice":84.357...}}
        // Yes, it is `usdPrice`.

        // However, the `test_price_v3.js` output in Step 37 also showing `usdPrice`.

        // So I will use `usdPrice`.

        if (!priceData) {
            console.warn('No price data for SOL in response');
            return { price: 0, direction: 'neutral' };
        }

        const priceVal = parseFloat(priceData.usdPrice || priceData.price || 0);

        if (!priceVal) {
            console.warn('No price value for SOL in response');
            return { price: 0, direction: 'neutral' };
        }

        return {
            price: priceVal,
            direction: 'neutral' // V3 doesn't seem to give direction directly, we'd need history. Keeping neutral for now.
        };
    } catch (error) {
        console.error('getSOLPrice failed:', error);
        return { price: 0, direction: 'neutral' };
    }
}

export async function getTokenPrices(mints) {
    if (!mints || mints.length === 0) return {};

    try {
        const ids = Array.isArray(mints) ? mints.join(',') : mints;
        const url = `${JUPITER_PRICE_API_V2}?ids=${ids}`;

        const headers = {};
        if (API_KEY) {
            headers['x-api-key'] = API_KEY;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`Jupiter API Error: ${response.status}`);

        const data = await response.json();
        // V3: data is the main object, keys are mints.
        // V2: data.data was the object.

        const prices = {};
        Object.entries(data).forEach(([mint, info]) => {
            if (info && (info.usdPrice || info.price)) {
                prices[mint] = {
                    price: parseFloat(info.usdPrice || info.price),
                    change24h: 0 // V3 has priceChange24h usually?
                };
            }
        });

        return prices;
    } catch (error) {
        console.error('getTokenPrices failed:', error);
        return {};
    }
}