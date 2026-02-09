// API endpoint to get referral stats for a wallet
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        // Get referral code
        const { data: codeData } = await supabase
            .from('referrals')
            .select('referrer_code')
            .eq('referrer_wallet', wallet)
            .limit(1)
            .single();

        // Get all referrals for this wallet
        const { data: referrals, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_wallet', wallet)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get referral stats error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const completed = referrals?.filter(r => r.status === 'completed') || [];
        const pending = referrals?.filter(r => r.status === 'pending') || [];
        const totalXP = completed.reduce((sum, r) => sum + (r.xp_awarded || 0), 0);

        // Calculate next milestone
        const totalReferrals = completed.length;
        let nextMilestone = 5;
        let nextBonus = 100;

        if (totalReferrals >= 100) {
            nextMilestone = null;
            nextBonus = 0;
        } else if (totalReferrals >= 25) {
            nextMilestone = 100;
            nextBonus = 2000;
        } else if (totalReferrals >= 5) {
            nextMilestone = 25;
            nextBonus = 500;
        }

        const stats = {
            referralCode: codeData?.referrer_code || null,
            totalReferrals: completed.length,
            pendingReferrals: pending.length,
            totalXPEarned: totalXP,
            nextMilestone,
            nextBonus,
            referralsUntilBonus: nextMilestone ? nextMilestone - totalReferrals : 0,
            recentReferrals: completed.slice(0, 10).map(r => ({
                wallet: r.referee_wallet,
                date: r.completed_at,
                xp: r.xp_awarded
            }))
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Get referral stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
