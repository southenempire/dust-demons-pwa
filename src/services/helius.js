// src/services/helius.js
// Helius DAS API service for fetching Solana assets

const HELIUS_DAS_URL = process.env.NEXT_PUBLIC_RPC_URL;
if (!HELIUS_DAS_URL) console.error('⚠️ NEXT_PUBLIC_RPC_URL is not set — Helius API calls will fail');

/**
 * Fetch all assets owned by a wallet address
 * @param {string} ownerAddress - Wallet public key as string
 * @param {Object} options - Fetch options
 * @param {number} options.limit - Items per page (default: 1000)
 * @param {number} options.maxPages - Maximum pages to fetch (default: 5)
 * @returns {Promise<Array>} Array of asset objects
 */
export async function fetchAssetsByOwner(ownerAddress, options = {}) {
    const { limit = 1000, maxPages = 5 } = options;
    let page = 1;
    let allAssets = [];

    try {
        while (true) {
            const response = await fetch(HELIUS_DAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'dust-demons-scan',
                    method: 'getAssetsByOwner',
                    params: {
                        ownerAddress,
                        page,
                        limit,
                        displayOptions: {
                            showFungible: true,
                            showNativeBalance: true
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`RPC Error: ${data.error.message || JSON.stringify(data.error)}`);
            }

            const items = data.result?.items || [];
            allAssets = [...allAssets, ...items];

            // Break if we fetched fewer than limit (end of list) or hit max pages
            if (items.length < limit || page >= maxPages) {
                break;
            }
            page++;
        }

        return allAssets;
    } catch (error) {
        console.error('Helius DAS API Error:', error);
        console.error('RPC URL:', HELIUS_DAS_URL);
        throw new Error(`Failed to fetch assets: ${error.message}`);
    }
}

/**
 * Get metadata for a specific asset
 * @param {string} assetId - Asset ID
 * @returns {Promise<Object>} Asset metadata
 */
export async function getAssetMetadata(assetId) {
    try {
        const response = await fetch(HELIUS_DAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'dust-demons-metadata',
                method: 'getAsset',
                params: { id: assetId }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`RPC Error: ${data.error.message}`);
        }

        return data.result;
    } catch (error) {
        console.error('Failed to fetch asset metadata:', error);
        throw error;
    }
}
