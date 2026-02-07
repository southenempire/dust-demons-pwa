// src/utils/jupsol-apy.js
// Fetch real-time JupSOL APY from Sanctum API

const SANCTUM_API = 'https://api.sanctum.so/v1/apy';
const JUPSOL_MINT = 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v';

/**
 * Fetch current JupSOL APY
 * @returns {Promise<number>} APY as percentage (e.g., 7.5)
 */
export async function fetchJupSOLAPY() {
    try {
        const response = await fetch(SANCTUM_API);

        if (!response.ok) {
            console.warn('Sanctum API error:', response.status);
            return 7.5; // Fallback
        }

        const data = await response.json();
        const jupsolData = data.apys?.find(lst => lst.lst === JUPSOL_MINT);

        return jupsolData?.apy || 7.5;
    } catch (error) {
        console.error('Failed to fetch JupSOL APY:', error);
        return 7.5; // Fallback
    }
}
