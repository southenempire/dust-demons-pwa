import './globals.css';
import { Inter } from 'next/font/google';
// 🚀 FIX: Pointing to src/components/AppWalletProvider.js
import AppWalletProvider from '@/components/AppWalletProvider';
import Script from 'next/script'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dust Demons',
  description: 'Gamified Solana Wallet Cleaner',
  manifest: '/manifest.json', 
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Load Jupiter Terminal Script */}
        <Script 
          src="https://terminal.jup.ag/main-v3.js" 
          strategy="lazyOnload" 
        />
      </head>
      <body className={inter.className}>
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}