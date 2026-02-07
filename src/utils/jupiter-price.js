// Price API Integration
// Using CoinGecko for reliable, free SOL price data
// Jupiter Price API v2 requires authentication

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

/**
 * Fetch SOL price from CoinGecko
 * @returns {Promise<number>} SOL price in USD
 */
export async function getSOLPrice() {
    try {
        const response = await fetch(`${COINGECKO_API}?ids=solana&vs_currencies=usd`);

        if (!response.ok) {
            console.warn('CoinGecko API error:', response.status);
            return 0;
        }

        const data = await response.json();
        return data.solana?.usd || 0;
    } catch (error) {
        console.error('Failed to fetch SOL price:', error);
        return 0;
    }
}

/**
 * Fetch prices for multiple token mints (fallback to mock data for now)
 * @param {string[]} mints - Array of token mint addresses
 * @returns {Promise<Object>} Price data keyed by mint address
 */
export async function getTokenPrices(mints) {
    if (!mints || mints.length === 0) return {};

    try {
        // For SOL, use CoinGecko
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        if (mints.includes(SOL_MINT)) {
            const solPrice = await getSOLPrice();
            return {
                [SOL_MINT]: {
                    price: solPrice,
                    id: SOL_MINT
                }
            };
        }

        // For other tokens, would need Jupiter API key or alternative
        return {};
    } catch (error) {
        console.error('Failed to fetch token prices:', error);
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
 * Calculate USD value for a token amount
 * @param {number} amount - Token amount (UI amount, not raw)
 * @param {string} mint - Token mint address
 * @returns {Promise<number>} USD value
 */
export async function calculateTokenValue(amount, mint) {
    const price = await getTokenPrice(mint);
    return amount * price;
}

/**
 * Batch calculate values for multiple tokens
 * @param {Array<{mint: string, amount: number}>} tokens
 * @returns {Promise<Object>} Values keyed by mint
 */
export async function batchCalculateValues(tokens) {
    const mints = tokens.map(t => t.mint);
    const prices = await getTokenPrices(mints);

    const values = {};
    tokens.forEach(({ mint, amount }) => {
        const price = prices[mint]?.price || 0;
        values[mint] = {
            price,
            value: amount * price,
            priceChange24h: 0
        };
    });

    return values;
}
