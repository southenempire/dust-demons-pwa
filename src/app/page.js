'use client';

import { useState, useEffect, useRef } from 'react';
import { Skull, Ghost, Crosshair, Zap, Menu, Activity, Shield, CheckCircle2, Circle, AlertTriangle, ExternalLink, WifiOff, Coins, Volume2, VolumeX, Vibrate, FileText, X, EyeOff, Trash2, Target, ArrowRightLeft, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createBurnInstruction, createCloseAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { fetchMyBounties } from '@/utils/nftFetcher';
import '@solana/wallet-adapter-react-ui/styles.css';

const SAFE_MINTS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'So11111111111111111111111111111111111111112', // Wrapped SOL
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'HzwqbKZw8RnJC2DVFrMp21571a81X1e56z6V7V2c62d', // BONK
];

export default function Home() {
  const { publicKey, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState('SCANNER');
  const [burningId, setBurningId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); 
  const [lootDrops, setLootDrops] = useState([]);
  const [shake, setShake] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  // Settings
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  
  const [phantomErrorId, setPhantomErrorId] = useState(null);
  const [tokenMap, setTokenMap] = useState({}); 
  const [priceMap, setPriceMap] = useState({}); 
  
  const [stats, setStats] = useState({ totalBurned: 0, solReclaimed: 0.0 });
  const [currentRank, setCurrentRank] = useState('VOID STALKER');
  const [rankColor, setRankColor] = useState('#00ff41');

  const [modal, setModal] = useState({ 
    isOpen: false, type: 'INFO', title: '', message: '', actionLabel: '', onConfirm: null 
  });

  const audioRefs = useRef({});

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('demon_stats');
    if (saved) setStats(JSON.parse(saved));

    const fetchTokens = async () => {
      try {
        // 1. Jupiter
        const res = await fetch('https://token.jup.ag/strict');
        if (!res.ok) throw new Error("Blocked");
        const data = await res.json();
        setTokenMap(data.reduce((acc, t) => ({ ...acc, [t.address]: t }), {}));
      } catch (e) {
        try {
          // 2. GitHub Backup
          const res = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json');
          const data = await res.json();
          const list = data.tokens || data;
          setTokenMap(list.reduce((acc, t) => ({ ...acc, [t.address]: t }), {}));
        } catch (e2) {
           // 3. Static Fallback (If internet is super restricted)
           console.warn("Using static fallback");
           const staticMap = {};
           SAFE_MINTS.forEach(m => staticMap[m] = { name: "Safe Asset", logoURI: "" });
           setTokenMap(staticMap);
        }
      }
    };
    fetchTokens();

    const loadAudio = (key, url) => {
      if (typeof window === 'undefined') return;
      const audio = new Audio(url);
      audio.volume = 0.5;
      audioRefs.current[key] = audio;
    };

    const sfx = {
      scan: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      burn: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      select: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3',
      error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      alert: 'https://assets.mixkit.co/active_storage/sfx/2865/2865-preview.mp3'
    };
    Object.entries(sfx).forEach(([k, v]) => loadAudio(k, v));
  }, []);

  useEffect(() => {
     if (isMounted) localStorage.setItem('demon_stats', JSON.stringify(stats));
  }, [stats, isMounted]);

  const playSound = (key) => {
    if (!audioEnabled) return;
    const audio = audioRefs.current[key];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  const showModal = (type, title, message, actionLabel = 'OK', onConfirm = null) => {
    playSound('alert');
    setModal({ isOpen: true, type, title, message, actionLabel, onConfirm });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (isMounted && publicKey) {
      setResult(null); setView('SCANNER'); setSelectedIds([]); setLastTx(null);
    }
  }, [publicKey, isMounted]);

  useEffect(() => {
    const count = selectedIds.length;
    let rank = 'VOID STALKER';
    let color = '#00ff41'; 
    if (count === 0) {
       if (stats.totalBurned > 100) { rank = 'ENTROPY GOD'; color = '#d946ef'; }
       else if (stats.totalBurned > 50) { rank = 'PROTOCOL DEMON'; color = '#ef4444'; }
       else { rank = 'AWAITING TARGETS'; color = '#333'; }
    } else if (count < 5) { rank = 'VOID STALKER'; color = '#00ff41'; } 
    else if (count < 15) { rank = 'GLITCH SLAYER'; color = '#fbbf24'; } 
    else if (count < 30) { rank = 'DATA REAPER'; color = '#f97316'; } 
    else if (count < 50) { rank = 'PROTOCOL DEMON'; color = '#ef4444'; } 
    else { rank = 'ENTROPY GOD'; color = '#d946ef'; }
    setCurrentRank(rank); setRankColor(color);
  }, [selectedIds, stats]);

  const triggerHaptic = (pattern = 50) => {
    if (hapticsEnabled && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  async function fetchPrices(mints) {
    if (!mints.length) return {};
    try {
      const chunks = [];
      for (let i = 0; i < mints.length; i += 100) chunks.push(mints.slice(i, i + 100));
      let prices = {};
      for (const chunk of chunks) {
        const res = await fetch(`https://api.jup.ag/price/v2?ids=${chunk.join(',')}`);
        if (!res.ok) continue; 
        const data = await res.json();
        if (data.data) prices = { ...prices, ...data.data };
      }
      return prices;
    } catch { return {}; }
  }

  async function handleScan() {
    if (!publicKey) return;
    setLoading(true); setView('INVENTORY'); triggerHaptic(100); playSound('scan');
    
    try {
      let nftAssets = [];
      try {
        const bounties = await fetchMyBounties(publicKey);
        if (Array.isArray(bounties)) nftAssets = bounties;
      } catch {}

      const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
      const rawTokens = [];
      const mintsToCheck = [];

      for (const item of accounts.value) {
        const info = item.account.data.parsed.info;
        const mint = info.mint;
        if (nftAssets.some(n => n.mint === mint) || SAFE_MINTS.includes(mint)) continue;
        const meta = tokenMap[mint];
        mintsToCheck.push(mint);
        rawTokens.push({
          mint, tokenAccount: item.pubkey.toString(),
          name: meta ? meta.name : `Token ${mint.slice(0, 4)}...`,
          image: meta ? meta.logoURI : null, 
          balance: info.tokenAmount.amount, uiBalance: info.tokenAmount.uiAmount
        });
      }

      const prices = await fetchPrices(mintsToCheck);
      setPriceMap(prices);

      const targets = [...nftAssets, ...rawTokens].map((a, i) => {
        const nameLower = (a.name || '').toLowerCase();
        const isScam = nameLower.includes('visit') || nameLower.includes('.com') || nameLower.includes('reward');
        const isEmpty = parseFloat(a.balance || '0') === 0;
        let val = 0;
        if (prices[a.mint]) val = parseFloat(prices[a.mint].price) * (a.uiBalance || 0);
        const isTradeable = val > 0.01; 
        const isDust = !isScam && !isEmpty && !isTradeable;
        const isPhantom = !a.mint;

        return {
          id: a.mint || `unknown-${i}`,
          tokenAccount: a.tokenAccount || a.pubkey || null, 
          name: a.name || 'UNKNOWN',
          type: isEmpty ? 'EMPTY' : (isScam ? 'SCAM' : (isTradeable ? 'VALUE' : 'DUST')),
          image: a.image, displayVal: a.uiBalance !== undefined ? a.uiBalance : (a.val || '0'), 
          usdValue: val, isScam, isDust, isTradeable, isEmpty, isPhantom
        };
      });

      targets.sort((a, b) => (a.isScam ? -1 : (b.isScam ? 1 : (a.isDust ? -1 : 1))));
      setResult({ targets });
    } catch (error) {
      showModal('DANGER', 'SYSTEM FAILURE', `Error: ${error.message || 'Connection Failed'}`);
      setView('SCANNER');
    }
    setLoading(false);
  }

  const toggleSelect = (target) => {
    if (target.isPhantom) {
      playSound('error'); triggerHaptic([50, 50, 50]);
      setPhantomErrorId(target.id); setTimeout(() => setPhantomErrorId(null), 1500);
      return;
    }
    if (target.isTradeable) {
       showModal('WARNING', 'VALUE DETECTED', `Worth $${target.usdValue.toFixed(2)}. Swap?`, 'SWAP', 
          () => window.open(`https://jup.ag/swap/${target.id}-SOL`, '_blank'));
       return;
    }
    playSound('select'); triggerHaptic(30);
    setSelectedIds(prev => prev.includes(target.id) ? prev.filter(i => i !== target.id) : [...prev, target.id]);
  };

  const handleSelectAllDust = () => {
    if (!result?.targets) return;
    const dust = result.targets.filter(t => (t.isDust || t.isEmpty) && !t.isPhantom && !t.isTradeable).map(t => t.id);
    if (!dust.length) { showModal('INFO', 'NO DUST', 'No safe dust found.'); return; }
    if (dust.every(id => selectedIds.includes(id))) { setSelectedIds([]); playSound('error'); } 
    else { setSelectedIds(dust); playSound('select'); triggerHaptic([50, 50]); }
  };

  async function executeExorcism() {
    closeModal(); setBurningId('MASS_BURN'); triggerHaptic([50, 50, 50]);
    try {
      const txs = []; let burned = 0;
      const { blockhash } = await connection.getLatestBlockhash('finalized');

      for (let i = 0; i < selectedIds.length; i += 10) {
        const chunk = selectedIds.slice(i, i + 10);
        const tx = new Transaction();
        tx.feePayer = publicKey; tx.recentBlockhash = blockhash;
        let hasIx = false;

        for (const id of chunk) {
          const t = result.targets.find(x => x.id === id);
          if (!t) continue;
          try {
              const mint = new PublicKey(t.id);
              const tokenAcc = t.tokenAccount ? new PublicKey(t.tokenAccount) : await getAssociatedTokenAddress(mint, publicKey);
              const info = await connection.getAccountInfo(tokenAcc);
              if (info) {
                  const bal = await connection.getTokenAccountBalance(tokenAcc);
                  if (BigInt(bal.value.amount) > BigInt(0)) {
                      tx.add(createBurnInstruction(tokenAcc, mint, publicKey, BigInt(bal.value.amount)));
                  }
                  tx.add(createCloseAccountInstruction(tokenAcc, publicKey, publicKey));
                  hasIx = true; burned++;
              }
          } catch {}
        }
        if (hasIx) txs.push(tx);
      }

      if (!txs.length) { showModal('INFO', 'INVALID', 'No valid targets.'); setBurningId(null); return; }

      const signed = await signAllTransactions(txs);
      setLoading(true);
      const sigs = await Promise.all(signed.map(t => connection.sendRawTransaction(t.serialize())));
      await connection.confirmTransaction(sigs[sigs.length - 1], 'confirmed');
      
      setLastTx(sigs[sigs.length - 1]); setShake(true); triggerHaptic([100, 50, 100]); 
      playSound('burn'); setTimeout(() => playSound('success'), 500);

      const rent = (burned * 0.002).toFixed(3);
      setStats(p => ({ totalBurned: p.totalBurned + burned, solReclaimed: p.solReclaimed + parseFloat(rent) }));
      setLootDrops(p => [...p, { id: Date.now(), text: `+${rent} SOL` }]);
      setResult(p => ({ ...p, targets: p.targets.filter(t => !selectedIds.includes(t.id)) }));
      setSelectedIds([]);
    } catch (err) {
      showModal('DANGER', 'FAILED', err.message);
    } finally {
      setBurningId(null); setLoading(false);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setLootDrops(p => p.filter(l => l.id !== Date.now())), 3000);
    }
  }

  const confirmExorcism = () => {
    if (!selectedIds.length || !publicKey) return;
    const isLarge = selectedIds.length > 10;
    const msg = isLarge 
      ? `Targeting ${selectedIds.length} entities. High-bandwidth signing required.`
      : `Delete ${selectedIds.length} assets to reclaim rent? Irreversible.`;
    showModal('DANGER', isLarge ? 'MASS PROTOCOL' : 'CONFIRM BURN', msg, 'EXECUTE', executeExorcism);
  };

  const handleShare = () => {
    const text = `I just reclaimed ${stats.solReclaimed.toFixed(3)} SOL using Dust Demons 😈🧹\nhttps://dust-demons.sol\nPowered by @JupiterExchange`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isMounted) return <div style={{ background: '#000', height: '100dvh', width: '100vw' }} />;

  return (
    <main style={{ 
      height: '100dvh', /* Forces app to fit exact screen height on mobile */
      width: '100vw', 
      backgroundColor: '#000', 
      color: '#fff', 
      position: 'relative', 
      overflow: 'hidden', /* Stops "rubber banding" scroll */
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'monospace' 
    }}>
      
      {/* CRT SCANLINE OVERLAY */ }
      <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9999,
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
          backgroundSize: '100% 2px, 3px 100%', opacity: 0.6
      }} />

      <header style={{ zIndex: 100, padding: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#111', border: `1px solid ${rankColor}`, padding: '5px 10px', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '8px', color: rankColor, fontWeight: 'bold' }}>RANK</p>
            <h2 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#fff' }}>{currentRank}</h2>
          </div>
          <div style={{ background: '#111', border: '1px solid #333', padding: '5px 10px', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '8px', color: '#fbbf24' }}>CAREER LOOT</p>
            <h2 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#fff' }}>{stats.solReclaimed.toFixed(3)} SOL</h2>
          </div>
        </div>
        <div style={{ transform: 'scale(0.85)' }}><WalletMultiButton /></div>
      </header>

      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 500 }} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.95)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#00ff41' }}>SETTINGS</h2>
                <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={24} /></button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#888' }}>TOTAL BURNED</span>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{stats.totalBurned}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#888' }}>TOTAL RECLAIMED</span>
                        <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold' }}>{stats.solReclaimed.toFixed(4)} SOL</span>
                     </div>
                </div>
                <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '15px' }}>
                     <img 
                       src="/demon-logo.jpg" 
                       onError={(e) => { e.target.onerror = null; e.target.src = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"; }}
                       alt="Logo" 
                       style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%' }} 
                     />
                     <div>
                        <h4 style={{ margin: 0, fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>POWERED BY JUPITER</h4>
                        <p style={{ margin: 0, fontSize: '10px', color: '#00ff41' }}>V6 API Integration</p>
                     </div>
                </div>
                <div style={{ marginTop: '20px', padding: '15px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#fbbf24' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <FileText size={16} color="#fbbf24" />
                        <h4 style={{ margin: 0, fontSize: '14px', color: '#fbbf24', fontWeight: '900' }}>HOW TO PLAY</h4>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#aaa', lineHeight: '1.8' }}>
                        <li><strong>SCAN:</strong> Find rent accounts and dust.</li>
                        <li><strong>TARGETS:</strong> <span style={{color:'#fbbf24'}}>Yellow</span>=Dust. <span style={{color:'#3b82f6'}}>Blue</span>=Value. <span style={{color:'#ff0055'}}>Red</span>=Scam.</li>
                        <li><strong>BURN:</strong> Reclaim 0.002 SOL rent per account.</li>
                        <li><strong>RANK UP:</strong> Become the <strong>ENTROPY GOD</strong>.</li>
                    </ul>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal.isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ width: '100%', maxWidth: '320px', background: '#0a0a0a', border: `1px solid ${modal.type === 'DANGER' ? '#ff0055' : (modal.type === 'WARNING' ? '#fbbf24' : '#00ff41')}`, borderRadius: '4px', padding: '24px', boxShadow: `0 0 30px ${modal.type === 'DANGER' ? 'rgba(255,0,85,0.2)' : 'rgba(0,255,65,0.1)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        {modal.type === 'DANGER' ? <AlertOctagon color="#ff0055" /> : (modal.type === 'WARNING' ? <AlertTriangle color="#fbbf24" /> : <Activity color="#00ff41" />)}
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{modal.title}</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5', marginBottom: '24px' }}>{modal.message}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={closeModal} style={{ flex: 1, padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', fontWeight: 'bold', borderRadius: '4px' }}>CANCEL</button>
                        {modal.onConfirm ? (
                             <button onClick={() => { modal.onConfirm(); closeModal(); }} style={{ flex: 1, padding: '12px', background: modal.type === 'DANGER' ? '#ff0055' : (modal.type === 'WARNING' ? '#fbbf24' : '#00ff41'), border: 'none', color: '#000', fontWeight: '900', borderRadius: '4px' }}>{modal.actionLabel}</button>
                        ) : (
                             <button onClick={closeModal} style={{ flex: 1, padding: '12px', background: '#00ff41', border: 'none', color: '#000', fontWeight: '900', borderRadius: '4px' }}>ACKNOWLEDGE</button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        padding: '16px', 
        paddingBottom: '100px', 
        zIndex: 10,
        position: 'relative'
      }}>
        {view === 'SCANNER' && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '65vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleScan} style={{ background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'center' }}>
               <div style={{ width: '180px', height: '180px', borderRadius: '50%', border: '2px solid #00ff41', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px #00ff41' }}>
                  <Crosshair size={50} color="#00ff41" />
                  <p style={{ color: '#00ff41', fontWeight: 'bold', marginTop: '12px', letterSpacing: '2px' }}>INITIATE SCAN</p>
               </div>
            </motion.button>
            {!publicKey && <p style={{ color: '#333', fontSize: '10px', marginTop: '20px' }}>NEURAL LINK REQUIRED</p>}
          </div>
        )}

        {loading && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', color: '#00ff41', marginBottom: '20px', fontSize: '12px', letterSpacing: '2px' }}>DECODING BLOCKCHAIN DATA...</div>
            {[1, 2, 3, 4, 5].map((i) => (
               <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: '80px', background: '#111', marginBottom: '12px', borderRadius: '4px', border: '1px solid #222' }} />
            ))}
          </div>
        )}

        {view === 'INVENTORY' && !loading && result && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', padding: '12px', background: '#0a0a0a', border: `1px solid ${selectedIds.length > 0 ? rankColor : '#222'}`, position: 'sticky', top: 0, zIndex: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: '#666' }}>SELECTED</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, color: rankColor }}>{selectedIds.length} / {result.targets.length}</h3>
                    </div>
                  </div>
                  <button onClick={handleSelectAllDust} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#111', border: '1px solid #fbbf24', color: '#fbbf24', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                     <Target size={12} /> LOCK ON DUST
                  </button>
              </div>
              <button onClick={confirmExorcism} disabled={!selectedIds.length || burningId} style={{ width: '100%', padding: '10px 20px', background: selectedIds.length ? '#ff0055' : '#111', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                {burningId ? <Activity className="animate-spin" size={16} /> : `BURN ${selectedIds.length} ASSETS`}
              </button>
            </div>

            {lastTx && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ background: '#00ff4111', border: '1px solid #00ff41', padding: '10px', marginBottom: '15px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <span style={{ fontSize: '10px', color: '#00ff41', fontWeight: 'bold', display: 'block' }}>MISSION SUCCESSFUL</span>
                    <a href={`https://solscan.io/tx/${lastTx}`} target="_blank" style={{ fontSize: '9px', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}>VIEW ON SOLSCAN <ExternalLink size={8} /></a>
                 </div>
                 <button onClick={handleShare} style={{ background: '#00ff41', color: '#000', border: 'none', padding: '6px 12px', fontSize: '10px', fontWeight: '900', borderRadius: '4px' }}>BRAG ON X 🚀</button>
               </motion.div>
            )}

            {!result.targets.length ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#333' }}>
                <Shield size={48} style={{ margin: '0 auto 10px auto', opacity: 0.2 }} /> NO THREATS DETECTED
              </div>
            ) : (
              result.targets.map(t => (
                <BountyPoster key={t.id} data={t} selected={selectedIds.includes(t.id)} onSelect={() => toggleSelect(t)} showError={phantomErrorId === t.id} />
              ))
            )}
          </div>
        )}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, width: '100%', height: '80px', background: 'rgba(5,5,5,0.95)', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, paddingBottom: '20px' }}>
        <button onClick={() => setView('SCANNER')} style={{ background: 'none', border: 'none', color: view === 'SCANNER' ? '#00ff41' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><Crosshair size={24} /><span style={{ fontSize: '9px', fontWeight: 'bold' }}>SCANNER</span></button>
        <button onClick={() => setView('INVENTORY')} style={{ background: 'none', border: 'none', color: view === 'INVENTORY' ? '#ff0055' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><Ghost size={24} /><span style={{ fontSize: '9px', fontWeight: 'bold' }}>TARGETS</span></button>
        <button onClick={() => setShowMenu(true)} style={{ background: 'none', border: 'none', color: '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><Menu size={24} /><span style={{ fontSize: '9px', fontWeight: 'bold' }}>MENU</span></button>
      </nav>

      {shake && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,0,0,0.15)', zIndex: 2000, pointerEvents: 'none' }} />}
      
      <AnimatePresence>
        {lootDrops.map(l => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], y: -150, scale: 1.5 }} className="fixed top-1/2 left-1/2 transform -translate-x-1/2 z-[3000] pointer-events-none">
             <div style={{ color: '#fbbf24', fontWeight: '900', fontSize: '24px', textShadow: '0 0 10px rgba(251,191,36,0.8)', display: 'flex', alignItems: 'center', gap: '5px' }}><Zap fill="currentColor" /> {l.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
}

function BountyPoster({ data, selected, onSelect, showError }) {
  const { isScam, isTradeable, isDust, isEmpty, isPhantom } = data;
  const mainColor = isPhantom ? '#333' : (selected ? '#00ff41' : (isScam ? '#ff0055' : (isTradeable ? '#3b82f6' : (isDust || isEmpty ? '#fbbf24' : '#333'))));
  const accentColor = isPhantom ? '#444' : (selected ? '#00ff41' : (isScam ? '#ff0055' : (isTradeable ? '#3b82f6' : (isDust || isEmpty ? '#fbbf24' : '#a855f7'))));
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div onClick={onSelect} whileTap={!isPhantom ? { scale: 0.98 } : { x: [0, -5, 5, -5, 5, 0] }} style={{ background: selected ? 'rgba(0,255,65,0.05)' : '#0a0a0a', borderTop: `1px solid ${mainColor}`, borderRight: `1px solid ${mainColor}`, borderBottom: `1px solid ${mainColor}`, borderLeft: `4px ${isPhantom ? 'dashed' : 'solid'} ${accentColor}`, padding: '12px', marginBottom: '12px', position: 'relative', borderRadius: '4px', cursor: isPhantom ? 'not-allowed' : 'pointer', overflow: 'hidden' }}>
      <AnimatePresence>
        {showError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, backgroundColor: 'rgba(20, 0, 0, 0.9)' }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #ff0055' }}>
            <motion.div animate={{ x: [-2, 2, -2, 0] }} transition={{ duration: 0.2 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff0055' }}><WifiOff size={24} /><h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>LOCK FAILED</h3></motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ position: 'relative', width: '70px', height: '90px', flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', background: '#000', border: '1px solid #333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.image && !imgError ? (
              <img src={data.image} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.6, filter: isPhantom ? 'grayscale(100%)' : 'none' }} />
            ) : (isEmpty ? <Trash2 color="#999" size={30} /> : isScam ? <Skull color="#ff0055" size={30} /> : isTradeable ? <ArrowRightLeft color="#3b82f6" size={30} /> : isDust ? <Coins color="#fbbf24" size={30} /> : <Circle color="#333" size={30} />)}
          </div>
          <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#000', borderRadius: '50%' }}>
            {isPhantom ? <EyeOff size={20} color="#444" /> : selected ? <CheckCircle2 size={20} color="#00ff41" fill="#000" /> : <Circle size={20} color="#333" />}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: selected ? '#00ff41' : (isPhantom ? '#666' : '#fff'), letterSpacing: '0.5px', maxWidth: '180px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{data.name}</h4>
            {isScam && <AlertTriangle size={14} color="#ff0055" />}
            {isTradeable && <ArrowRightLeft size={14} color="#3b82f6" />}
            {(isDust || isEmpty) && <Coins size={14} color="#fbbf24" />}
          </div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
             {isPhantom ? (
               <span style={{ fontSize: '9px', padding: '2px 4px', background: '#111', color: '#666', border: '1px solid #333' }}><WifiOff size={8} /> ERROR</span>
             ) : (
               <span style={{ fontSize: '9px', padding: '2px 4px', background: '#111', color: isScam ? '#ff0055' : (isTradeable ? '#3b82f6' : (isDust || isEmpty ? '#fbbf24' : '#666')), border: `1px solid ${isScam ? '#ff0055' : (isTradeable ? '#1d4ed8' : (isDust || isEmpty ? '#fbbf24' : '#222'))}` }}>
                 {isScam ? 'SCAM - HIGH RISK' : (isEmpty ? 'EMPTY ACCOUNT' : (isTradeable ? `VALUE: $${data.usdValue.toFixed(2)}` : 'DUST'))}
               </span>
             )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
             <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: isPhantom ? '#444' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={10} fill="currentColor" /> {isPhantom ? 'UNKNOWN' : (isEmpty ? '0 BAL' : data.displayVal)}</p>
             <span style={{ fontSize: '8px', padding: '2px 6px', background: selected ? '#00ff41' : '#111', color: selected ? '#000' : '#444', borderRadius: '2px', fontWeight: 'bold' }}>{isPhantom ? 'LOCKED' : (selected ? 'LOCKED ON' : 'ACTIVE')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}