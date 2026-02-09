'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

const tourSteps = [
    {
        title: 'Connect Wallet',
        emoji: '🔗',
        items: [
            'Tap wallet button',
            'Choose Solana wallet',
            'Approve connection',
            '3x XP with Jupiter!'
        ]
    },
    {
        title: 'Scan for Dust',
        emoji: '🎯',
        items: [
            'Find worthless tokens',
            'Auto-categorize value',
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
        title: 'Climb Ranks',
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
                            background: 'rgba(0, 0, 0, 0.95)',
                            zIndex: 9998,
                            backdropFilter: 'blur(8px)'
                        }}
                        onClick={onSkip}
                    />

                    {/* Tour Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '16px',
                            right: '16px',
                            transform: 'translateY(-50%)',
                            zIndex: 9999,
                            maxWidth: '340px',
                            margin: '0 auto',
                            background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: `1.5px solid ${theme.accent}`,
                            borderRadius: '14px',
                            padding: '20px 18px',
                            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px ${theme.accent}15, inset 0 1px 0 rgba(255, 255, 255, 0.04)`
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onSkip}
                            style={{
                                position: 'absolute',
                                top: '14px',
                                right: '14px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: theme.textDim,
                                padding: 0
                            }}
                        >
                            <X size={14} />
                        </button>

                        {/* Header */}
                        <div style={{ marginBottom: '16px', paddingRight: '28px' }}>
                            <div style={{
                                fontSize: '28px',
                                marginBottom: '6px',
                                filter: `drop-shadow(0 2px 8px ${theme.accent}40)`
                            }}>
                                {step.emoji}
                            </div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '18px',
                                color: theme.text,
                                fontWeight: '800',
                                letterSpacing: '-0.3px',
                                lineHeight: '1.2'
                            }}>
                                {step.title}
                            </h2>
                        </div>

                        {/* Content - Clean List */}
                        <div style={{ marginBottom: '18px' }}>
                            {step.items.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06, type: 'spring', damping: 20 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        padding: '8px 10px',
                                        marginBottom: i === step.items.length - 1 ? 0 : '4px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <div style={{
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        background: theme.accent,
                                        flexShrink: 0,
                                        marginTop: '5px',
                                        boxShadow: `0 0 6px ${theme.accent}`
                                    }} />
                                    <span style={{
                                        fontSize: '13px',
                                        color: theme.text,
                                        lineHeight: '1.4',
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
                            paddingTop: '14px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <span style={{
                                fontSize: '10px',
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
                                    padding: '8px 16px',
                                    borderRadius: '7px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#000',
                                    background: theme.accent,
                                    border: 'none',
                                    boxShadow: `0 4px 12px ${theme.accent}35`,
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                {isLastStep ? 'START' : 'NEXT'}
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
