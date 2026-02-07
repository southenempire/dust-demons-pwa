import './globals.css';
import { Inter } from 'next/font/google';
// 🚀 FIX: Pointing to src/components/AppWalletProvider.js
import AppWalletProvider from '@/components/AppWalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dust Demons',
  description: 'Gamified Solana Wallet Cleaner',
  manifest: '/manifest.json',
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