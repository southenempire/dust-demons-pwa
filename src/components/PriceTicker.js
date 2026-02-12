import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { getTokenPrices } from '@/utils/jupiter-price';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUP_SOL_MINT = 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v';

export default function PriceTicker() {
    const [prices, setPrices] = useState({ sol: 0, jupsol: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getTokenPrices([SOL_MINT, JUP_SOL_MINT]);
                // data structure: { [mint]: { price, id, decimals } }
                setPrices({
                    sol: data[SOL_MINT]?.price || 0,
                    jupsol: data[JUP_SOL_MINT]?.price || 0
                });
                setLoading(false);
            } catch (e) {
                console.error('Ticker error:', e);
            }
        };

        fetch();
        const interval = setInterval(fetch, 10000); // 10s update
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    const TickerItem = ({ label, price, isJup }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
            <span style={{ color: isJup ? '#00c2ff' : '#9ca3af', fontWeight: 'bold' }}>{label}</span>
            <span style={{ color: '#fff' }}>${price.toFixed(2)}</span>
        </div>
    );

    return (
        <div style={{
            width: '100%',
            background: '#0a0a0a',
            borderBottom: '1px solid #1f2937',
            overflow: 'hidden',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            zIndex: 50
        }}>
            <div className="ticker-wrap" style={{ display: 'flex', whiteSpace: 'nowrap', width: '100%' }}>
                <div style={{
                    display: 'flex',
                    animation: 'ticker 30s linear infinite', // Slower scrolling
                    gap: '40px',
                    paddingLeft: '100%'
                }}>
                    {/* REPEAT ITEMS FOR LOOP */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                            <TickerItem label="SOL" price={prices.sol} />
                            <TickerItem label="JupSOL" price={prices.jupsol} isJup />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#00c2ff', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Zap size={12} fill="#00c2ff" /> POWERED BY JUPITER
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
        </div>
    );
}
