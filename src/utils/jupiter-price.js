// src/utils/jupiter-price.js
// Jupiter Price API v3 Integration with Authentication

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v3';
const JUPITER_API_KEY = 'a338f239-2d73-4caa-a9a5-a691d51a54f2';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Fetch prices from Jupiter Price API v3
 * V3 provides more accurate pricing and better rate limits with API key
 * @param {string[]} mints - Array of token mint addresses
 * @returns {Promise<Object>} Price data keyed by mint address
 */
export async function getTokenPrices(mints) {
    if (!mints || mints.length === 0) return {};

    try {
        // Jupiter Price API v3 accepts comma-separated IDs (up to 50 per request)
        const ids = mints.slice(0, 50).join(',');
        const response = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`, {
            headers: {
                'x-api-key': JUPITER_API_KEY,
            },
        });

        if (!response.ok) {
            console.warn('Jupiter Price API error:', response.status);
            return {};
        }

        const data = await response.json();

        // V3 response format: { "MINT": { usdPrice: 123.45, decimals: 6, blockId: 123 } }
        const formattedPrices = {};
        Object.keys(data).forEach(mint => {
            formattedPrices[mint] = {
                price: data[mint]?.usdPrice || 0,
                id: mint,
                decimals: data[mint]?.decimals
            };
        });

        return formattedPrices;
    } catch (error) {
        console.error('Failed to fetch Jupiter prices:', error);
        return {};
    }
}

/**
 * Get price for a single token
 * @param {string} mint - Token mint address
 * @returns {Promise<number>} Price in USD
 */
export async function getTokenPrice(mint) {
    const prices = await getTokenPrices([mint]);
    return prices[mint]?.price || 0;
}

/**
 * Fetch SOL price specifically
 * @returns {Promise<number>} SOL price in USD
 */
export async function getSOLPrice() {
    return getTokenPrice(SOL_MINT);
}