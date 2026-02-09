// src/lib/nft/achievementTracker.js
// Achievement definitions and tracking logic

export const ACHIEVEMENTS = {
    FIRST_BURN: {
        id: 'first_burn',
        name: 'First Burn',
        title: 'Demon Initiate',
        description: 'Burn your first dust token',
        tier: 1,
        rarity: 'Common',
        emoji: '🔥',
        metadataUri: '', // Will be set after Arweave upload
        check: (stats, earnedAchievements) => {
            return stats.totalBurned >= 1 && !earnedAchievements.includes('first_burn');
        },
    },

    DUST_COLLECTOR: {
        id: 'dust_collector',
        name: 'Dust Collector',
        title: 'Dust Demon',
        description: 'Burn 100 tokens total',
        tier: 2,
        rarity: 'Uncommon',
        emoji: '💎',
        metadataUri: '',
        check: (stats, earnedAchievements) => {
            return stats.totalBurned >= 100 && !earnedAchievements.includes('dust_collector');
        },
    },

    YIELD_HUNTER: {
        id: 'yield_hunter',
        name: 'Yield Hunter',
        title: 'JupSOL Demon',
        description: 'Swap to JupSOL for yield',
        tier: 2,
        rarity: 'Uncommon',
        emoji: '🌊',
        metadataUri: '',
        check: (stats, earnedAchievements, jupsolBalance) => {
            return jupsolBalance > 0 && !earnedAchievements.includes('yield_hunter');
        },
    },

    PROPHET: {
        id: 'prophet',
        name: 'Prophet',
        title: 'Oracle Demon',
        description: 'Make 10 correct predictions',
        tier: 3,
        rarity: 'Rare',
        emoji: '🔮',
        metadataUri: '',
        check: (stats, earnedAchievements, jupsolBalance, predictions) => {
            const correctCount = predictions?.filter(p => p.correct).length || 0;
            return correctCount >= 10 && !earnedAchievements.includes('prophet');
        },
    },

    MOBILE_MASTER: {
        id: 'mobile_master',
        name: 'Mobile Master',
        title: 'Jupiter Demon',
        description: 'Use Jupiter Mobile app',
        tier: 3,
        rarity: 'Rare',
        emoji: '📱',
        metadataUri: '',
        check: (stats, earnedAchievements, jupsolBalance, predictions, isJupiterMobile) => {
            return isJupiterMobile && !earnedAchievements.includes('mobile_master');
        },
    },

    DEMON_LORD: {
        id: 'demon_lord',
        name: 'Demon Lord',
        title: 'Leaderboard King',
        description: 'Reach #1 on the leaderboard',
        tier: 4,
        rarity: 'Legendary',
        emoji: '👑',
        metadataUri: '',
        check: (stats, earnedAchievements, jupsolBalance, predictions, isJupiterMobile, userRank) => {
            return userRank === 1 && !earnedAchievements.includes('demon_lord');
        },
    },
};

/**
 * Check which new achievements the user has earned
 * @param {Object} stats - User stats (totalBurned, xp, etc)
 * @param {Array} earnedAchievements - Array of achievement IDs already earned
 * @param {Object} context - Additional context (jupsolBalance, predictions, etc)
 * @returns {Array} Array of newly earned achievement objects
 */
export function checkAchievements(stats, earnedAchievements = [], context = {}) {
    const newAchievements = [];

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        try {
            const isEarned = achievement.check(
                stats,
                earnedAchievements,
                context.jupsolBalance,
                context.predictions,
                context.isJupiterMobile,
                context.userRank
            );

            if (isEarned) {
                newAchievements.push(achievement);
            }
        } catch (error) {
            console.error(`Error checking achievement ${achievement.id}:`, error);
        }
    }

    return newAchievements;
}

/**
 * Get achievement by ID
 */
export function getAchievement(id) {
    return Object.values(ACHIEVEMENTS).find(a => a.id === id);
}

/**
 * Get all achievements as array
 */
export function getAllAchievements() {
    return Object.values(ACHIEVEMENTS);
}

/**
 * Get achievement progress (for UI)
 */
export function getAchievementProgress(achievementId, stats, context = {}) {
    const achievement = getAchievement(achievementId);
    if (!achievement) return { current: 0, total: 1, percentage: 0 };

    switch (achievementId) {
        case 'first_burn':
            return {
                current: Math.min(stats.totalBurned, 1),
                total: 1,
                percentage: stats.totalBurned >= 1 ? 100 : 0,
            };

        case 'dust_collector':
            return {
                current: Math.min(stats.totalBurned, 100),
                total: 100,
                percentage: Math.min((stats.totalBurned / 100) * 100, 100),
            };

        case 'yield_hunter':
            return {
                current: context.jupsolBalance > 0 ? 1 : 0,
                total: 1,
                percentage: context.jupsolBalance > 0 ? 100 : 0,
            };

        case 'prophet':
            const correctCount = context.predictions?.filter(p => p.correct).length || 0;
            return {
                current: Math.min(correctCount, 10),
                total: 10,
                percentage: Math.min((correctCount / 10) * 100, 100),
            };

        case 'mobile_master':
            return {
                current: context.isJupiterMobile ? 1 : 0,
                total: 1,
                percentage: context.isJupiterMobile ? 100 : 0,
            };

        case 'demon_lord':
            return {
                current: context.userRank === 1 ? 1 : 0,
                total: 1,
                percentage: context.userRank === 1 ? 100 : 0,
            };

        default:
            return { current: 0, total: 1, percentage: 0 };
    }
}
