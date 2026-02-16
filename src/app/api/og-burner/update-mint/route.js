import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { walletAddress } = await request.json();

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address required' },
                { status: 400 }
            );
        }

        // Update the record
        const { data, error } = await supabase
            .from('og_burners')
            .update({ nft_minted: true })
            .eq('wallet_address', walletAddress)
            .select();

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Update mint error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
