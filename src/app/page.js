'use client';

import { useState, useEffect, useRef } from 'react';
import { Skull, Ghost, Crosshair, Zap, Menu, Activity, Shield, CheckCircle2, Circle, AlertTriangle, ExternalLink, WifiOff, Coins, Volume2, VolumeX, Vibrate, FileText, X, EyeOff, Trash2, Target, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// REAL BLOCKCHAIN IMPORTS
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createBurnInstruction, createCloseAccountInstruction, getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { fetchMyBounties } from '@/utils/nftFetcher';
import '@solana/wallet-adapter-react-ui/styles.css';

// --- SAFETY PROTOCOL: DO NOT LIST THESE TOKENS ---
const SAFE_MINTS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'So11111111111111111111111111111111111111112', // Wrapped SOL
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP (Corrected Mint)
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'HzwqbKZw8RnJC2DVFrMp21571a81X1e56z6V7V2c62d', // BONK
];

export default function Home() {
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState('SCANNER');
  const [burningId, setBurningId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); 
  const [lootDrops, setLootDrops] = useState([]);
  const [shake, setShake] = useState(false);
  
  // NEW FEATURES STATE
  const [solBalance, setSolBalance] = useState(0);
  const [lastTx, setLastTx] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [phantomErrorId, setPhantomErrorId] = useState(null);
  const [tokenMap, setTokenMap] = useState({}); // Stores Jupiter Token Metadata
  const [priceMap, setPriceMap] = useState({}); // Stores Real-time Prices
  
  const [currentRank, setCurrentRank] = useState('VOID STALKER');
  const [rankColor, setRankColor] = useState('#00ff41');

  const audioRefs = useRef({});

  useEffect(() => {
    setIsMounted(true);
    
    // 1. PRE-LOAD JUPITER TOKEN LIST (For Metadata)
    fetch('https://token.jup.ag/strict') 
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(t => { map[t.address] = t });
        setTokenMap(map);
      })
      .catch(err => console.warn("Failed to load token map", err));

    const loadSound = (key, url) => {
      if (typeof window !== 'undefined') {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audioRefs.current[key] = audio;
      }
    };

    loadSound('scan', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    loadSound('burn', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    loadSound('select', 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3');
    loadSound('error', 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'); 
    loadSound('success', 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  }, []);

  const playSound = (key) => {
    if (!audioEnabled) return;
    const audio = audioRefs.current[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn("Audio failed:", e));
    }
  };

  const fetchBalance = async () => {
    if (publicKey && connection) {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    }
  };

  useEffect(() => {
    if (isMounted && publicKey) {
      fetchBalance();
      setResult(null);
      setView('SCANNER');
      setSelectedIds([]);
      setLastTx(null);
    }
  }, [publicKey, isMounted, connection]);

  // --- UPDATED RANK LOGIC (ENTROPY GOD TIER) ---
  useEffect(() => {
    const count = selectedIds.length;
    let newRank = 'VOID STALKER';
    let newColor = '#00ff41'; // Matrix Green

    if (count === 0) {
      newRank = 'AWAITING TARGETS';
      newColor = '#333';
    } else if (count < 5) {
      newRank = 'VOID STALKER';
      newColor = '#00ff41'; 
    } else if (count >= 5 && count < 15) {
      newRank = 'GLITCH SLAYER';
      newColor = '#fbbf24'; // Warning Yellow
    } else if (count >= 15 && count < 30) {
      newRank = 'DATA REAPER';
      newColor = '#f97316'; // Burnt Orange
    } else if (count >= 30 && count < 50) {
      newRank = 'PROTOCOL DEMON';
      newColor = '#ef4444'; // Danger Red
    } else if (count >= 50) {
      newRank = 'ENTROPY GOD';
      newColor = '#d946ef'; // Neon Purple/Magenta
    }
    
    setCurrentRank(newRank);
    setRankColor(newColor);
  }, [selectedIds]);

  const triggerHaptic = (pattern = 50) => {
    if (hapticsEnabled && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  // --- NEW: JUPITER PRICE FETCHING ---
  async function fetchJupiterPrices(mints) {
    if (mints.length === 0) return {};
    try {
      // Chunking requests because Jupiter API limit is 100 IDs
      const chunks = [];
      for (let i = 0; i < mints.length; i += 100) {
        chunks.push(mints.slice(i, i + 100));
      }

      let allPrices = {};
      for (const chunk of chunks) {
        const ids = chunk.join(',');
        const response = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`);
        const data = await response.json();
        if (data.data) {
          allPrices = { ...allPrices, ...data.data };
        }
      }
      return allPrices;
    } catch (e) {
      console.warn("Jupiter Price API Error:", e);
      return {};
    }
  }

  async function handleScan() {
    if (!publicKey) return;
    
    setLoading(true);
    setView('INVENTORY');
    triggerHaptic(100);
    playSound('scan');
    
    try {
      // 1. Fetch NFTs
      let nftAssets = [];
      try {
        const bounties = await fetchMyBounties(publicKey);
        if (Array.isArray(bounties)) nftAssets = bounties;
      } catch (e) { console.warn("NFT Fetch warning:", e); }

      // 2. Fetch SPL TOKENS
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      // 3. Prepare list for Price Check
      const rawTokens = [];
      const mintsToCheck = [];

      for (const item of tokenAccounts.value) {
        const info = item.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.amount; 
        const uiAmount = info.tokenAmount.uiAmount;
        
        if (nftAssets.some(n => n.mint === mint)) continue;
        if (SAFE_MINTS.includes(mint)) continue;

        const jupInfo = tokenMap[mint];
        mintsToCheck.push(mint);

        rawTokens.push({
          mint: mint,
          tokenAccount: item.pubkey.toString(),
          name: jupInfo ? jupInfo.name : `Token ${mint.slice(0, 4)}...`,
          symbol: jupInfo ? jupInfo.symbol : 'Ukwn',
          image: jupInfo ? jupInfo.logoURI : null, 
          balance: amount, 
          uiBalance: uiAmount, 
          isJupVerified: !!jupInfo
        });
      }

      // 4. GET REAL PRICES FROM JUPITER
      const prices = await fetchJupiterPrices(mintsToCheck);
      setPriceMap(prices);

      const allAssets = [...nftAssets, ...rawTokens];

      const mappedTargets = allAssets.map((a, index) => {
        const nameLower = (a.name || '').toLowerCase();
        
        // SCAM DETECTION
        const looksLikeScam = 
          a.name === 'Unknown Token' || 
          nameLower.includes('visit') || 
          nameLower.includes('.com') || 
          nameLower.includes('reward');

        // CALC VALUE
        const rawBalance = parseFloat(a.balance || '0');
        const isEmpty = rawBalance === 0;
        
        let usdValue = 0;
        if (prices[a.mint]) {
            usdValue = parseFloat(prices[a.mint].price) * (a.uiBalance || 0);
        }

        // SMART CLASSIFICATION
        const isTradeable = usdValue > 0.01; // Worth more than a penny? Trade it.
        const isDust = !looksLikeScam && !isEmpty && !isTradeable;
        const isPhantom = !a.mint;

        let typeLabel = 'TOKEN';
        if (isEmpty) typeLabel = 'EMPTY_ACC';
        else if (looksLikeScam) typeLabel = 'SCAM';
        else if (isTradeable) typeLabel = 'VALUE';
        else if (isDust) typeLabel = 'DUST';

        return {
          id: a.mint || `unknown-${index}`,
          tokenAccount: a.tokenAccount || a.pubkey || null, 
          name: a.name || 'UNIDENTIFIED ASSET',
          type: typeLabel,
          image: a.image || null,
          val: a.balance || '0', 
          displayVal: a.uiBalance !== undefined ? a.uiBalance : (a.val || '0'), 
          usdValue: usdValue, // REAL VALUE
          isScam: looksLikeScam,
          isDust: isDust,
          isTradeable: isTradeable,
          isEmpty: isEmpty, 
          isPhantom: isPhantom
        };
      });

      // Sort: Scam first, then Dust, then Value
      mappedTargets.sort((a, b) => {
        if (a.type === 'SCAM') return -1;
        if (b.type === 'SCAM') return 1;
        if (a.type === 'DUST') return -1;
        return 1;
      });

      setResult({
        net_worth: '$---',
        targets: mappedTargets
      });
    } catch (error) {
      console.error("Scan failed", error);
      alert("Scan failed. Check console.");
      setView('SCANNER');
    }
    setLoading(false);
  }

  const toggleSelect = (target) => {
    if (target.isPhantom) {
      playSound('error');
      triggerHaptic([50, 50, 50]);
      setPhantomErrorId(target.id); 
      setTimeout(() => setPhantomErrorId(null), 1500);
      return;
    }

    // Tradeable warning
    if (target.isTradeable) {
       if (!confirm(`WAIT! This token is worth $${target.usdValue.toFixed(2)}. Burning it destroys this value. Are you sure?`)) {
           return;
       }
    }

    playSound('select');
    triggerHaptic(30);
    setSelectedIds(prev => {
      if (prev.includes(target.id)) {
        return prev.filter(item => item !== target.id);
      } else {
        return [...prev, target.id];
      }
    });
  };

  const handleSelectAllDust = () => {
    if (!result || !result.targets) return;
    
    // Select DUST or EMPTY only. Ignore Value tokens and Scams.
    const dustIds = result.targets
      .filter(t => (t.isDust || t.isEmpty) && !t.isPhantom && !t.isTradeable)
      .map(t => t.id);

    if (dustIds.length === 0) {
      alert("No pure dust detected! Remaining tokens have value.");
      return;
    }

    const allSelected = dustIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds([]); 
      playSound('error');
    } else {
      setSelectedIds(dustIds); 
      playSound('select');
      triggerHaptic([50, 50, 50]);
    }
  };

  async function handleMassExorcism() {
    if (selectedIds.length === 0 || !publicKey) return;
    
    const isLargeBatch = selectedIds.length > 10;
    const confirmMsg = isLargeBatch 
      ? `WARNING: Burning ${selectedIds.length} tokens. Sign all transactions?`
      : `Confirm burn/close of ${selectedIds.length} assets?`;

    if(!confirm(confirmMsg)) return;

    setBurningId('MASS_BURN');
    triggerHaptic([50, 50, 50]);
    
    try {
      const BATCH_SIZE = 10;
      const txsToSign = [];
      let totalValidBurnCount = 0;
      
      const { blockhash } = await connection.getLatestBlockhash('finalized');

      for (let i = 0; i < selectedIds.length; i += BATCH_SIZE) {
        const chunk = selectedIds.slice(i, i + BATCH_SIZE);
        const transaction = new Transaction();
        transaction.feePayer = publicKey;
        transaction.recentBlockhash = blockhash;

        let chunkHasInstructions = false;

        for (const id of chunk) {
          const target = result.targets.find(t => t.id === id);
          if (!target) continue;

          try {
              const mintPublicKey = new PublicKey(target.id);
              let tokenAccountPublicKey = target.tokenAccount 
                  ? new PublicKey(target.tokenAccount) 
                  : await getAssociatedTokenAddress(mintPublicKey, publicKey);

              const accountInfo = await connection.getAccountInfo(tokenAccountPublicKey);
              
              if (accountInfo) {
                  const tokenAmount = await connection.getTokenAccountBalance(tokenAccountPublicKey);
                  const exactAmount = BigInt(tokenAmount.value.amount);

                  if (exactAmount > BigInt(0)) {
                      transaction.add(createBurnInstruction(tokenAccountPublicKey, mintPublicKey, publicKey, exactAmount));
                  }
                  transaction.add(createCloseAccountInstruction(tokenAccountPublicKey, publicKey, publicKey));
                  
                  chunkHasInstructions = true;
                  totalValidBurnCount++;
              }
          } catch (err) {
              console.error(`Build Error for ${target.name}:`, err);
          }
        }

        if (chunkHasInstructions) {
          txsToSign.push(transaction);
        }
      }

      if (txsToSign.length === 0) {
          alert("No valid targets found.");
          setBurningId(null);
          return;
      }

      const signedTransactions = await signAllTransactions(txsToSign);
      setLoading(true);

      const signatures = await Promise.all(
        signedTransactions.map(tx => 
          connection.sendRawTransaction(tx.serialize(), { skipPreflight: false })
        )
      );

      await connection.confirmTransaction(signatures[signatures.length - 1], 'confirmed');
      
      setLastTx(signatures[signatures.length - 1]);
      fetchBalance(); 

      setShake(true);
      triggerHaptic([100, 50, 100, 50, 200]); 
      playSound('burn');
      setTimeout(() => playSound('success'), 500);

      const rentReclaimed = (totalValidBurnCount * 0.002).toFixed(3);
      const newLoot = { id: Date.now(), text: `CRITICAL HIT: +${rentReclaimed} SOL` };
      setLootDrops(prev => [...prev, newLoot]);
      
      setResult(prev => ({
        ...prev,
        targets: prev.targets.filter(t => !selectedIds.includes(t.id))
      }));
      
      setSelectedIds([]);
      
    } catch (error) {
      console.error("Exorcism Failed:", error);
      alert("Transaction Failed: " + (error.message || "Unknown error"));
    } finally {
      setBurningId(null);
      setLoading(false);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setLootDrops(prev => prev.filter(l => l.id !== Date.now())), 3000);
    }
  }

  const handleShare = () => {
    const text = `I just reclaimed free SOL from digital dust using Dust Demons 😈🧹\n\nReclaim your rent here: https://dust-demons.sol\n\nPowered by @JupiterExchange`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isMounted) return <div style={{ background: '#000', height: '100vh', width: '100vw' }} />;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
      
      {/* 1. TOP TACTICAL HUD */}
      <header style={{ zIndex: 100, padding: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#111', border: `1px solid ${rankColor}`, padding: '5px 10px', borderRadius: '4px', transition: 'all 0.3s' }}>
            <p style={{ margin: 0, fontSize: '8px', color: rankColor, fontWeight: 'bold' }}>RANK</p>
            <h2 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#fff' }}>{currentRank}</h2>
          </div>
          <div style={{ background: '#111', border: '1px solid #333', padding: '5px 10px', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '8px', color: '#fbbf24' }}>SOL BALANCE</p>
            <h2 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#fff' }}>{solBalance.toFixed(3)}</h2>
          </div>
        </div>
        <div style={{ transform: 'scale(0.85)' }}>
          <WalletMultiButton />
        </div>
      </header>

      {/* 2. MENU OVERLAY */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.95)', padding: '20px', display: 'flex', flexDirection: 'column' }}
          >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#00ff41' }}>MISSION SETTINGS</h2>
                <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={24} /></button>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Zap size={18} color="#00ff41" />
                     <div>
                        <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>INTELLIGENCE PROVIDER</h4>
                        <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>Powered by Jupiter V6 API</p>
                     </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {audioEnabled ? <Volume2 color="#00ff41" /> : <VolumeX color="#666" />}
                      <span>AUDIO FEEDBACK</span>
                   </div>
                   <button onClick={() => setAudioEnabled(!audioEnabled)} style={{ background: audioEnabled ? '#00ff41' : '#333', color: '#000', border: 'none', padding: '5px 15px', fontWeight: 'bold' }}>{audioEnabled ? 'ON' : 'OFF'}</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Vibrate color={hapticsEnabled ? '#00ff41' : '#666'} />
                      <span>HAPTIC RECOIL</span>
                   </div>
                   <button onClick={() => setHapticsEnabled(!hapticsEnabled)} style={{ background: hapticsEnabled ? '#00ff41' : '#333', color: '#000', border: 'none', padding: '5px 15px', fontWeight: 'bold' }}>{hapticsEnabled ? 'ON' : 'OFF'}</button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. GAME ARENA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '120px', zIndex: 10 }}>
        
        {view === 'SCANNER' && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '65vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={handleScan}
              style={{ background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'center' }}
            >
               <div style={{ width: '180px', height: '180px', borderRadius: '50%', border: '2px solid #00ff41', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px #00ff41' }}>
                  <Crosshair size={50} color="#00ff41" />
                  <p style={{ color: '#00ff41', fontWeight: 'bold', marginTop: '12px', letterSpacing: '2px' }}>START MISSION</p>
               </div>
            </motion.button>
            {!publicKey && <p style={{ color: '#333', fontSize: '10px', marginTop: '20px' }}>NEURAL LINK REQUIRED</p>}
          </div>
        )}

        {loading && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', color: '#00ff41', marginBottom: '20px', fontSize: '12px', letterSpacing: '2px' }}>DECODING BLOCKCHAIN DATA...</div>
            {[1, 2, 3, 4, 5].map((i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0.3 }}
                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                 transition={{ repeat: Infinity, duration: 1.5 }}
                 style={{ height: '80px', background: '#111', marginBottom: '12px', borderRadius: '4px', border: '1px solid #222' }}
               />
            ))}
          </div>
        )}

        {view === 'INVENTORY' && !loading && result && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', padding: '12px', background: '#0a0a0a', border: `1px solid ${selectedIds.length > 0 ? rankColor : '#222'}`, position: 'sticky', top: 0, zIndex: 20, transition: 'border 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: '#666' }}>SELECTED TARGETS</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, color: rankColor }}>{selectedIds.length} / {result.targets.length}</h3>
                      {selectedIds.length > 1 && <span style={{ fontSize: '9px', background: rankColor, color: '#000', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold' }}>COMBO ACTIVE</span>}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSelectAllDust}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#111', border: '1px solid #fbbf24', color: '#fbbf24', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                     <Target size={12} /> LOCK ON DUST
                  </button>
              </div>

              <button 
                onClick={handleMassExorcism} 
                disabled={selectedIds.length === 0 || burningId}
                style={{ width: '100%', padding: '10px 20px', background: selectedIds.length > 0 ? '#ff0055' : '#111', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                {burningId ? <Activity className="animate-spin" size={16} /> : `BURN ${selectedIds.length} ASSETS`}
              </button>
            </div>

            {lastTx && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 style={{ background: '#00ff4111', border: '1px solid #00ff41', padding: '10px', marginBottom: '15px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
               >
                 <div>
                    <span style={{ fontSize: '10px', color: '#00ff41', fontWeight: 'bold', display: 'block' }}>MISSION SUCCESSFUL</span>
                    <a href={`https://solscan.io/tx/${lastTx}`} target="_blank" style={{ fontSize: '9px', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}>
                        VIEW ON SOLSCAN <ExternalLink size={8} />
                    </a>
                 </div>
                 
                 <button 
                   onClick={handleShare}
                   style={{ background: '#00ff41', color: '#000', border: 'none', padding: '6px 12px', fontSize: '10px', fontWeight: '900', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                 >
                    BRAG ON X 🚀
                 </button>
               </motion.div>
            )}

            {result.targets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#333' }}>
                <Shield size={48} style={{ margin: '0 auto 10px auto', opacity: 0.2 }} />
                NO THREATS DETECTED
              </div>
            ) : (
              result.targets.map((target) => (
                <BountyPoster 
                  key={target.id} 
                  data={target} 
                  selected={selectedIds.includes(target.id)}
                  onSelect={() => toggleSelect(target)}
                  showError={phantomErrorId === target.id} 
                />
              ))
            )}
          </div>
        )}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, width: '100%', height: '80px', background: 'rgba(5,5,5,0.95)', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, paddingBottom: '20px' }}>
        <button onClick={() => setView('SCANNER')} style={{ background: 'none', border: 'none', color: view === 'SCANNER' ? '#00ff41' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Crosshair size={24} /> <span style={{ fontSize: '9px', fontWeight: 'bold' }}>SCANNER</span>
        </button>
        <button onClick={() => setView('INVENTORY')} style={{ background: 'none', border: 'none', color: view === 'INVENTORY' ? '#ff0055' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Ghost size={24} /> <span style={{ fontSize: '9px', fontWeight: 'bold' }}>TARGETS</span>
        </button>
        <button onClick={() => setShowMenu(true)} style={{ background: 'none', border: 'none', color: '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Menu size={24} /> <span style={{ fontSize: '9px', fontWeight: 'bold' }}>MENU</span>
        </button>
      </nav>

      {shake && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,0,0,0.15)', zIndex: 2000, pointerEvents: 'none' }} />}
      
      <AnimatePresence>
        {lootDrops.map(loot => (
          <motion.div key={loot.id} initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], y: -150, scale: 1.5 }} className="fixed top-1/2 left-1/2 transform -translate-x-1/2 z-[3000] pointer-events-none">
             <div style={{ color: '#fbbf24', fontWeight: '900', fontSize: '24px', textShadow: '0 0 10px rgba(251,191,36,0.8)', display: 'flex', alignItems: 'center', gap: '5px' }}>
               <Zap fill="currentColor" /> {loot.text}
             </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
}

function BountyPoster({ data, selected, onSelect, showError }) {
  const isScam = data.isScam;
  const isTradeable = data.isTradeable;
  const isDust = data.isDust;
  const isEmpty = data.isEmpty;
  const isPhantom = data.isPhantom;
  
  // COLOR LOGIC: Scam=Red, Value=Blue, Dust=Yellow, Phantom=Dark
  const mainColor = isPhantom ? '#333' : (selected ? '#00ff41' : (isScam ? '#ff0055' : (isTradeable ? '#3b82f6' : (isDust || isEmpty ? '#fbbf24' : '#333'))));
  const accentColor = isPhantom ? '#444' : (selected ? '#00ff41' : (isScam ? '#ff0055' : (isTradeable ? '#3b82f6' : (isDust || isEmpty ? '#fbbf24' : '#a855f7'))));

  return (
    <motion.div 
      onClick={onSelect}
      whileTap={!isPhantom ? { scale: 0.98 } : { x: [0, -5, 5, -5, 5, 0] }} 
      style={{ 
        background: selected ? 'rgba(0,255,65,0.05)' : '#0a0a0a', 
        borderTop: `1px solid ${mainColor}`,
        borderRight: `1px solid ${mainColor}`,
        borderBottom: `1px solid ${mainColor}`,
        borderLeft: `4px ${isPhantom ? 'dashed' : 'solid'} ${accentColor}`,
        padding: '12px', 
        marginBottom: '12px', 
        position: 'relative', 
        borderRadius: '4px', 
        cursor: isPhantom ? 'not-allowed' : 'pointer',
        opacity: 1, 
        transition: 'all 0.2s',
        overflow: 'hidden'
      }}
    >
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backgroundColor: 'rgba(20, 0, 0, 0.9)' }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #ff0055',
            }}
          >
            <motion.div 
               animate={{ x: [-2, 2, -2, 0] }} 
               transition={{ duration: 0.2 }}
               style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff0055' }}
            >
               <WifiOff size={24} />
               <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>TARGET LOCK FAILED</h3>
            </motion.div>
            <p style={{ color: '#888', fontSize: '9px', marginTop: '4px' }}>NO MINT ID DETECTED</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ position: 'relative', width: '70px', height: '90px', flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', background: '#000', border: '1px solid #333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.image ? (
              <img src={data.image} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.6, filter: isPhantom ? 'grayscale(100%)' : 'none' }} />
            ) : (
              // Icon Fallback Logic
              isEmpty ? <Trash2 color="#999" size={30} /> :
              isScam ? <Skull color="#ff0055" size={30} /> :
              isTradeable ? <ArrowRightLeft color="#3b82f6" size={30} /> : // Swap Icon
              isDust ? <Coins color="#fbbf24" size={30} /> :
              <Circle color="#333" size={30} />
            )}
          </div>
          <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#000', borderRadius: '50%' }}>
            {isPhantom ? (
               <EyeOff size={20} color="#444" /> 
            ) : (
               selected ? <CheckCircle2 size={20} color="#00ff41" fill="#000" /> : <Circle size={20} color="#333" />
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: selected ? '#00ff41' : (isPhantom ? '#666' : '#fff'), letterSpacing: '0.5px', maxWidth: '180px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {data.name}
            </h4>
            {isScam && <AlertTriangle size={14} color="#ff0055" />}
            {isTradeable && <ArrowRightLeft size={14} color="#3b82f6" />}
            {(isDust || isEmpty) && <Coins size={14} color="#fbbf24" />}
          </div>
          
          <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
             {isPhantom ? (
               <span style={{ fontSize: '9px', padding: '2px 4px', background: '#111', color: '#666', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <WifiOff size={8} /> SIGNAL CORRUPTED
               </span>
             ) : (
               <span style={{ fontSize: '9px', padding: '2px 4px', background: '#111', color: isScam ? '#ff0055' : (isTradeable ? '#3b82f6' : (isDust || isEmpty ? '#fbbf24' : '#666')), border: `1px solid ${isScam ? '#ff0055' : (isTradeable ? '#1d4ed8' : (isDust || isEmpty ? '#fbbf24' : '#222'))}` }}>
                 {isScam ? 'SCAM - HIGH RISK' : (isEmpty ? 'EMPTY ACCOUNT' : (isTradeable ? `VALUE: $${data.usdValue.toFixed(2)}` : 'DUST'))}
               </span>
             )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
             <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: isPhantom ? '#444' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={10} fill="currentColor" /> {isPhantom ? 'UNKNOWN' : (isEmpty ? '0 BAL' : data.displayVal)}
             </p>
             <span style={{ fontSize: '8px', padding: '2px 6px', background: selected ? '#00ff41' : '#111', color: selected ? '#000' : '#444', borderRadius: '2px', fontWeight: 'bold' }}>
               {isPhantom ? 'LOCKED' : (selected ? 'LOCKED ON' : 'ACTIVE')}
             </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}