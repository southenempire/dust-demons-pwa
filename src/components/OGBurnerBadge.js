// src/components/OGBurnerBadge.js
// Badge component to display OG Burner status

'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export default function OGBurnerBadge({ ogNumber, size = 'medium' }) {
    const sizes = {
        small: {
            container: '24px',
            fontSize: '10px',
            iconSize: 12
        },
        medium: {
            container: '32px',
            fontSize: '12px',
            iconSize: 16
        },
        large: {
            container: '48px',
            fontSize: '14px',
            iconSize: 20
        }
    };

    const config = sizes[size];

    return (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', damping: 10 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.2) 0%, rgba(0, 255, 65, 0.2) 100%)',
                border: '1.5px solid rgba(157, 78, 221, 0.5)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: config.fontSize,
                fontWeight: 'bold',
                color: '#00ff41',
                textShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
                cursor: 'pointer',
                userSelect: 'none'
            }}
            title={`OG Burner #${ogNumber} - One of the first 100!`}
        >
            <Flame size={config.iconSize} color="#ff0055" />
            <span>OG #{ogNumber}</span>
        </motion.div>
    );
}
