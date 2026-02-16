// src/components/OGBurnerCelebration.js
// Celebration modal when user becomes an OG Burner

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function OGBurnerCelebration({ isOpen, onClose, ogNumber, totalOGs = 100, onMint, isMinting, isMinted }) {
    useEffect(() => {
        if (isOpen) {
            // Fire confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#00ff41', '#ff0055', '#9d4edd']
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#00ff41', '#ff0055', '#9d4edd']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '20px'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(0, 255, 65, 0.1) 100%)',
                            border: '2px solid rgba(157, 78, 221, 0.3)',
                            borderRadius: '24px',
                            padding: '40px',
                            maxWidth: '500px',
                            width: '100%',
                            position: 'relative',
                            textAlign: 'center'
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                            }}
                        >
                            <X size={16} />
                        </button>

                        {/* Trophy icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                            style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 20px',
                                background: 'linear-gradient(135deg, #9d4edd 0%, #00ff41 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Trophy size={40} color="white" />
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #9d4edd 0%, #00ff41 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '16px'
                            }}
                        >
                            🔥 YOU&apos;RE AN OG BURNER! 🔥
                        </motion.h1>

                        {/* OG Number */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: 'spring', damping: 10 }}
                            style={{
                                fontSize: '64px',
                                fontWeight: 'bold',
                                color: '#00ff41',
                                marginBottom: '16px',
                                textShadow: '0 0 20px rgba(0, 255, 65, 0.5)'
                            }}
                        >
                            #{ogNumber}
                        </motion.div>

                        {/* Description */}
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                fontSize: '18px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                marginBottom: '24px',
                                lineHeight: '1.6'
                            }}
                        >
                            You&apos;re one of the first <strong>{totalOGs}</strong> users to burn dust!
                            <br />
                            Your exclusive OG Burner NFT is coming soon...
                        </motion.p>


                        {/* Flame animation */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                            style={{
                                fontSize: '48px',
                                marginBottom: '24px'
                            }}
                        >
                            <Flame size={48} color="#ff0055" style={{ margin: '0 auto' }} />
                        </motion.div>

                        {/* Buttons Container */}
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            {/* Mint Button */}
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onMint}
                                disabled={isMinting || isMinted}
                                style={{
                                    background: isMinted
                                        ? 'rgba(0, 255, 65, 0.2)'
                                        : 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', // Gold/Amber for Premium Feel
                                    border: isMinted ? '1px solid #00ff41' : 'none',
                                    borderRadius: '12px',
                                    padding: '12px 20px',
                                    fontSize: '14px',
                                    fontWeight: '900',
                                    color: isMinted ? '#00ff41' : (isMinting ? 'rgba(0,0,0,0.5)' : 'black'),
                                    cursor: (isMinting || isMinted) ? 'default' : 'pointer',
                                    flex: 1,
                                    boxShadow: isMinted ? 'none' : '0 4px 15px rgba(251, 191, 36, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isMinting ? (
                                    <>Claiming...</>
                                ) : isMinted ? (
                                    <>✅ CLAIMED</>
                                ) : (
                                    <>🔥 CLAIM OG BADGE</>
                                )}
                            </motion.button>

                            {/* Close Button */}
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    padding: '12px 20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                CLOSE
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
