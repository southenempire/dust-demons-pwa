'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function AppWalletProvider({ children }) {
  // 🚀 NUCLEAR FIX: We found a valid key.
  // We switched 'wss://' to 'https://' because the app needs HTTP to send transactions.
  const endpoint = 'https://mainnet.helius-rpc.com/?api-key=bacbe1c4-e2b2-453a-b52d-b2465e08a9dc';

  // Empty wallets list allows auto-detection of mobile/browser wallets
  const wallets = useMemo(() => [], []);

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