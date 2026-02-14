// src/hooks/useLeaderboard.js
// Manages leaderboard data fetching and submission

import { useState, useCallback } from 'react';

export function useLeaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch leaderboard data
    const fetchLeaderboard = useCallback(async (wallet = null) => {
        setLoading(true);
        try {
            const url = wallet
                ? `/api/leaderboard/rankings?wallet=${wallet.toBase58()}`
                : '/api/leaderboard/rankings';

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error('Leaderboard fetch error:', data.error);
                return;
            }

            setLeaderboardData(data.topPlayers || []);
            setUserRank(data.userRank || null);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Submit stats to leaderboard
    const submitToLeaderboard = useCallback(async (wallet, stats, isMobile = false) => {
        if (!wallet) return;

        try {
            const response = await fetch('/api/leaderboard/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: wallet.toBase58(),
                    xp: stats.xp || 0,
                    totalBurned: stats.totalBurned || 0,
                    solReclaimed: stats.solReclaimed || 0,
                    level: stats.level || 1,
                    rank: stats.rank || 'VOID STALKER',
                    isMobile
                })
            });

            const data = await response.json();

            if (data.success) {
                setUserRank(data.rank || null);
                console.log('✅ Leaderboard updated:', data);
            }
        } catch (error) {
            console.error('Failed to submit to leaderboard:', error);
        }
    }, []);

    return {
        leaderboardData,
        userRank,
        loading,
        fetchLeaderboard,
        submitToLeaderboard
    };
}
