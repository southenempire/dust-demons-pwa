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
            // Use Helius service to fetch assets
            const allAssets = await fetchAssetsByOwner(owner.toBase58(), {
                limit: 100,
                maxPages: 10
            });

            // Filter and format assets
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
                        isClosed: balance === 0
                    };
                })
                .sort((a, b) => b.valueUSD - a.valueUSD); // Sort by value descending

            setAssets(formattedAssets);
            setLoading(false);
            return formattedAssets;

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
