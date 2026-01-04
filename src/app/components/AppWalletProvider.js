'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import the styles directly here to ensure they load
import '@solana/wallet-adapter-react-ui/styles.css';

export default function AppWalletProvider({ children }) {
  // 1. FIX THE BUILD ERROR: Provide a fallback if the Env Var is missing
  const network = WalletAdapterNetwork.Mainnet;
  
  // If NEXT_PUBLIC_RPC_URL is missing, fallback to the public Solana endpoint
  // This prevents the "Endpoint URL must start with http" error during build
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';

  // 2. FIX THE WARNING: Explicitly list supported wallets
  // This removes the "UnsafeBurnerWalletAdapter" warning
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
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