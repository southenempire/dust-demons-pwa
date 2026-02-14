// src/hooks/useWalletState.js
// Manages wallet connection state, balance tracking, and Jupiter Mobile detection

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function useWalletState() {
    const { publicKey, connected } = useWallet();
    const { connection } = useConnection();

    const [walletBalance, setWalletBalance] = useState(0);
    const [isJupiterMobile, setIsJupiterMobile] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect Jupiter Mobile environment
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const detectJupiterMobile = () => {
            // Check 1: User Agent
            const userAgent = navigator.userAgent || '';
            const hasJupiterUA = /Jupiter/i.test(userAgent);

            // Check 2: Window object
            const hasJupiterWindow = typeof window.jupiter !== 'undefined';

            // Check 3: Wallet adapter name
            const hasJupiterWallet = window.solana?.isJupiter === true;

            // Check 4: Custom event listener (Jupiter Mobile fires this)
            let hasJupiterEvent = false;
            const checkEvent = () => { hasJupiterEvent = true; };
            window.addEventListener('jupiter-mobile-ready', checkEvent, { once: true });

            setTimeout(() => {
                window.removeEventListener('jupiter-mobile-ready', checkEvent);
            }, 100);

            const isJupMobile = hasJupiterUA || hasJupiterWindow || hasJupiterWallet || hasJupiterEvent;
            setIsJupiterMobile(isJupMobile);

            // General mobile detection
            setIsMobile(/Mobi|Android/i.test(userAgent));

            if (isJupMobile) {
                console.log('🚀 Jupiter Mobile detected!');
            }
        };

        detectJupiterMobile();
    }, []);

    // Fetch wallet balance
    useEffect(() => {
        if (!publicKey || !connection) {
            setWalletBalance(0);
            return;
        }

        const fetchBalance = async () => {
            try {
                const balance = await connection.getBalance(publicKey);
                setWalletBalance(balance / LAMPORTS_PER_SOL);
            } catch (error) {
                console.error('Failed to fetch wallet balance:', error);
                setWalletBalance(0);
            }
        };

        fetchBalance();

        // Poll balance every 10 seconds
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [publicKey, connection]);

    return {
        publicKey,
        connected,
        walletBalance,
        isJupiterMobile,
        isMobile
    };
}
