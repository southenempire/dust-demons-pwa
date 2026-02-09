'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

const tourSteps = [
    {
        title: '🔗 Connect Your Wallet',
        items: [
            'Click wallet button (top right)',
            'Select your Solana wallet',
            'Approve the connection',
            'Jupiter Mobile gets 3x XP!'
        ],
        highlight: '.wallet-adapter-button'
    },
    {
        title: '🎯 Scan for Dust',
        items: [
            'Find worthless tokens in wallet',
            'Auto-categorize by value',
            'Identify rent-claimable accounts',
            'See total reclaimable SOL'
        ],
        highlight: '.scan-button'
    },
    {
        title: '⚔️ Complete Missions',
        items: [
            'Daily login streaks',
            'Burn dust tokens',
            'Swap to JupSOL',
            'Make price predictions'
        ],
        highlight: '.missions-section'
    },
    {
        title: '🏆 Climb the Leaderboard',
        items: [
            'Compete globally for ranks',
            'Track your percentile',
            'Win contest prizes',
            'Earn exclusive badges'
        ],
        highlight: '.leaderboard-section'
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
                            background: 'rgba(0, 0, 0, 0.9)',
                            zIndex: 9998,
                            pointerEvents: 'auto'
                        }}
                    />

                    {/* Tour Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 9999,
                            width: '90%',
                            maxWidth: '400px',
                            background: 'rgba(0, 0, 0, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: `2px solid ${theme.accent}`,
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px ${theme.accent}40`
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', color: theme.accent, fontWeight: '900' }}>
                                {step.title}
                            </h2>
                            <button
                                onClick={onSkip}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.textDim,
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - Clean List */}
                        <div style={{ marginBottom: '24px' }}>
                            {step.items.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        marginBottom: '8px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                        e.currentTarget.style.borderColor = theme.accent + '40';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                >
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: theme.accent,
                                        flexShrink: 0
                                    }} />
                                    <span style={{ fontSize: '14px', color: theme.text }}>{item}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: theme.textDim }}>
                                {currentStep + 1} / {tourSteps.length}
                            </span>
                            <button
                                onClick={onNext}
                                className="glass-button"
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: theme.accent
                                }}
                            >
                                {isLastStep ? 'START PLAYING' : 'NEXT'}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
