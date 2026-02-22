'use client';

import React, { useMemo } from 'react';
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

export default function AppWalletProvider({ children }) {
  // Initialize Jupiter Mobile adapter
  // Uses the user's explicitly generated Reown Project ID
  const { jupiterAdapter } = useWrappedReownAdapter({
    appKitOptions: {
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '52de7acd49ae6261e81ee1f270e0d5c1',
      metadata: {
        name: 'Dust Demons',
        description: 'Gamified Solana wallet cleanup. Earn 3x XP with Jupiter Mobile!',
        url: 'https://dust-demons.vercel.app',
        icons: ['https://dust-demons.vercel.app/icon.jpg'],
      },
      features: {
        analytics: false,
        socials: ['google', 'x', 'apple'],
        email: false,
      }
    }
  });

  // Specifically include the Jupiter adapter for WalletConnect / local mobile injection,
  // plus standard adapters so injected wallets (like Jupiter in-app browser) are recognized natively.
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    jupiterAdapter
  ].filter(Boolean), [jupiterAdapter]);

  return (
    <UnifiedWalletProvider
      wallets={wallets}
      config={{
        autoConnect: true,
        env: "mainnet-beta",
        metadata: {
          name: "Dust Demons",
          description: "Gamified Solana wallet cleanup. Earn 3x XP with Jupiter Mobile!",
          url: "https://dust-demons.vercel.app",
          iconUrls: ["https://dust-demons.vercel.app/icon.jpg"],
        },
        theme: "dark",
        lang: "en",
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
}