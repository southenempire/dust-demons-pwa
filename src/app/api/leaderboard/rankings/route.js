// src/app/api/leaderboard/rankings/route.js
// Get top players and user rank from Supabase

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Get top players ordered by XP
        const { data: topPlayers, error: playersError } = await supabase
            .from('players')
            .select('*')
            .order('xp', { ascending: false })
            .limit(limit);

        if (playersError) {
            console.error('Supabase query error:', playersError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Format top players with ranks
        const formattedPlayers = (topPlayers || []).map((player, index) => ({
            rank: index + 1,
            wallet: player.wallet,
            walletShort: `${player.wallet.slice(0, 4)}...${player.wallet.slice(-4)}`,
            xp: player.xp || 0,
            totalBurned: player.total_burned || 0,
            solReclaimed: parseFloat(player.sol_reclaimed) || 0,
            level: player.level || 1,
            rankTitle: player.rank || 'VOID STALKER',
            isMobile: player.is_mobile || false
        }));

        // Get user rank if wallet provided
        let userRank = null;
        if (wallet) {
            const { data: playerData } = await supabase
                .from('players')
                .select('*')
                .eq('wallet', wallet)
                .single();

            if (playerData) {
                const { count } = await supabase
                    .from('players')
                    .select('*', { count: 'exact', head: true })
                    .gt('xp', playerData.xp || 0);

                userRank = {
                    rank: (count || 0) + 1,
                    wallet: playerData.wallet,
                    xp: playerData.xp || 0,
                    totalBurned: playerData.total_burned || 0,
                    solReclaimed: parseFloat(playerData.sol_reclaimed) || 0
                };
            }
        }

        // Use actual player count from the query result
        const totalPlayers = topPlayers?.length || 0;

        // Contest end time (example: 7 days from now)
        const contestEndsIn = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

        return NextResponse.json({
            topPlayers: formattedPlayers,
            userRank,
            totalPlayers,
            contestEndsIn,
            lastUpdated: Date.now()
        });

    } catch (error) {
        console.error('Leaderboard rankings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
