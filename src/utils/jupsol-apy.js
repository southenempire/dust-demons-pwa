// src/utils/jupsol-apy.js
// JupSOL APY utility - simplified to avoid CORS issues

const JUPSOL_MINT = 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v';

/**
 * Fetch current JupSOL APY
 * Note: Sanctum API has CORS restrictions in browser
 * For production, proxy this through your own backend
 * @returns {Promise<number>} APY as percentage (e.g., 7.5)
 */
export async function fetchJupSOLAPY() {
    try {
        // Option 1: Try Sanctum API (may fail due to CORS)
        const response = await fetch('https://api.sanctum.so/v1/apy', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        }).catch(() => null);

        if (response && response.ok) {
            const data = await response.json();
            const jupsolData = data.apys?.find(lst => lst.lst === JUPSOL_MINT);
            if (jupsolData?.apy) return jupsolData.apy;
        }
    } catch (error) {
        console.warn('Sanctum API unavailable, using fallback APY:', error.message);
    }

    // Fallback: Use well-documented JupSOL historical APY
    // JupSOL typically maintains 7-8% APY based on Solana staking rewards
    return 7.5;
}

