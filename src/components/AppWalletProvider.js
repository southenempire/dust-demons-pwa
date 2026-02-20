'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';
import { solana, solanaDevnet, solanaTestnet } from '@reown/appkit/networks';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function AppWalletProvider({ children }) {
  // Use the env RPC or fallback to mainnet
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';

  // Initialize Jupiter Mobile adapter
  // Uses a public fallback WalletConnect Project ID if one isn't in .env
  const { jupiterAdapter } = useWrappedReownAdapter({
    appKitOptions: {
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '1ca0020d20dff0c5f5dc4ad2cb434232',
      metadata: {
        name: 'Dust Demons',
        description: 'Gamified Solana wallet cleanup. Earn 3x XP with Jupiter Mobile!',
        url: 'https://dust-demons.vercel.app',
        icons: ['https://dust-demons.vercel.app/icon.jpg'],
      },
      networks: [solana, solanaDevnet, solanaTestnet],
      customWallets: [
        {
          id: 'jupiter',
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
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
// Force rebuild