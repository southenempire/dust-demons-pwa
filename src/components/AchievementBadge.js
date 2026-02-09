// src/components/AchievementBadge.js
// Display a single achievement badge

import { motion } from 'framer-motion';

export default function AchievementBadge({ achievement, earned = false, progress = null, onClick }) {
    const { id, name, title, description, tier, rarity, emoji } = achievement;

    // Rarity colors
    const rarityColors = {
        Common: '#9CA3AF',
        Uncommon: '#8B5CF6',
        Rare: '#3B82F6',
        Legendary: '#F59E0B',
    };

    const rarityColor = rarityColors[rarity] || '#9CA3AF';

    return (
        <motion.div
            whileHover={{ scale: earned ? 1.05 : 1 }}
            whileTap={{ scale: earned ? 0.95 : 1 }}
            onClick={onClick}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                borderRadius: '12px',
                border: `2px solid ${earned ? rarityColor : '#374151'}`,
                background: earned
                    ? `linear-gradient(135deg, ${rarityColor}22 0%, ${rarityColor}11 100%)`
                    : '#1F2937',
                padding: '12px',
                cursor: onClick ? 'pointer' : 'default',
                opacity: earned ? 1 : 0.5,
                overflow: 'hidden',
            }}
        >
            {/* Rarity badge */}
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: rarityColor,
                color: '#000',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: '900',
            }}>
                {rarity.toUpperCase()}
            </div>

            {/* Achievement image */}
            <div style={{
                width: '100%',
                height: '60%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
            }}>
                {earned ? (
                    <img
                        src={`/achievements/achievement_${id}.png`}
                        alt={name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
                        }}
                    />
                ) : (
                    <div style={{
                        fontSize: '48px',
                        opacity: 0.3,
                        filter: 'grayscale(100%)',
                    }}>
                        {emoji}
                    </div>
                )}
            </div>

            {/* Achievement info */}
            <div style={{ textAlign: 'center' }}>
                <p style={{
                    margin: '0 0 2px 0',
                    fontSize: '11px',
                    fontWeight: '900',
                    color: earned ? rarityColor : '#6B7280',
                }}>
                    {name}
                </p>
                <p style={{
                    margin: 0,
                    fontSize: '9px',
                    color: '#9CA3AF',
                }}>
                    {title}
                </p>
            </div>

            {/* Progress bar (if not earned) */}
            {!earned && progress && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: '#374151',
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        style={{
                            height: '100%',
                            background: rarityColor,
                        }}
                    />
                </div>
            )}

            {/* Earned checkmark */}
            {earned && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: '#10B981',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                    }}
                >
                    ✓
                </motion.div>
            )}
        </motion.div>
    );
}
