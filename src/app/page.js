'use client'

import { useState } from 'react';
import { performScan } from './actions'; // REAL SCANNER
import { prepareBatchExorcism } from '@/lib/exorcist'; // REAL BURNER
import { 
  Shield, Skull, Ghost, Crosshair, Flame, Zap, Trophy, Menu, Activity, 
  X, Star, Target, ShoppingCart, Settings, HelpCircle, Award, Lock, 
  Users, Volume2, VolumeX, Bell, BellOff, CheckCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

// Fix Wallet Button Hydration
const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
    { ssr: false }
);

export default function Home() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState('SCANNER');
  const [lootDrops, setLootDrops] = useState([]);
  const [playerRank, setPlayerRank] = useState('ROOKIE');
  
  // MULTI-SELECT STATE
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBurning, setIsBurning] = useState(false);

  // GAME VISUALS
  const [shake, setShake] = useState(false);
  const [killCount, setKillCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0.000);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState('STATS');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // --- SCAN LOGIC ---
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!publicKey) return;
    setLoading(true);
    setResult(null);
    setSelectedIds([]);
    
    await new Promise(r => setTimeout(r, 1200)); // Cinematic Delay

    try {
        const formData = new FormData();
        formData.append('walletAddress', publicKey.toString());
        const response = await performScan(formData);
        
        if (response.success) {
            setResult(response.data);
            const worth = parseFloat(response.data.net_worth.replace('$','').replace(/,/g,''));
            if (worth > 1000) setPlayerRank('WHALE HUNTER');
            else if (worth > 100) setPlayerRank('VOID STALKER');
            else setPlayerRank('DUST RECRUIT');
            setView('INVENTORY');
        } else {
            alert(response.error);
        }
    } catch (error) { console.error(error); }
    setLoading(false);
  }

  // --- MULTI-SELECT TOGGLE ---
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- BATCH BURN LOGIC ---
  async function handleBatchBurn() {
    if (!publicKey || selectedIds.length === 0) return;
    try {
      setIsBurning(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // 1. Gather Targets
      const allDemons = [...result.dust_demons, ...result.nft_demons];
      const targets = allDemons.filter(d => selectedIds.includes(d.id));

      // 2. Execute on Blockchain
      const transaction = await prepareBatchExorcism(publicKey.toString(), targets, connection);
      const signature = await sendTransaction(transaction, connection);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');

      // 3. Rewards
      const reward = 0.002 * targets.length;
      const newLoot = { id: Date.now(), text: `CLUSTER KILL: +${reward.toFixed(3)} SOL` };
      setLootDrops(prev => [...prev, newLoot]);
      setTotalEarned(prev => prev + reward);
      setKillCount(prev => prev + targets.length);
      setCombo(prev => prev + targets.length);
      setTimeout(() => setLootDrops(prev => prev.filter(l => l.id !== newLoot.id)), 3000);

      // 4. Cleanup UI
      setResult(prev => ({
        ...prev,
        dust_demons: prev.dust_demons.filter(d => !selectedIds.includes(d.id)),
        nft_demons: prev.nft_demons.filter(d => !selectedIds.includes(d.id))
      }));
      setSelectedIds([]);

    } catch (error) {
      console.error(error);
      alert("Burn failed. Try selecting fewer items.");
    } finally {
      setIsBurning(false);
    }
  }

  // --- MENU MOCK DATA ---
  const achievements = [
    { id: 1, name: 'First Blood', desc: 'Eliminate 1 demon', unlocked: killCount > 0, icon: Skull },
    { id: 2, name: 'Cluster Bomber', desc: 'Burn 5+ at once', unlocked: killCount >= 5, icon: Zap },
    { id: 3, name: 'Rent Seeker', desc: 'Earn 0.01 SOL', unlocked: totalEarned >= 0.01, icon: Trophy },
  ];
  const shopItems = [{ id: 1, name: 'Auto Scanner', desc: 'Scan automatically', price: '0.1 SOL', icon: Crosshair, locked: true }, { id: 2, name: 'Combo Extender', desc: '+5s timer', price: '0.05 SOL', icon: Zap, locked: true }];

  return (
    <main className={`min-h-screen relative overflow-hidden flex flex-col bg-black font-mono selection:bg-red-500/30 ${shake ? 'animate-shake' : ''}`}>
      
      {/* 3D WARP STYLES */}
      <style jsx global>{`
        @keyframes warp { 0% { transform: perspective(500px) rotateX(60deg) translateY(0); } 100% { transform: perspective(500px) rotateX(60deg) translateY(60px); } }
        @keyframes shake { 0%, 100% { transform: translate(0, 0); } 10%, 90% { transform: translate(-2px, 2px); } 50% { transform: translate(2px, -2px); } }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .warp-grid { position: fixed; top: -50%; left: -50%; width: 200%; height: 200%; background-image: linear-gradient(rgba(0, 255, 65, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.3) 1px, transparent 1px); background-size: 60px 60px; animation: warp 2s linear infinite; opacity: 0.15; z-index: 0; }
        .vignette { position: fixed; inset: 0; background: radial-gradient(circle, transparent 40%, black 120%); z-index: 1; pointer-events: none; }
      `}</style>

      <div className="warp-grid" />
      <div className="vignette" />

      {/* HEADER */}
      <header className="relative z-20 p-4 flex items-center justify-between border-b border-green-500/20 bg-black/60 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-10 h-10 bg-green-900/40 rounded-lg flex items-center justify-center border border-green-500 shadow-[0_0_15px_#22c55e]">
            <Ghost size={20} className="text-green-400" />
          </motion.div>
          <div>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-[0.2em] animate-pulse">DUST DEMON</p>
            <h2 className="text-xs font-black text-white tracking-wider">{playerRank}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block"><p className="text-[8px] text-red-500 uppercase font-bold">KILLS</p><p className="text-xl font-black text-white leading-none">{killCount}</p></div>
            <div className="scale-90"><WalletMultiButton style={{ backgroundColor: '#050505', border: '1px solid #22c55e', height: '36px', fontSize: '12px', textTransform: 'uppercase' }} /></div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 relative z-10 p-4 pb-40 overflow-y-auto">
        
        {/* SCANNER */}
        {view === 'SCANNER' && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            {!publicKey ? (
              <p className="text-green-500 animate-pulse text-center font-bold tracking-widest text-sm bg-green-900/20 px-4 py-2 rounded border border-green-500/50">CONNECT POWER CELL</p>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={loading} className="relative w-72 h-72 group">
                <div className="absolute inset-0 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all duration-500" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-green-500/30 rounded-full" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border border-green-500/50 rounded-full border-t-transparent border-l-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    {loading ? (
                        <><Activity size={64} className="text-red-500 animate-bounce" /><p className="text-red-500 font-black mt-4 tracking-widest animate-pulse">SCANNING...</p></>
                    ) : (
                        <><Crosshair size={64} className="text-green-400 drop-shadow-[0_0_10px_#22c55e]" /><p className="text-white font-black text-xl mt-4 tracking-widest drop-shadow-md">SYSTEM SCAN</p><p className="text-green-600 text-xs tracking-[0.3em] mt-1">TAP TO ENGAGE</p></>
                    )}
                </div>
              </motion.button>
            )}
          </div>
        )}

        {/* INVENTORY GRID (MULTI-SELECT ENABLED) */}
        {view === 'INVENTORY' && result && (
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-green-900/50 pb-2 mb-4">
                <div><p className="text-[10px] text-green-600 uppercase font-bold tracking-wider">NET WORTH</p><p className="text-2xl font-black text-white drop-shadow-md">{result.net_worth}</p></div>
                <div className="text-right"><p className="text-[10px] text-red-600 uppercase font-bold tracking-wider">THREATS</p><p className="text-2xl font-black text-red-500 drop-shadow-md">{result.dust_demons.length + result.nft_demons.length}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-24">
              {[...result.nft_demons, ...result.dust_demons].map((demon) => (
                <EnemyCard 
                    key={demon.id} 
                    data={demon} 
                    type={demon.id.includes('nft') ? 'NFT' : 'DUST'} 
                    isSelected={selectedIds.includes(demon.id)}
                    onToggle={() => toggleSelection(demon.id)}
                />
              ))}
              
              {result.nft_demons.length === 0 && result.dust_demons.length === 0 && (
                <div className="col-span-2 text-center py-20 border-2 border-dashed border-green-900 rounded-2xl bg-green-900/5"><Shield size={48} className="mx-auto text-green-500 mb-4 opacity-50" /><p className="text-green-500 font-bold tracking-widest text-sm">SECTOR CLEAR</p></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NUKE BUTTON */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 left-0 w-full px-6 z-40 flex justify-center">
                <button 
                    onClick={handleBatchBurn} disabled={isBurning}
                    className="w-full max-w-sm bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-lg py-4 rounded-xl shadow-[0_0_40px_rgba(220,38,38,0.6)] border border-red-400 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    {isBurning ? <Activity className="animate-spin" /> : <Flame fill="currentColor" />}
                    {isBurning ? 'INCINERATING...' : `INCINERATE (${selectedIds.length})`}
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-green-900 p-2 z-30 flex justify-around items-center backdrop-blur-xl pb-6">
        <button onClick={() => setView('SCANNER')} className={`flex flex-col items-center p-2 transition-all ${view === 'SCANNER' ? 'text-green-400 scale-110' : 'text-gray-600'}`}><Crosshair size={24} /><span className="text-[9px] uppercase font-bold mt-1">Scanner</span></button>
        <button onClick={() => { if(result) setView('INVENTORY'); }} className={`flex flex-col items-center p-2 transition-all ${view === 'INVENTORY' ? 'text-red-500 scale-110' : 'text-gray-600'}`}><Ghost size={24} /><span className="text-[9px] uppercase font-bold mt-1">Targets</span></button>
        <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center p-2 text-gray-400 hover:text-white transition-all"><Menu size={24} /><span className="text-[9px] uppercase font-bold mt-1">Menu</span></button>
      </nav>

      {/* MENU & LOOT DROPS (Standard) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-green-500/30 z-50 overflow-y-auto">
              <div className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-green-500/30 p-4 flex items-center justify-between"><h2 className="text-green-500 font-black text-xl tracking-wider">COMMAND</h2><button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button></div>
              <div className="flex overflow-x-auto border-b border-gray-800 bg-black/50 p-1">{['STATS', 'SHOP', 'HELP'].map(tab => (<button key={tab} onClick={() => setMenuTab(tab)} className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-all ${menuTab === tab ? 'text-green-500 bg-green-900/20 rounded' : 'text-gray-600'}`}>{tab}</button>))}</div>
              <div className="p-4">
                {menuTab === 'STATS' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3"><div className="bg-gray-900/50 border border-green-500/30 p-4 rounded-xl"><p className="text-[10px] text-gray-500 uppercase font-bold">Confirmed Kills</p><p className="text-3xl font-black text-green-500">{killCount}</p></div><div className="bg-gray-900/50 border border-yellow-500/30 p-4 rounded-xl"><p className="text-[10px] text-gray-500 uppercase font-bold">Bounty Claimed</p><p className="text-3xl font-black text-yellow-500">{totalEarned.toFixed(3)}</p></div></div>
                    <div className="space-y-2 mt-4"><h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Medals</h3>{achievements.map(ach => (<div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 ${ach.unlocked ? 'bg-green-900/10 border-green-500/50' : 'bg-gray-900/20 border-gray-800 opacity-50'}`}><ach.icon size={20} className={ach.unlocked ? 'text-green-500' : 'text-gray-600'} /><div className="flex-1"><h4 className="font-bold text-sm text-white">{ach.name}</h4><p className="text-[10px] text-gray-500">{ach.desc}</p></div></div>))}</div>
                  </div>
                )}
                {menuTab === 'SHOP' && <div className="text-center py-10 opacity-50"><ShoppingCart size={40} className="mx-auto text-yellow-500 mb-2"/><p className="text-yellow-500 font-bold">SHOP OFFLINE</p></div>}
              </div>
            </motion.div>
          </>
        )}
        {lootDrops.map(loot => (
          <motion.div key={loot.id} initial={{ opacity: 0, scale: 0.3, y: 0 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.5, 1.2, 0.8], y: [-50, -150, -200, -250] }} transition={{ duration: 2.5 }} className="fixed top-1/2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="relative text-yellow-400 font-black text-2xl tracking-tighter flex items-center gap-2 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]"><Zap fill="currentColor" className="animate-bounce" /> {loot.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
}

// --- SELECTABLE CARD COMPONENT ---
function EnemyCard({ data, type, isSelected, onToggle }) {
  return (
    <motion.div 
      layout
      onClick={onToggle}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
          opacity: 1, scale: isSelected ? 0.95 : 1,
          borderColor: isSelected ? '#ef4444' : 'rgba(255,255,255,0.1)',
          backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(10,10,10,0.8)'
      }}
      whileTap={{ scale: 0.92 }}
      className={`relative rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-all duration-200 overflow-hidden group ${isSelected ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'hover:border-gray-500'}`}
    >
      <div className={`absolute top-2 right-2 z-20 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-600 bg-black/50'}`}>{isSelected && <CheckCircle size={12} className="text-white" />}</div>
      <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
        {data.image ? <img src={data.image} alt="Target" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-gray-700">{type === 'NFT' ? <Ghost size={32} /> : <Skull size={32} />}</div>}
        {isSelected && <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay animate-pulse" />}
      </div>
      <div>
        <div className="flex justify-between items-center"><h3 className="font-bold text-gray-200 text-xs truncate max-w-[100px]">{data.name || "Unknown"}</h3><span className={`text-[8px] font-bold px-1 rounded ${type === 'NFT' ? 'bg-purple-900/50 text-purple-400' : 'bg-orange-900/50 text-orange-400'}`}>{type}</span></div>
        <p className="text-[9px] text-gray-500 font-mono mt-1">VAL: {data.balance < 0.0001 ? "TRACE" : data.balance.toFixed(4)}</p>
        <p className="text-[9px] text-yellow-600 mt-2 font-bold flex items-center gap-1"><Zap size={10} fill="currentColor" /> BOUNTY: 0.002</p>
      </div>
    </motion.div>
  );
}