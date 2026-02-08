import './globals.css';
import { Inter } from 'next/font/google';
// 🚀 FIX: Pointing to src/components/AppWalletProvider.js
import AppWalletProvider from '@/components/AppWalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dust Demons | Turn Wallet Dust into JupSOL Yield',
  description: 'Gamified Solana wallet cleanup. Burn dust tokens, swap to JupSOL, earn 7.5% APY, and predict markets. Built for Jupiter Mobile with 3x XP bonus.',
  keywords: ['Solana', 'Jupiter', 'JupSOL', 'DeFi', 'Wallet Cleanup', 'Yield', 'Gaming', 'Mobile'],
  authors: [{ name: 'Dust Demons Team' }],
  manifest: '/manifest.json',
  metadataBase: new URL('https://dust-demons.vercel.app'),

  openGraph: {
    title: 'Dust Demons | Turn Wallet Dust into JupSOL Yield',
    description: 'Gamified Solana wallet cleanup with Jupiter integration. Burn dust, earn yield, predict markets.',
    url: 'https://dust-demons.vercel.app',
    siteName: 'Dust Demons',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dust Demons - Gamified Wallet Cleanup',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Dust Demons | Turn Wallet Dust into JupSOL Yield',
    description: 'Gamified Solana wallet cleanup. Burn dust → Earn JupSOL yield → Predict markets',
    images: ['/og-image.png'],
  },

  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}