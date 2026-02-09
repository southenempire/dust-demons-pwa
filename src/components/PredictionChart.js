import { motion } from 'framer-motion';

export default function PredictionChart({ startPrice, currentPrice, direction, theme }) {
    // Simple visualizer: Start price is the middle line.
    // Current price moves up or down relative to it.

    const percentageChange = ((currentPrice - startPrice) / startPrice) * 100;
    const isWin = direction === 'up' ? currentPrice > startPrice : currentPrice < startPrice;

    // Calculate relative position (clamped to keep within view)
    // 0 = center, -50 = bottom, +50 = top
    const relativeY = Math.max(-45, Math.min(45, percentageChange * 500)); // Amplify movement for visual effect

    return (
        <div style={{
            width: '100%',
            height: '100px',
            background: theme.bg,
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${theme.border}`,
            marginBottom: '10px'
        }}>
            {/* Center Line (Start Price) */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                background: theme.textDim,
                borderTop: '1px dashed ' + theme.textDim,
                opacity: 0.5
            }} />
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '5px',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                color: theme.textDim
            }}>
                ENTRY: ${startPrice.toFixed(2)}
            </div>

            {/* Current Price Indicator */}
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: -relativeY }} // Negative because Y goes down in CSS
                transition={{ type: 'spring', stiffness: 100 }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: isWin ? '#00ff41' : '#ff0055',
                    boxShadow: `0 0 10px ${isWin ? '#00ff41' : '#ff0055'}`,
                    zIndex: 2
                }}
            />

            {/* Dynamic Line connecting center to current */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '2px',
                height: Math.abs(relativeY),
                background: isWin ? '#00ff41' : '#ff0055',
                transform: `translate(-50%, ${relativeY > 0 ? -100 : 0}%)`, // Grow up or down
                opacity: 0.5
            }} />

            {/* Live Price Label */}
            <motion.div
                animate={{ y: -relativeY }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '60%', // Offset from dot
                    color: isWin ? '#00ff41' : '#ff0055',
                    fontSize: '12px',
                    fontWeight: '900',
                    textShadow: '0 0 5px rgba(0,0,0,0.5)'
                }}
            >
                ${currentPrice.toFixed(2)} ({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(3)}%)
            </motion.div>
        </div>
    );
}
