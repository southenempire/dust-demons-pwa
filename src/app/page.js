'use client'

import { useState, useEffect } from 'react';
import { performScan } from './actions';
import { Shield, Skull, Ghost, Search, Trash2, Flame, Loader2, Zap, Crosshair, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { prepareExorcism } from '@/lib/exorcist';

import dynamic from 'next/dynamic';
const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
    { ssr: false }
);

export default function Home() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('demons');
  const [burningId, setBurningId] = useState(null);
  const [lootDrops, setLootDrops] = useState([]); // Tracks floating "money" text

  // 1. The Scanner Logic
  async function handleSubmit(e) {
      if (e) e.preventDefault();
      if (!publicKey) return;

      setLoading(true);
      setResult(null);

      // Fake delay for "cool" radar effect
      await new Promise(r => setTimeout(r, 1200));

      const formData = new FormData();
      formData.append('walletAddress', publicKey.toString());

      const response = await performScan(formData);
      if (response.success) {
        setResult(response.data);
      } else {
        alert(response.error);
      }
      setLoading(false);
  }

  // 2. The Exorcism Logic
  async function handleExorcism(demon) {
    if (!publicKey) return;

    try {
      setBurningId(demon.id); 
      
      const transaction = await prepareExorcism(publicKey.toString(), demon, connection);
      const signature = await sendTransaction(transaction, connection);
      
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');

      // --- THE JUICE: SPAWN LOOT DROP ---
      const newLoot = { id: Date.now(), text: "+0.002 SOL" };
      setLootDrops(prev => [...prev, newLoot]);
      
      // Remove loot text after 2 seconds
      setTimeout(() => {
        setLootDrops(prev => prev.filter(l => l.id !== newLoot.id));
      }, 2000);

      // Refresh list
      handleSubmit(null);

    } catch (error) {
      console.error("Exorcism Failed:", error);
      alert("Burn failed. Check console.");
    } finally {
      setBurningId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-green-500 font-mono p-4 pb-24 relative overflow-hidden selection:bg-green-900 selection:text-white">
      
      {/* CYBER GRID BACKGROUND */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] -z-10 opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-900/10 to-black pointer-events-none -z-10" />

      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 mt-4 border-b border-green-900/50 pb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="bg-green-900/20 p-2 rounded-full border border-green-500/30"
          >
            <Crosshair className="w-6 h-6 text-green-500" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white glitch-text">DUST DEMONS</h1>
            <p className="text-[10px] text-green-600 tracking-[0.2em] uppercase">Tactical Wallet Cleaner</p>
          </div>
        </div>
        <div className="text-xs font-mono text-green-800 border border-green-900 px-2 py-1 rounded flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> ONLINE
        </div>
      </header>

      {/* CONNECT / SCANNER */}
      <section className="mb-8 flex flex-col items-center gap-6 relative z-10">
        <div className="bg-black border border-green-900/50 p-2 rounded-xl shadow-[0_0_20px_rgba(0,255,0,0.1)]">
          {/* We style the wallet button with global CSS usually, but this wrapper helps */}
          <WalletMultiButton style={{ backgroundColor: '#050505', border: '1px solid #333' }} />
        </div>
        
        {publicKey && (
           <motion.button 
             whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(220, 38, 38, 0.4)" }}
             whileTap={{ scale: 0.95 }}
             onClick={(e) => handleSubmit(e)}
             disabled={loading}
             className={`
               relative overflow-hidden group
               bg-gradient-to-r from-red-950 to-black 
               border border-red-500/50 hover:border-red-500 
               text-red-100 font-bold py-4 px-12 rounded-lg 
               transition-all flex items-center gap-3 uppercase tracking-wider
               ${loading ? 'opacity-80 cursor-not-allowed' : ''}
             `}
           >
             {loading && <div className="absolute inset-0 bg-red-500/10 animate-pulse" />}
             {loading ? "Scanning Sector..." : "INITIATE SCAN"} 
             {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
           </motion.button>
        )}
      </section>

      {/* RADAR ANIMATION (LOADING) */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center my-12"
          >
             <div className="relative w-48 h-48 border border-green-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,255,0,0.1)]">
                {/* Radar Sweep */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full absolute top-0 left-0 rounded-full"
                  style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(34, 197, 94, 0.3) 360deg)' }}
                />
                <div className="absolute inset-0 border-[40px] border-black rounded-full" />
                <div className="absolute w-2 h-2 bg-red-500 rounded-full top-10 left-12 animate-ping" />
                <div className="absolute w-2 h-2 bg-red-500 rounded-full bottom-14 right-10 animate-ping delay-75" />
             </div>
             <p className="mt-6 text-green-500 text-xs tracking-widest animate-pulse">DETECTING ANOMALIES...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS DASHBOARD */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-md mx-auto"
          >
            {/* STATS HUD */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-green-900/5 border border-green-800/50 p-4 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-20"><Terminal size={12}/></div>
                  <p className="text-[10px] text-green-600 uppercase tracking-widest">Net Worth</p>
                  <p className="text-xl font-black text-white">{result.net_worth}</p>
               </div>
               <div className="bg-red-900/10 border border-red-800/50 p-4 rounded-lg">
                  <p className="text-[10px] text-red-600 uppercase tracking-widest">Threat Level</p>
                  <p className="text-xl font-black text-red-500">
                    {result.dust_demons.length + result.nft_demons.length > 0 ? 'CRITICAL' : 'SAFE'}
                  </p>
               </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-gray-800">
              <button 
                onClick={() => setActiveTab('demons')}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                  activeTab === 'demons' ? 'text-red-500 border-b-2 border-red-500 shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)]' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                HOSTILES [{result.dust_demons.length + result.nft_demons.length}]
              </button>
              <button 
                onClick={() => setActiveTab('safe')}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                  activeTab === 'safe' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                SAFE ASSETS
              </button>
            </div>

            {/* LIST AREA */}
            <div className="space-y-4 pb-20">
              {activeTab === 'demons' ? (
                <>
                  {/* NFT DEMONS */}
                  {result.nft_demons.map((nft) => (
                    <DemonCard 
                      key={nft.id} 
                      data={nft} 
                      type="NFT" 
                      onBurn={() => handleExorcism(nft)} 
                      isBurning={burningId === nft.id} 
                    />
                  ))}
                  {/* DUST DEMONS */}
                  {result.dust_demons.map((dust) => (
                    <DemonCard 
                      key={dust.id} 
                      data={dust} 
                      type="DUST" 
                      onBurn={() => handleExorcism(dust)} 
                      isBurning={burningId === dust.id} 
                    />
                  ))}
                  
                  {result.nft_demons.length === 0 && result.dust_demons.length === 0 && (
                    <div className="text-center py-12 border border-green-900/30 rounded-lg border-dashed">
                      <Shield className="w-12 h-12 text-green-900 mx-auto mb-3" />
                      <p className="text-green-700 text-sm tracking-widest">SECTOR CLEAR. NO HOSTILES.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {result.safe_assets.map((asset) => (
                    <div key={asset.mint} className="bg-green-900/5 border border-green-900/30 p-3 rounded hover:bg-green-900/10 transition-colors">
                      <h3 className="text-white text-xs font-bold">{asset.symbol}</h3>
                      <p className="text-green-500 text-[10px]">{asset.balance.toFixed(2)}</p>
                      <p className="text-gray-500 text-[10px] mt-1">{asset.total_value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOOT DROP POPUPS (The Dopamine Hit) */}
      <AnimatePresence>
        {lootDrops.map(loot => (
          <motion.div
            key={loot.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -100, scale: 1.2 }}
            exit={{ opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 pointer-events-none z-50"
          >
            <div className="text-yellow-400 font-black text-2xl text-shadow-glow flex items-center gap-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              <Zap size={24} fill="currentColor" /> {loot.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

    </main>
  );
}

// --- SUB COMPONENT FOR CARDS ---
function DemonCard({ data, type, onBurn, isBurning }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isBurning ? 0.5 : 1, 
        scale: isBurning ? 0.95 : 1,
        x: isBurning ? [0, -5, 5, -5, 5, 0] : 0 // Shake animation
      }}
      exit={{ opacity: 0, scale: 0, filter: "blur(10px)" }} // Explode fade out
      transition={{ duration: 0.2 }}
      className={`relative group bg-neutral-900/80 border ${type === 'NFT' ? 'border-purple-900/30' : 'border-red-900/30'} p-4 rounded-xl overflow-hidden backdrop-blur-sm`}
    >
        {/* SCAN LINE EFFECT */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${type === 'NFT' ? 'bg-purple-900/10 border-purple-500/20 text-purple-500' : 'bg-red-900/10 border-red-500/20 text-red-500'}`}>
                    {type === 'NFT' ? <Ghost size={20} /> : <Skull size={20} />}
                </div>
                <div>
                    <h3 className="font-bold text-gray-200 text-sm tracking-wide">{data.name || data.symbol}</h3>
                    <p className={`text-[10px] uppercase tracking-wider ${type === 'NFT' ? 'text-purple-400' : 'text-red-400'}`}>
                        {type === 'NFT' ? 'Corrupted Asset' : 'Dust Remnant'}
                    </p>
                </div>
            </div>

            <button 
                onClick={onBurn}
                disabled={isBurning}
                className="bg-neutral-800 hover:bg-red-600 text-neutral-400 hover:text-white p-3 rounded-lg transition-all duration-300 group-hover:scale-110 shadow-lg border border-neutral-700 hover:border-red-500"
            >
                {isBurning ? <Loader2 className="animate-spin" size={18} /> : <Flame size={18} />}
            </button>
        </div>

        {/* REWARD PILL */}
        <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">
                BOUNTY: 0.002 SOL
            </span>
        </div>
    </motion.div>
  )
}