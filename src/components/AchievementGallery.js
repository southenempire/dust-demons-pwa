// src/components/AchievementGallery.js
// View all achievements with progress

import { motion } from 'framer-motion';
import { useState } from 'react';
import AchievementBadge from './AchievementBadge';
import { getAllAchievements, getAchievementProgress } from '@/lib/nft/achievementTracker';

export default function AchievementGallery({
    earnedAchievements = [],
    stats = {},
    context = {},
    theme,
    onMint
}) {
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const allAchievements = getAllAchievements();

    // Calculate total progress
    const earnedCount = earnedAchievements.length;
    const totalCount = allAchievements.length;
    const progressPercentage = (earnedCount / totalCount) * 100;

    return (
        <div style={{ padding: '16px' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    fontWeight: '900',
                    color: theme.accent,
                }}>
                    🏆 Achievements
                </h2>
                <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    color: theme.textDim,
                }}>
                    Collect all {totalCount} achievements to become a legend
                </p>

                {/* Progress bar */}
                <div style={{
                    background: theme.panel,
                    borderRadius: '8px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                    }}>
                        <span style={{ fontSize: '12px', color: theme.text, fontWeight: '700' }}>
                            Progress
                        </span>
                        <span style={{ fontSize: '12px', color: theme.accent, fontWeight: '900' }}>
                            {earnedCount}/{totalCount}
                        </span>
                    </div>
                    <div style={{
                        height: '8px',
                        background: '#374151',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5 }}
                            style={{
                                height: '100%',
                                background: `linear-gradient(90deg, ${theme.accent} 0%, #F59E0B 100%)`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Achievement grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '20px',
            }}>
                {allAchievements.map((achievement, index) => {
                    const isEarned = earnedAchievements.includes(achievement.id);
                    const progress = !isEarned ? getAchievementProgress(achievement.id, stats, context) : null;

                    return (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <AchievementBadge
                                achievement={achievement}
                                earned={isEarned}
                                progress={progress}
                                onClick={() => setSelectedAchievement(achievement)}
                            />
                        </motion.div>
                    );
                })}
            </div>

            {/* Selected achievement details */}
            {selectedAchievement && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '20px',
                        background: theme.panel,
                        borderRadius: '12px',
                        padding: '16px',
                        border: `1px solid ${theme.border}`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '32px' }}>{selectedAchievement.emoji}</div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{
                                margin: '0 0 4px 0',
                                fontSize: '16px',
                                fontWeight: '900',
                                color: theme.accent,
                            }}>
                                {selectedAchievement.name}
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: theme.textDim,
                            }}>
                                {selectedAchievement.title}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedAchievement(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme.textDim,
                                fontSize: '20px',
                                cursor: 'pointer',
                                padding: '4px',
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: theme.text,
                    }}>
                        {selectedAchievement.description}
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '8px',
                    }}>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '900',
                            background: '#374151',
                            color: '#D1D5DB',
                        }}>
                            TIER {selectedAchievement.tier}
                        </span>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '900',
                            background: '#8B5CF6',
                            color: '#000',
                        }}>
                            {selectedAchievement.rarity.toUpperCase()}
                        </span>
                        {earnedAchievements.includes(selectedAchievement.id) && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    background: '#10B981',
                                    color: '#000',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    ✓ UNLOCKED
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMint && onMint(selectedAchievement);
                                    }}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        background: 'linear-gradient(45deg, #a855f7, #ec4899)',
                                        color: '#fff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    MINT NFT
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
