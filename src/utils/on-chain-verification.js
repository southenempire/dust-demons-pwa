// src/utils/on-chain-verification.js
// Verify transactions on-chain to prove real Jupiter interactions

const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

/**
 * Verify if user has completed a Jupiter swap
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} publicKey - User's wallet address
 * @param {number} limit - Number of recent transactions to check
 * @returns {Promise<{verified: boolean, signature?: string, timestamp?: number}>}
 */
export async function verifyJupiterSwap(connection, publicKey, limit = 20) {
    try {
        const signatures = await connection.getSignaturesForAddress(
            publicKey,
            { limit }
        );

        console.log(`Verifying Jupiter Swap: Found ${signatures.length} recent txs for ${publicKey.toString()}`);

        for (const sig of signatures) {
            const tx = await connection.getParsedTransaction(
                sig.signature,
                { maxSupportedTransactionVersion: 0 }
            );

            if (!tx) continue;

            // Check if transaction involves Jupiter program
            const accountKeys = tx.transaction.message.accountKeys.map(k =>
                typeof k === 'string' ? k : k.pubkey.toString()
            );

            // console.log('Tx Accounts:', accountKeys); // Verbose logging

            if (accountKeys.includes(JUPITER_PROGRAM_ID)) {
                console.log('Jupiter Swap Verified!', sig.signature);
                return {
                    verified: true,
                    signature: sig.signature,
                    timestamp: sig.blockTime
                };
            }
        }

        console.warn('Jupiter Swap Verification Failed: No matching V6 program ID found.');
        return { verified: false };
    } catch (error) {
        console.error('Failed to verify Jupiter swap:', error);
        return { verified: false };
    }
}

/**
 * Verify if user has burned tokens (closed token accounts)
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} publicKey - User's wallet address
 * @param {number} limit - Number of recent transactions to check
 * @returns {Promise<{verified: boolean, count: number}>}
 */
export async function verifyTokenBurns(connection, publicKey, limit = 20) {
    try {
        const signatures = await connection.getSignaturesForAddress(
            publicKey,
            { limit }
        );

        let burnCount = 0;

        for (const sig of signatures) {
            const tx = await connection.getParsedTransaction(
                sig.signature,
                { maxSupportedTransactionVersion: 0 }
            );

            if (!tx) continue;

            // Check for closeAccount instructions (burning tokens)
            const instructions = tx.transaction.message.instructions;
            for (const ix of instructions) {
                if (ix.parsed?.type === 'closeAccount') {
                    burnCount++;
                }
            }
        }

        return {
            verified: burnCount > 0,
            count: burnCount
        };
    } catch (error) {
        console.error('Failed to verify token burns:', error);
        return { verified: false, count: 0 };
    }
}

/**
 * Get transaction count for a specific time period
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} publicKey - User's wallet address
 * @param {number} hoursAgo - How many hours back to check
 * @returns {Promise<number>}
 */
export async function getRecentTransactionCount(connection, publicKey, hoursAgo = 24) {
    try {
        const signatures = await connection.getSignaturesForAddress(
            publicKey,
            { limit: 100 }
        );

        const cutoffTime = Math.floor(Date.now() / 1000) - (hoursAgo * 3600);
        const recentTxs = signatures.filter(sig =>
            sig.blockTime && sig.blockTime > cutoffTime
        );

        return recentTxs.length;
    } catch (error) {
        console.error('Failed to get transaction count:', error);
        return 0;
    }
}
