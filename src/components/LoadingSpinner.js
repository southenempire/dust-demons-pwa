'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner({ theme, type = 'pulse', size = 24 }) {
    if (type === 'flame') {
        return (
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    fontSize: `${size}px`,
                    filter: `drop-shadow(0 0 ${size / 2}px ${theme.accent})`
                }}
            >
                🔥
            </motion.div>
        );
    }

    if (type === 'dust') {
        return (
            <motion.div
                animate={{ rotate: 360 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    fontSize: `${size}px`,
                    filter: `drop-shadow(0 0 ${size / 2}px ${theme.accent})`
                }}
            >
                💫
            </motion.div>
        );
    }

    // Default pulse
    return (
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
            }}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: theme.accent,
                boxShadow: `0 0 ${size}px ${theme.accent}80`
            }}
        />
    );
}
