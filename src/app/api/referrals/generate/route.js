// API endpoint to generate a unique referral code for a wallet
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { wallet } = await request.json();

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        // Check if wallet already has a referral code
        const { data: existing, error: checkError } = await supabase
            .from('referrals')
            .select('referrer_code')
            .eq('referrer_wallet', wallet)
            .limit(1)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({
                code: existing.referrer_code,
                message: 'Existing code retrieved'
            });
        }

        // Generate new unique code
        let code;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            // Generate code: DUST-XXXXX
            code = 'DUST-' + Array.from({ length: 5 }, () =>
                'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
            ).join('');

            // Check if code already exists
            const { data: duplicate } = await supabase
                .from('referrals')
                .select('referrer_code')
                .eq('referrer_code', code)
                .single();

            if (!duplicate) break;
            attempts++;
        }

        if (attempts >= maxAttempts) {
            return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
        }

        // Insert referral code
        const { data, error } = await supabase
            .from('referrals')
            .insert({
                referrer_wallet: wallet,
                referrer_code: code,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Referral code generation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            code: data.referrer_code,
            message: 'Code generated successfully'
        });

    } catch (error) {
        console.error('Generate referral code error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
