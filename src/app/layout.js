import './globals.css';
import AppWalletProvider from '../components/AppWalletProvider'; // Adjust path as needed

export const metadata = {
  title: 'Dust Demons',
  description: 'Solana Rent Recovery',
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



