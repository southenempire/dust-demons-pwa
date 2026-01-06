import { PublicKey } from '@solana/web3.js';

// 🛡️ HELIUS / RPC CONFIGURATION
const HELIUS_API_KEY = '6e729352-0402-4522-8367-7703e3396658'; // Use your actual key if different
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export async function fetchMyBounties(walletAddress) {
  if (!walletAddress) return [];

  try {
    new PublicKey(walletAddress); // Validate address

    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dust-demons-scanner',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress.toString(),
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: true,
            showNativeBalance: true,
          },
        },
      }),
    });

    if (!response.ok) return [];

    const { result } = await response.json();
    if (!result || !result.items) return [];

    return result.items.map((item) => {
      const isCompressed = item.compression?.compressed || false;
      return {
        id: item.id,
        mint: item.id,
        name: item.content?.metadata?.name || 'Unknown Asset',
        image: item.content?.links?.image || null,
        isScam: false,
        isRentClaimable: false,
        type: isCompressed ? 'CNFT' : 'NFT',
        uiBalance: 1,
        isSafe: false
      };
    });

  } catch (error) {
    console.warn("NFT Scanner Error:", error);
    return []; 
  }
}