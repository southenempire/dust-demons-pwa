'use client';

import React, { useMemo } from 'react';
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';

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
      },
      // Disable built-in wallet list to use only Jupiter Mobile Adapter
      enableWallets: false,
      customWallets: [
        {
          id: '19b096d1-dce5-49a3-ad44-5e7876db7661', // Must be a valid UUID format to avoid Reown Core fallback collisions
          name: 'Jupiter Mobile',
          homepage: 'https://jup.ag',
          image_url: 'https://jup.ag/favicon.ico',
          mobile_link: 'jupiter://', // Custom deep link schema
          desktop_link: 'https://jup.ag',
          app_store: 'https://apps.apple.com/us/app/jupiter-mobile/id6738361715',
          play_store: 'https://play.google.com/store/apps/details?id=ag.jup.mobile'
        }
      ],
    }
  });

  // Specifically include the Jupiter adapter for WalletConnect / local mobile injection
  const wallets = useMemo(() => [jupiterAdapter].filter(Boolean), [jupiterAdapter]);

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