import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';

// Config: Use Mainnet
// Note: In Next.js, use process.env for server-side secrets
const RPC_ENDPOINT = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_ENDPOINT);

// Config: Jupiter API (Authenticated)
const JUP_API_URL = "https://api.jup.ag/tokens/v2/search";
const API_KEY = process.env.JUPITER_API_KEY;

// Fallback Safe List
const SAFE_KEYWORDS = ['USDT', 'USDC', 'SOL', 'JUP', 'JLP', 'PYUSD', 'RAY', 'BONK', 'WIF'];

export async function scanWallet(walletAddress) {
    console.log(`\n🔍 Scanning wallet: ${walletAddress}...`);

    // --- STEP 1: FETCH RAW ASSETS (RPC) ---
    let tokenAccounts = [];
    let solBalance = 0;

    try {
        // A. Native SOL
        const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));
        solBalance = balanceLamports / 1e9; 

        // B. All Tokens
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
    
    // Filter out zero balances
    const activeItems = tokenAccounts
        .map(t => {
            const info = t.account.data.parsed.info;
            return {
                mint: info.mint,
                amount: info.tokenAmount.uiAmount,
                decimals: info.tokenAmount.decimals,
                // CRITICAL: We need raw amount for burning later
                rawAmount: info.tokenAmount.amount 
            };
        })
        .filter(t => t.amount > 0);

    const mintsToFetch = [...activeItems.map(t => t.mint), SOL_MINT];

    // --- STEP 3: FETCH METADATA & PRICES (Official V2 API) ---
    let apiData = new Map();

    try {
        // Chunking: Jupiter allows max 100 mints per request. 
        // We slice the array to be safe (taking first 100 for MVP).
        const batch = mintsToFetch.slice(0, 100); 

        const response = await axios.get(JUP_API_URL, {
            params: {
                query: batch.join(',') 
            },
            headers: {
                'x-api-key': API_KEY ? API_KEY.trim() : ''
            }
        });

        const results = response.data || [];
        results.forEach(item => {
            apiData.set(item.id, item);
        });

    } catch (e) {
        console.error("⚠️ Jupiter API Failed (Price/Metadata might be missing).");
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

        // --- GAME LOGIC ---

        // A. NFT DETECTION
        const isLikelyNFT = decimals === 0 && amount === 1 && !data;
        if (isLikelyNFT) {
            nftDemons.push({
                id: `nft_${mint.slice(0,4)}`,
                name: "Unknown NFT",
                symbol: "NFT",
                mint: mint,
                balance: amount,
                decimals: decimals,
                value_usd: 0,
                visual_type: "NFT_DEMON"
            });
            return;
        }

        // B. SAFE ASSET DETECTION
        const isWhitelisted = SAFE_KEYWORDS.some(k => symbol.includes(k));
        const isValuable = valueUsd > 1.00;

        if (isNative || isWhitelisted || isValuable || isVerified) {
            safeAssets.push({
                name: name,
                symbol: symbol,
                mint: mint,
                balance: amount,
                decimals: decimals,
                price_per_token: price,
                total_value: valueUsd,
                is_verified: isVerified
            });
            return;
        }

        // C. DUST DEMON
        dustDemons.push({
            id: `dust_${mint.slice(0,4)}`,
            name: name,
            symbol: symbol,
            mint: mint,
            balance: amount,
            decimals: decimals, 
            total_value: valueUsd,
            visual_type: "DUST_MITE"
        });
    };

    // Process SOL
    if (solBalance > 0) classify(SOL_MINT, solBalance, 9, 0, true);


    // Process Tokens
    activeItems.forEach(t => classify(t.mint, t.amount, t.decimals, t.rawAmount, false));

    // --- OUTPUT ---
    // FIXED: Mapping camelCase variables to snake_case keys for the frontend
    return {
        wallet: walletAddress,
        net_worth: `$${totalNetWorth.toFixed(2)}`, 
        safe_assets: safeAssets,   // Map safeAssets -> safe_assets
        dust_demons: dustDemons,   // Map dustDemons -> dust_demons
        nft_demons: nftDemons      // Map nftDemons -> nft_demons
    };
}