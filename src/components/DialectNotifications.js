'use client';

import { DialectSolanaSdk } from '@dialectlabs/react-sdk-blockchain-solana';
import { DialectNoftifications, DialectThemeProvider } from '@dialectlabs/react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import '@dialectlabs/react-ui/index.css';

export default function DialectNotifications({ theme }) {
    const [mounted, setMounted] = useState(false);
    const wallet = useWallet();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Custom theme to match our app
    const dialectTheme = {
        dark: {
            colors: {
                bg: theme.panel,
                text: theme.text,
                primary: theme.accent,
                button: theme.accent,
                buttonText: '#000000',
                input: 'rgba(255, 255, 255, 0.05)',
                inputFocus: `1px solid ${theme.accent}`,
            }
        }
    };

    return (
        <div style={{ position: 'relative', zIndex: 100 }}>
            <DialectSolanaSdk wallet={wallet}>
                <DialectThemeProvider theme="dark" variables={dialectTheme.dark}>
                    <DialectNoftifications />
                </DialectThemeProvider>
            </DialectSolanaSdk>
        </div>
    );
}
