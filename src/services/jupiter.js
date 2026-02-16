// src/services/jupiter.js
// Jupiter API service for price data
// Using Jupiter's Price API v3 for the hackathon challenge

// Using Jupiter's Price API v4 (Public) or fallback
// Note: v3 requires an API key, v4/v1 are public but rate-limited

// Using Jupiter's Price API v3 with User Provided Key
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v3';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// API key from user (fallback if env var missing)
const API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || 'a338f239-2d73-4caa-a9a5-a691d51a54f2';

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

        // Try Jupiter V2 (Public)
        const response = await fetch(
            `https://api.jup.ag/price/v2?ids=${SOL_MINT}`
        );

        if (response.ok) {
            const data = await response.json();
            // V2 Response: { data: { "Mint": { id, type, price: "123.45" } } }
            const solData = data?.data?.[SOL_MINT];

            if (solData) {
                return {
                    price: parseFloat(solData.price) || 0,
                    direction: 'neutral' // V2 doesn't give direction
                };
            }
        }

        throw new Error('Jupiter API failed');
    } catch (error) {
        console.warn('Jupiter API failed, trying CoinGecko fallback...');
        try {
            // Fallback to CoinGecko
            const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true');
            const cgData = await cgResponse.json();

            return {
                price: cgData.solana.usd,
                direction: cgData.solana.usd_24h_change >= 0 ? 'up' : 'down'
            };
        } catch (fallbackError) {
            console.error('All price APIs failed:', fallbackError);
            return { price: 0, direction: 'neutral' };
        }
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

        const response = await fetch(
            `https://api.jup.ag/price/v2?ids=${mints.join(',')}`
        );

        if (response.ok) {
            // Jupiter Price API v2 structure: { data: { "Mint": { price: ... } } }
            const data = await response.json();
            const prices = {};
            const sourceData = data.data;

            if (sourceData) {
                for (const [mint, priceData] of Object.entries(sourceData)) {
                    if (priceData) {
                        prices[mint] = {
                            price: parseFloat(priceData.price) || 0,
                            change24h: 0
                        };
                    }
                }
            }
            return prices;
        }

        throw new Error('Jupiter API failed');
    } catch (error) {
        console.warn('Jupiter token API failed:', error);
        // Fallback or return empty to prevent crash
        return {};
    }
}
