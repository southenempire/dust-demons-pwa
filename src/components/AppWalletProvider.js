'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function AppWalletProvider({ children }) {
  // FALLBACK: Using public node because your Helius key returned 401 (Invalid).
  // If this gives 403 errors, you MUST paste a NEW valid Helius key here.
  const endpoint = 'https://api.mainnet-beta.solana.com'; 

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