'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

const tourSteps = [
    {
        title: 'Connect Wallet',
        emoji: '🔗',
        items: [
            'Tap wallet button above',
            'Choose your Solana wallet',
            'Approve connection',
            '3x XP with Jupiter Mobile!'
        ]
    },
    {
        title: 'Scan for Dust',
        emoji: '🎯',
        items: [
            'Find worthless tokens',
            'Auto-categorize by value',
            'See reclaimable SOL',
            'Identify rent accounts'
        ]
    },
    {
        title: 'Complete Missions',
        emoji: '⚔️',
        items: [
            'Daily login streaks',
            'Burn dust tokens',
            'Swap to JupSOL',
            'Make predictions'
        ]
    },
    {
        title: 'Climb Leaderboard',
        emoji: '🏆',
        items: [
            'Compete globally',
            'Track percentile',
            'Win prizes',
            'Earn badges'
        ]
    }
];

export default function OnboardingTour({ show, currentStep, onNext, onSkip, theme }) {
    if (!show) return null;

    const step = tourSteps[currentStep];
    const isLastStep = currentStep === tourSteps.length - 1;

    return (
        <AnimatePresence>
            {show && (
                <>
                    {/* Dark Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.92)',
                            zIndex: 9998,
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={onSkip}
                    />

                    {/* Tour Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 9999,
                            width: 'calc(100vw - 32px)',
                            maxWidth: '360px',
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${theme.accent}`,
                            borderRadius: '16px',
                            padding: '24px 20px',
                            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px ${theme.accent}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onSkip}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: theme.textDim
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.borderColor = theme.accent;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            <X size={16} />
                        </button>

                        {/* Header */}
                        <div style={{ marginBottom: '20px', paddingRight: '32px' }}>
                            <div style={{
                                fontSize: '32px',
                                marginBottom: '8px',
                                filter: 'drop-shadow(0 2px 8px rgba(0, 255, 65, 0.3))'
                            }}>
                                {step.emoji}
                            </div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '20px',
                                color: theme.text,
                                fontWeight: '800',
                                letterSpacing: '-0.5px',
                                lineHeight: '1.2'
                            }}>
                                {step.title}
                            </h2>
                        </div>

                        {/* Content - Clean List */}
                        <div style={{ marginBottom: '24px' }}>
                            {step.items.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08, type: 'spring', damping: 20 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        marginBottom: i === step.items.length - 1 ? 0 : '6px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        background: theme.accent,
                                        flexShrink: 0,
                                        marginTop: '6px',
                                        boxShadow: `0 0 8px ${theme.accent}`
                                    }} />
                                    <span style={{
                                        fontSize: '14px',
                                        color: theme.text,
                                        lineHeight: '1.5',
                                        fontWeight: '400'
                                    }}>
                                        {item}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <span style={{
                                fontSize: '11px',
                                color: theme.textDim,
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                {currentStep + 1} / {tourSteps.length}
                            </span>
                            <button
                                onClick={onNext}
                                className="glass-button"
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#000',
                                    background: theme.accent,
                                    border: 'none',
                                    boxShadow: `0 4px 12px ${theme.accent}40`,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = `0 6px 16px ${theme.accent}60`;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = `0 4px 12px ${theme.accent}40`;
                                }}
                            >
                                {isLastStep ? 'START' : 'NEXT'}
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
