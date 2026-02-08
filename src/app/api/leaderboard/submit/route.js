// src/app/api/leaderboard/submit/route.js
// Submit player stats to leaderboard

import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Rate limiting map (in-memory for simplicity)
const rateLimitMap = new Map();

function checkRateLimit(wallet) {
    const now = Date.now();
    const key = `ratelimit:${wallet}`;
    const limit = rateLimitMap.get(key) || { count: 0, resetTime: now + 60000 };

    if (now > limit.resetTime) {
        limit.count = 0;
        limit.resetTime = now + 60000;
    }

    if (limit.count >= 10) {
        return false;
    }

    limit.count++;
    rateLimitMap.set(key, limit);
    return true;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { wallet, xp, totalBurned, solReclaimed, level, rank, isMobile } = body;

        // Validate wallet
        if (!wallet || typeof wallet !== 'string' || wallet.length < 32) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        // Rate limiting
        if (!checkRateLimit(wallet)) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        // Update player data in hash
        const playerKey = `player:${wallet}`;
        await kv.hset(playerKey, {
            wallet,
            xp: xp || 0,
            totalBurned: totalBurned || 0,
            solReclaimed: solReclaimed || 0,
            level: level || 1,
            rank: rank || 'VOID STALKER',
            isMobile: isMobile || false,
            lastUpdated: Date.now()
        });

        // Update sorted sets for rankings
        await kv.zadd('leaderboard:xp', { score: xp || 0, member: wallet });
        await kv.zadd('leaderboard:burns', { score: totalBurned || 0, member: wallet });
        await kv.zadd('leaderboard:sol', { score: solReclaimed || 0, member: wallet });

        // Get player's rank
        const playerRank = await kv.zrevrank('leaderboard:xp', wallet);
        const actualRank = playerRank !== null ? playerRank + 1 : null;

        return NextResponse.json({
            success: true,
            rank: actualRank,
            xp: xp || 0,
            message: 'Stats updated successfully'
        });

    } catch (error) {
        console.error('Leaderboard submit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
