// API endpoint to track referral completion and award XP
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REFERRAL_XP = 50; // XP awarded to referrer
const REFEREE_BONUS_XP = 25; // Welcome bonus for referee

export async function POST(request) {
    try {
        const { referralCode, refereeWallet } = await request.json();

        if (!referralCode || !refereeWallet) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find referral by code
        const { data: referral, error: findError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_code', referralCode)
            .single();

        if (findError || !referral) {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
        }

        // Prevent self-referral
        if (referral.referrer_wallet === refereeWallet) {
            return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
        }

        // Check if referee already used a referral
        const { data: existingReferee } = await supabase
            .from('referrals')
            .select('*')
            .eq('referee_wallet', refereeWallet)
            .eq('status', 'completed')
            .single();

        if (existingReferee) {
            return NextResponse.json({ error: 'Wallet already referred' }, { status: 400 });
        }

        // Create or update referral record
        const { data: tracked, error: trackError } = await supabase
            .from('referrals')
            .upsert({
                referrer_wallet: referral.referrer_wallet,
                referrer_code: referralCode,
                referee_wallet: refereeWallet,
                status: 'completed',
                xp_awarded: REFERRAL_XP,
                completed_at: new Date().toISOString()
            }, {
                onConflict: 'referrer_wallet,referee_wallet'
            })
            .select()
            .single();

        if (trackError) {
            console.error('Track referral error:', trackError);
            return NextResponse.json({ error: trackError.message }, { status: 500 });
        }

        // Award XP to referrer in players table
        const { error: xpError } = await supabase
            .from('players')
            .update({
                xp: supabase.raw(`xp + ${REFERRAL_XP}`)
            })
            .eq('wallet', referral.referrer_wallet);

        if (xpError) {
            console.error('XP award error:', xpError);
        }

        // Award XP to Referee (New User)
        const { error: refereeError } = await supabase
            .from('players')
            .update({
                xp: supabase.raw(`xp + ${REFEREE_BONUS_XP}`)
            })
            .eq('wallet', refereeWallet);

        if (refereeError) {
            console.error('Referee XP error:', refereeError);
            // Try insert if not exists (upsert)
            await supabase.from('players').upsert({
                wallet: refereeWallet,
                xp: REFEREE_BONUS_XP,
                total_burned: 0,
                sol_reclaimed: 0,
                level: 1,
                rank: 'VOID STALKER',
                last_updated: new Date().toISOString()
            });
        }

        // Check for milestone bonuses
        const { data: stats } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_wallet', referral.referrer_wallet)
            .eq('status', 'completed');

        const totalReferrals = stats?.length || 0;
        let bonusXP = 0;

        // Milestone bonuses
        if (totalReferrals === 5) bonusXP = 100;
        if (totalReferrals === 25) bonusXP = 500;
        if (totalReferrals === 100) bonusXP = 2000;

        if (bonusXP > 0) {
            await supabase
                .from('players')
                .update({
                    xp: supabase.raw(`xp + ${bonusXP}`)
                })
                .eq('wallet', referral.referrer_wallet);
        }

        return NextResponse.json({
            success: true,
            referrerXP: REFERRAL_XP,
            refereeBonus: REFEREE_BONUS_XP,
            bonusXP,
            totalReferrals,
            message: bonusXP > 0 ? `Milestone reached! +${bonusXP} bonus XP!` : 'Referral tracked successfully'
        });

    } catch (error) {
        console.error('Track referral error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
