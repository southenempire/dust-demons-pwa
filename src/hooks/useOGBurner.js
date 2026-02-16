// src/hooks/useOGBurner.js
// Hook to manage OG Burner status and claiming

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function useOGBurner() {
    const { publicKey } = useWallet();

    const [ogStatus, setOGStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    // Fetch OG status for connected wallet
    const fetchOGStatus = useCallback(async () => {
        if (!publicKey) {
            setOGStatus(null);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`/api/og-burner/claim?wallet=${publicKey.toString()}`);
            const data = await response.json();

            if (data.isOG) {
                setOGStatus(data);
            } else {
                setOGStatus(null);
            }
        } catch (err) {
            console.error('Failed to fetch OG status:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey]);

    // Fetch OG Burner statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/og-burner/stats');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch OG stats:', err);
        }
    }, []);

    // Claim OG Burner status after burning
    const claimOGStatus = useCallback(async (burnTxSignature) => {
        if (!publicKey) {
            throw new Error('Wallet not connected');
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('Fetching URL:', '/api/og-burner/claim');
            const response = await fetch('/api/og-burner/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    walletAddress: publicKey.toString(),
                    burnTxSignature
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to claim OG status');
            }

            if (data.eligible) {
                setOGStatus({
                    isOG: true,
                    ogNumber: data.ogNumber,
                    burnCount: data.burnCount,
                    nftMinted: data.nftMinted
                });

                // Refresh stats
                fetchStats();

                return data;
            }

            return data;
        } catch (err) {
            console.error('Failed to claim OG status:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, fetchStats]);

    // Fetch status on wallet connect
    useEffect(() => {
        if (publicKey) {
            fetchOGStatus();
            fetchStats();
        }
    }, [publicKey, fetchOGStatus, fetchStats]);

    return {
        ogStatus,
        stats,
        isLoading,
        error,
        claimOGStatus,
        fetchOGStatus,
        fetchStats,
        isOG: ogStatus?.isOG || false,
        ogNumber: ogStatus?.ogNumber || null,
        burnCount: ogStatus?.burnCount || 0,
        nftMinted: ogStatus?.nftMinted || false
    };
}
