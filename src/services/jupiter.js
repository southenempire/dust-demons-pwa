// src/services/jupiter.js
// Jupiter Price API v3 integration

const JUPITER_PRICE_API_V3 = 'https://api.jup.ag/price/v3';

async function fetchPrices(ids) {
    const headers = {};
    const apiKey = process.env.NEXT_PUBLIC_JUPITER_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch(`${JUPITER_PRICE_API_V3}?ids=${ids}`, { headers });
    if (!res.ok) throw new Error(`Jupiter API ${res.status}`);
    return res.json();
}

export async function getSOLPrice() {
    try {
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        const data = await fetchPrices(SOL_MINT);

        // v3 response: { [mint]: { usdPrice: number, ... } }
        const priceData = data?.[SOL_MINT];
        if (!priceData) return { price: 0, direction: 'neutral' };

        const price = parseFloat(priceData.usdPrice || 0);
        return { price, direction: 'neutral' };
    } catch (error) {
        console.error('getSOLPrice failed:', error);
        return { price: 0, direction: 'neutral' };
    }
}

export async function getTokenPrices(mints) {
    if (!mints || mints.length === 0) return {};

    try {
        const ids = Array.isArray(mints) ? mints.join(',') : mints;
        const data = await fetchPrices(ids);

        // v3 response: { [mint]: { usdPrice: number, ... } }
        const prices = {};
        Object.entries(data).forEach(([mint, info]) => {
            if (info?.usdPrice) {
                prices[mint] = {
                    price: parseFloat(info.usdPrice),
                    change24h: parseFloat(info.priceChange24h || 0)
                };
            }
        });

        return prices;
    } catch (error) {
        console.error('getTokenPrices failed:', error);
        return {};
    }
}