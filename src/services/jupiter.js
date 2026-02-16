const JUPITER_PRICE_API = 'https://api.jup.ag/price/v3';
// API key from user (fallback if env var missing)
const API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || '168af430-77b6-4fe0-b528-b12b28dfc728';

const JUPITER_PRICE_API_V2 = 'https://api.jup.ag/price/v2';

export async function getSOLPrice() {
    try {
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        const url = `${JUPITER_PRICE_API_V2}?ids=${SOL_MINT}`;

        // console.log('Fetching SOL price V2 with Key...');

        const headers = {};
        if (API_KEY) {
            headers['x-api-key'] = API_KEY;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`Jupiter API Error: ${response.status}`);

        const data = await response.json();
        const priceData = data?.data?.[SOL_MINT];
        const price = priceData ? parseFloat(priceData.price) : 0;

        if (!price) {
            console.warn('No price for SOL in response');
            return { price: 0, direction: 'neutral' };
        }

        return {
            price,
            direction: 'neutral'
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
        const rawData = data.data || {};

        const prices = {};
        Object.entries(rawData).forEach(([mint, info]) => {
            if (info && info.price) {
                prices[mint] = {
                    price: parseFloat(info.price),
                    change24h: 0
                };
            }
        });

        return prices;
    } catch (error) {
        // console.error('getTokenPrices failed:', error);
        return {};
    }
}