'use client';

import { useState, useEffect, useRef } from 'react';
import { Skull, Ghost, Crosshair, Zap, Menu, Activity, Shield, CheckCircle2, Circle, AlertTriangle, ExternalLink, WifiOff, Coins, Volume2, VolumeX, Vibrate, FileText, X, EyeOff, Trash2, Target, ArrowRightLeft, AlertOctagon, Sun, Moon, Monitor, ChevronRight, Wallet, Radar, Flame, Scan, Terminal, Settings, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createBurnInstruction, createCloseAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { fetchMyBounties } from '@/utils/nftFetcher';
import confetti from 'canvas-confetti';
import '@solana/wallet-adapter-react-ui/styles.css';

// 🛡️ HOT LIST
const FALLBACK_METADATA = {
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { name: 'Jupiter', logoURI: 'https://static.jup.ag/jup/icon.png' },
  'HzwqbKZw8RnJC2DVFrMp21571a81X1e56z6V7V2c62d': { name: 'Bonk', logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I' },
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': { name: 'WEN', logoURI: 'https://shdw-drive.genesysgo.net/6tcnBSybPG7piEDShBcrVtYJDjnJeHG4D398enUDk8Wf/wen_logo.png' },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { name: 'WIF', logoURI: 'https://bafkreiql2yl26a27376k4y322td346433367545636322363226322.ipfs.nftstorage.link/' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { name: 'USDT', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg' },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { name: 'USDC', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
  'So11111111111111111111111111111111111111112': { name: 'Solana', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
};

const SAFE_MINTS = Object.keys(FALLBACK_METADATA);
const JUPITER_API_KEY = 'a338f239-2d73-4caa-a9a5-a691d51a54f2'; 

// 🎨 THEME CONFIGURATION (Dynamic Colors)
const THEMES = {
  dark: {
    bg: '#030303',
    panel: '#0a0a0a',
    border: '#222',
    text: '#e0e0e0',
    textDim: '#666',
    accent: '#00ff41',
    grid: 'rgba(0, 255, 65, 0.03)',
    vignette: 'radial-gradient(circle at center, transparent 0%, #000 90%)',
    modal: '#111'
  },
  light: {
    bg: '#eef2f5',
    panel: '#ffffff',
    border: '#cbd5e1',
    text: '#0f172a',
    textDim: '#64748b',
    accent: '#00ff41', // Keep neon green for brand identity
    grid: 'rgba(0, 0, 0, 0.05)',
    vignette: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.05) 100%)',
    modal: '#fff'
  }
};

// 🎥 ANIMATIONS
const hudVariants = {
  idle: { scale: 1, rotate: 0 },
  scanning: { scale: 1.1, rotate: 360, transition: { duration: 3, repeat: Infinity, ease: "linear" } },
  lock: { scale: 0.9, rotate: 0, transition: { duration: 0.1 } }
};

const radarVariants = {
  ping: { scale: [1, 2], opacity: [0.5, 0], transition: { duration: 1.5, repeat: Infinity } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const scannerVariants = {
  idle: { rotate: 0 },
  scan: { rotate: 360, transition: { duration: 3, repeat: Infinity, ease: "linear" } }
};

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
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState('dark'); 
  const [isJupiterMobile, setIsJupiterMobile] = useState(false);
  
  const [phantomErrorId, setPhantomErrorId] = useState(null);
  const [tokenMap, setTokenMap] = useState(FALLBACK_METADATA); 
  const [priceMap, setPriceMap] = useState({}); 
  
  const [stats, setStats] = useState({ totalBurned: 0, solReclaimed: 0.0 });
  const [currentRank, setCurrentRank] = useState('VOID STALKER');
  const [rankColor, setRankColor] = useState('#00ff41');

  const [modal, setModal] = useState({ 
    isOpen: false, type: 'INFO', title: '', message: '', actionLabel: '', onConfirm: null 
  });

  const theme = THEMES[themeMode];
  const audioRefs = useRef({});

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00ff41', '#fbbf24'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00ff41', '#fbbf24'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  // 🛡️ EFFECT 1: INITIALIZATION
  useEffect(() => {
    setIsMounted(true);
    const savedStats = localStorage.getItem('demon_stats');
    if (savedStats) setStats(JSON.parse(savedStats));

    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent || '';
        if (ua.includes('Jupiter') || window?.solana?.isJupiter) setIsJupiterMobile(true);
    }

    const fetchTokens = async () => {
        let baseMap = { ...FALLBACK_METADATA };
        try {
            const res = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json');
            const data = await res.json();
            const list = data.tokens || data;
            const gitMap = list.reduce((acc, t) => ({ ...acc, [t.address]: t }), {});
            baseMap = { ...baseMap, ...gitMap };
            setTokenMap(baseMap); 
        } catch (e) {}

        try {
            const res = await fetch('https://api.jup.ag/tokens/v2/tag?query=verified', {
                headers: { 'x-api-key': JUPITER_API_KEY }
            });
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.tokens || []);
                const apiMap = list.reduce((acc, t) => ({ ...acc, [t.address]: t }), {});
                setTokenMap(prev => ({ ...prev, ...apiMap }));
            }
        } catch (e) {}
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

  const playSound = (key) => {
    if (!audioEnabled) return;
    const audio = audioRefs.current[key];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  const showModal = (type, title, message, actionLabel = 'OK', onConfirm = null) => {
    if (type !== 'SWAP_PROMPT') playSound('alert');
    setModal({ isOpen: true, type, title, message, actionLabel, onConfirm });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (isMounted && publicKey) {
      setResult(null); setView('SCANNER'); setSelectedIds([]); setLastTx(null);
    }
  }, [publicKey, isMounted]);

  const triggerHaptic = (pattern = 50) => {
    if (hapticsEnabled && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  async function fetchPrices(mints) {
    if (!mints.length) return {};
    try {
      const chunks = [];
      for (let i = 0; i < mints.length; i += 50) chunks.push(mints.slice(i, i + 50));
      let prices = {};
      for (const chunk of chunks) {
        const res = await fetch(`https://api.jup.ag/price/v3?ids=${chunk.join(',')}`, {
            headers: { 'x-api-key': JUPITER_API_KEY }
        });
        if (!res.ok) continue; 
        const data = await res.json();
        if (data) prices = { ...prices, ...data };
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
      const rawTokens = [], mintsToCheck = [];
      const seenMints = new Set(); 

      for (const item of accounts.value) {
        const info = item.account.data.parsed.info;
        const mint = info.mint;
        
        if (seenMints.has(mint)) continue;
        seenMints.add(mint);

        const meta = tokenMap[mint] || {};
        mintsToCheck.push(mint);
        
        rawTokens.push({
          mint, tokenAccount: item.pubkey.toString(),
          name: meta.name || `Token ${mint.slice(0, 4)}...`,
          image: meta.logoURI || null, 
          balance: info.tokenAmount.amount, uiBalance: info.tokenAmount.uiAmount
        });
      }

      const prices = await fetchPrices(mintsToCheck);
      setPriceMap(prices);

      const targets = [...nftAssets, ...rawTokens].map((a, i) => {
        let val = 0;
        if (prices[a.mint]) {
            val = (prices[a.mint].usdPrice || 0) * (a.uiBalance || 0);
        }

        const nameLower = (a.name || '').toLowerCase();
        const isScam = nameLower.includes('visit') || nameLower.includes('.com') || nameLower.includes('reward');
        const isEmpty = parseFloat(a.balance || '0') === 0;
        const isKnownSafe = SAFE_MINTS.includes(a.mint);
        const isHighValue = val > 1.0;
        
        const isRentClaimable = isKnownSafe && isEmpty;
        const isSafe = (isKnownSafe || isHighValue) && !isRentClaimable; 
        
        const isTradeable = val > 0.01 && !isSafe; 
        const isDust = !isScam && !isEmpty && !isSafe && !isTradeable;
        const isPhantom = !a.mint;

        if (isSafe && !isRentClaimable) return null;

        return {
          id: a.mint || `unknown-${i}`,
          tokenAccount: a.tokenAccount || a.pubkey || null, 
          name: a.name || 'UNKNOWN',
          type: isEmpty ? 'EMPTY' : (isScam ? 'SCAM' : (isSafe ? 'SAFE' : 'DUST')),
          image: a.image, displayVal: a.uiBalance !== undefined ? a.uiBalance : (a.val || '0'), 
          usdValue: val, isScam, isDust, isTradeable, isEmpty, isPhantom, isSafe, isRentClaimable
        };
      }).filter(Boolean);

      targets.sort((a, b) => {
          if (a.isRentClaimable && !b.isRentClaimable) return -1;
          if (!a.isRentClaimable && b.isRentClaimable) return 1;
          if (a.isScam && !b.isScam) return -1;
          return 0;
      });
      
      setResult({ targets });
    } catch (error) {
      showModal('DANGER', 'SYSTEM FAILURE', `Error: ${error.message || 'Connection Failed'}`);
      setView('SCANNER');
    }
    setLoading(false);
  }

  const handleSwap = (target) => {
      playSound('success'); 
      window.location.href = `https://jup.ag/swap/${target.id}-SOL`;
  };

  const toggleSelect = (target) => {
    if (target.isPhantom) {
      playSound('error'); triggerHaptic([50, 50, 50]);
      return;
    }
    if (target.isRentClaimable || target.isDust || target.isScam || target.isEmpty) {
        playSound('select'); triggerHaptic(30);
        setSelectedIds(prev => prev.includes(target.id) ? prev.filter(i => i !== target.id) : [...prev, target.id]);
    } else {
        handleSwap(target);
    }
  };

  const handleToggleSelectAll = () => {
    if (!result?.targets) return;
    const burnable = result.targets.map(t => t.id);
    const allSelected = burnable.every(id => selectedIds.includes(id));
    if (allSelected) { setSelectedIds([]); playSound('select'); } 
    else { setSelectedIds(burnable); playSound('select'); triggerHaptic([50, 50]); }
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
                  if (!t.isRentClaimable) {
                      const bal = await connection.getTokenAccountBalance(tokenAcc);
                      if (BigInt(bal.value.amount) > BigInt(0)) {
                          tx.add(createBurnInstruction(tokenAcc, mint, publicKey, BigInt(bal.value.amount)));
                      }
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
      playSound('burn'); 
      triggerConfetti(); 
      setTimeout(() => playSound('success'), 500);

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
    showModal('DANGER', 'CONFIRM PROTOCOL', `Incinerate ${selectedIds.length} targets?`, 'EXECUTE', executeExorcism);
  };

  const handleShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just reclaimed ${stats.solReclaimed.toFixed(3)} SOL using Dust Demons 😈🧹\nhttps://dust-demons.sol`)}`, '_blank');
  };

  if (!isMounted) return <div style={{ background: theme.bg, height: '100dvh', width: '100vw' }} />;

  return (
    <main style={{ 
      height: '100dvh', width: '100vw', 
      backgroundColor: theme.bg, 
      color: theme.text, 
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' 
    }}>
      
      {/* 🚀 DYNAMIC BACKGROUND */}
      <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: theme.vignette, zIndex: 1 }} />

      <div className="scanner-line" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, transparent, #00ff41, transparent)',
          boxShadow: '0 0 15px #00ff41',
          zIndex: 5, animation: 'scan 2.5s linear infinite', pointerEvents: 'none'
      }} />
      <style jsx>{`@keyframes scan { 0% { top: -10%; opacity: 0; } 20% { opacity: 1; } 100% { top: 110%; opacity: 0; } }`}</style>

      {/* 🚀 MODAL OVERLAY */}
      <AnimatePresence>
        {modal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
             <div style={{ background: theme.modal, border: `1px solid ${modal.type === 'DANGER' ? '#ff0055' : '#00ff41'}`, padding: '24px', borderRadius: '8px', maxWidth: '300px', width: '100%', textAlign: 'center', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                <h3 style={{ color: modal.type === 'DANGER' ? '#ff0055' : '#00ff41', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '900' }}>{modal.title}</h3>
                <p style={{ color: theme.textDim, fontSize: '12px', marginBottom: '20px' }}>{modal.message}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                   <button onClick={closeModal} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${theme.border}`, color: theme.textDim, borderRadius: '4px', fontWeight: 'bold' }}>CANCEL</button>
                   {modal.onConfirm && (
                     <button onClick={modal.onConfirm} style={{ padding: '10px 20px', background: modal.type === 'DANGER' ? '#ff0055' : '#00ff41', border: 'none', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>{modal.actionLabel}</button>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ zIndex: 100, padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}`, background: 'rgba(5,5,5,0.2)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <img src="/demon-logo.jpg" style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${theme.border}`, objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
             <div style={{ background: theme.panel, border: `1px solid ${rankColor}`, padding: '4px 10px', borderRadius: '2px' }}>
               <p style={{ margin: 0, fontSize: '8px', color: rankColor, fontWeight: 'bold', letterSpacing: '1px' }}>RANK</p>
               <h2 style={{ margin: 0, fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', color: theme.text }}>{currentRank}</h2>
             </div>
          </div>
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, padding: '4px 10px', borderRadius: '2px' }}>
            <p style={{ margin: 0, fontSize: '8px', color: '#fbbf24', letterSpacing: '1px' }}>LOOT</p>
            <h2 style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: theme.text }}>{stats.solReclaimed.toFixed(3)} SOL</h2>
          </div>
        </div>
        <div style={{ transform: 'scale(0.85)' }}><WalletMultiButton /></div>
      </header>

      {isJupiterMobile && <div style={{ background: '#00ff41', color: '#000', textAlign: 'center', fontSize: '9px', fontWeight: '900', padding: '3px', letterSpacing: '2px', textTransform: 'uppercase' }}>[ JUP_LINK: ACTIVE ]</div>}

      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} 
            style={{ 
              position: 'fixed', inset: 0, zIndex: 9999, 
              backgroundColor: theme.bg, 
              padding: '20px', display: 'flex', flexDirection: 'column' 
            }}
          >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Terminal size={24} color="#00ff41" />
                   <h2 style={{ margin: 0, fontSize: '18px', color: '#00ff41', fontFamily: 'monospace' }}>SYSTEM CONFIG</h2>
                </div>
                <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: theme.text }}><X size={24} /></button>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: theme.panel, padding: '15px', borderRadius: '4px', border: `1px solid ${theme.border}` }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', color: theme.textDim }}>TOTAL BURNED</span>
                        <span style={{ fontSize: '12px', color: theme.text, fontWeight: 'bold' }}>{stats.totalBurned}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: theme.textDim }}>TOTAL RECLAIMED</span>
                        <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold' }}>{stats.solReclaimed.toFixed(4)} SOL</span>
                     </div>
                </div>

                <div style={{ background: theme.panel, padding: '15px', borderRadius: '4px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.text }}>
                            {audioEnabled ? <Volume2 size={16} color="#00ff41" /> : <VolumeX size={16} color={theme.textDim} />} AUDIO
                        </span>
                        <button onClick={() => setAudioEnabled(!audioEnabled)} style={{ background: audioEnabled ? 'rgba(0,255,65,0.2)' : theme.bg, border: `1px solid ${audioEnabled ? '#00ff41' : theme.border}`, color: audioEnabled ? '#00ff41' : theme.textDim, padding: '4px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px' }}>
                            {audioEnabled ? 'ONLINE' : 'MUTED'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.text }}>
                            <Vibrate size={16} color={hapticsEnabled ? "#fbbf24" : theme.textDim} /> HAPTICS
                        </span>
                        <button onClick={() => setHapticsEnabled(!hapticsEnabled)} style={{ background: hapticsEnabled ? 'rgba(251,191,36,0.2)' : theme.bg, border: `1px solid ${hapticsEnabled ? '#fbbf24' : theme.border}`, color: hapticsEnabled ? '#fbbf24' : theme.textDim, padding: '4px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px' }}>
                            {hapticsEnabled ? 'ACTIVE' : 'DISABLED'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.text }}>
                            {themeMode === 'light' ? <Sun size={16} color="#00ff41" /> : <Moon size={16} color="#00ff41" />} THEME
                        </span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => setThemeMode('dark')} style={{ padding: '6px', background: themeMode === 'dark' ? '#00ff41' : theme.bg, color: themeMode === 'dark' ? '#000' : theme.textDim, border: `1px solid ${theme.border}`, borderRadius: '2px' }}><Moon size={14}/></button>
                            <button onClick={() => setThemeMode('light')} style={{ padding: '6px', background: themeMode === 'light' ? '#00ff41' : theme.bg, color: themeMode === 'light' ? '#000' : theme.textDim, border: `1px solid ${theme.border}`, borderRadius: '2px' }}><Sun size={14}/></button>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '5px', padding: '15px', background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#00ff41' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Info size={16} color="#00ff41" />
                        <h4 style={{ margin: 0, fontSize: '14px', color: '#00ff41', fontWeight: '900', letterSpacing: '1px' }}>MISSION BRIEF</h4>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: theme.textDim, lineHeight: '1.8' }}>
                        <li><strong>SCAN:</strong> Identify targets (Dust, Scams, Empty Accounts).</li>
                        <li><strong>ENGAGE:</strong> <span style={{color:'#00ff41'}}>Green</span> = Free Rent. <span style={{color:'#fbbf24'}}>Yellow</span> = Dust.</li>
                        <li><strong>EXECUTE:</strong> Select targets and burn to reclaim SOL.</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.6, marginTop: 'auto', paddingTop: '20px' }}>
                    <img src="https://static.jup.ag/jup/icon.png" width="20" style={{ borderRadius: '50%' }} />
                    <span style={{ fontSize: '10px', color: theme.textDim }}>POWERED BY JUPITER API</span>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingBottom: '100px', zIndex: 10 }}>
        {view === 'SCANNER' && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <motion.button 
                whileHover="scanning"
                whileTap="lock"
                variants={hudVariants}
                onClick={handleScan} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
            >
               <motion.div variants={radarVariants} animate="ping" style={{ position: 'absolute', inset: -25, border: '1px solid #00ff41', borderRadius: '50%', opacity: 0.5 }} />
               <motion.div variants={radarVariants} animate="ping" style={{ position: 'absolute', inset: -50, border: '1px solid #00ff41', borderRadius: '50%', opacity: 0.2, animationDelay: '0.5s' }} />

               <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: '2px solid #00ff41', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.panel, boxShadow: '0 0 40px rgba(0,255,65,0.2)', position: 'relative' }}>
                  <div style={{ position: 'absolute', width: '100%', height: '2px', background: '#00ff41', top: '50%', opacity: 0.3 }} />
                  <div style={{ position: 'absolute', height: '100%', width: '2px', background: '#00ff41', left: '50%', opacity: 0.3 }} />
                  <Crosshair size={70} color="#00ff41" strokeWidth={1} />
                  <p style={{ color: '#00ff41', fontWeight: '900', marginTop: '12px', letterSpacing: '4px', fontSize: '12px' }}>INITIATE</p>
               </div>
            </motion.button>
            {!publicKey && <p style={{ color: theme.textDim, fontSize: '10px', marginTop: '40px', letterSpacing: '2px', fontWeight: 'bold' }}>[ AWAITING UPLINK ]</p>}
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', color: '#00ff41', marginTop: '150px', letterSpacing: '3px', fontWeight: '900', fontSize: '12px', animation: 'pulse 1s infinite' }}>SCANNING SECTOR...</div>}

        {view === 'INVENTORY' && !loading && result && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', padding: '10px', background: theme.panel, border: `1px solid ${selectedIds.length > 0 ? rankColor : theme.border}`, position: 'sticky', top: 0, zIndex: 20, borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: rankColor, fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>TARGETS: {selectedIds.length}</h3>
                  <button onClick={handleToggleSelectAll} style={{ background: theme.bg, border: '1px solid #fbbf24', color: '#fbbf24', padding: '6px 12px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                      {selectedIds.length === result.targets.length ? 'DESELECT ALL' : 'SELECT ALL'}
                  </button>
              </div>
              <button onClick={confirmExorcism} disabled={!selectedIds.length || burningId} style={{ width: '100%', padding: '14px', background: selectedIds.length ? '#ff0055' : theme.bg, color: selectedIds.length ? '#fff' : theme.textDim, border: 'none', borderRadius: '2px', fontWeight: '900', letterSpacing: '2px', transition: 'all 0.2s' }}>
                {burningId ? <Activity className="animate-spin" size={16} /> : `EXECUTE BURN`}
              </button>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', paddingBottom: '40px' }}
            >
              <AnimatePresence>
                {result.targets.map((t, i) => (
                  <motion.div key={t.id} variants={itemVariants} layout>
                    <BountyPoster 
                      data={t} 
                      theme={theme}
                      selected={selectedIds.includes(t.id)} 
                      onSelect={() => toggleSelect(t)} 
                      onSwap={() => handleSwap(t)} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, width: '100%', height: '70px', background: theme.bg, borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, paddingBottom: '10px' }}>
        <button onClick={() => setView('SCANNER')} style={{ background: 'none', border: 'none', color: view === 'SCANNER' ? '#00ff41' : theme.textDim, transition: '0.2s' }}><Crosshair size={28} /></button>
        <button onClick={() => setView('INVENTORY')} style={{ background: 'none', border: 'none', color: view === 'INVENTORY' ? '#ff0055' : theme.textDim, transition: '0.2s' }}><Ghost size={28} /></button>
        <button onClick={() => setShowMenu(true)} style={{ background: 'none', border: 'none', color: theme.textDim, transition: '0.2s' }}><Settings size={28} /></button>
      </nav>

      {shake && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,0,0,0.2)', zIndex: 2000, pointerEvents: 'none' }} />}
      
      <AnimatePresence>
        {lootDrops.map(l => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], y: -100, scale: 1.5 }} className="fixed top-1/2 left-1/2 transform -translate-x-1/2 z-[3000] pointer-events-none">
             <div style={{ color: '#fbbf24', fontWeight: '900', fontSize: '24px', textShadow: '0 0 10px #fbbf24' }}><Zap fill="currentColor" /> {l.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
}

function BountyPoster({ data, selected, onSelect, onSwap, theme }) {
  const { isScam, isRentClaimable, isEmpty, isSafe } = data;
  
  const mainColor = isRentClaimable ? '#00ff41' : (isScam ? '#ff0055' : '#fbbf24');
  const bgStyle = selected ? `rgba(${isRentClaimable ? '0,255,65' : '255,191,36'}, 0.1)` : theme.panel;
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div 
      onClick={isSafe && !isRentClaimable ? onSwap : onSelect}
      whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${mainColor}30` }} 
      whileTap={{ scale: 0.95 }} 
      style={{ 
        background: bgStyle, border: `1px solid ${mainColor}40`, borderRadius: '4px', 
        overflow: 'hidden', cursor: 'pointer', position: 'relative', 
        display: 'flex', flexDirection: 'column', height: '160px',
        boxShadow: `0 4px 10px rgba(0,0,0,0.1)`
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff41', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <Scan size={40} color="#00ff41" strokeWidth={1} />
        </div>
      )}

      {isRentClaimable && !selected && (
         <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff41', opacity: 0.5, animation: 'pulse 2s infinite' }} />
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(180deg, ${mainColor}15 0%, transparent 100%)`, position: 'relative' }}>
         <div style={{ position: 'absolute', top: 6, right: 6 }}>
            {isRentClaimable ? <Wallet size={14} color="#00ff41" /> : (isScam ? <Skull size={14} color="#ff0055" /> : (isSafe ? <Shield size={14} color="#3b82f6" /> : <Target size={14} color="#fbbf24" />))}
         </div>
         
         <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `2px solid ${mainColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', boxShadow: `0 0 15px ${mainColor}20` }}>
            {data.image && !imgError ? (
               <img src={data.image} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} onError={() => setImgError(true)} />
            ) : (
               <Ghost size={24} color={mainColor} />
            )}
         </div>
      </div>

      <div style={{ padding: '10px', borderTop: `1px solid ${mainColor}20`, background: theme.panel }}>
         <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', letterSpacing: '0.5px' }}>
            {data.name}
         </h4>
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ 
               fontSize: '8px', padding: '2px 8px', borderRadius: '2px', 
               background: isRentClaimable ? 'rgba(0,255,65,0.15)' : 'rgba(100,100,100,0.1)', 
               color: mainColor, fontWeight: '900', border: `1px solid ${mainColor}40`, textTransform: 'uppercase'
            }}>
                {isRentClaimable ? 'CLAIM RENT' : (isScam ? 'THREAT' : 'TARGET')}
            </span>
         </div>
         {!isEmpty && !isRentClaimable && <p style={{ margin: '4px 0 0 0', fontSize: '9px', color: theme.textDim, textAlign: 'center', fontFamily: 'monospace' }}>{data.displayVal}</p>}
      </div>
    </motion.div>
  );
}