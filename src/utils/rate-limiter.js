// src/utils/rate-limiter.js
// Rate limiting to prevent abuse

class RateLimiter {
    constructor() {
        this.limits = new Map();
    }

    /**
     * Check if action is rate limited
     * @param {string} action - Action identifier
     * @param {number} maxAttempts - Max attempts allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {object} - { allowed: boolean, remaining: number, resetAt: number }
     */
    check(action, maxAttempts, windowMs) {
        const now = Date.now();
        const key = action;

        if (!this.limits.has(key)) {
            this.limits.set(key, {
                count: 1,
                resetAt: now + windowMs
            });
            return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
        }

        const limit = this.limits.get(key);

        // Reset if window expired
        if (now >= limit.resetAt) {
            this.limits.set(key, {
                count: 1,
                resetAt: now + windowMs
            });
            return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
        }

        // Check if over limit
        if (limit.count >= maxAttempts) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: limit.resetAt,
                retryAfter: Math.ceil((limit.resetAt - now) / 1000)
            };
        }

        // Increment counter
        limit.count++;
        this.limits.set(key, limit);

        return {
            allowed: true,
            remaining: maxAttempts - limit.count,
            resetAt: limit.resetAt
        };
    }

    /**
     * Reset a specific rate limit
     */
    reset(action) {
        this.limits.delete(action);
    }

    /**
     * Clear all rate limits
     */
    clearAll() {
        this.limits.clear();
    }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
    // Per hour
    BURNS_PER_HOUR: { max: 50, window: 60 * 60 * 1000 },
    SWAPS_PER_HOUR: { max: 20, window: 60 * 60 * 1000 },
    SCANS_PER_HOUR: { max: 100, window: 60 * 60 * 1000 },

    // Per day
    PREDICTIONS_PER_DAY: { max: 10, window: 24 * 60 * 60 * 1000 },

    // Per minute (prevent spam)
    ACTIONS_PER_MINUTE: { max: 10, window: 60 * 1000 }
};

/**
 * Check if burn action is allowed
 */
export function canBurn(walletAddress) {
    const result = rateLimiter.check(
        `burn:${walletAddress}`,
        RATE_LIMITS.BURNS_PER_HOUR.max,
        RATE_LIMITS.BURNS_PER_HOUR.window
    );
    return result;
}

/**
 * Check if swap action is allowed
 */
export function canSwap(walletAddress) {
    const result = rateLimiter.check(
        `swap:${walletAddress}`,
        RATE_LIMITS.SWAPS_PER_HOUR.max,
        RATE_LIMITS.SWAPS_PER_HOUR.window
    );
    return result;
}

/**
 * Check if scan action is allowed
 */
export function canScan(walletAddress) {
    const result = rateLimiter.check(
        `scan:${walletAddress}`,
        RATE_LIMITS.SCANS_PER_HOUR.max,
        RATE_LIMITS.SCANS_PER_HOUR.window
    );
    return result;
}

/**
 * Check if prediction is allowed
 */
export function canPredict(walletAddress) {
    const result = rateLimiter.check(
        `predict:${walletAddress}`,
        RATE_LIMITS.PREDICTIONS_PER_DAY.max,
        RATE_LIMITS.PREDICTIONS_PER_DAY.window
    );
    return result;
}

/**
 * Generic rate limit check
 */
export function checkRateLimit(action, walletAddress) {
    const actionLimits = {
        burn: () => canBurn(walletAddress),
        swap: () => canSwap(walletAddress),
        scan: () => canScan(walletAddress),
        predict: () => canPredict(walletAddress)
    };

    return actionLimits[action] ? actionLimits[action]() : { allowed: true };
}

export default rateLimiter;
