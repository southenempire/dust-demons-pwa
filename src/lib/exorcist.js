import { 
    Transaction, 
    PublicKey, 
    SystemProgram 
} from '@solana/web3.js';
import { 
    createBurnInstruction, 
    createCloseAccountInstruction, 
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';

/**
 * THE EXORCIST
 * Creates a transaction to Burn tokens and Close the account.
 * * @param {string} userWalletPubKey - The user's public key (string)
 * @param {object} demon - The demon object from the scanner (must have mint & decimals & rawAmount)
 * @param {Connection} connection - Solana connection object
 */
export async function prepareExorcism(userWalletPubKey, demon, connection) {
    const user = new PublicKey(userWalletPubKey);
    const mint = new PublicKey(demon.mint);
    
    // 1. Get the token account address
    // (We find the address where the demon lives)
    const tokenAccount = await getAssociatedTokenAddress(mint, user);

    const tx = new Transaction();

    // STEP A: BURN THE BODY 🔥
    // If there is any balance, we must burn it first. You can't close an account with tokens in it.
    if (demon.balance > 0) {
        console.log(`🔥 Adding Burn Instruction for: ${demon.mint} (Amount: ${demon.balance})`);
        
        // We use the rawAmount we saved in the engine (essential for the blockchain)
        // If rawAmount is missing, we try to calculate it, but engine should provide it.
        const amountToBurn = demon.rawAmount || Math.floor(demon.balance * (10 ** demon.decimals));

        tx.add(
            createBurnInstruction(
                tokenAccount, // Account to burn from
                mint,         // The Token Mint
                user,         // The Owner
                amountToBurn  // The Exact Amount
            )
        );
    }

    // STEP B: CLOSE THE COFFIN ⚰️
    // This is the instruction that gives the user their 0.002 SOL back.
    tx.add(
        createCloseAccountInstruction(
            tokenAccount, // Account to close
            user,         // Destination for the rent SOL (The User)
            user          // Authority (The User)
        )
    );

    // STEP C: PREPARE TRANSACTION
    // We need a recent blockhash to make the transaction valid
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = user;

    return tx;
}