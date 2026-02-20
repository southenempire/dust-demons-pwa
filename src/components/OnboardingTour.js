'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

const tourSteps = [
    {
        title: 'Uplink via Jupiter',
        emoji: '🪐',
        items: [
            'Tap UPLINK MOBILE',
            'Launch Jupiter app',
            'Approve connection automatically',
            'Earn 3x XP bonus!'
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

export default function OnboardingTour({ show, currentStep, onNext, onBack, onSkip, theme }) {
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

                    {/* Centering Container */}
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        pointerEvents: 'none'
                    }}>
                        {/* Tour Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            style={{
                                pointerEvents: 'auto',
                                width: '100%',
                                maxWidth: '360px',
                                maxHeight: '85vh',
                                overflowY: 'auto',
                                background: 'rgba(12, 12, 14, 0.95)',
                                backdropFilter: 'blur(24px)',
                                border: `1px solid ${theme.accent}40`,
                                borderRadius: '20px',
                                padding: '24px',
                                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255,255,255,0.05)`
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
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {/* Back Button */}
                                    {currentStep > 0 && (
                                        <button
                                            onClick={onBack}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '8px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: 'none',
                                                color: theme.textDim,
                                                cursor: 'pointer',
                                                transition: '0.2s'
                                            }}
                                        >
                                            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                                        </button>
                                    )}
                                    <span style={{
                                        fontSize: '11px',
                                        color: theme.textDim,
                                        fontWeight: '500',
                                        fontFamily: 'monospace'
                                    }}>
                                        {currentStep + 1} / {tourSteps.length}
                                    </span>
                                </div>

                                <button
                                    onClick={() => onNext(true)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: '#000',
                                        background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)`,
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: `0 4px 12px ${theme.accent}40`,
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {isLastStep ? '🚀 LAUNCH' : 'NEXT'} <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
