// src/utils/jupiter-mobile.js
// Jupiter Mobile specific utilities

/**
 * Send notification via Jupiter Mobile
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {boolean} - Success status
 */
export function sendJupiterNotification(title, body) {
    if (window?.solana?.sendNotification) {
        try {
            window.solana.sendNotification({ title, body });
            return true;
        } catch (error) {
            console.error('Failed to send Jupiter notification:', error);
            return false;
        }
    }
    return false;
}

/**
 * Handle deep links from Jupiter Mobile
 * @param {Function} handler - Callback function to handle deep link URLs
 */
export function setupDeepLinking(handler) {
    if (typeof window === 'undefined') return;

    // Listen for deep link messages
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'deeplink' && event.data?.url) {
            handler(event.data.url);
        }
    });

    // Check for initial deep link on load
    const params = new URLSearchParams(window.location.search);
    const deepLink = params.get('deeplink');
    if (deepLink) {
        handler(deepLink);
    }
}

/**
 * Parse deep link URL and extract action
 * @param {string} url - Deep link URL (e.g., jupiter://dustdemons/mission/burn)
 * @returns {Object} - Parsed action object
 */
export function parseDeepLink(url) {
    try {
        // Handle both jupiter:// and https:// formats
        const urlStr = url.replace('jupiter://dustdemons/', '').replace('https://dustdemons.app/', '');
        const parts = urlStr.split('/');

        return {
            section: parts[0] || null, // e.g., 'mission', 'view', 'action'
            action: parts[1] || null,  // e.g., 'burn', 'swap', 'predict'
            params: parts.slice(2)     // any additional parameters
        };
    } catch (error) {
        console.error('Failed to parse deep link:', error);
        return { section: null, action: null, params: [] };
    }
}
