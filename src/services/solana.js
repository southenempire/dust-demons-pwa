// src/services/solana.js
// Solana blockchain interaction service

import { Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    createBurnInstruction,
    createCloseAccountInstruction,
    getAssociatedTokenAddress
} from '@solana/spl-token';

/**
 * Get token balance for a wallet
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} wallet - Wallet public key
 * @param {PublicKey} mint - Token mint address
 * @returns {Promise<number>} Token balance
 */
export async function getTokenBalance(connection, wallet, mint) {
    try {
        const tokenAccount = await getAssociatedTokenAddress(mint, wallet);
        const balance = await connection.getTokenAccountBalance(tokenAccount);
        return balance.value.uiAmount || 0;
    } catch (error) {
        console.error('Failed to get token balance:', error);
        return 0;
    }
}

/**
 * Get SOL balance for a wallet
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} wallet - Wallet public key
 * @returns {Promise<number>} SOL balance
 */
export async function getSOLBalance(connection, wallet) {
    try {
        const balance = await connection.getBalance(wallet);
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Failed to get SOL balance:', error);
        return 0;
    }
}

/**
 * Create burn transaction for tokens
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} wallet - Wallet public key
 * @param {Array} tokens - Array of token objects with { mint, amount, decimals }
 * @returns {Promise<Transaction>} Burn transaction
 */
export async function createBurnTransaction(connection, wallet, tokens) {
    const transaction = new Transaction();

    for (const token of tokens) {
        try {
            const tokenAccount = await getAssociatedTokenAddress(
                token.mint,
                wallet
            );

            // Add burn instruction
            const burnIx = createBurnInstruction(
                tokenAccount,
                token.mint,
                wallet,
                token.amount * Math.pow(10, token.decimals)
            );
            transaction.add(burnIx);

            // Add close account instruction to reclaim rent
            const closeIx = createCloseAccountInstruction(
                tokenAccount,
                wallet,
                wallet
            );
            transaction.add(closeIx);
        } catch (error) {
            console.error(`Failed to create burn instruction for ${token.mint}:`, error);
            throw error;
        }
    }

    return transaction;
}

/**
 * Send and confirm transaction
 * @param {Connection} connection - Solana connection
 * @param {Transaction} transaction - Transaction to send
 * @param {Object} wallet - Wallet adapter
 * @returns {Promise<string>} Transaction signature
 */
export async function sendAndConfirmTransaction(connection, transaction, wallet) {
    try {
        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        // Sign transaction
        const signed = await wallet.signTransaction(transaction);

        // Send transaction
        const signature = await connection.sendRawTransaction(signed.serialize());

        // Confirm transaction
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        return signature;
    } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
    }
}
