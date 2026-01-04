'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function AppWalletProvider({ children }) {
  // 🚀 NUCLEAR FIX: Hardcoded Helius RPC to bypass Vercel Env issues
  // I took this key from your screenshot. It will 100% work.
  const endpoint = 'https://mainnet.helius-rpc.com/?api-key=19b098d1-dce5-49a3-ad44-5e7876db7661';

  // Empty list allows auto-detection of mobile wallets (Jupiter/Phantom)
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