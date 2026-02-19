'use client';

import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { Skull, Ghost, Crosshair, Zap, Activity, Wallet, Terminal, Settings, Volume2, VolumeX, X, Target, ArrowRightLeft, ArrowLeft, Loader2, Moon, Sun, Share2, Users, Trophy, Crown, Smartphone, TrendingUp, TrendingDown, HelpCircle, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createBurnInstruction, createCloseAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import confetti from 'canvas-confetti';
import { playSynthesizedSound } from '@/utils/sound-effects'; // 🔊 Sound Synth
import { fetchJupSOLAPY } from '@/utils/jupsol-apy';
import { getTokenPrices, getSOLPrice } from '@/services/jupiter';
import { verifyJupiterSwap, verifyTokenBurns } from '@/utils/on-chain-verification';
import { sendJupiterNotification, setupDeepLinking, parseDeepLink } from '@/utils/jupiter-mobile';
import { TokenSkeleton, BalanceSkeleton, StatsSkeleton } from '@/components/LoadingSkeleton';
import { trackEvent, AnalyticsEvents, PerformanceMonitor, TransactionMonitor } from '@/utils/analytics';
import { canBurn, canSwap, canScan, canPredict } from '@/utils/rate-limiter';
import OnboardingTour from '@/components/OnboardingTour';

import LoadingSpinner from '@/components/LoadingSpinner';
import AchievementModal from '@/components/AchievementModal';
import AchievementGallery from '@/components/AchievementGallery';
import ReferralPanel from '@/components/ReferralPanel';
import PredictionChart from '@/components/PredictionChart';
import { checkAchievements, getAllAchievements } from '@/lib/nft/achievementTracker';
import { createMerkleTree } from '@/lib/nft/createMerkleTree';
import { mintAchievementNFT } from '@/lib/nft/mintAchievement';
import { detectReferralCode, trackReferralCompletion } from '@/lib/referrals';
import PriceTicker from '@/components/PriceTicker';
import SplashScreen from '@/components/SplashScreen';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { useWalletState } from '@/hooks/useWalletState';
import { useAssets } from '@/hooks/useAssets';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useModal } from '@/hooks/useModal';
import { useAudio } from '@/hooks/useAudio';
import { usePredictions } from '@/hooks/usePredictions';
import { useTheme } from '@/hooks/useTheme';
import { useJupSOL } from '@/hooks/useJupSOL';
import { useTransactions } from '@/hooks/useTransactions';
import { useOGBurner } from '@/hooks/useOGBurner';
import OGBurnerCelebration from '@/components/OGBurnerCelebration';
import OGBurnerBadge from '@/components/OGBurnerBadge';
import '@solana/wallet-adapter-react-ui/styles.css';

// ⚡ RPC CONFIGURATION (DAS API endpoint for asset fetching)
const HELIUS_DAS_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=19b096d1-dce5-49a3-ad44-5e7876db7661';

// 🎯 JUPITER CONFIG
const JUP_SOL_MINT = 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v';

// 🎨 THEME
const THEMES = {
  dark: { bg: '#050505', panel: '#0a0a0a', border: '#222', text: '#e0e0e0', textDim: '#666', accent: '#00ff41', grid: 'rgba(0, 255, 65, 0.03)', vignette: 'radial-gradient(circle at center, transparent 0%, #000 90%)', modal: '#111' },
  light: { bg: '#eef2f5', panel: '#ffffff', border: '#cbd5e1', text: '#0f172a', textDim: '#64748b', accent: '#00ff41', grid: 'rgba(0, 0, 0, 0.05)', vignette: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.05) 100%)', modal: '#fff' },
  jupiter: { bg: '#000000', panel: '#131c21', border: '#1f2937', text: '#ffffff', textDim: '#9ca3af', accent: '#00c2ff', grid: 'rgba(0, 194, 255, 0.05)', vignette: 'radial-gradient(circle at center, transparent 0%, #000 80%)', modal: '#111' }
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
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, scale: 0.9, y: 20 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

// 🛡️ CONFETTI
const triggerConfetti = () => {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00ff41', '#fbbf24', '#00c2ff'] });
};

// 📱 HAPTIC FEEDBACK PATTERNS
const HAPTICS = {
  success: [50, 100, 50],
  error: [100, 50, 100, 50, 100],
  scan: [30, 30, 30],
  levelUp: [100, 50, 100, 50, 200],
  click: [10]
};

const triggerHaptic = (type) => {
  // Jupiter Mobile vibration API
  if (window?.solana?.vibrate) {
    window.solana.vibrate(HAPTICS[type] || HAPTICS.click);
  }
  // Standard vibration API fallback
  else if (navigator.vibrate) {
    navigator.vibrate(HAPTICS[type] || HAPTICS.click);
  }
};

// 📱 MOBILE SHARE UTILITY
const mobileShare = async (text, url) => {
  if (navigator.share) {
    try {
      await navigator.share({ text, url });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }
  // Fallback to Twitter
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${url ? `&url=${encodeURIComponent(url)}` : ''}`, '_blank');
  return false;
};

export default function Home() {
  const { signAllTransactions, wallet, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Custom Hooks
  const { publicKey, connected, walletBalance, setWalletBalance, isJupiterMobile, isMobile } = useWalletState();
  const { assets, loading: assetsLoading, selectedIds, setSelectedIds, fetchAssets, getDustAssets, getBurnableAssets, toggleSelection, clearSelection, selectAllDust } = useAssets();
  const { leaderboardData, userRank, loading: leaderboardLoading, fetchLeaderboard, submitToLeaderboard } = useLeaderboard();
  const { modal, showModal, closeModal } = useModal();
  const { audioEnabled, loadAudio, playSound, toggleAudio, setAudioEnabled } = useAudio();
  const { currentSOLPrice, previousSOLPrice, priceDirection, dailyPrediction, predictionHistory, timeLeft, fetchSOLPrice, makePrediction: makePredictionHook, checkPredictionResult } = usePredictions();
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();

  // Local UI State
  const [mounted, setMounted] = useState(false);
  const [treeAddress, setTreeAddress] = useState(null); // 🌳 Merkle Tree
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState('SCANNER');
  const [burningId, setBurningId] = useState(null);
  const [lootDrops, setLootDrops] = useState([]);
  const [shake, setShake] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [swapTarget, setSwapTarget] = useState(null);
  const [swapOutput, setSwapOutput] = useState('So11111111111111111111111111111111111111112'); // Default SOL

  const scrollRef = useRef(null);
  usePullToRefresh(scrollRef);

  useEffect(() => {
    setMounted(true);
    setTreeAddress(localStorage.getItem('merkle_tree'));
  }, []);

  // Real Data: Session History
  // Settings
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [jupiterInitialized, setJupiterInitialized] = useState(false);

  // 🐞 DEBUG: Force View Reset on Mount
  useEffect(() => {
    console.log('🔄 APP MOUNTED - FORCING VIEW RESET');
    // Only if we suspect stuck state
  }, []);

  // Stats
  const [stats, setStats] = useState({ totalBurned: 0, solReclaimed: 0.0, xp: 0, level: 1, streak: 0, lastLogin: '' });
  const [missions, setMissions] = useState([
    { id: 'login', label: 'Daily Uplink', target: 1, progress: 0, xp: 100, completed: false },
    { id: 'burn', label: 'Incinerate 5 Threats', target: 5, progress: 0, xp: 300, completed: false },
    { id: 'swap', label: 'Yield Farm (Swap to JupSOL)', target: 1, progress: 0, xp: 500, completed: false },
    { id: 'predict', label: '🔮 Market Prophet (Make Daily Prediction)', target: 1, progress: 0, xp: 200, completed: false },
    { id: 'mobile', label: '📱 Mobile Master (Jupiter Mobile Only)', target: 1, progress: 0, xp: 250, completed: false, mobileOnly: true }
  ]);

  const [currentRank, setCurrentRank] = useState('VOID STALKER');
  const [rankColor, setRankColor] = useState('#00ff41');

  // 💰 JUPSOL YIELD (using hook)
  const {
    jupsolBalance,
    jupsolValueUSD,
    jupsolAPY,
    realtimeEarnings,
    estimatedEarnings,
    calculatorAmount,
    setJupsolBalance,
    setJupsolValueUSD,
    setRealtimeEarnings,
    setCalculatorAmount,
    fetchBalance: fetchJupSOLBalance,
    calculateYield
  } = useJupSOL();

  // 🔥 OG BURNER STATE
  const {
    ogStatus,
    stats: ogStats,
    claimOGStatus,
    isOG,
    ogNumber
  } = useOGBurner();

  const [showOGCelebration, setShowOGCelebration] = useState(false);

  // 🏆 ACHIEVEMENT STATE
  const [earnedAchievements, setEarnedAchievements] = useState([]);
  const [achievementToShow, setAchievementToShow] = useState(null);

  // 📊 TRANSACTION STATE (using hook)
  const {
    pendingTx,
    sessionHistory,
    addTransaction,
    setPending,
    clearPending
  } = useTransactions();

  const hasHydrated = useRef(false);

  // 🛡️ LOAD JUPITER PLUGIN
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('jupiter-plugin-script')) {
      const script = document.createElement('script');
      script.id = 'jupiter-plugin-script';
      script.src = "https://plugin.jup.ag/plugin-v1.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // 🛡️ DAILY QUEST & LOGIN LOGIC
  useEffect(() => {
    if (isMounted && publicKey) { // Require wallet connection
      const today = new Date().toDateString();
      if (stats.lastLogin !== today) {
        const newStreak = stats.lastLogin === new Date(Date.now() - 86400000).toDateString() ? stats.streak + 1 : 1;
        const bonus = isJupiterMobile ? 300 : 100; // 3x for mobile!

        setStats(p => ({ ...p, streak: newStreak, lastLogin: today, xp: p.xp + bonus }));
        setMissions(prev => prev.map(m => {
          if (m.id === 'login') return { ...m, progress: 1, completed: true };
          if (m.id === 'mobile' && isJupiterMobile) return { ...m, progress: 1, completed: true };
          return { ...m, progress: 0, completed: false };
        }));

        setTimeout(() => {
          showModal('SUCCESS', 'DAILY REWARD', `Login Streak: ${newStreak} Day(s)\nXP Gained: +${bonus}${isJupiterMobile ? ' (3x Jupiter Mobile Bonus)' : ''}`);
          triggerHaptic('success');
          triggerConfetti();
        }, 1000);
      }
    }
  }, [isMounted, publicKey, isJupiterMobile]);



  // 🐞 DEBUG: Log View Changes
  useEffect(() => {
    console.log('👀 VIEW CHANGED TO:', view);
    console.log('👀 Swap Target:', swapTarget);
  }, [view, swapTarget]);

  // 🛡️ INIT JUPITER PLUGIN
  useEffect(() => {
    if (view === 'SWAP_STATION' && swapTarget && typeof window !== 'undefined') {
      let intervalId;
      const initJupiter = () => {
        if (window.Jupiter) {
          clearInterval(intervalId);
          try {
            if (jupiterInitialized) {
              window.Jupiter.close();
            }
            window.Jupiter.init({
              displayMode: 'integrated',
              integratedTargetId: 'integrated-terminal',
              enableWalletPassthrough: true,
              formProps: {
                initialInputMint: swapTarget.id,
                initialOutputMint: JUP_SOL_MINT,
              },
              containerStyles: { minHeight: '500px', height: '100%', width: '100%' },
              onRequestConnectWallet: () => {
                // Trigger our hidden button
                document.getElementById('hidden-wallet-trigger')?.querySelector('button')?.click();
              },
              onSuccess: ({ txid }) => {
                playSound('success');
                triggerHaptic('success');
                triggerConfetti();
                updateMission('swap', 1);
                sendJupiterNotification('🪐 Swap Complete!', 'Successfully converted dust → JupSOL');
                addTransaction({
                  action: `Swapped ${swapTarget.name}`,
                  value: '+500 XP',
                  time: new Date().toLocaleTimeString()
                });
                setTimeout(() => {
                  showModal('SUCCESS', 'YIELD SECURED', 'Target converted to JupSOL. Earning APY now.', () => {
                    handleShare('swap');
                    closeModal();
                  }, 'SHARE ON X');
                }, 1500);
              },
            });
            setJupiterInitialized(true);
          } catch (e) { console.error("Jupiter Init Error:", e); }
        }
      };
      intervalId = setInterval(initJupiter, 100);
      setTimeout(() => clearInterval(intervalId), 10000);
    }
    return () => {
      if (view !== 'SWAP_STATION' && jupiterInitialized && window.Jupiter) {
        try { window.Jupiter.close(); setJupiterInitialized(false); } catch (e) { }
      }
    };
  }, [view, swapTarget]);

  // 🎁 DETECT REFERRAL CODE FROM URL
  useEffect(() => {
    detectReferralCode();
  }, []);

  // 🛡️ SYNC WALLET
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Jupiter && jupiterInitialized) {
      window.Jupiter.syncProps({ passthroughWalletContextState: { publicKey, connected, wallet, signTransaction, signAllTransactions } });
    }
  }, [publicKey, connected, wallet, signTransaction, signAllTransactions, jupiterInitialized]);

  // 🛡️ APP INIT
  useEffect(() => {
    setIsMounted(true);
    const savedStats = localStorage.getItem('demon_stats');
    if (savedStats) setStats(JSON.parse(savedStats));
    setTimeout(() => { hasHydrated.current = true; }, 500);

    // Load audio files
    const sfx = {
      scan: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      burn: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      select: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3',
      error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      alert: 'https://assets.mixkit.co/active_storage/sfx/2865/2865-preview.mp3'
    };
    Object.entries(sfx).forEach(([k, v]) => loadAudio(k, v));

    // Setup deep linking for Jupiter Mobile
    setupDeepLinking((url) => {
      const { section, action } = parseDeepLink(url);
      trackEvent(AnalyticsEvents.DEEP_LINK_OPENED, { url, section, action });

      if (section === 'mission') {
        if (action === 'burn') setView('INVENTORY');
        else if (action === 'swap') setView('SWAP_STATION');
        else if (action === 'predict') setView('PROPHECY');
        else if (action === 'yield') setView('YIELD');
      } else if (section === 'view') {
        setView(action.toUpperCase());
      }
    });

    // First-time user onboarding tour
    const tourCompleted = localStorage.getItem('dust_demons_tour_completed');
    if (!tourCompleted) {
      setTimeout(() => setShowTour(true), 1500);
    }
  }, []);

  useEffect(() => {
    const levels = ['VOID STALKER', 'DUST HUNTER', 'ENTROPY KILLER', 'SOLANA REAPER', 'JUPITER VANGUARD', 'MOBILE LEGEND', 'GOD OF VOID'];
    const colors = ['#00ff41', '#00ff41', '#00ff41', '#00ff41', '#00c2ff', '#ff6b35', '#fbbf24'];

    // Mobile-exclusive rank at high XP
    let rankIndex = Math.min(Math.floor(stats.xp / 500), levels.length - 1);
    if (isJupiterMobile && stats.xp >= 2500 && stats.xp < 3000) rankIndex = 5; // MOBILE LEGEND

    const newRank = levels[rankIndex];
    const newColor = colors[rankIndex];

    if (newRank !== currentRank) {
      setCurrentRank(newRank);
      setRankColor(newColor);
      trackEvent(AnalyticsEvents.RANK_UP, { rank: newRank, xp: stats.xp });
      if (hasHydrated.current) { triggerHaptic('levelUp'); triggerConfetti(); if (audioEnabled) playSound('success'); }
    }
    if (isMounted) localStorage.setItem('demon_stats', JSON.stringify(stats));
  }, [stats.xp, audioEnabled, isMounted]);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey)
        .then(bal => setWalletBalance(bal / LAMPORTS_PER_SOL))
        .catch(e => console.warn("Balance check failed:", e));

      // 📊 Auto-submit to leaderboard on wallet connection
      setTimeout(() => submitToLeaderboard(), 1500);
    }
  }, [publicKey]);

  // 💰 FETCH JUPSOL BALANCE
  useEffect(() => {
    if (publicKey && connection && currentSOLPrice > 0) {
      fetchJupSOLBalance();
    }
  }, [publicKey, connection, currentSOLPrice]);

  // 🎲 FETCH SOL PRICE ON MOUNT
  useEffect(() => {
    if (isMounted) {
      fetchSOLPrice();
      const interval = setInterval(fetchSOLPrice, 60000);
      return () => clearInterval(interval);
    }
  }, [isMounted, fetchSOLPrice]);

  // 🏆 FETCH LEADERBOARD ON MOUNT
  useEffect(() => {
    if (isMounted && publicKey) {
      fetchLeaderboard(publicKey);
    }
  }, [isMounted, publicKey, fetchLeaderboard]);

  // ⚡ LIVE EARNINGS COUNTER (ticks every second)
  useEffect(() => {
    if (jupsolBalance === 0) {
      setRealtimeEarnings(0);
      return;
    }

    const perSecond = (jupsolBalance * jupsolAPY / 100) / (365 * 24 * 60 * 60);

    const interval = setInterval(() => {
      setRealtimeEarnings(prev => prev + perSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [jupsolBalance, jupsolAPY]);

  // Enhanced haptic feedback with patterns
  const triggerHaptic = (type = 'light') => {
    if (!hapticsEnabled || !window.navigator?.vibrate) return;

    const patterns = {
      light: 50,           // Button press
      medium: 100,         // Successful scan
      strong: [100, 50, 100],  // Burn complete
      success: [50, 30, 50, 30, 50],  // Achievement
      error: [200, 100, 200]   // Error state
    };

    window.navigator.vibrate(patterns[type] || patterns.light);
  };

  // 🎉 Confetti celebration
  const triggerConfetti = (type = 'default') => {
    const colors = [theme.accent, '#FFD700', '#FFA500'];

    if (type === 'burn') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      });
    } else if (type === 'achievement') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: colors,
        ticks: 200
      });
    } else {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: colors
      });
    }
  };

  // 📳 Screen shake effect
  const triggerScreenShake = () => {
    const app = document.querySelector('main');
    if (!app) return;

    app.style.animation = 'shake 0.5s';
    setTimeout(() => {
      app.style.animation = '';
    }, 500);
  };

  // 🔢 Animate number count-up
  const animateNumber = (start, end, duration, callback) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(start + (end - start) * easeOutQuad);
      callback(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  };

  // 🛡️ Security: Validate PublicKey
  const validatePublicKey = (address) => {
    try {
      const pubkey = new PublicKey(address);
      return PublicKey.isOnCurve(pubkey.toBytes());
    } catch {
      return false;
    }
  };

  // 🛡️ Security: Validate and parse localStorage
  const safeGetLocalStorage = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Failed to parse localStorage key "${key}":`, error);
      localStorage.removeItem(key);
      return defaultValue;
    }
  };

  const handleShare = async (action = 'general', data = null) => {
    let text = "I'm cleaning up my Solana wallet with Dust Demons! 🧹💀";
    if (action === 'burn') text = `I just incinerated ${stats.totalBurned} dust tokens and reclaimed ${(stats.solReclaimed || 0).toFixed(3)} SOL on Dust Demons! 🔥`;
    if (action === 'swap') text = `I just turned my dust into Yield-Bearing JupSOL on Dust Demons! 🪐`;
    if (action === 'prediction' && data) {
      const result = data.result === 'correct' ? '🎯 CORRECT' : '❌ MISSED';
      text = `${result}! I predicted SOL will go ${data.prediction.toUpperCase()} on Dust Demons! 🔮\n\nCurrent Rank: ${currentRank}\nTotal XP: ${stats.xp}`;
    }
    if (action === 'rank') text = `I just reached ${currentRank} rank on Dust Demons! 💀\n\nTotal XP: ${stats.xp}\nSOL Reclaimed: ${(stats.solReclaimed || 0).toFixed(3)}`;

    const refLink = publicKey ? `https://dust-demons.vercel.app/?ref=${publicKey.toString()}` : 'https://dust-demons.vercel.app/';
    const tweetText = encodeURIComponent(text);
    const tweetUrl = encodeURIComponent(refLink);
    const hashtags = 'JupiterMobile,Solana,JupSOL,DustDemons';
    const webUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}&hashtags=${hashtags}`;

    // 1. Try Native Web Share API (Mobile)
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'Dust Demons',
          text: text,
          url: refLink
        });
        return;
      } catch (err) {
        console.warn('Share cancelled or failed:', err);
        // If user cancelled, we might not want to fallback. 
        // But if it failed for other reasons, we might.
        // Usually cancellation throws error. 
        if (err.name !== 'AbortError') {
          window.open(webUrl, '_blank');
        }
      }
    } else {
      // 2. Fallback to Twitter Web Intent (Universal Link)
      window.open(webUrl, '_blank');
    }
  };

  // 🎯 TOUR HANDLERS
  const handleTourNext = () => {
    if (tourStep < 3) {
      setTourStep(tourStep + 1);
    } else {
      setShowTour(false);
      localStorage.setItem('dust_demons_tour_completed', 'true');
      trackEvent(AnalyticsEvents.TOUR_COMPLETED);
    }
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('dust_demons_tour_completed', 'true');
    trackEvent(AnalyticsEvents.TOUR_SKIPPED);
  };

  const updateMission = (id, amount) => {
    // Only award XP and complete missions if wallet is connected
    if (!publicKey) return;

    setMissions(prev => prev.map(m => {
      if (m.id === id && !m.completed) {
        const newProgress = m.progress + amount;
        if (newProgress >= m.target) {
          setStats(s => ({ ...s, xp: s.xp + m.xp }));
          setLootDrops(l => [...l, { id: Date.now(), text: `QUEST COMPLETE: +${m.xp} XP` }]);
          trackEvent(AnalyticsEvents.MISSION_COMPLETED, { mission: id, xp: m.xp });
          return { ...m, progress: m.target, completed: true };
        }
        return { ...m, progress: newProgress };
      }
      return m;
    }));
  };

  // 🔗 ON-CHAIN VERIFICATION
  const verifyMissionsOnChain = async () => {
    if (!publicKey || !connection) {
      showModal('ERROR', 'Wallet Not Connected', 'Please connect your wallet to verify missions.');
      return;
    }

    setPending({ type: 'verification', message: 'Verifying on-chain activity...' });

    // Ensure overlay stays visible for at least 2 seconds (UX)
    const minTimePromise = new Promise(r => setTimeout(r, 2000));

    try {
      // Verify Jupiter swaps and burns in parallel with min time
      const [swapResult, burnResult] = await Promise.all([
        verifyJupiterSwap(connection, publicKey, 50),
        verifyTokenBurns(connection, publicKey, 50),
        minTimePromise
      ]);
      if (swapResult.verified) {
        setMissions(prev => prev.map(m =>
          m.id === 'swap' ? { ...m, progress: m.target, completed: true } : m
        ));
        if (!missions.find(m => m.id === 'swap')?.completed) {
          setStats(s => ({ ...s, xp: s.xp + 500 }));
          trackEvent(AnalyticsEvents.SWAP_COMPLETED, { verified: true });
        }
      }

      // Verify token burns (result from parallel execution)
      if (burnResult.verified && burnResult.count > 0) {
        const burnMission = missions.find(m => m.id === 'burn');
        if (burnMission && !burnMission.completed) {
          const progress = Math.min(burnResult.count, burnMission.target);
          setMissions(prev => prev.map(m =>
            m.id === 'burn' ? { ...m, progress, completed: progress >= m.target } : m
          ));
          if (progress >= burnMission.target) {
            setStats(s => ({ ...s, xp: s.xp + 300 }));
            trackEvent(AnalyticsEvents.BURN_COMPLETED, { verified: true, count: burnResult.count });
          }
        }
      }

      setPending(null);
      showModal('SUCCESS', 'Verification Complete', `Verified:\n${swapResult.verified ? '✅ Jupiter Swaps' : '❌ No Swaps'}\n${burnResult.verified ? `✅ ${burnResult.count} Burns` : '❌ No Burns'}`);
    } catch (error) {
      console.error('Verification error:', error);
      setPending(null);
      showModal('ERROR', 'Verification Failed', 'Could not verify on-chain activity. Please try again.');
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, { type: 'verification', error: error.message });
    }
  };

  // 🛡️ SCAN LOGIC (PRECISION FILTERING)
  async function handleScan() {
    // Require wallet connection
    if (!publicKey) {
      showModal('INFO', '🔗 WALLET REQUIRED',
        [
          'Click wallet button (top right)',
          'Select your Solana wallet',
          'Approve the connection',
          'Start scanning for dust!',
          '💡 Jupiter Mobile gets 3x XP!'
        ],
        () => { closeModal(); setShowMenu(true); },
        'VIEW GUIDE'
      );
      return;
    }

    setLoading(true); setView('INVENTORY'); triggerHaptic(100); playSound('scan');

    try {
      const assets = await fetchAssets(publicKey);

      const targets = assets.map((item, i) => {
        // 🛑 FILTER: HIDE COMPRESSED NFTS (Check if preserved or already filtered)
        // Note: useAssets might not preserve compression info, but for now we assume standard SPL tokens are fine.

        const isFungible = true; // formatted assets are simplified
        const uiBalance = item.balance || 0;
        const value = item.valueUSD || 0;

        const nameLower = (item.name || 'Unknown').toLowerCase();
        const isScam = nameLower.includes('visit') || nameLower.includes('.com') || nameLower.includes('reward');
        const isEmpty = uiBalance === 0;

        // 🛑 MARK SCAM / SPAM
        if (isScam) return { ...item, isScam: true };

        // 🚀 LOGIC: 
        // 1. Swap = Value > $1.00 (Show Blue - No upper limit!)
        // 2. Dust = Value < $1.00 (Show Yellow) - BURN IT!
        // 3. Rent = Balance 0 (Show Green) - CLAIM IT!

        const isTradeable = value >= 1.00; // Anything worth > $1.00 is tradeable
        const isRentClaimable = isEmpty; // Balance is 0, so we can close strict
        const isDust = !isRentClaimable && value < 1.00 && !isScam && !isTradeable;

        return {
          id: item.id,
          name: item.name,
          image: item.image,
          uiBalance: item.isNFT ? 1 : uiBalance,
          value: value,
          isNFT: item.isNFT,
          isScam: isScam,
          isDust: isDust,
          isTradeable: isTradeable,
          isRentClaimable: isRentClaimable,
          isEmpty: isEmpty, // ⚡ ADDED FOR FILTERING
          isFrozen: item.isFrozen || false,
          decimals: item.decimals, // Important for burn calc
          rawBalance: item.rawBalance // ⚡ PRECISE BURN AMOUNT
        };
      }).filter(Boolean);

      targets.sort((a, b) => a.value - b.value);

      setResult({ targets });
    } catch (error) {
      showModal('DANGER', 'SYSTEM FAILURE', error.message);
      setView('SCANNER');
    }
    setLoading(false);
  }

  const handleSwap = (target) => {
    setSwapTarget(target);
    setView('SWAP_STATION');
    playSound('success');
  };

  const toggleSelect = (target) => {
    if (target.isTradeable) { handleSwap(target); }
    else {
      toggleSelection(target.id);
    }
  };

  const handleToggleSelectAll = () => {
    if (!result?.targets) return;
    const burnable = result.targets.filter(t => !t.isTradeable).map(t => t.id); // Select only burnable
    const allSelected = burnable.every(id => selectedIds.includes(id));
    if (allSelected) clearSelection();
    else setSelectedIds(burnable);
  };

  async function executeExorcism() {
    closeModal(); setBurningId('MASS_BURN'); triggerHaptic([50, 50, 50]);
    let failedIds = [];
    try {
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      const txs = []; let burned = 0;
      let errorLog = [];

      for (let i = 0; i < selectedIds.length; i += 5) {
        const chunk = selectedIds.slice(i, i + 5);
        const tx = new Transaction();
        tx.feePayer = publicKey; tx.recentBlockhash = blockhash;

        // Valid instruction added flag
        let addedConfig = false;

        for (const id of chunk) {
          const t = result.targets.find(x => x.id === id);
          if (!t) continue;

          // Check Frozen
          if (t.isFrozen) {
            errorLog.push(`${t.name}: Token is Frozen`);
            failedIds.push(id);
            continue;
          }

          // 🛡️ Security: Validate PublicKey
          // For standard assets, t.id is MINT. For Empty Accounts, t.id is ACCOUNT.
          // We need to be careful here.
          let mintStr = t.id;
          if (t.isEmptyTokenAccount && t.mint) {
            mintStr = t.mint;
          }

          if (!validatePublicKey(mintStr)) {
            errorLog.push(`${t.name}: Invalid Address`);
            failedIds.push(id);
            continue;
          }

          try {
            const mint = new PublicKey(mintStr);
            let tokenAcc;

            if (t.isEmptyTokenAccount) {
              // For empty accounts, t.id IS the token account address
              tokenAcc = new PublicKey(t.id);
            } else {
              // For standard assets, t.id is the MINT, we derive the ATA
              tokenAcc = await getAssociatedTokenAddress(mint, publicKey);
            }

            // ⚡ Determine correct Token Program (default to Standard)
            const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
            const tokenProgramId = t.programId ? new PublicKey(t.programId) : new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

            // Override for Empty Accounts (Legacy usually standard, but check)
            // Empty accounts from RPC don't have programId stored, but usually are standard.
            // If we want to be safe we'd need to check owner, but standard is safe default for legacy empty.

            if (!t.isNFT && t.uiBalance > 0) {
              // ⚡ USE RAW BALANCE - NO MATH.POW ROUNDING ERRORS
              tx.add(createBurnInstruction(tokenAcc, mint, publicKey, BigInt(t.rawBalance), [], tokenProgramId));
            }

            // Close the account to reclaim rent
            tx.add(createCloseAccountInstruction(tokenAcc, publicKey, publicKey, [], tokenProgramId));

            burned++;
            addedConfig = true;
          } catch (e) {
            console.error(e);
            errorLog.push(`${t.name}: Build Error ${e.message}`);
            failedIds.push(id);
          }
        }

        // 🛡️ Security: Simulate transaction before adding to batch
        if (addedConfig && tx.instructions.length > 0) {
          try {
            const simulation = await connection.simulateTransaction(tx);
            if (simulation.value.err) {
              const simErrStr = JSON.stringify(simulation.value.err);
              if (!simErrStr.includes('AccountNotFound')) {
                console.error('Sim Error:', simulation.value.err);
                console.error('Sim Logs:', simulation.value.logs); // Add logs
                errorLog.push(`Sim Failed: ${simErrStr}`);
              } else {
                // Ghost asset detected (AccountNotFound)
                // We don't add to errorLog, so it doesn't trigger "BURN FAILED"
              }
              // If batch fails, assume all in chunk failed/processed
              failedIds.push(...chunk);
              continue;
            }
            txs.push(tx);
          } catch (simError) {
            errorLog.push(`Sim Error: ${simError.message}`);
            failedIds.push(...chunk);
          }
        }
      }

      // Update UI to remove failed items
      if (failedIds.length > 0) {
        setResult(prev => ({
          ...prev,
          targets: prev.targets.filter(t => !failedIds.includes(t.id))
        }));
        setSelectedIds(prev => prev.filter(id => !failedIds.includes(id)));
      }

      if (!txs.length) {
        if (failedIds.length > 0 && errorLog.length === 0) {
          showModal('SUCCESS', 'CLEANUP COMPLETE', 'Removed ghost assets (already closed).');
        } else {
          showModal('DANGER', 'BURN FAILED',
            errorLog.length > 0 ? errorLog.join('\n') : 'No valid targets found.');
        }
        setBurningId(null);
        return;
      }
      const signed = await signAllTransactions(txs);
      setLoading(true);

      let lastSig = '';
      for (const tx of signed) {
        const sig = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(sig, 'confirmed');
        lastSig = sig;
      }

      setShake(true); triggerHaptic([100, 50, 100]);
      playSound('burn'); triggerConfetti();
      updateMission('burn', burned);

      const rent = (burned * 0.002).toFixed(3);
      sendJupiterNotification('🔥 Burn Complete!', `+${rent} SOL reclaimed`);
      setStats(p => ({ ...p, totalBurned: p.totalBurned + burned, solReclaimed: p.solReclaimed + parseFloat(rent), xp: p.xp + (burned * 10) }));
      setLootDrops(p => [...p, { id: Date.now(), text: `+${rent} SOL` }]);
      setResult(p => ({ ...p, targets: p.targets.filter(t => !selectedIds.includes(t.id)) }));
      setSelectedIds([]);

      // Submit to leaderboard
      setTimeout(submitToLeaderboard, 500);

      // Update Session Log
      // Update Session Log
      addTransaction({
        action: `Incinerated ${burned} Assets`,
        value: `+${rent} SOL`,
        time: new Date().toLocaleTimeString()
      });

      // 🎉 GAME FEEL: Confetti + Shake + Haptic
      triggerConfetti('burn');
      triggerScreenShake();
      triggerHaptic('strong');

      // 🔥 OG BURNER: Claim status after burn
      try {
        const ogResult = await claimOGStatus(lastSig);
        if (ogResult.eligible && !ogResult.alreadyClaimed) {
          // New OG Burner! Show celebration
          setTimeout(() => setShowOGCelebration(true), 1000);
          trackEvent(AnalyticsEvents.OG_BURNER_CLAIMED, {
            ogNumber: ogResult.ogNumber,
            burnCount: burned
          });
        }
      } catch (ogError) {

        // Non-critical, don't show error to user
      }

      // 🎁 Track referral completion (first burn)
      const isFirstBurn = stats.totalBurned === 0;
      if (isFirstBurn && wallet?.publicKey) {
        setTimeout(async () => {
          try {
            const referralResult = await trackReferralCompletion(wallet.publicKey.toString());
            if (referralResult?.success) {
              setTimeout(() => {
                showModal('SUCCESS', '🎁 REFERRAL BONUS!', `Welcome! You earned +${referralResult.refereeBonus} XP\\n\\nYour referrer earned +${referralResult.referrerXP} XP${referralResult.bonusXP > 0 ? `\\n\\n🎉 Milestone bonus: +${referralResult.bonusXP} XP!` : ''}`);
                triggerConfetti('success');
              }, 3000);
            }
          } catch (error) {
            console.error('Referral tracking error:', error);
          }
        }, 1000);
      }

      setTimeout(() => {
        const txLink = lastSig ? `\nTX: ${lastSig.slice(0, 8)}...` : '';
        showModal('SUCCESS', 'EXORCISM COMPLETE', `You recovered ${rent} SOL.${txLink}\nShare to recruit more Hunters?`, () => {
          handleShare('burn');
          closeModal();
        }, 'SHARE ON X');
      }, 2000);

    } catch (err) { showModal('DANGER', 'FAILED', err.message); }
    finally { setBurningId(null); setLoading(false); setTimeout(() => setShake(false), 500); setTimeout(() => setLootDrops(p => p.filter(l => l.id !== Date.now())), 3000); }
  }

  const confirmExorcism = () => {
    if (selectedIds.length && publicKey) {
      showModal('DANGER', 'CONFIRM PROTOCOL', `Incinerate ${selectedIds.length} targets?`, executeExorcism, 'EXECUTE');
    }
  };

  // 🖼️ NFT HANDLERS
  const handleInitNFT = async () => {
    alert('Debug: Init Clicked'); // DEBUG
    if (!connected || !publicKey) return alert('Connect wallet first!');
    if (!confirm('This will create a Merkle Tree for Compressed NFTs (~0.02 SOL cost). Proceed?')) return;

    try {

      // Construct wallet object expected by helper
      const walletObj = { publicKey, signTransaction, signAllTransactions };

      const { tx, treeAddress } = await createMerkleTree(connection, walletObj);

      // Send transaction (use wallet adapter hook)
      // Note: sendTransaction hook signs with wallet and sends. 
      // It should respect the partial signature on the transaction if we pass it correctly?
      // Actually, wallet-adapter's sendTransaction might overwrite signatures if not careful.
      // Better to use signTransaction and then connection.sendRawTransaction if we have partials.
      // But let's try standard sendTransaction first.
      // Actually, createMerkleTree returns a Transaction with `partialSign`.
      // We should use `sendTransaction`.
      const sig = await sendTransaction(tx, connection);

      await connection.confirmTransaction(sig, 'confirmed');

      localStorage.setItem('merkle_tree', treeAddress);
      setTreeAddress(treeAddress); // Update UI
      triggerConfetti();
      playSynthesizedSound('success');
      alert(`NFT System Initialized! 🌳\nTree Address: ${treeAddress}`);

    } catch (err) {
      console.error("Tree Init Error:", err);
      playSynthesizedSound('error');
      alert('Failed to initialize: ' + err.message);
    }
  };

  const handleMintNFT = async (achievement) => {
    if (!connected) return alert('Connect wallet first!');

    try {
      // Check if Tree exists
      const savedTree = localStorage.getItem('merkle_tree') || process.env.NEXT_PUBLIC_MERKLE_TREE;
      if (!savedTree) return alert('NFT System not initialized! Go to Settings > Initialize NFT System.');

      // Minting achievement...

      // Construct wallet object
      const walletObj = { publicKey, signTransaction, signAllTransactions };

      const sig = await mintAchievementNFT(connection, walletObj, achievement);

      triggerConfetti();
      playSynthesizedSound('success');

      // Award XP for Minting
      setStats(prev => ({ ...prev, xp: prev.xp + 500 }));
      alert(`Minted ${achievement.name}! 🎨\n+500 XP Awarded!`);

    } catch (err) {
      console.error("Mint Error:", err);
      playSynthesizedSound('error');
      alert('Mint Failed: ' + err.message);
    }
  };

  // 🔥 HANDLE OG MINTING (Special Case)
  const handleMintOG = async () => {
    if (!isOG || !ogNumber) return;
    if (ogStatus?.nftMinted) return alert('Already claimed!');

    setLoading(true); // Re-use main loading or local state
    try {
      // Construct specific OG Achievement
      const ogAchievement = {
        id: 'og_burner',
        name: `OG Burner #${ogNumber}`,
        description: `One of the first 100 hunters to burn dust on Dust Demons.`
      };

      // 1. SKIP ON-CHAIN MINTING (Whitelist Mode)
      // const walletObj = { publicKey, signTransaction, signAllTransactions };
      // const sig = await mintAchievementNFT(connection, walletObj, ogAchievement);

      // 2. Update DB to mark as minted (Shadow Claim)
      await fetch('/api/og-burner/update-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toString() })
      });

      // 3. Update Local State
      triggerConfetti();
      playSynthesizedSound('success');

      alert(`OG Burner #${ogNumber} Badge Claimed! 🔥\nVerified internally as a Whitelisted OG.`);
      setShowOGCelebration(false);

      // Force refresh or update local state so UI updates
      window.location.reload();

    } catch (err) {
      console.error("OG Claim Error:", err);
      playSynthesizedSound('error');
      alert('Claim Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return <div style={{ background: theme.bg, height: '100dvh', width: '100vw' }} />;



  return (
    <WalletModalProvider>
      <SplashScreen />

      {/* Hidden Wallet Trigger for Jupiter */}
      <div id="hidden-wallet-trigger" style={{ display: 'none' }}>
        <WalletMultiButton />
      </div>

      <main style={{ height: '100dvh', width: '100vw', backgroundColor: theme.bg, color: theme.text, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
        <div style={{ position: 'absolute', inset: 0, background: theme.vignette, zIndex: 1 }} />
        <div className="scanner-line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`, boxShadow: `0 0 15px ${theme.accent}`, zIndex: 5, animation: 'scan 2.5s linear infinite', pointerEvents: 'none' }} />
        <style jsx>{`
        @keyframes scan { 
          0% { top: -10%; opacity: 0; } 
          20% { opacity: 1; } 
          100% { top: 110%; opacity: 0; } 
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
        <style jsx global>{`
        .wallet-adapter-button { 
          height: 40px !important; 
          padding: 0 16px !important; 
          font-size: 13px !important; 
          font-weight: 700 !important;
          white-space: nowrap !important; 
          overflow: hidden !important; 
          text-overflow: ellipsis !important; 
          max-width: 160px !important; 
          cursor: pointer !important;
          border-radius: 8px !important;
        }
        .wallet-adapter-button-trigger { 
          background-color: ${theme.panel} !important; 
          border: 1.5px solid ${theme.accent} !important; 
          color: ${theme.text} !important;
          box-shadow: 0 2px 8px ${theme.accent}30 !important;
        }
        @media (max-width: 400px) { 
          .wallet-adapter-button { 
            max-width: 120px !important;
            font-size: 12px !important;
            padding: 0 12px !important;
          } 
        }
        
        /* Glassmorphism Buttons */
        .glass-button {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }
        .glass-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5) !important;
        }
        .glass-button:active:not(:disabled) {
          transform: translateY(0) scale(0.98) !important;
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.3) !important;
        }
        .glass-button:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
        
        /* All Button Active States */
        button:active:not(:disabled) {
          transform: scale(0.95) !important;
        }
        
        /* Pulse Animation for Important Buttons */
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
        
        button { cursor: pointer !important; }
        button:disabled { cursor: not-allowed !important; }
      `}</style>

        {/* MODAL */}
        <AnimatePresence>
          {modal.isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: theme.modal, border: `1px solid ${modal.type === 'DANGER' ? '#ff0055' : (modal.type === 'SUCCESS' ? '#00ff41' : theme.accent)}`, padding: '24px', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                <h3 style={{ color: modal.type === 'DANGER' ? '#ff0055' : (modal.type === 'SUCCESS' ? '#00ff41' : theme.accent), margin: '0 0 16px 0', fontSize: '18px', fontWeight: '900' }}>{modal.title}</h3>

                {/* Support for list-based content */}
                {Array.isArray(modal.message) ? (
                  <div style={{ marginBottom: '20px' }}>
                    {modal.message.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          marginBottom: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: theme.accent,
                          flexShrink: 0
                        }} />
                        <span style={{ fontSize: '14px', color: theme.text }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.textDim, fontSize: '12px', marginBottom: '20px' }}>{modal.message}</p>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={closeModal} className="glass-button" style={{ padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', color: theme.textDim }}>CANCEL</button>
                  {modal.onConfirm && <button onClick={modal.onConfirm} className="glass-button" style={{ padding: '10px 20px', background: modal.type === 'DANGER' ? '#ff0055' : (modal.type === 'SUCCESS' ? '#00ff41' : theme.accent), borderRadius: '4px', fontWeight: 'bold', color: '#fff' }}>{modal.actionLabel}</button>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* LOOT DROPS (FLOATING TEXT) */}
        {/* HEADER */}
        <header style={{ zIndex: 100, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
            {/* LOGO & RANK */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <img src="/logo-bright.svg" style={{ width: '32px', height: '32px', borderRadius: '4px', border: `1px solid ${theme.border}`, objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
              <div className="mobile-hide-label" style={{ background: theme.panel, border: `1px solid ${rankColor}`, padding: '4px 8px', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '8px', color: rankColor, fontWeight: 'bold', letterSpacing: '1px', display: 'none', '@media (min-width: 400px)': { display: 'block' } }}>RANK</p>
                <h2 style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: theme.text, whiteSpace: 'nowrap' }}>{currentRank.split(' ')[0]}</h2>
              </div>
            </div>

            {/* BALANCE & LOOT */}
            <div style={{ display: 'flex', gap: '6px', overflow: 'hidden' }}>
              <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wallet size={10} color={theme.accent} />
                <h2 style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: theme.text, whiteSpace: 'nowrap' }}>{(walletBalance || 0).toFixed(2)}</h2>
              </div>

              {/* OG BADGE (Compact) */}
              {isOG && ogNumber && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <OGBurnerBadge ogNumber={ogNumber} size="small" />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <WalletMultiButton style={{ height: '32px', padding: '0 12px', fontSize: '12px' }} />
          </div>
        </header>

        {/* MENU */}
        <AnimatePresence>
          {showMenu && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: theme.bg, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', position: 'sticky', top: 0, background: theme.bg, zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Terminal size={24} color={theme.accent} />
                  <h2 style={{ margin: 0, fontSize: '18px', color: theme.accent, fontFamily: 'monospace' }}>SYSTEM CONFIG</h2>
                </div>
                <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = '0.7'} onMouseLeave={(e) => e.target.style.opacity = '1'}><X size={24} /></button>
              </div>

              {/* REPLAY TOUR */}
              <div style={{ marginBottom: '20px', padding: '15px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: theme.panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', color: theme.text }}>🎓 Replay Tutorial</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: theme.textDim }}>Learn how to play.</p>
                </div>
                <button onClick={() => { setShowTour(true); setTourStep(0); setShowMenu(false); }} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: theme.text, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>START</button>
              </div>

              {/* NFT SETUP (Admin/Dev) */}
              <div style={{ marginBottom: '20px', padding: '15px', border: `1px dashed ${theme.accent}`, borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: theme.accent }}>🎨 NFT SYSTEM</h3>

                {!treeAddress ? (
                  <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                    <p style={{ fontSize: '12px', color: theme.textDim, fontWeight: 'bold' }}>NFT PROTOCOL LOADING...</p>
                    <p style={{ fontSize: '10px', color: theme.textDim, marginTop: '5px' }}>Top 101 Burners get OG status.</p>
                    <button disabled style={{ marginTop: '10px', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '4px', color: theme.textDim, fontSize: '10px', fontWeight: 'bold', cursor: 'not-allowed' }}>COMING SOON</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '10px', color: theme.textDim, marginBottom: '4px' }}>TREE ADDRESS (Give to Friend):</p>
                    <div style={{
                      background: '#000',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      border: `1px solid ${theme.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {treeAddress}
                      <button
                        onClick={() => { navigator.clipboard.writeText(treeAddress); alert('Copied!'); }}
                        style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', marginLeft: '5px' }}
                      >
                        📋
                      </button>
                    </div>
                    <p style={{ fontSize: '10px', color: '#10B981', marginTop: '4px' }}>✅ System Active</p>
                  </div>
                )}
              </div>

              {/* 🎯 BADGES */}
              <button
                onClick={() => { setView('ACHIEVEMENTS'); setShowMenu(false); }}
                style={{
                  background: theme.panel,
                  border: `2px solid ${theme.accent}`,
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: '0.2s',
                  width: '100%',
                  marginBottom: '15px'
                }}
              >
                <div style={{ fontSize: '28px' }}>🎯</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: theme.text }}>Achievement Badges</div>
                  <div style={{ fontSize: '10px', color: theme.textDim }}>View your NFT achievements</div>
                </div>
                {earnedAchievements.length > 0 && (
                  <span style={{
                    background: theme.accent,
                    color: '#000',
                    borderRadius: '10px',
                    padding: '3px 7px',
                    fontSize: '10px',
                    fontWeight: '900'
                  }}>
                    {earnedAchievements.length}
                  </span>
                )}
              </button>

              {/* 🎁 REFERRALS */}
              <button
                onClick={() => { setView('REFERRALS'); setShowMenu(false); }}
                style={{
                  background: theme.panel,
                  border: `2px solid #10B981`,
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: '0.2s',
                  width: '100%',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '28px' }}>🎁</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: theme.text }}>Invite Friends</div>
                  <div style={{ fontSize: '10px', color: theme.textDim }}>Earn +50 XP per referral</div>
                </div>
              </button>

              {/* 🛡️ TACTICAL GUIDE (HOW TO PLAY) */}

              {/* 🛡️ TACTICAL GUIDE (GLASS STYLE) */}
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(10, 10, 18, 0.6)', backdropFilter: 'blur(12px)', border: `1px solid rgba(255, 255, 255, 0.1)`, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <HelpCircle size={18} color={theme.accent} />
                  <h4 style={{ margin: 0, fontSize: '14px', color: theme.accent, fontWeight: '900', letterSpacing: '1px' }}>TACTICAL GUIDE</h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: theme.textDim, lineHeight: '1.8' }}>
                  <li><strong>SCAN:</strong> Find dust & spam.</li>
                  <li><strong><span style={{ color: '#00ff41' }}>GREEN</span> (RENT):</strong> Burn to reclaim free SOL.</li>
                  <li><strong><span style={{ color: '#00c2ff' }}>BLUE</span> (YIELD):</strong> Swap to <strong>JupSOL</strong> (7% APY).</li>
                  <li><strong><span style={{ color: '#fbbf24' }}>YELLOW</span> (DUST):</strong> Burn it all.</li>
                </ul>

                {/* SWAP TO JUPSOL ACTION */}
                {/* SWAP TO JUPSOL ACTION */}
                <button
                  onClick={() => {
                    console.log('🌊 TACTICAL SWAP CLICKED');
                    const target = { id: 'So11111111111111111111111111111111111111112', name: 'SOL' };
                    setSwapTarget(target);
                    setView('SWAP_STATION');
                    console.log('🌊 View set to SWAP_STATION');
                  }}
                  style={{ width: '100%', marginTop: '15px', padding: '10px', background: 'linear-gradient(90deg, #00c2ff 0%, #007aff 100%)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '900', cursor: 'pointer', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                >
                  🌊 SWAP SOL → JUPSOL
                </button>
              </div>

              {/* 🛡️ JUPITER QUESTS (NEW) */}
              <div style={{ marginBottom: '20px', padding: '15px', background: theme.panel, border: `1px solid #00c2ff`, borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  {/* REPLACED LOGO */}
                  <img src="/logo-bright.svg" alt="Demon" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#00c2ff', fontWeight: '900', letterSpacing: '1px' }}>JUPITER QUESTS</h4>
                </div>
                {missions.map(m => {
                  if (m.mobileOnly && !isJupiterMobile) return null;
                  const progress = Math.min(m.progress, m.target);
                  const percentage = (progress / m.target) * 100;
                  return (
                    <div key={m.id} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '11px', color: m.completed ? '#00ff41' : theme.textDim, fontWeight: '700' }}>
                          {m.completed ? '✅' : '⏳'} {m.label}
                        </span>
                        <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold' }}>+{m.xp} XP</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: m.completed ? '#00ff41' : '#00c2ff', transition: 'width 0.3s' }}></div>
                      </div>
                      <div style={{ fontSize: '9px', color: theme.textDim, marginTop: '2px' }}>{progress} / {m.target}</div>
                    </div>
                  );
                })}

                {/* VERIFY ON-CHAIN BUTTON */}
                {publicKey && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      verifyMissionsOnChain();
                    }}
                    disabled={pendingTx?.type === 'verification'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '12px',
                      background: pendingTx?.type === 'verification' ? theme.panel : 'linear-gradient(135deg, #00ff41, #00c2ff)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#000',
                      fontSize: '12px',
                      fontWeight: '900',
                      letterSpacing: '1px',
                      cursor: pendingTx?.type === 'verification' ? 'not-allowed' : 'pointer',
                      opacity: pendingTx?.type === 'verification' ? 0.5 : 1,
                      transition: '0.2s'
                    }}
                  >
                    {pendingTx?.type === 'verification' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader2 className="animate-spin" size={16} />
                        VERIFYING...
                      </div>
                    ) : (
                      '🔗 VERIFY ON-CHAIN'
                    )}
                  </button>
                )}
                <p style={{ fontSize: '10px', color: theme.textDim, marginTop: '8px', textAlign: 'center' }}>Streak: {stats.streak} Days 🔥</p>
              </div>

              {/* 🛡️ MISSION LOG (REAL DATA) */}
              <div style={{ marginBottom: '20px', padding: '15px', background: theme.panel, border: `1px solid ${theme.accent}`, borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Activity size={18} color={theme.accent} />
                  <h4 style={{ margin: 0, fontSize: '14px', color: theme.accent, fontWeight: '900', letterSpacing: '1px' }}>MISSION LOG</h4>
                </div>
                {sessionHistory.length === 0 ? (
                  <p style={{ color: theme.textDim, fontSize: '11px', textAlign: 'center' }}>No actions recorded this session.</p>
                ) : (
                  sessionHistory.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #333' }}>
                      <span style={{ color: theme.text, fontSize: '11px' }}>{item.action}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#00ff41', fontSize: '11px' }}>{item.value}</span>
                        <span style={{ color: theme.textDim, fontSize: '11px' }}>{item.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 🛡️ SETTINGS */}
              <div style={{ background: theme.panel, padding: '15px', borderRadius: '4px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.text }}>{audioEnabled ? <Volume2 size={16} color={theme.accent} /> : <VolumeX size={16} color={theme.textDim} />} AUDIO</span>
                  <button onClick={() => setAudioEnabled(!audioEnabled)} style={{ background: audioEnabled ? `${theme.accent}20` : theme.bg, border: `1px solid ${audioEnabled ? theme.accent : theme.border}`, color: audioEnabled ? theme.accent : theme.textDim, padding: '4px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px' }}>{audioEnabled ? 'ONLINE' : 'MUTED'}</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.text }}>{hapticsEnabled ? <Smartphone size={16} color={theme.accent} /> : <Smartphone size={16} color={theme.textDim} />} HAPTICS</span>
                  <button onClick={() => setHapticsEnabled(!hapticsEnabled)} style={{ background: hapticsEnabled ? `${theme.accent}20` : theme.bg, border: `1px solid ${hapticsEnabled ? theme.accent : theme.border}`, color: hapticsEnabled ? theme.accent : theme.textDim, padding: '4px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px' }}>{hapticsEnabled ? 'ON' : 'OFF'}</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.text }}>{themeMode === 'light' ? <Sun size={16} color={theme.accent} /> : (themeMode === 'system' ? <Monitor size={16} color={theme.accent} /> : <Moon size={16} color={theme.accent} />)} THEME</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setThemeMode('dark')} style={{ padding: '6px', background: themeMode === 'dark' ? theme.accent : theme.bg, color: themeMode === 'dark' ? '#000' : theme.textDim, border: `1px solid ${theme.border}`, borderRadius: '2px' }}><Moon size={14} /></button>
                    <button onClick={() => setThemeMode('light')} style={{ padding: '6px', background: themeMode === 'light' ? theme.accent : theme.bg, color: themeMode === 'light' ? '#000' : theme.textDim, border: `1px solid ${theme.border}`, borderRadius: '2px' }}><Sun size={14} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT AREA */}
        <PriceTicker />
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))', zIndex: 10 }}>

          {/* VIEW 1: SCANNER */}
          {view === 'SCANNER' && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleScan}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}>
                <motion.div variants={radarVariants} animate="ping" style={{ position: 'absolute', inset: -25, border: `1px solid ${theme.accent}`, borderRadius: '50%', opacity: 0.5 }} />
                <motion.div variants={radarVariants} animate="ping" style={{ position: 'absolute', inset: -50, border: `1px solid ${theme.accent}`, borderRadius: '50%', opacity: 0.2, animationDelay: '0.5s' }} />
                <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: `2px solid ${theme.accent}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.panel, boxShadow: `0 0 40px ${theme.accent}40`, position: 'relative' }}>
                  <Crosshair size={70} color={theme.accent} strokeWidth={1} />
                  <p style={{ color: theme.accent, fontWeight: '900', marginTop: '12px', letterSpacing: '4px', fontSize: '12px' }}>INITIATE</p>
                </div>
              </motion.button>
              {!publicKey && <p style={{ color: theme.textDim, fontSize: '10px', marginTop: '40px', letterSpacing: '2px', fontWeight: 'bold' }}>[ AWAITING UPLINK ]</p>}
            </div>
          )}

          {/* 🛡️ GHOST LOADING (SKELETON UI) */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', maxWidth: '600px', margin: '0 auto', marginTop: '50px' }}>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  style={{ height: '160px', background: theme.panel, borderRadius: '4px', border: `1px solid ${theme.border}` }}
                />
              ))}
            </div>
          )}

          {/* VIEW 2: INVENTORY */}
          {view === 'INVENTORY' && !loading && result && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', padding: '16px', background: 'rgba(10, 10, 18, 0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${selectedIds.length > 0 ? rankColor : theme.border}`, position: 'sticky', top: 0, zIndex: 200, borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: rankColor, fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>TARGETS: {selectedIds.length}</h3>
                  <button onClick={handleToggleSelectAll} className="glass-button" style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', color: '#fbbf24' }}>{selectedIds.length === result.targets.length ? 'DESELECT ALL' : 'SELECT ALL'}</button>
                </div>
                <button onClick={confirmExorcism} disabled={!selectedIds.length || burningId} className="glass-button" style={{ width: '100%', padding: '14px', background: selectedIds.length ? '#ff0055' : 'rgba(255, 255, 255, 0.05)', color: selectedIds.length ? '#fff' : theme.textDim, borderRadius: '4px', fontWeight: '900', letterSpacing: '2px' }}>
                  {burningId ? <LoadingSpinner theme={theme} type="flame" size={20} /> : `EXECUTE BURN`}
                </button>
              </div>

              <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', paddingBottom: '40px' }}>
                <AnimatePresence>
                  {result.targets.filter(t => !t.isTradeable && !t.isEmpty).map((t, i) => (
                    <motion.div key={t.id} variants={itemVariants} layout>
                      <BountyPoster data={t} theme={theme} selected={selectedIds.includes(t.id)} onSelect={() => toggleSelect(t)} onSwap={() => handleSwap(t)} />
                    </motion.div>
                  ))}
                  {/* Show hidden count if tradeables exist */}
                  {result.targets.some(t => t.isTradeable) && (
                    <div style={{ gridColumn: '1 / -1', padding: '10px', textAlign: 'center', opacity: 0.5, fontSize: '10px', color: theme.textDim }}>
                      {result.targets.filter(t => t.isTradeable).length} valuable assets hidden for safety.
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* VIEW 3: PROPHECY (PREDICTION MARKETS) - GAMIFIED ORACLE */}
          {view === 'PROPHECY' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '10px', paddingBottom: '100px', paddingLeft: '15px', paddingRight: '15px' }}>

              {/* 🔮 ORACLE HEADER CARD */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #1a0033 0%, #0f0f1a 100%)',
                  border: '1px solid #a855f7',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: -10, right: -10, width: '60px', height: '60px', background: '#a855f7', opacity: 0.2, filter: 'blur(30px)', borderRadius: '50%' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🔮</span>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#a855f7', letterSpacing: '2px', textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>ORACLE PROTOCOL</h2>
                  </div>
                  <div style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #a855f7', padding: '4px 8px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#d8b4fe', fontWeight: 'bold' }}>5 MIN ROUNDS</span>
                  </div>
                </div>

                {/* LIVE PRICE DISPLAY */}
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <p style={{ margin: 0, fontSize: '10px', color: '#9333ea', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>SOL/USD ORACLE PRICE</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <h1 style={{ margin: '5px 0', fontSize: '42px', fontWeight: '900', fontFamily: 'monospace', color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                      {(currentSOLPrice || 0).toFixed(2)}
                    </h1>
                  </div>
                  {previousSOLPrice > 0 && currentSOLPrice !== previousSOLPrice && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: currentSOLPrice > previousSOLPrice ? '#00ff41' : '#ff0055' }}>
                        {currentSOLPrice > previousSOLPrice ? '▲' : '▼'} {(Math.abs((currentSOLPrice || 0) - (previousSOLPrice || 0))).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '10px', color: theme.textDim }}>last tick</span>
                    </div>
                  )}
                </div>

                {/* PROGRESS BAR (Visual Flair) */}
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div
                    className="scanner-line"
                    style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }}
                  />
                </div>
              </motion.div>

              {/* 🎮 GAMEPLAY AREA */}
              {!dailyPrediction ? (
                <div style={{ display: 'flex', gap: '12px', height: '180px' }}>
                  {/* BULLISH BUTTON */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => makePredictionHook('up', currentSOLPrice)}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(180deg, rgba(0,255,65,0.1) 0%, rgba(0,255,65,0.05) 100%)',
                      border: '2px solid #00ff41',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,255,65,0.2), transparent 70%)', opacity: 0.5 }} />
                    <TrendingUp size={40} color="#00ff41" strokeWidth={3} />
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff', textShadow: '0 0 10px #00ff41' }}>PUMP</span>
                    <div style={{ padding: '4px 8px', background: '#00ff41', borderRadius: '4px', color: '#000', fontSize: '10px', fontWeight: '900' }}>
                      +300 XP
                    </div>
                  </motion.button>

                  {/* BEARISH BUTTON */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => makePredictionHook('down', currentSOLPrice)}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(180deg, rgba(255,0,85,0.1) 0%, rgba(255,0,85,0.05) 100%)',
                      border: '2px solid #ff0055',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,0,85,0.2), transparent 70%)', opacity: 0.5 }} />
                    <TrendingDown size={40} color="#ff0055" strokeWidth={3} />
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff', textShadow: '0 0 10px #ff0055' }}>DUMP</span>
                    <div style={{ padding: '4px 8px', background: '#ff0055', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: '900' }}>
                      +300 XP
                    </div>
                  </motion.button>
                </div>
              ) : (
                /* ACTIVE PREDICTION STATUS */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: theme.panel,
                    border: `1px solid ${dailyPrediction.result ? (dailyPrediction.result === 'correct' ? '#00ff41' : '#ff0055') : theme.accent}`,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: `0 0 20px ${dailyPrediction.result ? (dailyPrediction.result === 'correct' ? 'rgba(0,255,65,0.2)' : 'rgba(255,0,85,0.2)') : 'rgba(168,85,247,0.1)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '12px', color: theme.textDim, fontWeight: 'bold' }}>YOUR POSITION</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {dailyPrediction.prediction === 'up' ? <TrendingUp size={16} color="#00ff41" /> : <TrendingDown size={16} color="#ff0055" />}
                      <span style={{ fontSize: '14px', fontWeight: '900', color: dailyPrediction.prediction === 'up' ? '#00ff41' : '#ff0055' }}>
                        {dailyPrediction.prediction === 'up' ? 'LONG (PUMP)' : 'SHORT (DUMP)'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: theme.bg, padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '10px', color: theme.textDim }}>ENTRY PRICE</span>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: theme.text, fontFamily: 'monospace' }}>${(dailyPrediction?.startPrice || dailyPrediction?.targetPrice || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ background: theme.bg, padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '10px', color: theme.textDim }}>TARGET</span>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: dailyPrediction.prediction === 'up' ? '#00ff41' : '#ff0055', fontFamily: 'monospace' }}>
                        {dailyPrediction.prediction === 'up' ? '> Entry' : '< Entry'}
                      </div>
                    </div>
                  </div>

                  <PredictionChart
                    startPrice={dailyPrediction.startPrice}
                    currentPrice={currentSOLPrice}
                    direction={dailyPrediction.prediction}
                    theme={theme}
                  />

                  <div style={{ marginTop: '20px' }}>
                    {!dailyPrediction.result ? (
                      <button
                        onClick={() => checkPredictionResult(dailyPrediction, currentSOLPrice)}
                        style={{
                          width: '100%',
                          padding: '16px',
                          background: Date.now() >= dailyPrediction.endTime
                            ? 'linear-gradient(135deg, #fbbf24, #d97706)' // Gold for Claim
                            : 'rgba(255,255,255,0.05)',
                          border: Date.now() >= dailyPrediction.endTime ? 'none' : `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          color: Date.now() >= dailyPrediction.endTime ? '#000' : theme.textDim,
                          fontWeight: '900',
                          fontSize: '14px',
                          cursor: Date.now() >= dailyPrediction.endTime ? 'pointer' : 'default',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '10px',
                          letterSpacing: '1px',
                          transition: 'all 0.3s'
                        }}
                      >
                        {Date.now() >= dailyPrediction.endTime ? (
                          <>
                            <Crown size={20} /> CLAIM REWARD
                          </>
                        ) : (
                          <>
                            <Loader2 size={18} className="animate-spin" /> {timeLeft || 'LIVE TRACKING...'}
                          </>
                        )}
                      </button>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        style={{
                          padding: '15px',
                          background: dailyPrediction.result === 'correct' ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 0, 85, 0.1)',
                          border: `1px solid ${dailyPrediction.result === 'correct' ? '#00ff41' : '#ff0055'}`,
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}
                      >
                        <h3 style={{ margin: '0 0 5px 0', color: dailyPrediction.result === 'correct' ? '#00ff41' : '#ff0055', fontSize: '18px', fontWeight: '900' }}>
                          {dailyPrediction.result === 'correct' ? '✅ WINNER' : '❌ REKT'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: theme.text }}>
                          {dailyPrediction.result === 'correct' ? `You earned +300 XP!` : 'Consolation prize: +50 XP'}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* RECENT HISTORY */}
              {predictionHistory.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h4 style={{ fontSize: '12px', color: theme.textDim, marginBottom: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>RECENT PROPHECIES</h4>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {predictionHistory.slice(0, 5).map((p, i) => (
                      <div key={i} style={{
                        minWidth: '100px',
                        padding: '10px',
                        background: theme.panel,
                        border: `1px solid ${p.result === 'correct' ? '#00ff41' : '#ff0055'}`,
                        borderRadius: '8px',
                        flexShrink: 0
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: theme.text }}>{p.prediction === 'up' ? 'PUMP' : 'DUMP'}</span>
                          <span style={{ fontSize: '10px' }}>{p.result === 'correct' ? '✅' : '❌'}</span>
                        </div>
                        <div style={{ fontSize: '9px', color: theme.textDim }}>{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
          )}


          {/* VIEW 5: YIELD DASHBOARD - MOBILE OPTIMIZED */}
          {view === 'YIELD' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px 15px 100px 15px' }}>
              {/* Compact Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '15px',
                padding: '15px',
                background: 'linear-gradient(135deg, #001a33 0%, #003d52 100%)',
                border: '2px solid #00c2ff',
                borderRadius: '10px',
                boxShadow: '0 0 20px rgba(0, 194, 255, 0.3)'
              }}>
                <div style={{ fontSize: '32px' }}>💰</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#00c2ff', letterSpacing: '1px' }}>
                    YIELD CALCULATOR
                  </h2>
                  <div style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {jupsolAPY > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00c2ff', fontWeight: '700' }}>
                        <img src="/logo-bright.svg" alt="Demon" style={{ width: '12px', height: '12px', borderRadius: '50%' }} /> {(jupsolAPY || 0).toFixed(2)}% APY (Live)
                      </div>
                    ) : (
                      <>Powered by JupSOL</>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculator Input */}
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="number"
                  value={calculatorAmount}
                  onChange={(e) => setCalculatorAmount(e.target.value)}
                  placeholder="Enter JupSOL amount..."
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'rgba(0, 194, 255, 0.05)',
                    border: '2px solid rgba(0, 194, 255, 0.3)',
                    borderRadius: '8px',
                    color: theme.text,
                    fontSize: '18px',
                    fontWeight: '900',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                {calculatorAmount && currentSOLPrice > 0 && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#7dd3fc', textAlign: 'center' }}>
                    ≈ ${(parseFloat(calculatorAmount || 0) * (currentSOLPrice || 0)).toFixed(2)} USD
                  </p>
                )}
              </div>

              {/* Calculator Results */}
              {calculatorAmount && parseFloat(calculatorAmount) > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}
                >
                  <div style={{ background: 'rgba(0, 194, 255, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 194, 255, 0.3)' }}>
                    <p style={{ margin: 0, fontSize: '9px', color: theme.textDim }}>Daily</p>
                    <p style={{ margin: '3px 0 0 0', fontSize: '13px', fontWeight: '900', color: '#00c2ff' }}>
                      {((parseFloat(calculatorAmount || 0) * (jupsolAPY || 0) / 100) / 365).toFixed(4)}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#7dd3fc' }}>
                      ${((parseFloat(calculatorAmount || 0) * (jupsolAPY || 0) / 100 / 365) * (currentSOLPrice || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(0, 194, 255, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 194, 255, 0.3)' }}>
                    <p style={{ margin: 0, fontSize: '9px', color: theme.textDim }}>Monthly</p>
                    <p style={{ margin: '3px 0 0 0', fontSize: '13px', fontWeight: '900', color: '#00c2ff' }}>
                      {((parseFloat(calculatorAmount || 0) * (jupsolAPY || 0) / 100) / 12).toFixed(4)}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#7dd3fc' }}>
                      ${((parseFloat(calculatorAmount || 0) * (jupsolAPY || 0) / 100 / 12) * (currentSOLPrice || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(0, 255, 136, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 255, 136, 0.3)', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: theme.textDim }}>Yearly Earnings</span>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#00ff88' }}>
                          {(parseFloat(calculatorAmount || 0) * (jupsolAPY || 0) / 100).toFixed(4)} SOL
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#7dd3fc' }}>
                          ${((parseFloat(calculatorAmount || 0) * (jupsolAPY || 0) / 100) * (currentSOLPrice || 0)).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: 'rgba(0, 194, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(0, 194, 255, 0.3)',
                  marginBottom: '15px'
                }}>
                  <p style={{ margin: 0, fontSize: '12px', color: theme.textDim }}>
                    👆 Enter an amount to calculate earnings
                  </p>
                </div>
              )}

              {/* Current Holdings (if any) - Compact */}
              {jupsolBalance > 0 && (
                <div style={{ background: 'rgba(0, 255, 136, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 255, 136, 0.3)', marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#00ff88', fontWeight: '900', letterSpacing: '1px' }}>
                    💎 YOUR HOLDINGS
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: theme.text }}>Balance</span>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#00c2ff' }}>{(jupsolBalance || 0).toFixed(4)} JupSOL</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: theme.text }}>Yearly</span>
                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#00ff88' }}>{(estimatedEarnings?.yearly || 0).toFixed(4)} SOL</span>
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('SCANNER')}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: jupsolBalance === 0
                    ? 'linear-gradient(135deg, #00c2ff 0%, #00ff88 100%)'
                    : 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  border: `3px solid ${jupsolBalance === 0 ? '#00c2ff' : '#a855f7'}`,
                  borderRadius: '10px',
                  color: jupsolBalance === 0 ? '#000' : '#fff',
                  fontWeight: '900',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: `0 0 20px ${jupsolBalance === 0 ? 'rgba(0, 194, 255, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
                  letterSpacing: '1px'
                }}
              >
                {jupsolBalance === 0 ? 'FIND TOKENS TO CONVERT' : 'SCAN FOR MORE TOKENS'}
              </motion.button>
            </div>
          )}

          {/* VIEW 6: LEADERBOARD - MOBILE OPTIMIZED */}
          {view === 'LEADERBOARD' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px 15px 100px 15px' }}>
              {/* Compact Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '15px',
                padding: '15px',
                background: 'linear-gradient(135deg, #1a0033 0%, #2d0052 100%)',
                border: '2px solid #fbbf24',
                borderRadius: '10px',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
              }}>
                <div style={{ fontSize: '32px' }}>🏆</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fbbf24', letterSpacing: '1px' }}>
                    LEADERBOARD
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#fcd34d' }}>
                    Live Rankings
                  </p>
                </div>
              </div>

              {/* User Rank Card */}
              {userRank && (
                <div style={{
                  background: 'linear-gradient(135deg, #000000 0%, #1a0033 100%)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  border: '2px solid #fbbf24',
                  boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#fcd34d', fontWeight: '900', letterSpacing: '1px' }}>
                    YOUR RANK
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#fbbf24', fontFamily: 'monospace' }}>
                        #{String(userRank?.rank || '')}
                      </h1>
                      <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: theme.text }}>
                        {stats.xp.toLocaleString()} XP • {currentRank}
                      </p>
                    </div>
                    {isJupiterMobile && (
                      <div style={{
                        background: 'rgba(0, 194, 255, 0.2)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #00c2ff',
                        marginRight: '8px'
                      }}>
                        <p style={{ margin: 0, fontSize: '10px', color: '#00c2ff', fontWeight: '900' }}>📱 MOBILE</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleShare('rank')}
                      style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid #fbbf24',
                        color: '#fbbf24',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '10px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      SHARE
                    </button>
                  </div>
                </div>
              )}

              {/* Top 10 Leaderboard */}
              <div style={{ background: theme.panel, padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '900', color: theme.accent }}>
                  TOP 10 HUNTERS
                </h3>

                {leaderboardData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: theme.textDim }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '24px' }}>👻</p>
                    <p style={{ margin: 0, fontSize: '11px' }}>No hunters yet. Be the first to burn!</p>
                  </div>
                ) : (
                  leaderboardData.map((player, index) => {
                    const isTop3 = index < 3;
                    const trophies = ['🥇', '🥈', '🥉'];
                    const truncatedWallet = player.isUser
                      ? 'YOU'
                      : `${player.wallet.slice(0, 4)}...${player.wallet.slice(-4)}`;

                    return (
                      <div
                        key={player.wallet}
                        style={{
                          padding: '10px',
                          background: player.isUser ? 'rgba(251, 191, 36, 0.1)' : theme.bg,
                          borderRadius: '6px',
                          marginBottom: '8px',
                          border: player.isUser ? '1px solid #fbbf24' : `1px solid ${theme.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        {/* Rank */}
                        <div style={{
                          minWidth: '30px',
                          textAlign: 'center',
                          fontSize: isTop3 ? '18px' : '12px',
                          fontWeight: '900',
                          color: isTop3 ? '#fbbf24' : theme.textDim
                        }}>
                          {isTop3 ? trophies[index] : `#${index + 1}`}
                        </div>

                        {/* Player Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <p style={{
                              margin: 0,
                              fontSize: '11px',
                              fontWeight: '900',
                              color: player.isUser ? '#fbbf24' : theme.text,
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {truncatedWallet}
                            </p>
                            {player.isMobile && (
                              <span style={{ fontSize: '10px' }}>📱</span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '9px', color: theme.textDim }}>
                            {player.xp.toLocaleString()} XP • {player.solReclaimed} SOL
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mobile Exclusive Section */}
              {isJupiterMobile && (
                <div style={{
                  marginTop: '15px',
                  background: 'rgba(0, 194, 255, 0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00c2ff'
                }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '10px', color: '#00c2ff', fontWeight: '900', letterSpacing: '1px' }}>
                    📱 MOBILE EXCLUSIVE
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: theme.text }}>
                    Earning <strong style={{ color: '#00c2ff' }}>3x XP</strong> on Jupiter Mobile
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 7: ACHIEVEMENTS */}
          {view === 'ACHIEVEMENTS' && (
            <div style={{ minHeight: '100vh', paddingBottom: '90px' }}>
              <AchievementGallery
                earnedAchievements={earnedAchievements}
                stats={stats}
                context={{
                  jupsolBalance,
                  predictions: predictionHistory,
                  isJupiterMobile,
                  userRank,
                }}
                onMint={handleMintNFT}
                theme={theme}
              />
            </div>
          )}

          {/* VIEW 8: REFERRALS */}
          {view === 'REFERRALS' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 15px 100px 15px' }}>
              <ReferralPanel
                wallet={publicKey?.toString()}
                theme={theme}
                onCopy={() => {
                  triggerHaptic('light');
                  triggerConfetti('success');
                }}
                onShare={(platform) => {
                  triggerHaptic('medium');

                }}
              />
            </div>
          )}

        </div >

        {/* FOOTER NAV - Streamlined to 6 core actions */}
        < nav style={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          height: 'calc(70px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: theme.bg,
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <button onClick={() => setView('SCANNER')} style={{ background: 'none', border: 'none', color: view === 'SCANNER' ? theme.accent : theme.textDim, transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <Crosshair size={24} />
            <span style={{ fontSize: '9px' }}>SCAN</span>
          </button>
          <button onClick={() => setView('INVENTORY')} style={{ background: 'none', border: 'none', color: view === 'INVENTORY' ? '#ff0055' : theme.textDim, transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <Ghost size={24} />
            <span style={{ fontSize: '9px' }}>BURN</span>
          </button>
          <button onClick={() => setView('PROPHECY')} style={{ background: 'none', border: 'none', color: view === 'PROPHECY' ? '#a855f7' : theme.textDim, transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '24px' }}>🔮</div>
            <span style={{ fontSize: '9px' }}>PREDICT</span>
          </button>
          <button onClick={() => setView('YIELD')} style={{ background: 'none', border: 'none', color: view === 'YIELD' ? '#00c2ff' : theme.textDim, transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '24px' }}>💰</div>
            <span style={{ fontSize: '9px' }}>YIELD</span>
          </button>
          <button onClick={() => setView('LEADERBOARD')} style={{ background: 'none', border: 'none', color: view === 'LEADERBOARD' ? '#fbbf24' : theme.textDim, transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '24px' }}>🏆</div>
            <span style={{ fontSize: '9px' }}>RANKS</span>
          </button>
          <button onClick={() => setShowMenu(true)} style={{ background: 'none', border: 'none', color: theme.textDim, transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', position: 'relative' }}>
            <Settings size={24} />
            <span style={{ fontSize: '9px' }}>MORE</span>
            {earnedAchievements.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: theme.accent,
                color: '#000',
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                fontSize: '8px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {earnedAchievements.length}
              </span>
            )}
          </button>
        </nav >

        {shake && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,0,0,0.2)', zIndex: 2000, pointerEvents: 'none' }} />}
        <AnimatePresence>
          {lootDrops.map(l => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], y: -100, scale: 1.5 }} className="fixed top-1/2 left-1/2 transform -translate-x-1/2 z-[3000] pointer-events-none">
              <div style={{ color: '#fbbf24', fontWeight: '900', fontSize: '24px', textShadow: '0 0 10px #fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logo-bright.svg" alt="Demon" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                {l.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ONBOARDING TOUR */}
        <OnboardingTour
          show={showTour}
          currentStep={tourStep}
          onNext={handleTourNext}
          onBack={() => { if (tourStep > 0) setTourStep(s => s - 1); }}
          onSkip={handleTourSkip}
          theme={theme}
        />

        {/* Achievement Unlock Modal */}
        <AchievementModal
          achievement={achievementToShow}
          isOpen={!!achievementToShow}
          onClose={() => setAchievementToShow(null)}
        />

        {/* 🔥 OG BURNER CELEBRATION MODAL */}
        <OGBurnerCelebration
          isOpen={showOGCelebration}
          onClose={() => setShowOGCelebration(false)}
          ogNumber={ogNumber}
          totalOGs={100}
          isMinted={ogStatus?.nftMinted}
        />

        {/* 🛡️ VERIFICATION OVERLAY */}
        <VerificationOverlay isOpen={pendingTx?.type === 'verification'} />
        {/* VIEW 4: SWAP STATION (JUPITER PLUGIN) */}
        {/* MOVED TO ROOT LEVEL FOR Z-INDEX FIX */}
        {
          view === 'SWAP_STATION' && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 99999, background: '#000000',
              display: 'flex', flexDirection: 'column', overscrollBehavior: 'none'
            }}>
              <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${theme.border}` }}>
                <button onClick={() => { setView('INVENTORY'); if (window.Jupiter) window.Jupiter.close(); setJupiterInitialized(false); }} style={{ background: theme.panel, border: `1px solid ${theme.border}`, color: theme.text, padding: '8px', borderRadius: '4px' }}>
                  <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#00c2ff' }}>YIELD GENERATOR (JupSOL)</h2>
              </div>
              {/* JUPITER PLUGIN CONTAINER */}
              <div id="integrated-terminal" style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
                {!jupiterInitialized && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: theme.textDim }}>
                    <Loader2 className="animate-spin" size={24} /> INITIALIZING...
                  </div>
                )}
              </div>
            </div>
          )
        }
      </main >
    </WalletModalProvider >
  );
}

// 🛡️ VERIFICATION OVERLAY COMPONENT
function VerificationOverlay({ isOpen }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff41', borderRadius: '50%', opacity: 0.3, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
        <div style={{ position: 'absolute', inset: '10px', border: '2px solid #00ff41', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <Terminal size={32} color="#00ff41" />
      </div>
      <h2 style={{ color: '#00ff41', marginTop: '24px', fontSize: '18px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
        VERIFYING ON-CHAIN
      </h2>
      <p style={{ color: '#fff', opacity: 0.7, fontSize: '12px', marginTop: '8px', fontFamily: 'monospace' }}>
        Scanning for Jupiter Swaps & Burns...
      </p>
    </div>
  );
}

// 🛡️ GAMIFIED POSTER COMPONENT
function BountyPoster({ data, selected, onSelect, onSwap, theme }) {
  const { isScam, isRentClaimable, isEmpty, isSafe, isHighValue, isNFT, isTradeable } = data;

  // 🛡️ GAMIFIED COLOR LOGIC
  const mainColor = isTradeable ? '#00c2ff' : (isRentClaimable ? '#00ff41' : (isScam ? '#ff0055' : (isNFT ? '#a855f7' : '#fbbf24')));
  const glow = selected ? `0 0 15px ${mainColor}` : 'none';
  const bgStyle = selected ? `rgba(0,194,255,0.1)` : theme.panel;
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: `0 0 25px ${mainColor}40` }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: bgStyle,
        border: `1px solid ${mainColor}60`,
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '170px',
        boxShadow: selected ? glow : `0 4px 10px rgba(0,0,0,0.2)`,
        transition: 'all 0.2s ease'
      }}
    >
      {/* 🛡️ RARE HOLO EFFECT */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, transparent 40%, ${mainColor}20 50%, transparent 60%)`, opacity: 0.3, pointerEvents: 'none' }} />

      {selected && <div style={{ position: 'absolute', inset: 0, border: `2px solid ${mainColor}`, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }}><Crosshair size={40} color={mainColor} strokeWidth={2} /></div>}

      {isRentClaimable && !selected && <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff41', opacity: 0.5, animation: 'pulse 2s infinite', pointerEvents: 'none' }} />}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(180deg, ${mainColor}15 0%, transparent 100%)`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 8, right: 8 }}>{isTradeable ? <ArrowRightLeft size={16} color="#00c2ff" /> : (isScam ? <Skull size={16} color="#ff0055" /> : (isNFT ? <Ghost size={16} color="#a855f7" /> : <Target size={16} color="#fbbf24" />))}</div>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: `2px solid ${mainColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', boxShadow: `0 0 20px ${mainColor}30` }}>
          {data.image && !imgError ? <img src={data.image} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} onError={() => setImgError(true)} /> : <Ghost size={28} color={mainColor} />}
        </div>
      </div>

      <div style={{ padding: '12px', borderTop: `1px solid ${mainColor}20`, background: theme.panel }}>
        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{data.name}</h4>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '8px' }}>
          <span style={{
            fontSize: '9px', padding: '3px 8px', borderRadius: '2px',
            background: isTradeable ? 'rgba(0,194,255,0.15)' : 'rgba(251,191,36,0.1)',
            color: mainColor, fontWeight: '900', border: `1px solid ${mainColor}40`, textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            {isTradeable ? 'YIELD FARM' : (isRentClaimable ? 'CLAIM RENT' : (isScam ? 'THREAT' : (isNFT ? 'NFT DUST' : 'TARGET')))}
          </span>
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: theme.textDim, textAlign: 'center', fontFamily: 'monospace' }}>
          {isRentClaimable ? '0.002 SOL' : `$${(data.value || 0).toFixed(2)}`}
        </p>
      </div>

      {/* 🖱️ CLICK MASK: Guaranteed Touch Target */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          isTradeable ? onSwap() : onSelect();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        aria-label={`Select ${data.name}`}
      />
    </motion.div>
  );
}
