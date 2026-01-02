import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';

// Config: Use Mainnet
const RPC_ENDPOINT = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_ENDPOINT);

// Config: Jupiter API
const JUP_API_URL = "https://api.jup.ag/tokens/v2/search";
const API_KEY = process.env.JUPITER_API_KEY;

// EXPANDED SAFE LIST (Prevents burning DeFi positions)
const SAFE_KEYWORDS = [
    'USDT', 'USDC', 'SOL', 'JUP', 'JLP', 'PYUSD', 'RAY', 'BONK', 'WIF',
    'Vault', 'Position', 'Lend', 'Staked', 'vSOL', 'bSOL', 'mSOL', 'JupSOL', 
    'Infinitie', 'Sanctum', 'Liquidity', 'LP'
];

export async function scanWallet(walletAddress) {
    console.log(`\n🔍 Scanning wallet: ${walletAddress}...`);

    // --- STEP 1: FETCH RAW ASSETS (RPC) ---
    let tokenAccounts = [];
    let solBalance = 0;

    try {
        const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));
        solBalance = balanceLamports / 1e9; 

        const response = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(walletAddress),
            { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
        );
        tokenAccounts = response.value;
    } catch (e) {
        console.error("❌ RPC Failed:", e);
        throw new Error("Failed to scan wallet on blockchain.");
    }

    // --- STEP 2: PREPARE DATA ---
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    
    const activeItems = tokenAccounts
        .map(t => {
            const info = t.account.data.parsed.info;
            return {
                mint: info.mint,
                amount: info.tokenAmount.uiAmount,
                decimals: info.tokenAmount.decimals,
                rawAmount: info.tokenAmount.amount 
            };
        })
        .filter(t => t.amount > 0);

    const mintsToFetch = [...activeItems.map(t => t.mint), SOL_MINT];

    // --- STEP 3: FETCH METADATA & PRICES ---
    let apiData = new Map();

    try {
        // Fetch in chunks of 100
        const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
        const batches = chunk(mintsToFetch, 100);

        for (const batch of batches) {
             const response = await axios.get(JUP_API_URL, {
                params: { query: batch.join(',') },
                headers: { 'x-api-key': API_KEY ? API_KEY.trim() : '' }
            });
            (response.data || []).forEach(item => apiData.set(item.id, item));
        }
    } catch (e) {
        console.error("⚠️ Jupiter API Failed.");
    }

    // --- STEP 4: THE CLASSIFIER ---
    const safeAssets = [];
    const dustDemons = [];
    const nftDemons = [];
    let totalNetWorth = 0;

    const classify = (mint, amount, decimals, rawAmount, isNative = false) => {
        const data = apiData.get(mint);
        const price = data ? (data.usdPrice || 0) : 0;
        const valueUsd = amount * price;
        totalNetWorth += valueUsd;

        let name = data ? data.name : (isNative ? "Solana" : "Unknown Token");
        let symbol = data ? data.symbol : (isNative ? "SOL" : mint.slice(0,6));
        const isVerified = data ? data.tags.includes('verified') : false;
        
        // GRAB THE IMAGE URL
        const image = data ? data.logoURI : null;

        // --- SAFETY LOGIC UPDATE ---
        // 1. Check Keywords
        const isSafeKeyword = SAFE_KEYWORDS.some(k => 
            symbol.toLowerCase().includes(k.toLowerCase()) || 
            name.toLowerCase().includes(k.toLowerCase())
        );
        
        // 2. Check Value
        const isValuable = valueUsd > 1.00;

        // 3. AUTO-SAFEGUARD: If it's verified OR matches keywords, it is SAFE.
        if (isNative || isSafeKeyword || isValuable || isVerified) {
            safeAssets.push({
                name, symbol, mint, balance: amount, decimals,
                price_per_token: price, total_value: valueUsd,
                image: image, // Pass image to frontend
                is_verified: isVerified
            });
            return;
        }

        // --- DEMON LOGIC ---
        // NFT Detection (Low decimals, low amount, no price data)
        const isLikelyNFT = decimals === 0 && amount === 1 && !data;
        
        if (isLikelyNFT) {
            nftDemons.push({
                id: `nft_${mint.slice(0,4)}`,
                name: "Unknown NFT",
                symbol: "NFT",
                mint, balance: amount, decimals, rawAmount,
                value_usd: 0,
                image: image, // Might be null for unknown NFTs
                visual_type: "NFT_DEMON"
            });
            return;
        }

        // Otherwise, it's DUST
        dustDemons.push({
            id: `dust_${mint.slice(0,4)}`,
            name, symbol, mint, balance: amount, decimals, rawAmount,
            total_value: valueUsd,
            image: image,
            visual_type: "DUST_MITE"
        });
    };

    if (solBalance > 0) classify(SOL_MINT, solBalance, 9, 0, true);
    activeItems.forEach(t => classify(t.mint, t.amount, t.decimals, t.rawAmount, false));

    return {
        wallet: walletAddress,
        net_worth: `$${totalNetWorth.toFixed(2)}`,
        safe_assets: safeAssets,
        dust_demons: dustDemons,
        nft_demons: nftDemons
    };
}