'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';

// Default styles that come with the wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

export default function AppWalletProvider({ children }) {
    // CRITICAL FIX: Use the custom RPC from .env instead of the blocked public one
    const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_URL, []);

    const wallets = useMemo(
        () => [
            new UnsafeBurnerWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}