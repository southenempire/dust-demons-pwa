// src/services/coingecko.js
// CoinGecko API service for cryptocurrency price data

/**
 * Get current SOL price in USD
 * @returns {Promise<Object>} { price: number, change24h: number }
 */
export async function getSOLPrice() {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch SOL price`);
        }

        const data = await response.json();
        const price = data?.solana?.usd || 0;
        const change24h = data?.solana?.usd_24h_change || 0;

        return {
            price,
            change24h,
            direction: change24h > 0 ? 'up' : 'down'
        };
    } catch (error) {
        console.error('Failed to fetch SOL price from CoinGecko:', error);
        throw error;
    }
}

/**
 * Get price for any cryptocurrency by ID
 * @param {string} coinId - CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
 * @param {string} vsCurrency - Currency to compare against (default: 'usd')
 * @returns {Promise<number>} Price in specified currency
 */
export async function getCoinPrice(coinId, vsCurrency = 'usd') {
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch ${coinId} price`);
        }

        const data = await response.json();
        return data?.[coinId]?.[vsCurrency] || 0;
    } catch (error) {
        console.error(`Failed to fetch ${coinId} price:`, error);
        throw error;
    }
}
