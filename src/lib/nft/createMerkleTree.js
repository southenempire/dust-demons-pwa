import { PublicKey, SystemProgram, Transaction, Keypair } from '@solana/web3.js';
import {
    createCreateTreeInstruction,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID
} from '@metaplex-foundation/mpl-bubblegum';
import {
    getConcurrentMerkleTreeAccountSize,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID
} from '@solana/spl-account-compression';
import { TREE_CONFIG } from './config';

/**
 * Creates a transaction to initialize a new Merkle Tree for compressed NFTs.
 * Returns the transaction (partially signed by the tree keypair) and the tree address.
 */
export async function createMerkleTree(connection, wallet) {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const treeKeypair = Keypair.generate();
    const space = getConcurrentMerkleTreeAccountSize(TREE_CONFIG.maxDepth, TREE_CONFIG.maxBufferSize, TREE_CONFIG.canopyDepth);
    const rent = await connection.getMinimumBalanceForRentExemption(space);

    const createAccountIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: treeKeypair.publicKey,
        lamports: rent,
        space: space,
        programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID
    });

    const [treeAuthority] = PublicKey.findProgramAddressSync(
        [treeKeypair.publicKey.toBuffer()],
        BUBBLEGUM_PROGRAM_ID
    );

    const createTreeIx = createCreateTreeInstruction(
        {
            merkleTree: treeKeypair.publicKey,
            treeAuthority: treeAuthority,
            authority: wallet.publicKey,
            payer: wallet.publicKey,
            treeCreator: wallet.publicKey,
            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
            logWrapper: SPL_NOOP_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        {
            maxDepth: TREE_CONFIG.maxDepth,
            maxBufferSize: TREE_CONFIG.maxBufferSize,
            public: false,
        }
    );

    const tx = new Transaction().add(createAccountIx, createTreeIx);
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Partially sign with the tree keypair (needed for account creation)
    tx.partialSign(treeKeypair);

    return { tx, treeAddress: treeKeypair.publicKey.toBase58() };
}
