// src/app/api/player/stats/route.js
// Load and save player stats from Supabase (wallet-keyed persistence)

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/player/stats?wallet=<address>
// Returns saved stats for a given wallet
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');

        if (!wallet || wallet.length < 32) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('players')
            .select('xp, total_burned, sol_reclaimed, level, rank, is_mobile, last_updated')
            .eq('wallet', wallet)
            .single();

        if (error || !data) {
            // No record yet — return defaults (first time player)
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({
            found: true,
            stats: {
                xp: data.xp || 0,
                totalBurned: data.total_burned || 0,
                solReclaimed: parseFloat(data.sol_reclaimed) || 0,
                level: data.level || 1,
                rank: data.rank || 'VOID STALKER',
                isMobile: data.is_mobile || false,
                lastUpdated: data.last_updated
            }
        });

    } catch (error) {
        console.error('Player stats GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/player/stats
// Save updated player stats to Supabase
export async function POST(request) {
    try {
        const body = await request.json();
        const { wallet, xp, totalBurned, solReclaimed, level, rank, isMobile } = body;

        if (!wallet || wallet.length < 32) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        const { error } = await supabase
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
            }, { onConflict: 'wallet' });

        if (error) {
            console.error('Player stats upsert error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Player stats POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
