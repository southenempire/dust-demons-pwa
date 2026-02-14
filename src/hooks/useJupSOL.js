// src/hooks/useJupSOL.js
// Manages JupSOL yield farming and earnings calculations

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getTokenBalance } from '@/services/solana';

const JUPSOL_MINT = new PublicKey('jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v');

export function useJupSOL() {
    const { connection } = useConnection();

    const [jupsolBalance, setJupsolBalance] = useState(0);
    const [jupsolValueUSD, setJupsolValueUSD] = useState(0);
    const [jupsolAPY, setJupsolAPY] = useState(0);
    const [realtimeEarnings, setRealtimeEarnings] = useState(0);
    const [estimatedEarnings, setEstimatedEarnings] = useState({
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0
    });
    const [calculatorAmount, setCalculatorAmount] = useState('');

    // Fetch JupSOL APY from API
    const fetchAPY = useCallback(async () => {
        try {
            const response = await fetch('/api/apy/jupsol');
            const data = await response.json();
            if (data && data.apy) {
                setJupsolAPY(data.apy * 100); // Convert decimal to percentage
            }
        } catch (error) {
            console.error('Failed to fetch JupSOL APY:', error);
            setJupsolAPY(0);
        }
    }, []);

    // Fetch JupSOL balance for wallet
    const fetchBalance = useCallback(async (wallet) => {
        if (!wallet) {
            setJupsolBalance(0);
            return 0;
        }

        try {
            const balance = await getTokenBalance(connection, wallet, JUPSOL_MINT);
            setJupsolBalance(balance);
            return balance;
        } catch (error) {
            console.error('Failed to fetch JupSOL balance:', error);
            setJupsolBalance(0);
            return 0;
        }
    }, [connection]);

    // Calculate yield estimates
    const calculateYield = useCallback((amount, apy, jupsolPrice) => {
        if (!amount || !apy || !jupsolPrice) {
            return { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
        }

        const valueUSD = amount * jupsolPrice;
        const yearlyEarnings = valueUSD * (apy / 100);

        return {
            daily: yearlyEarnings / 365,
            weekly: yearlyEarnings / 52,
            monthly: yearlyEarnings / 12,
            yearly: yearlyEarnings
        };
    }, []);

    // Update estimated earnings when balance, APY, or price changes
    useEffect(() => {
        if (jupsolBalance > 0 && jupsolAPY > 0 && jupsolValueUSD > 0) {
            const jupsolPrice = jupsolValueUSD / jupsolBalance;
            const earnings = calculateYield(jupsolBalance, jupsolAPY, jupsolPrice);
            setEstimatedEarnings(earnings);
        } else {
            setEstimatedEarnings({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
        }
    }, [jupsolBalance, jupsolAPY, jupsolValueUSD, calculateYield]);

    // Fetch APY on mount
    useEffect(() => {
        fetchAPY();
    }, [fetchAPY]);

    return {
        jupsolBalance,
        jupsolValueUSD,
        jupsolAPY,
        realtimeEarnings,
        estimatedEarnings,
        calculatorAmount,
        setJupsolBalance,
        setJupsolValueUSD,
        setRealtimeEarnings,
        setCalculatorAmount,
        fetchBalance,
        fetchAPY,
        calculateYield
    };
}
