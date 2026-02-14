// src/services/jupiter.js
// Jupiter API service for price data
// Using Jupiter's Price API v3 for the hackathon challenge

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v3';
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
        const solData = data?.[SOL_MINT];

        if (!solData) {
            throw new Error('SOL price data not found in Jupiter response');
        }

        const price = solData.usdPrice || 0;
        const change24h = solData.priceChange24h || 0;

        return {
            price,
            change24h,
            direction: change24h > 0 ? 'up' : 'down'
        };
    } catch (error) {
        console.error('Failed to fetch SOL price from Jupiter:', error);
        throw error;
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

        // Transform to simpler format (v3 response is flatter)
        const prices = {};
        for (const [mint, priceData] of Object.entries(data || {})) {
            prices[mint] = {
                price: priceData.usdPrice || 0,
                change24h: priceData.priceChange24h || 0
            };
        }

        return prices;
    } catch (error) {
        console.error('Failed to fetch token prices from Jupiter:', error);
        throw error;
    }
}
