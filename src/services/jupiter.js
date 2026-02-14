// src/services/jupiter.js
// Jupiter API service for price data
// Using Jupiter's Price API v3 for the hackathon challenge

// Using Jupiter's Price API v4 (Public) or fallback
// Note: v3 requires an API key, v4/v1 are public but rate-limited

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2'; // Trying v2 public endpoint
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// API key is optional for public use, but recommended for production
const API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || '';

/**
 * Get current SOL price in USD using Jupiter Price API v3
 * @returns {Promise<Object>} { price: number, change24h: number, direction: string }
 */
export async function getSOLPrice() {
    try {
        const headers = {};
        if (API_KEY) {
            headers['x-api-key'] = API_KEY;
        }

        const response = await fetch(
            `${JUPITER_PRICE_API}?ids=${SOL_MINT}`,
            { headers }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch SOL price from Jupiter`);
        }

        const data = await response.json();

        // V2 Response: { data: { "So11...": { id, type, price: "123.45" } } }
        const solData = data?.data?.[SOL_MINT];

        if (!solData) {
            console.warn('SOL price data not found in Jupiter response, defaulting to 0');
            return { price: 0, direction: 'neutral' };
        }

        const price = solData.price || 0;
        // V2 simple endpoint might not have 24h change, so we'll look for it or default
        const change24h = 0;

        // Validation: Ensure we return a valid number
        const finalPrice = parseFloat(price);

        if (isNaN(finalPrice)) {
            console.error('Invalid SOL price received:', price);
            return { price: 0, direction: 'neutral' };
        }

        return {
            price: finalPrice,
            direction: 'neutral' // V2 simple endpoint doesn't give direction context easily
        };
    } catch (error) {
        console.error('Failed to fetch SOL price from Jupiter:', error);
        // value 0 is better than crashing
        return { price: 0, direction: 'neutral' };
    }
}

/**
 * Get prices for multiple tokens using Jupiter Price API v3
 * @param {Array<string>} mints - Array of token mint addresses
 * @returns {Promise<Object>} Object mapping mint addresses to price data
 */
export async function getTokenPrices(mints) {
    try {
        const headers = {};
        if (API_KEY) {
            headers['x-api-key'] = API_KEY;
        }

        const mintIds = mints.join(',');
        const response = await fetch(
            `${JUPITER_PRICE_API}?ids=${mintIds}`,
            { headers }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch token prices from Jupiter`);
        }

        const data = await response.json();

        // Jupiter Price API v2 structure: { data: { "Mint": { id, mintSymbol, vsToken, startPrice, endPrice, price } } }
        // Note: The structure might vary slightly, but usually it's nested under 'data'
        const prices = {};

        if (data && data.data) {
            for (const [mint, priceData] of Object.entries(data.data)) {
                if (priceData) {
                    prices[mint] = {
                        price: parseFloat(priceData.price) || 0,
                        change24h: 0 // V2 might not provide 24h change in this endpoint, defaulting to 0
                    };
                }
            }
        }

        return prices;
    } catch (error) {
        console.error('Failed to fetch token prices from Jupiter:', error);
        // Return empty object instead of throwing to prevent app crash
        return {};
    }
}
