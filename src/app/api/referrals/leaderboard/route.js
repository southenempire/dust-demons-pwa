import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 10;

        const { data: leaderboard, error } = await supabase.rpc('get_referral_leaderboard', {
            limit_count: limit
        });

        if (error) {
            console.error('Leaderboard fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Fetch OG status for these wallets
        try {
            const wallets = leaderboard.map(l => l.referrer_wallet);

            if (wallets.length > 0) {
                const { data: ogData } = await supabase
                    .from('og_burners')
                    .select('wallet_address, og_number')
                    .in('wallet_address', wallets);

                // Merge OG data
                const mergedData = leaderboard.map(player => {
                    const og = ogData?.find(o => o.wallet_address === player.referrer_wallet);
                    return {
                        ...player,
                        og_number: og ? og.og_number : null
                    };
                });

                return NextResponse.json(mergedData);
            }
        } catch (err) {
            console.error('Error fetching OG data:', err);
            // Fallback to just leaderboard data if OG fetch fails
            return NextResponse.json(leaderboard);
        }

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
