// src/components/AchievementModal.js
// Celebration modal when achievement is unlocked

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export default function AchievementModal({ achievement, isOpen, onClose }) {
    if (!achievement) return null;

    const { name, title, description, rarity, emoji, id } = achievement;

    // Rarity colors
    const rarityColors = {
        Common: '#9CA3AF',
        Uncommon: '#8B5CF6',
        Rare: '#3B82F6',
        Legendary: '#F59E0B',
    };

    const rarityColor = rarityColors[rarity] || '#9CA3AF';

    // Auto-close after 5 seconds
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            zIndex: 9998,
                            backdropFilter: 'blur(4px)',
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 20 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 9999,
                            background: '#1F2937',
                            borderRadius: '16px',
                            border: `3px solid ${rarityColor}`,
                            padding: '24px',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center',
                            boxShadow: `0 0 40px ${rarityColor}66`,
                        }}
                    >
                        {/* Rarity badge */}
                        <div style={{
                            display: 'inline-block',
                            background: rarityColor,
                            color: '#000',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '900',
                            marginBottom: '16px',
                        }}>
                            {rarity.toUpperCase()} ACHIEVEMENT
                        </div>

                        {/* Achievement image */}
                        <motion.div
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            style={{
                                width: '200px',
                                height: '200px',
                                margin: '0 auto 16px',
                                filter: `drop-shadow(0 0 20px ${rarityColor}88)`,
                            }}
                        >
                            <img
                                src={`/achievements/achievement_${id}.png`}
                                alt={name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                }}
                            />
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                margin: '0 0 8px 0',
                                fontSize: '24px',
                                fontWeight: '900',
                                color: rarityColor,
                                textShadow: `0 0 10px ${rarityColor}66`,
                            }}
                        >
                            {name}
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                margin: '0 0 12px 0',
                                fontSize: '16px',
                                color: '#D1D5DB',
                                fontWeight: '700',
                            }}
                        >
                            {title}
                        </motion.p>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                margin: '0 0 20px 0',
                                fontSize: '13px',
                                color: '#9CA3AF',
                            }}
                        >
                            {description}
                        </motion.p>

                        {/* Close button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            style={{
                                background: rarityColor,
                                color: '#000',
                                border: 'none',
                                padding: '12px 32px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '900',
                                cursor: 'pointer',
                            }}
                        >
                            AWESOME! 🎉
                        </motion.button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
