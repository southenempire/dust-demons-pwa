// src/app/api/og-burner/claim/route.js
// API endpoint to claim OG Burner status after burning dust

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';

const MAX_OG_BURNERS = 101;

export async function POST(request) {
    try {
        // Initialize clients inside handler to prevent build-time errors
        console.log('🔥 API: Claiming OG status...');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        console.log('🔥 API: Supabase initialized');

        const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL);

        const { walletAddress, burnTxSignature } = await request.json();

        // Validate input
        if (!walletAddress || !burnTxSignature) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify transaction exists on-chain with retry logic for RPC delay
        console.log('🔥 API: Verifying tx:', burnTxSignature);
        let tx = null;
        let retries = 5;

        while (retries > 0 && !tx) {
            try {
                tx = await connection.getTransaction(burnTxSignature, {
                    maxSupportedTransactionVersion: 0,
                    commitment: 'confirmed'
                });
                if (!tx) {
                    console.log(`⏳ TX not found yet. Retrying in 1s... (${retries} left)`);
                    await new Promise(r => setTimeout(r, 1000));
                    retries--;
                }
            } catch (err) {
                console.error('RPC Error fetching tx:', err);
                await new Promise(r => setTimeout(r, 1000));
                retries--;
            }
        }

        if (!tx) {
            return NextResponse.json(
                { error: 'Transaction not found after retries' },
                { status: 404 }
            );
        }

        // Verify wallet is involved in transaction
        const walletPubkey = new PublicKey(walletAddress);
        const msg = tx.transaction.message;
        const accountKeys = msg.staticAccountKeys || msg.accountKeys || [];

        const isInvolved = accountKeys.some(
            key => key.equals(walletPubkey)
        );

        if (!isInvolved) {
            return NextResponse.json(
                { error: 'Wallet not involved in transaction' },
                { status: 400 }
            );
        }
        // (Removed orphaned catch block)

        // Check if wallet already claimed
        const { data: existing } = await supabase
            .from('og_burners')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (existing) {
            // Update burn count
            await supabase
                .from('og_burners')
                .update({
                    burn_count: existing.burn_count + 1,
                    last_burn_timestamp: new Date().toISOString()
                })
                .eq('wallet_address', walletAddress);

            return NextResponse.json({
                eligible: true,
                alreadyClaimed: true,
                ogNumber: existing.og_number,
                burnCount: existing.burn_count + 1,
                nftMinted: existing.nft_minted
            });
        }

        // Get current OG count
        const { count } = await supabase
            .from('og_burners')
            .select('*', { count: 'exact', head: true })
            .not('og_number', 'is', null);

        // Check if limit reached
        if (count >= MAX_OG_BURNERS) {
            return NextResponse.json({
                eligible: false,
                reason: 'limit_reached',
                message: 'Sorry! All 100 OG Burner spots have been claimed.'
            });
        }

        // Assign OG number (count + 1)
        const ogNumber = count + 1;

        // Create new OG burner record
        const { data: newBurner, error } = await supabase
            .from('og_burners')
            .insert({
                wallet_address: walletAddress,
                burn_count: 1,
                first_burn_timestamp: new Date().toISOString(),
                last_burn_timestamp: new Date().toISOString(),
                og_number: ogNumber,
                nft_minted: false
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create OG burner:', error);
            return NextResponse.json(
                { error: 'Failed to claim OG status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            eligible: true,
            alreadyClaimed: false,
            ogNumber: newBurner.og_number,
            burnCount: 1,
            nftMinted: false,
            message: `Congratulations! You're OG Burner #${ogNumber}!`
        });

    } catch (error) {
        console.error('OG Burner claim error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` },
            { status: 500 }
        );
    }
}

// GET endpoint to check OG status
export async function GET(request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address required' },
                { status: 400 }
            );
        }

        const { data } = await supabase
            .from('og_burners')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (!data) {
            return NextResponse.json({
                isOG: false,
                message: 'Not an OG Burner yet'
            });
        }

        return NextResponse.json({
            isOG: true,
            ogNumber: data.og_number,
            burnCount: data.burn_count,
            nftMinted: data.nft_minted,
            firstBurn: data.first_burn_timestamp
        });

    } catch (error) {
        console.error('OG status check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
