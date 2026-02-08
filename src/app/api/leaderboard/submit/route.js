// src/app/api/leaderboard/submit/route.js
// Submit player stats to Supabase leaderboard

import { supabase } from '@/lib/supabase';
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

        // Upsert player data
        const { error: upsertError } = await supabase
            .from('players')
            .upsert({
                wallet,
                xp: xp || 0,
                total_burned: totalBurned || 0,
                sol_reclaimed: solReclaimed || 0,
                level: level || 1,
                rank: rank || 'VOID STALKER',
                is_mobile: isMobile || false,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'wallet'
            });

        if (upsertError) {
            console.error('Supabase upsert error:', upsertError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Get player's rank
        const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .gt('xp', xp || 0);

        const playerRank = (count || 0) + 1;

        return NextResponse.json({
            success: true,
            rank: playerRank,
            xp: xp || 0,
            message: 'Stats updated successfully'
        });

    } catch (error) {
        console.error('Leaderboard submit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
