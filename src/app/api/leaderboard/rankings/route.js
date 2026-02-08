// src/app/api/leaderboard/rankings/route.js
// Get top players and user rank

import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Get top players from sorted set (descending by XP)
        const topWallets = await kv.zrevrange('leaderboard:xp', 0, limit - 1, { withScores: true });

        // Fetch player details for top wallets
        const topPlayers = [];
        for (let i = 0; i < topWallets.length; i += 2) {
            const playerWallet = topWallets[i];
            const xp = topWallets[i + 1];

            const playerData = await kv.hgetall(`player:${playerWallet}`);

            if (playerData) {
                topPlayers.push({
                    rank: (i / 2) + 1,
                    wallet: playerWallet,
                    walletShort: `${playerWallet.slice(0, 4)}...${playerWallet.slice(-4)}`,
                    xp: playerData.xp || xp,
                    totalBurned: playerData.totalBurned || 0,
                    solReclaimed: playerData.solReclaimed || 0,
                    level: playerData.level || 1,
                    rank: playerData.rank || 'VOID STALKER',
                    isMobile: playerData.isMobile || false
                });
            }
        }

        // Get user rank if wallet provided
        let userRank = null;
        if (wallet) {
            const rank = await kv.zrevrank('leaderboard:xp', wallet);
            const playerData = await kv.hgetall(`player:${wallet}`);

            if (rank !== null && playerData) {
                userRank = {
                    rank: rank + 1,
                    wallet,
                    xp: playerData.xp || 0,
                    totalBurned: playerData.totalBurned || 0,
                    solReclaimed: playerData.solReclaimed || 0
                };
            }
        }

        // Get total player count
        const totalPlayers = await kv.zcard('leaderboard:xp');

        // Contest end time (example: 7 days from now)
        const contestEndsIn = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

        return NextResponse.json({
            topPlayers,
            userRank,
            totalPlayers: totalPlayers || 0,
            contestEndsIn,
            lastUpdated: Date.now()
        });

    } catch (error) {
        console.error('Leaderboard rankings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
