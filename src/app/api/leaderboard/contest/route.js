// src/app/api/leaderboard/contest/route.js
// Get contest information and prizes

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Contest configuration
        const contestEndDate = new Date('2026-02-15T23:59:59Z'); // Example: Feb 15
        const now = new Date();
        const endsIn = contestEndDate.getTime() - now.getTime();
        const isActive = endsIn > 0;

        const prizes = [
            { rank: 1, prize: '1000 USDC', description: '🥇 Champion' },
            { rank: 2, prize: '500 USDC', description: '🥈 Runner-up' },
            { rank: 3, prize: '250 USDC', description: '🥉 Third Place' },
            { rank: '4-10', prize: '100 USDC', description: '🏆 Top 10' },
            { rank: '11-50', prize: '50 USDC', description: '⭐ Top 50' }
        ];

        // Get total players from Supabase
        const { count: totalPlayers } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            status: isActive ? 'active' : 'ended',
            endsIn: isActive ? endsIn : 0,
            endDate: contestEndDate.toISOString(),
            prizes,
            totalPlayers: totalPlayers || 0,
            prizePool: '2500 USDC',
            description: 'Jupiter Hackathon Trading Contest'
        });

    } catch (error) {
        console.error('Contest info error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
