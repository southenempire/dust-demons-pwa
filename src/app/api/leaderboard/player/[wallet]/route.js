// src/app/api/leaderboard/player/[wallet]/route.js
// Get detailed player stats

import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { wallet } = params;

        if (!wallet || typeof wallet !== 'string') {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        // Get player data
        const playerData = await kv.hgetall(`player:${wallet}`);

        if (!playerData) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        // Get player rank
        const rank = await kv.zrevrank('leaderboard:xp', wallet);
        const totalPlayers = await kv.zcard('leaderboard:xp');

        const actualRank = rank !== null ? rank + 1 : null;
        const percentile = actualRank && totalPlayers
            ? Math.round((1 - (actualRank / totalPlayers)) * 100)
            : 0;

        return NextResponse.json({
            wallet,
            walletShort: `${wallet.slice(0, 4)}...${wallet.slice(-4)}`,
            xp: playerData.xp || 0,
            rank: actualRank,
            totalBurned: playerData.totalBurned || 0,
            solReclaimed: playerData.solReclaimed || 0,
            level: playerData.level || 1,
            rankTitle: playerData.rank || 'VOID STALKER',
            isMobile: playerData.isMobile || false,
            percentile,
            totalPlayers,
            lastUpdated: playerData.lastUpdated || Date.now()
        });

    } catch (error) {
        console.error('Player stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
