// src/services/jupiter.js
// Jupiter API service for price data
// Using Jupiter's Price API v2 for the hackathon challenge

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Get current SOL price in USD using Jupiter Price API
 * @returns {Promise<Object>} { price: number, change24h: number, direction: string }
 */
export async function getSOLPrice() {
    try {
        const response = await fetch(
            `${JUPITER_PRICE_API}?ids=${SOL_MINT}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch SOL price from Jupiter`);
        }

        const data = await response.json();
        const solData = data?.data?.[SOL_MINT];

        if (!solData) {
            throw new Error('SOL price data not found in Jupiter response');
        }

        const price = solData.price || 0;
        const change24h = solData.extraInfo?.quotedPrice?.buyPrice24hChangePercent || 0;

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
 * Get prices for multiple tokens using Jupiter Price API
 * @param {Array<string>} mints - Array of token mint addresses
 * @returns {Promise<Object>} Object mapping mint addresses to price data
 */
export async function getTokenPrices(mints) {
    try {
        const mintIds = mints.join(',');
        const response = await fetch(
            `${JUPITER_PRICE_API}?ids=${mintIds}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch token prices from Jupiter`);
        }

        const data = await response.json();

        // Transform to simpler format
        const prices = {};
        for (const [mint, priceData] of Object.entries(data?.data || {})) {
            prices[mint] = {
                price: priceData.price || 0,
                change24h: priceData.extraInfo?.quotedPrice?.buyPrice24hChangePercent || 0
            };
        }

        return prices;
    } catch (error) {
        console.error('Failed to fetch token prices from Jupiter:', error);
        throw error;
    }
}
