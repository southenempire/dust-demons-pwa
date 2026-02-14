// src/hooks/useAudio.js
// Manages audio system and sound effects

import { useState, useRef, useCallback } from 'react';

export function useAudio() {
    const [audioEnabled, setAudioEnabled] = useState(true);
    const audioRefs = useRef({});
    const audioContextRef = useRef(null);

    // Load audio file
    const loadAudio = useCallback((key, url) => {
        if (typeof window === 'undefined') return;

        const audio = new Audio(url);
        audio.preload = 'auto';
        audioRefs.current[key] = audio;
    }, []);

    // Play sound
    const playSound = useCallback((key) => {
        if (!audioEnabled || typeof window === 'undefined') return;

        // Initialize AudioContext on first interaction (browser requirement)
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const audio = audioRefs.current[key];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }, [audioEnabled]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        setAudioEnabled(prev => !prev);
    }, []);

    return {
        audioEnabled,
        loadAudio,
        playSound,
        toggleAudio,
        setAudioEnabled
    };
}
