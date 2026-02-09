// src/components/ReferralPanel.js
// Referral code display and sharing component

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Copy, Share2, Twitter } from 'lucide-react';

export default function ReferralPanel({ wallet, theme, onCopy, onShare }) {
    const [referralCode, setReferralCode] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Fetch or generate referral code
    useEffect(() => {
        if (!wallet) {
            console.log('ReferralPanel: No wallet connected');
            return;
        }

        console.log('ReferralPanel: Fetching referral data for wallet:', wallet);

        async function fetchReferralData() {
            try {
                // Generate code if doesn't exist
                console.log('ReferralPanel: Calling /api/referrals/generate');
                const genRes = await fetch('/api/referrals/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet })
                });
                const genData = await genRes.json();
                console.log('ReferralPanel: Generate response:', genData);

                if (genData.code) {
                    setReferralCode(genData.code);
                } else {
                    console.error('ReferralPanel: No code in response:', genData);
                }

                // Fetch stats
                console.log('ReferralPanel: Calling /api/referrals/stats');
                const statsRes = await fetch(`/api/referrals/stats?wallet=${wallet}`);
                const statsData = await statsRes.json();
                console.log('ReferralPanel: Stats response:', statsData);
                setStats(statsData);

                setLoading(false);
            } catch (error) {
                console.error('ReferralPanel: Fetch error:', error);
                setLoading(false);
            }
        }

        fetchReferralData();
    }, [wallet]);

    const referralLink = referralCode
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://dustdemons.app'}?ref=${referralCode}`
        : '';

    const handleCopyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onCopy) onCopy();
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onCopy) onCopy();
    };

    const handleTwitterShare = () => {
        const text = `🔥 I'm cleaning my Solana wallet with Dust Demons!\n\nTurn worthless tokens into JupSOL yield 💰\n\nJoin me: ${referralLink}\n\n#Solana #Jupiter #DeFi`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        if (onShare) onShare('twitter');
    };

    if (!wallet) {
        return (
            <div style={{
                padding: '20px',
                background: theme.panel,
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                textAlign: 'center'
            }}>
                <p style={{ margin: 0, color: theme.textDim, fontSize: '13px' }}>
                    Connect wallet to get your referral code
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                padding: '20px',
                background: theme.panel,
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                textAlign: 'center'
            }}>
                <p style={{ margin: 0, color: theme.textDim, fontSize: '13px' }}>
                    Loading referral data...
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: `linear-gradient(135deg, ${theme.panel} 0%, ${theme.bg} 100%)`,
                borderRadius: '12px',
                border: `2px solid ${theme.accent}`,
                padding: '20px',
                boxShadow: `0 0 20px ${theme.accent}33`
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px'
            }}>
                <div style={{ fontSize: '28px' }}>🎁</div>
                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '900',
                        color: theme.accent
                    }}>
                        INVITE FRIENDS & EARN
                    </h3>
                    <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '11px',
                        color: theme.textDim
                    }}>
                        +50 XP per referral • Milestone bonuses
                    </p>
                </div>
            </div>

            {/* Referral Code */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: '900',
                    color: theme.textDim,
                    marginBottom: '6px',
                    letterSpacing: '1px'
                }}>
                    YOUR REFERRAL CODE
                </label>
                <div style={{
                    display: 'flex',
                    gap: '8px'
                }}>
                    <div style={{
                        flex: 1,
                        background: theme.bg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '18px',
                        fontWeight: '900',
                        color: theme.accent,
                        textAlign: 'center',
                        letterSpacing: '2px'
                    }}>
                        {referralCode}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyCode}
                        style={{
                            background: copied ? '#10B981' : theme.accent,
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'pointer',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Copy size={20} />
                    </motion.button>
                </div>
            </div>

            {/* Share Buttons */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px'
            }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTwitterShare}
                    style={{
                        background: '#1DA1F2',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Twitter size={16} />
                    SHARE ON X
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyLink}
                    style={{
                        background: theme.panel,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        padding: '12px',
                        color: theme.text,
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Share2 size={16} />
                    COPY LINK
                </motion.button>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{
                    background: theme.bg,
                    borderRadius: '8px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginBottom: '12px'
                    }}>
                        <div>
                            <div style={{
                                fontSize: '10px',
                                color: theme.textDim,
                                marginBottom: '4px'
                            }}>
                                REFERRALS
                            </div>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: '900',
                                color: theme.accent
                            }}>
                                {stats.totalReferrals}
                            </div>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '10px',
                                color: theme.textDim,
                                marginBottom: '4px'
                            }}>
                                XP EARNED
                            </div>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: '900',
                                color: '#FFD700'
                            }}>
                                +{stats.totalXPEarned}
                            </div>
                        </div>
                    </div>

                    {/* Next Milestone */}
                    {stats.nextMilestone && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '6px'
                            }}>
                                <span style={{ fontSize: '10px', color: theme.textDim }}>
                                    Next Bonus
                                </span>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: theme.accent }}>
                                    {stats.referralsUntilBonus} more for +{stats.nextBonus} XP
                                </span>
                            </div>
                            <div style={{
                                height: '6px',
                                background: theme.panel,
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(stats.totalReferrals / stats.nextMilestone) * 100}%`
                                    }}
                                    style={{
                                        height: '100%',
                                        background: `linear-gradient(90deg, ${theme.accent} 0%, #FFD700 100%)`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
