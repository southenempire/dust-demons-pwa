// src/lib/referrals.js
// Client-side referral tracking utilities

/**
 * Check URL for referral code and store in localStorage
 */
export function detectReferralCode() {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode && refCode.startsWith('DUST-')) {
        localStorage.setItem('dust_demons_ref', refCode);
        console.log('Referral code detected:', refCode);

        // Clean URL without reload
        const url = new URL(window.location);
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url);

        return refCode;
    }

    return localStorage.getItem('dust_demons_ref');
}

/**
 * Track referral completion (call after first burn/swap)
 */
export async function trackReferralCompletion(walletAddress) {
    if (typeof window === 'undefined') return null;

    const refCode = localStorage.getItem('dust_demons_ref');
    if (!refCode) return null;

    try {
        const response = await fetch('/api/referrals/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referralCode: refCode,
                refereeWallet: walletAddress
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Clear referral code after successful tracking
            localStorage.removeItem('dust_demons_ref');
            console.log('Referral tracked:', data);
            return data;
        } else {
            console.error('Referral tracking failed:', data.error);
            // Don't clear on error - might retry later
            return null;
        }
    } catch (error) {
        console.error('Referral tracking error:', error);
        return null;
    }
}

/**
 * Get referral stats for a wallet
 */
export async function getReferralStats(walletAddress) {
    try {
        const response = await fetch(`/api/referrals/stats?wallet=${walletAddress}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Get referral stats error:', error);
        return null;
    }
}

/**
 * Generate or get referral code for a wallet
 */
export async function getOrCreateReferralCode(walletAddress) {
    try {
        const response = await fetch('/api/referrals/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: walletAddress })
        });

        const data = await response.json();
        return data.code;
    } catch (error) {
        console.error('Generate referral code error:', error);
        return null;
    }
}
