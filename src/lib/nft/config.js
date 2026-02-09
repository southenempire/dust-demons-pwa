// src/lib/nft/config.js
// NFT configuration and constants

// Merkle tree address (will be set after initialization)
export const MERKLE_TREE_ADDRESS = process.env.NEXT_PUBLIC_MERKLE_TREE || '';

// Collection details
export const COLLECTION_NAME = 'Dust Demons Achievements';
export const COLLECTION_SYMBOL = 'DUST';
export const COLLECTION_DESCRIPTION = 'On-chain achievement NFTs for Dust Demons players';

// Merkle tree configuration
export const TREE_CONFIG = {
    maxDepth: 14, // Supports 16,384 NFTs
    maxBufferSize: 64,
    canopyDepth: 0,
};

// Arweave gateway
export const ARWEAVE_GATEWAY = 'https://arweave.net';

// Achievement metadata URIs (will be updated after Arweave upload)
export const METADATA_URIS = {
    first_burn: '',
    dust_collector: '',
    yield_hunter: '',
    prophet: '',
    mobile_master: '',
    demon_lord: '',
};

// Update this after uploading to Arweave
export function setMetadataUri(achievementId, uri) {
    METADATA_URIS[achievementId] = uri;
}
