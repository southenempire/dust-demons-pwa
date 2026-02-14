// src/services/leaderboard.js
// Leaderboard API service for rankings and stats submission

/**
 * Fetch leaderboard rankings
 * @param {string|null} wallet - Optional wallet address to include user rank
 * @param {number} limit - Number of top players to return (default: 100)
 * @returns {Promise<Object>} { topPlayers: Array, userRank: Object|null }
 */
export async function fetchRankings(wallet = null, limit = 100) {
    try {
        const timestamp = Date.now(); // Cache buster
        const url = wallet
            ? `/api/leaderboard/rankings?wallet=${wallet}&limit=${limit}&t=${timestamp}`
            : `/api/leaderboard/rankings?limit=${limit}&t=${timestamp}`;

        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch leaderboard`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return {
            topPlayers: data.topPlayers || [],
            userRank: data.userRank || null
        };
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        throw error;
    }
}

/**
 * Submit player stats to leaderboard
 * @param {string} wallet - Wallet address
 * @param {Object} stats - Player statistics
 * @param {number} stats.xp - Experience points
 * @param {number} stats.totalBurned - Total tokens burned
 * @param {number} stats.solReclaimed - Total SOL reclaimed
 * @param {number} stats.level - Player level
 * @param {string} stats.rank - Rank title
 * @param {boolean} isMobile - Whether player is on mobile
 * @returns {Promise<Object>} Submission result
 */
export async function submitStats(wallet, stats, isMobile = false) {
    try {
        const response = await fetch('/api/leaderboard/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet,
                xp: stats.xp || 0,
                totalBurned: stats.totalBurned || 0,
                solReclaimed: stats.solReclaimed || 0,
                level: stats.level || 1,
                rank: stats.rank || 'VOID STALKER',
                isMobile
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to submit stats`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Submission failed');
        }

        return {
            success: true,
            rank: data.rank || null,
            message: data.message
        };
    } catch (error) {
        console.error('Failed to submit to leaderboard:', error);
        throw error;
    }
}

/**
 * Get specific player's rank
 * @param {string} wallet - Wallet address
 * @returns {Promise<Object|null>} Player rank data
 */
export async function getPlayerRank(wallet) {
    try {
        const response = await fetch(`/api/leaderboard/player/${wallet}`);

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`HTTP ${response.status}: Failed to fetch player rank`);
        }

        const data = await response.json();
        return data.player || null;
    } catch (error) {
        console.error('Failed to fetch player rank:', error);
        return null;
    }
}
