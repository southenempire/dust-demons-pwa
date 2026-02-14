import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

export default function PredictionChart({ startPrice = 0, currentPrice = 0, direction, theme }) {
    // ⚡ GENERATE FAKE VOLATILITY LINE
    // We want a line that starts at 'startPrice' and ends at 'currentPrice',
    // but has random jaggedness in between to look like a chart.

    const [dataPoints, setDataPoints] = useState([]);

    useEffect(() => {
        const points = [];
        const steps = 40; // Number of points in the graph
        const volatility = (Math.abs(currentPrice - startPrice) || startPrice * 0.0005) * 0.5;

        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;

            // Linear interpolation between start and end
            let value = startPrice + (currentPrice - startPrice) * progress;

            // Add randomness (noise)
            if (i > 0 && i < steps) {
                value += (Math.random() - 0.5) * volatility;
            }

            points.push(value);
        }
        setDataPoints(points);
    }, [startPrice, currentPrice]);

    if (dataPoints.length === 0) return null;

    // Calculate SVG scales
    const minVal = Math.min(...dataPoints);
    const maxVal = Math.max(...dataPoints);
    const range = maxVal - minVal || 0.00001;
    const padding = range * 0.2; // 20% padding top/bottom

    const getY = (val) => {
        // Map value to Y coordinate (0 at top, 100 at bottom)
        return 100 - ((val - (minVal - padding)) / (range + padding * 2)) * 100;
    };

    const getX = (index) => {
        // Map index to X coordinate (0 to 100%)
        return (index / (dataPoints.length - 1)) * 100;
    };

    // Build SVG Path
    const pathD = dataPoints.reduce((acc, val, i) => {
        const x = getX(i);
        const y = getY(val);
        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    // Fill area (for gradient under line)
    const fillD = `${pathD} L 100 100 L 0 100 Z`;

    const isWin = direction === 'up' ? currentPrice >= startPrice : currentPrice <= startPrice;
    const color = isWin ? '#00ff41' : '#ff0055';
    const finalY = getY(currentPrice);

    return (
        <div style={{
            width: '100%',
            height: '140px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${theme.border}`,
            marginBottom: '10px'
        }}>
            {/* SVG CHART */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Gradient Fill */}
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={fillD} fill="url(#chartGradient)" />

                {/* The Line */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>

            {/* Start Line (Dashed) */}
            <div style={{
                position: 'absolute',
                top: `${getY(startPrice)}%`,
                left: 0,
                right: 0,
                height: '1px',
                borderTop: `1px dashed ${theme.textDim}`,
                opacity: 0.5,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: `${getY(startPrice)}%`,
                left: '5px',
                transform: 'translateY(-150%)',
                fontSize: '9px',
                color: theme.textDim,
                fontWeight: 'bold'
            }}>
                ENTRY: ${startPrice.toFixed(2)}
            </div>

            {/* Current Price Dot & Label */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                    position: 'absolute',
                    top: `${finalY}%`,
                    right: '0',
                    transform: 'translate(50%, -50%)',
                    zIndex: 10
                }}
            >
                <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 10px ${color}`,
                    border: '2px solid #fff'
                }} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                    position: 'absolute',
                    top: `${finalY}%`,
                    right: '15px',
                    transform: 'translateY(-50%)',
                    textAlign: 'right'
                }}
            >
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', textShadow: `0 0 10px ${color}` }}>
                    ${currentPrice.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: color, fontWeight: 'bold' }}>
                    {((currentPrice - startPrice) / startPrice * 100).toFixed(3)}%
                </div>
            </motion.div>
        </div>
    );
}
