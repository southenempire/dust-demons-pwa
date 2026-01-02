import { Transaction, PublicKey } from '@solana/web3.js';
import { createBurnInstruction, createCloseAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

// SINGLE BURN
export async function prepareExorcism(userWalletPubKey, demon, connection) {
    return prepareBatchExorcism(userWalletPubKey, [demon], connection);
}

// BATCH BURN (MULTI-SELECT)
export async function prepareBatchExorcism(userWalletPubKey, demons, connection) {
    const user = new PublicKey(userWalletPubKey);
    const tx = new Transaction();

    // Solana allows ~1232 bytes per tx. We cap at 8-10 burns to be safe.
    for (const demon of demons) {
        const mint = new PublicKey(demon.mint);
        const tokenAccount = await getAssociatedTokenAddress(mint, user);

        // 1. Burn Token
        if (demon.balance > 0) {
            const amount = demon.rawAmount || Math.floor(demon.balance * (10 ** demon.decimals));
            tx.add(createBurnInstruction(tokenAccount, mint, user, amount));
        }
        // 2. Reclaim Rent
        tx.add(createCloseAccountInstruction(tokenAccount, user, user));
    }

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = user;

    return tx;
}