// src/app/api/og-burner/stats/route.js
// API endpoint to get OG Burner statistics

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_OG_BURNERS = 100;

export async function GET() {
    try {
        // Get total count of OG burners
        const { count: totalOGs } = await supabase
            .from('og_burners')
            .select('*', { count: 'exact', head: true })
            .not('og_number', 'is', null);

        // Get count of minted NFTs
        const { count: mintedCount } = await supabase
            .from('og_burners')
            .select('*', { count: 'exact', head: true })
            .eq('nft_minted', true);

        // Get recent OG burners
        const { data: recentOGs } = await supabase
            .from('og_burners')
            .select('wallet_address, og_number, first_burn_timestamp')
            .order('og_number', { ascending: false })
            .limit(10);

        return NextResponse.json({
            totalOGs: totalOGs || 0,
            remaining: MAX_OG_BURNERS - (totalOGs || 0),
            mintedNFTs: mintedCount || 0,
            maxOGs: MAX_OG_BURNERS,
            recentOGs: recentOGs || []
        });

    } catch (error) {
        console.error('OG stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
