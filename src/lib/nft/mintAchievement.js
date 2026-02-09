// src/lib/nft/mintAchievement.js
// Compressed NFT minting using Metaplex Bubblegum

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
    createMintToCollectionV1Instruction,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
} from '@metaplex-foundation/mpl-bubblegum';
import { MERKLE_TREE_ADDRESS } from './config';

/**
 * Mint an achievement NFT to the user's wallet
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} achievement - Achievement object from achievementTracker
 * @returns {Promise<string>} Transaction signature
 */
export async function mintAchievementNFT(connection, wallet, achievement) {
    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!MERKLE_TREE_ADDRESS) {
        throw new Error('Merkle tree not initialized. Set NEXT_PUBLIC_MERKLE_TREE in .env.local');
    }

    if (!achievement.metadataUri) {
        throw new Error(`Metadata URI not set for achievement: ${achievement.id}`);
    }

    try {
        const treeAddress = new PublicKey(MERKLE_TREE_ADDRESS);
        const leafOwner = wallet.publicKey;

        // Create metadata
        const metadata = {
            name: `${achievement.name} - ${achievement.title}`,
            symbol: 'DUST',
            uri: achievement.metadataUri,
            sellerFeeBasisPoints: 0,
            collection: null,
            creators: [
                {
                    address: leafOwner,
                    verified: false,
                    share: 100,
                },
            ],
        };

        // Build mint instruction
        const mintIx = createMintToCollectionV1Instruction(
            {
                tree: treeAddress,
                leafOwner,
                leafDelegate: leafOwner,
                merkleTree: treeAddress,
                payer: leafOwner,
                treeDelegate: leafOwner,
                logWrapper: new PublicKey('noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV'),
                compressionProgram: new PublicKey('cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK'),
                bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            },
            {
                metadataArgs: {
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
                    primarySaleHappened: false,
                    isMutable: false,
                    editionNonce: null,
                    tokenStandard: null,
                    collection: metadata.collection,
                    uses: null,
                    tokenProgramVersion: 'Original',
                    creators: metadata.creators,
                },
            }
        );

        // Create and send transaction
        const transaction = new Transaction().add(mintIx);
        transaction.feePayer = leafOwner;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // Sign and send
        const signed = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());

        // Confirm
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`✅ Achievement NFT minted: ${achievement.name}`, signature);
        return signature;

    } catch (error) {
        console.error('NFT minting error:', error);
        throw new Error(`Failed to mint achievement: ${error.message}`);
    }
}

/**
 * Check if user can mint (has enough SOL for transaction)
 */
export async function canMintNFT(connection, wallet) {
    if (!wallet.publicKey) return false;

    try {
        const balance = await connection.getBalance(wallet.publicKey);
        const minBalance = 0.001 * 1e9; // 0.001 SOL minimum
        return balance >= minBalance;
    } catch {
        return false;
    }
}
