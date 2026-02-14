// src/hooks/useTheme.js
// Manages theme state and switching

import { useState, useCallback } from 'react';

const THEMES = {
    dark: {
        bg: '#050505',
        panel: '#0a0a0a',
        border: '#222',
        text: '#e0e0e0',
        textDim: '#666',
        accent: '#00ff41',
        grid: 'rgba(0, 255, 65, 0.03)',
        vignette: 'radial-gradient(circle at center, transparent 0%, #000 90%)',
        modal: '#111'
    },
    light: {
        bg: '#f5f5f5',
        panel: '#fff',
        border: '#ddd',
        text: '#222',
        textDim: '#999',
        accent: '#00c2ff',
        grid: 'rgba(0, 194, 255, 0.05)',
        vignette: 'radial-gradient(circle at center, transparent 0%, #e0e0e0 90%)',
        modal: '#fff'
    }
};

export function useTheme() {
    const [themeMode, setThemeMode] = useState('dark');

    const getActiveTheme = useCallback(() => {
        if (themeMode === 'system') {
            if (typeof window !== 'undefined' && window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? THEMES.dark
                    : THEMES.light;
            }
            return THEMES.dark;
        }
        return THEMES[themeMode] || THEMES.dark;
    }, [themeMode]);

    const theme = getActiveTheme();

    const toggleTheme = useCallback(() => {
        setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    return {
        theme,
        themeMode,
        setThemeMode,
        toggleTheme
    };
}
