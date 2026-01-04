import './globals.css';
import AppWalletProvider from '../components/AppWalletProvider';

export const metadata = {
  title: 'Dust Demons',
  description: 'Solana Rent Recovery',
  manifest: '/manifest.json',
};

// 🚀 THIS FIXES THE WHITE TOP BAR
export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Forces app to go BEHIND the notch
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}