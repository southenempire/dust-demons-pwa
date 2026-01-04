// src/utils/nftFetcher.js

// You really need a dedicated RPC for this. Use a free Helius or QuickNode one if you can.
// If you don't have one, this public one might be rate-limited.
const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=bacbe1c4-e2b2-453a-b52d-b2465e08a9dc";


// Helper to fix CORS and optimize images
const toCorsUrl = (url) => {
  if (!url) return "";
  // We use wsrv.nl as a proxy. It fixes CORS and converts images to WebP for speed.
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=500&h=500&output=webp`;
};

export const fetchMyBounties = async (walletAddress) => {
  if (!walletAddress) return [];
  
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'hunter-game',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress.toString(),
          page: 1,
          limit: 10,
          displayOptions: { showNativeBalance: false },
        },
      }),
    });

    const { result } = await response.json();
    
    if (!result || !result.items) return [];

    // Filter and Map with the CORS fix
    return result.items
      .filter(item => item.content?.links?.image)
      .map(item => ({
        id: item.id,
        name: item.content.metadata.name || "Unknown Target",
        // WRAP THE URL HERE
        image: toCorsUrl(item.content.links.image), 
      }));

  } catch (error) {
    console.error("Error fetching NFTs", error);
    // Return dummy data if fetch fails so the game doesn't crash
    return [
        { id: '1', name: 'Training Bot 1', image: 'https://wsrv.nl/?url=https://arweave.net/u2x4H5rZ5gO4X0j7X4g5' },
        { id: '2', name: 'Training Bot 2', image: 'https://wsrv.nl/?url=https://arweave.net/A4x4H5rZ5gO4X0j7X4g5' }
    ]; 
  }
};