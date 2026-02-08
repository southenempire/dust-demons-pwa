// src/app/api/leaderboard/player/[wallet]/route.js
// Get detailed player stats from Supabase

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { wallet } = params;

        if (!wallet || typeof wallet !== 'string') {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        // Get player data
        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('wallet', wallet)
            .single();

        if (playerError || !playerData) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        // Get player rank
        const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .gt('xp', playerData.xp || 0);

        const playerRank = (count || 0) + 1;

        // Get total players
        const { count: totalPlayers } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true });

        const percentile = totalPlayers
            ? Math.round((1 - (playerRank / totalPlayers)) * 100)
            : 0;

        return NextResponse.json({
            wallet: playerData.wallet,
            walletShort: `${wallet.slice(0, 4)}...${wallet.slice(-4)}`,
            xp: playerData.xp || 0,
            rank: playerRank,
            totalBurned: playerData.total_burned || 0,
            solReclaimed: parseFloat(playerData.sol_reclaimed) || 0,
            level: playerData.level || 1,
            rankTitle: playerData.rank || 'VOID STALKER',
            isMobile: playerData.is_mobile || false,
            percentile,
            totalPlayers: totalPlayers || 0,
            lastUpdated: playerData.last_updated || Date.now()
        });

    } catch (error) {
        console.error('Player stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
