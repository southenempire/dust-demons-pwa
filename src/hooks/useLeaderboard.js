// src/hooks/useLeaderboard.js
// Manages leaderboard data fetching and submission

import { useState, useCallback } from 'react';
import { fetchRankings, submitStats } from '@/services/leaderboard';

export function useLeaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch leaderboard data
    const fetchLeaderboard = useCallback(async (wallet = null) => {
        setLoading(true);
        try {
            const walletAddress = wallet ? wallet.toBase58() : null;
            const { topPlayers, userRank: rank } = await fetchRankings(walletAddress);

            setLeaderboardData(topPlayers);
            setUserRank(rank);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            setLeaderboardData([]);
            setUserRank(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Load previously saved player stats from server (on wallet connect)
    const loadPlayerStats = useCallback(async (wallet) => {
        if (!wallet) return null;
        try {
            const walletAddress = typeof wallet.toBase58 === 'function' ? wallet.toBase58() : wallet;
            const res = await fetch(`/api/player/stats?wallet=${walletAddress}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (data.found && data.stats) {
                console.log('✅ Loaded saved player stats from server:', data.stats);
                return data.stats;
            }
        } catch (err) {
            console.warn('Could not load player stats from server:', err);
        }
        return null;
    }, []);

    // Submit stats to leaderboard
    const submitToLeaderboard = useCallback(async (wallet, stats, isMobile = false) => {
        if (!wallet) return;

        try {
            const walletAddress = wallet.toBase58();
            const result = await submitStats(walletAddress, stats, isMobile);

            if (result.success) {
                setUserRank(result.rank);
                console.log('✅ Leaderboard updated:', result);
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
        loadPlayerStats,
        submitToLeaderboard
    };
}
