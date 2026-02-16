// src/hooks/useAssets.js
// Manages asset fetching, filtering, and dust detection

import { useState, useCallback } from 'react';
import { fetchAssetsByOwner } from '@/services/helius';

const DUST_THRESHOLD_USD = 1.00; // $1.00 threshold

export function useAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Fetch assets using Helius DAS API with pagination
    const fetchAssets = useCallback(async (owner) => {
        if (!owner) {
            setAssets([]);
            return [];
        }

        setLoading(true);
        try {
            // 1. Fetch Helius Assets (Compressed + Standard)
            const heliusPromise = fetchAssetsByOwner(owner.toBase58(), {
                limit: 100,
                maxPages: 10
            });

            // 2. Fetch Legacy Empty Accounts (via RPC)
            // Helius DAS often skips 0-balance accounts, but we need them for Rent Reclaiming!
            const rpcPromise = fetch('/api/rpc', {
                method: 'POST',
                body: JSON.stringify({
                    method: 'getTokenAccountsByOwner',
                    params: [
                        owner.toBase58(),
                        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                        { encoding: 'jsonParsed' }
                    ]
                })
            }).then(r => r.json()).catch(() => ({ result: { value: [] } }));

            // We use the Helius service URL directly via a helper or just rely on the existing connection if available
            // But since we are in a hook, we can use the Helius fetching we already have or just add a direct RPC fallback.
            // For simplicity/speed, let's assume fetchAssetsByOwner does the heavy lifting for metadata.
            // But for EMPTY accounts, we don't need metadata.

            const [allAssets, rpcResponse] = await Promise.all([
                heliusPromise,
                rpcPromise
            ]);

            // Process RPC Empty Accounts
            const emptyAccounts = (rpcResponse?.result?.value || [])
                .filter(item => item.account.data.parsed.info.tokenAmount.uiAmount === 0)
                .map(item => ({
                    id: item.pubkey, // The account address, not mint
                    mint: item.account.data.parsed.info.mint,
                    name: 'Empty Account',
                    symbol: 'RENT',
                    image: null,
                    balance: 0,
                    rawBalance: 0,
                    decimals: item.account.data.parsed.info.tokenAmount.decimals,
                    valueUSD: 0,
                    priceUSD: 0,
                    isDust: false,
                    isFrozen: false,
                    isClosed: true,
                    // Special flag to identify these as strictly empty token accounts
                    isEmptyTokenAccount: true
                }));

            // Filter and format Helius assets
            const formattedAssets = allAssets
                .filter(asset => {
                    // Exclude SOL and JupSOL
                    if (asset.id === 'So11111111111111111111111111111111111111112') return false;
                    if (asset.id === 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v') return false;
                    // Must have token info
                    if (!asset.token_info) return false;
                    return true;
                })
                .map(asset => {
                    const balance = asset.token_info?.balance || 0;
                    const decimals = asset.token_info?.decimals || 0;
                    const priceUSD = asset.token_info?.price_info?.price_per_token || 0;
                    const actualBalance = balance / Math.pow(10, decimals);
                    const valueUSD = actualBalance * priceUSD;

                    return {
                        id: asset.id,
                        name: asset.content?.metadata?.name || 'Unknown Token',
                        symbol: asset.content?.metadata?.symbol || '???',
                        image: asset.content?.links?.image || asset.content?.files?.[0]?.uri || '/placeholder.png',
                        balance: actualBalance,
                        rawBalance: balance, // ⚡ RAW INTEGER BALANCE FOR BURNING
                        decimals,
                        valueUSD,
                        priceUSD,
                        isDust: valueUSD < DUST_THRESHOLD_USD && valueUSD > 0,
                        isFrozen: asset.ownership?.frozen || false,
                        isClosed: balance === 0,
                        programId: asset.token_info?.token_program // ⚡ Capture Program ID (Token vs Token-2022)
                    };
                });

            // 3. Fallback Price Fetch (Jupiter V3)
            // Identify assets with 0 price but non-zero price should exist (not rent exempt empty ones)
            // We'll just check all tradeable/valid assets that have 0 value
            const missingPriceMints = formattedAssets
                .filter(a => a.priceUSD === 0 && !a.isClosed)
                .map(a => a.id);

            let jupPrices = {};
            if (missingPriceMints.length > 0) {
                try {
                    // Import dynamically or assume it's imported at top
                    const { getTokenPrices } = await import('@/services/jupiter');
                    jupPrices = await getTokenPrices(missingPriceMints);
                } catch (e) {
                    console.error('Jupiter Price Fallback Failed:', e);
                }
            }

            // Merge Prices
            const finalAssets = formattedAssets.map(asset => {
                if (jupPrices[asset.id]) {
                    const price = jupPrices[asset.id].price;
                    return {
                        ...asset,
                        priceUSD: price,
                        valueUSD: asset.balance * price,
                        isDust: (asset.balance * price) < DUST_THRESHOLD_USD && (asset.balance * price) > 0
                    };
                }
                return asset;
            });

            // Merge: Prefer Helius data (now updated), but add empty accounts
            const existingIds = new Set(finalAssets.map(a => a.id));
            const uniqueEmpty = emptyAccounts.filter(a => !existingIds.has(a.id));

            const merged = [...finalAssets, ...uniqueEmpty].sort((a, b) => b.valueUSD - a.valueUSD);

            setAssets(merged);
            setLoading(false);
            return merged;

        } catch (error) {
            console.error('Failed to fetch assets:', error);
            setAssets([]);
            setLoading(false);
            return [];
        }
    }, []);

    // Get dust assets (below threshold)
    const getDustAssets = useCallback(() => {
        return assets.filter(a => a.isDust && !a.isFrozen && !a.isClosed);
    }, [assets]);

    // Get burnable assets (selected or all dust)
    const getBurnableAssets = useCallback(() => {
        if (selectedIds.length > 0) {
            return assets.filter(a => selectedIds.includes(a.id) && !a.isFrozen && !a.isClosed);
        }
        return getDustAssets();
    }, [assets, selectedIds, getDustAssets]);

    // Toggle asset selection
    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    // Select all dust
    const selectAllDust = useCallback(() => {
        const dustIds = getDustAssets().map(a => a.id);
        setSelectedIds(dustIds);
    }, [getDustAssets]);

    return {
        assets,
        loading,
        selectedIds,
        fetchAssets,
        getDustAssets,
        getBurnableAssets,
        toggleSelection,
        clearSelection,
        selectAllDust,
        setSelectedIds
    };
}
