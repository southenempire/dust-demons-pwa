// src/utils/analytics.js
// Event tracking and performance monitoring

/**
 * Track custom events for analytics
 * @param {string} eventName - Name of the event
 * @param {object} properties - Event properties
 */
export function trackEvent(eventName, properties = {}) {
    if (typeof window === 'undefined') return;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {

    }

    // Send to analytics provider (GA, Mixpanel, etc)
    if (window.gtag) {
        window.gtag('event', eventName, properties);
    }

    // Custom analytics endpoint (optional)
    try {
        // You can send to your own analytics backend here
        // fetch('/api/analytics', {
        //     method: 'POST',
        //     body: JSON.stringify({ event: eventName, properties, timestamp: Date.now() })
        // });
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

/**
 * Track page views
 * @param {string} page - Page name
 */
export function trackPageView(page) {
    trackEvent('page_view', { page });
}

/**
 * Track user actions
 */
export const AnalyticsEvents = {
    // Burn events
    BURN_STARTED: 'burn_started',
    BURN_COMPLETED: 'burn_completed',
    BURN_FAILED: 'burn_failed',

    // Swap events
    SWAP_STARTED: 'swap_started',
    SWAP_COMPLETED: 'swap_completed',
    SWAP_FAILED: 'swap_failed',

    // Prediction events
    PREDICTION_MADE: 'prediction_made',
    PREDICTION_RESULT: 'prediction_result',

    // User progression
    RANK_UP: 'rank_up',
    MISSION_COMPLETED: 'mission_completed',
    DAILY_LOGIN: 'daily_login',

    // Jupiter Mobile
    JUPITER_MOBILE_DETECTED: 'jupiter_mobile_detected',
    DEEP_LINK_OPENED: 'deep_link_opened',

    // Errors
    ERROR_OCCURRED: 'error_occurred',
    TRANSACTION_FAILED: 'transaction_failed'
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
    static marks = new Map();

    static start(label) {
        if (typeof performance === 'undefined') return;
        this.marks.set(label, performance.now());
    }

    static end(label, logToConsole = false) {
        if (typeof performance === 'undefined') return 0;

        const startTime = this.marks.get(label);
        if (!startTime) return 0;

        const duration = performance.now() - startTime;
        this.marks.delete(label);

        if (logToConsole) {

        }

        // Track slow operations
        if (duration > 1000) {
            trackEvent('slow_operation', { operation: label, duration });
        }

        return duration;
    }

    static measure(label, fn) {
        this.start(label);
        const result = fn();
        this.end(label, true);
        return result;
    }

    static async measureAsync(label, fn) {
        this.start(label);
        const result = await fn();
        this.end(label, true);
        return result;
    }
}

/**
 * Track transaction success rate
 */
export class TransactionMonitor {
    static stats = {
        burns: { total: 0, success: 0, failed: 0 },
        swaps: { total: 0, success: 0, failed: 0 },
        predictions: { total: 0, success: 0, failed: 0 }
    };

    static recordBurn(success) {
        this.stats.burns.total++;
        if (success) this.stats.burns.success++;
        else this.stats.burns.failed++;

        trackEvent(success ? AnalyticsEvents.BURN_COMPLETED : AnalyticsEvents.BURN_FAILED, {
            total: this.stats.burns.total,
            success_rate: (this.stats.burns.success / this.stats.burns.total * 100).toFixed(2)
        });
    }

    static recordSwap(success) {
        this.stats.swaps.total++;
        if (success) this.stats.swaps.success++;
        else this.stats.swaps.failed++;

        trackEvent(success ? AnalyticsEvents.SWAP_COMPLETED : AnalyticsEvents.SWAP_FAILED, {
            total: this.stats.swaps.total,
            success_rate: (this.stats.swaps.success / this.stats.swaps.total * 100).toFixed(2)
        });
    }

    static getStats() {
        return this.stats;
    }
}
