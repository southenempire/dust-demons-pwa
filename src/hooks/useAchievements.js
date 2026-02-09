// src/hooks/useAchievements.js
// Custom hook for achievement management

import { useState, useEffect } from 'react';
import { checkAchievements } from '@/lib/nft/achievementTracker';

export function useAchievements(stats, context) {
    const [earnedAchievements, setEarnedAchievements] = useState([]);
    const [achievementToShow, setAchievementToShow] = useState(null);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('dust_demons_achievements');
        if (saved) {
            try {
                setEarnedAchievements(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load achievements:', e);
            }
        }
    }, []);

    // Save to localStorage when changed
    useEffect(() => {
        if (earnedAchievements.length > 0) {
            localStorage.setItem('dust_demons_achievements', JSON.stringify(earnedAchievements));
        }
    }, [earnedAchievements]);

    // Check for new achievements
    const checkForNewAchievements = () => {
        const newAchievements = checkAchievements(stats, earnedAchievements, context);

        if (newAchievements.length > 0) {
            // Show first achievement
            const achievement = newAchievements[0];
            setEarnedAchievements(prev => [...prev, achievement.id]);
            setAchievementToShow(achievement);
            return achievement;
        }

        return null;
    };

    return {
        earnedAchievements,
        achievementToShow,
        setAchievementToShow,
        checkForNewAchievements,
    };
}
