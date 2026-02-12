import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
    createMintToCollectionV1Instruction,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID
} from '@metaplex-foundation/mpl-bubblegum';

/**
 * Dust Demons SDK 
 * Easy integration for 3rd party apps to mint Dust Demon NFTs.
 */
export class DustDemonsSDK {
    /**
     * @param {Object} config
     * @param {string} config.treeAddress - The Merkle Tree Address (Public)
     * @param {string} [config.rpcUrl] - Solana RPC URL
     * @param {string} [config.apiUrl] - Metadata API URL (Default: https://dust-demons.vercel.app/api/nft)
     */
    constructor(config) {
        if (!config.treeAddress) throw new Error("Tree Address is required");

        this.treeAddress = new PublicKey(config.treeAddress);
        this.connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
        this.apiUrl = config.apiUrl || 'https://dust-demons.vercel.app/api/nft';
    }

    /**
     * Mint an Achievement NFT
     * @param {Object} wallet - Wallet Adapter (publicKey, signTransaction)
     * @param {string} achievementId - ID (e.g. 'demon_lord', 'first_burn')
     * @returns {Promise<string>} Signature
     */
    async mintAchievement(wallet, achievementId) {
        if (!wallet.publicKey) throw new Error("Wallet not connected");

        // 1. Fetch Metadata
        console.log(`[SDK] Fetching metadata for ${achievementId}...`);
        const response = await fetch(`${this.apiUrl}/metadata/${achievementId}`);
        if (!response.ok) throw new Error("Failed to fetch achievement metadata");
        const metadataJson = await response.json();

        // 2. Prepare Transaction
        const leafOwner = wallet.publicKey;

        const metadata = {
            name: metadataJson.name,
            symbol: metadataJson.symbol,
            uri: metadataJson.image, // Use the image URL as URI for simplicity in this demo SDK
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

        const mintIx = createMintToCollectionV1Instruction(
            {
                tree: this.treeAddress,
                leafOwner,
                leafDelegate: leafOwner,
                merkleTree: this.treeAddress,
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
                    sellerFeeBasisPoints: 0,
                    primarySaleHappened: false,
                    isMutable: false,
                    editionNonce: null,
                    tokenStandard: null,
                    collection: null,
                    uses: null,
                    tokenProgramVersion: 'Original',
                    creators: metadata.creators,
                },
            }
        );

        const transaction = new Transaction().add(mintIx);
        transaction.feePayer = leafOwner;
        transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

        // 3. Sign & Send
        const signed = await wallet.signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(signed.serialize());

        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log(`[SDK] Minted: ${signature}`);

        return signature;
    }
}
