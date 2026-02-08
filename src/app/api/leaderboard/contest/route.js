// src/app/api/leaderboard/contest/route.js
// Get contest information and prizes

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
    try {
        // Contest configuration (can be stored in KV or Edge Config later)
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

        // Get total players
        const totalPlayers = await kv.zcard('leaderboard:xp') || 0;

        return NextResponse.json({
            status: isActive ? 'active' : 'ended',
            endsIn: isActive ? endsIn : 0,
            endDate: contestEndDate.toISOString(),
            prizes,
            totalPlayers,
            prizePool: '2500 USDC',
            description: 'Jupiter Hackathon Trading Contest'
        });

    } catch (error) {
        console.error('Contest info error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
