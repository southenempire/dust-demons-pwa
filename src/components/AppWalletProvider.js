'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function AppWalletProvider({ children }) {
  const network = WalletAdapterNetwork.Mainnet;
  
  // FALLBACK: Use public RPC if env var is missing (Prevents "System Failure" crash)
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';

  const wallets = useMemo(
    () => [
      // Standard adapters. Mobile wallets (Jupiter/Phantom) inject themselves automatically.
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