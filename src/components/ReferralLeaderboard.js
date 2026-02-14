import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

export default function ReferralLeaderboard({ wallet, theme }) {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch('/api/referrals/leaderboard?limit=10');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setLeaders(data);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Trophy size={16} color="#FFD700" />;
            case 1: return <Medal size={16} color="#C0C0C0" />;
            case 2: return <Award size={16} color="#CD7F32" />;
            default: return <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.textDim }}>#{index + 1}</span>;
        }
    };

    if (loading) return null;

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Trophy size={18} color={theme.accent} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: theme.accent, letterSpacing: '1px' }}>TOP REFERRERS</h4>
            </div>

            <div style={{ background: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                {leaders.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: theme.textDim, fontSize: '12px' }}>
                        No referrals yet. Be the first!
                    </div>
                ) : (
                    leaders.map((leader, index) => {
                        const isMe = wallet && leader.referrer_wallet === wallet;
                        return (
                            <motion.div
                                key={leader.referrer_wallet}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 15px',
                                    borderBottom: index < leaders.length - 1 ? `1px solid ${theme.border}` : 'none',
                                    background: isMe ? `${theme.accent}15` : 'transparent'
                                }}
                            >
                                <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                                    {getRankIcon(index)}
                                </div>
                                <div style={{ flex: 1, marginLeft: '10px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: isMe ? theme.accent : theme.text, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {isMe ? 'YOU' : `${leader.referrer_wallet.slice(0, 4)}...${leader.referrer_wallet.slice(-4)}`}
                                        {/* OG Burner Badge */}
                                        {leader.og_number && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                borderRadius: '4px',
                                                padding: '2px 6px',
                                                fontSize: '9px',
                                                fontWeight: '900',
                                                color: '#000',
                                                boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
                                            }}>
                                                🔥 #{leader.og_number}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '900', color: theme.text }}>
                                        {leader.total_referrals} Refs
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#fbbf24' }}>
                                        {parseInt(leader.total_xp).toLocaleString()} XP
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
