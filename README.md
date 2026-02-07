# 🔥 Dust Demons

> **Turn wallet dust into yield-bearing JupSOL while predicting markets and earning XP**

A gamified, mobile-first DeFi application that transforms Solana wallet cleanup into an engaging adventure. Built for the **Jupiter Gamification, DeFi & Mobile Adventures Track**.

[![Jupiter Mobile](https://img.shields.io/badge/Jupiter-Mobile%20Optimized-00c2ff?style=for-the-badge)](https://jup.ag)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-14F195?style=for-the-badge&logo=solana)](https://solana.com)

## 🎯 Competition Track Alignment

This project directly addresses **4 out of 5** challenge areas:

| Challenge Area | Implementation | Status |
|----------------|----------------|--------|
| **Jupiter Mobile-Native Auth** | 3x XP multiplier, exclusive rank, mobile-only missions | ✅ Complete |
| **On-chain Missions** | Daily quests requiring real swaps & predictions | ✅ Complete |
| **Game Economies** | Real token pricing via Jupiter Price API | ✅ Complete |
| **Prediction Markets** | Daily SOL price prediction mini-game | ✅ Complete |

## 🚀 Key Features

### 1. 🎲 Prediction Markets Integration
- **Daily SOL Price Predictions**: Predict if SOL will go up or down in 24 hours
- **XP Rewards**: 300 XP for correct predictions, 50 XP for participation
- **Powered by Jupiter Price API**: Real-time SOL pricing
- **Gamified UI**: Beautiful PROPHECY view with prediction history

### 2. 📱 Jupiter Mobile-First Experience
- **3x XP Multiplier**: Jupiter Mobile users earn 300 XP vs 100 XP for daily login
- **Exclusive "MOBILE LEGEND" Rank**: Special rank tier only for mobile users
- **Mobile-Only Missions**: Dedicated quests that unlock only in Jupiter Mobile
- **Seamless Integration**: Auto-detection and enhanced experience

### 3. 💰 JupSOL Yield Farming
- **Dust → Yield**: Convert worthless tokens into yield-bearing JupSOL
- **Jupiter Plugin Integration**: Seamless swap experience
- **Real-time Pricing**: Accurate token valuations via Jupiter Price API v2
- **Mission Rewards**: 500 XP for swapping to JupSOL

### 4. 🎮 Full Gamification System
- **XP & Leveling**: Earn XP through burns, swaps, and predictions
- **7 Rank Tiers**: From "VOID STALKER" to "GOD OF VOID"
- **Daily Missions**: Login streaks, burn targets, swap goals, predictions
- **Achievement System**: Track your progress and share on Twitter
- **Session History**: Real-time activity log

### 5. 🔗 Social & Viral Features
- **Twitter Sharing**: Share predictions, achievements, and rank ups
- **Referral Links**: Invite friends with your public key
- **Leaderboard Ready**: Built for global competition (backend TBD)

## 🛠️ Jupiter API Integrations

### 1. Jupiter Price API v2
```javascript
// Real-time token pricing for accurate valuations
const prices = await getTokenPrices([SOL_MINT, TOKEN_MINT]);
const solPrice = prices[SOL_MINT]?.price;
```

**Usage:**
- SOL price fetching for prediction markets
- Token valuation during wallet scans
- Dust vs tradeable classification ($0.10 threshold)

### 2. Jupiter Plugin (Swap Integration)
```javascript
window.Jupiter.init({
  displayMode: 'integrated',
  enableWalletPassthrough: true,
  formProps: {
    initialInputMint: dustToken.id,
    initialOutputMint: JUP_SOL_MINT,
  },
  onSuccess: ({ txid }) => {
    // Award XP, update missions, trigger confetti
  }
});
```

**Features:**
- Integrated swap UI for dust → JupSOL conversion
- Wallet passthrough for seamless UX
- Success callbacks for gamification

### 3. Jupiter Mobile Detection
```javascript
// Enhanced experience for Jupiter Mobile users
const isJupiterMobile = ua.includes('Jupiter') || window?.solana?.isJupiter;
const xpBonus = isJupiterMobile ? 300 : 100; // 3x multiplier!
```

## 📊 Technical Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Blockchain**: Solana Web3.js, SPL Token
- **Wallet**: Solana Wallet Adapter (Jupiter Mobile compatible)
- **UI**: Framer Motion, Lucide React icons
- **APIs**: Jupiter Price API v2, Helius DAS API
- **Deployment**: Vercel (PWA-ready)

### Key Components

#### Prediction Markets (`/src/app/page.js`)
- Daily prediction state management
- SOL price fetching via Jupiter API
- Result checking with XP rewards
- Prediction history tracking

#### Mobile Experience
- Jupiter Mobile detection
- 3x XP multiplier logic
- Mobile-exclusive rank calculation
- Mobile-only mission filtering

#### Swap Integration
- Jupiter Plugin initialization
- Wallet context passthrough
- Success event handling
- Mission progress tracking

## 🎮 How to Play

1. **Connect Wallet** (Jupiter Mobile recommended for 3x XP!)
2. **Scan Wallet** to find dust and tradeable tokens
3. **Make Daily Prediction** on SOL price movement
4. **Burn Dust** to reclaim SOL rent deposits
5. **Swap to JupSOL** to earn yield on valuable tokens
6. **Complete Missions** to level up and unlock ranks
7. **Share Achievements** on Twitter to recruit friends

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Solana wallet (Jupiter Mobile recommended)
- Some SOL for transaction fees

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dust-demons-pwa.git
cd dust-demons-pwa

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser or Jupiter Mobile wallet.

### Environment Setup

No environment variables required! All APIs are public:
- Jupiter Price API: `https://api.jup.ag/price/v2`
- Jupiter Plugin: Loaded via CDN
- Helius DAS API: Public endpoint (consider adding your own key for production)

## 🎯 Competition Highlights

### Why This Wins

1. **Multiple Jupiter APIs**: Price API + Plugin + Mobile detection
2. **Real Utility**: Solves actual wallet cleanup problem
3. **Prediction Markets**: Unique integration of Jupiter's newest product
4. **Mobile-First**: 3x XP multiplier and exclusive features for Jupiter Mobile
5. **Production Ready**: Fully functional PWA, not just a demo
6. **Gamification**: Makes DeFi fun and approachable
7. **Viral Potential**: Social sharing, referrals, achievements

### Metrics
- **3x XP Multiplier** for Jupiter Mobile users
- **300 XP** for correct predictions (vs 50 XP for trying)
- **500 XP** for swapping to JupSOL
- **7 Rank Tiers** including mobile-exclusive "MOBILE LEGEND"
- **4 Daily Missions** including prediction market participation

## 📱 Mobile Experience

The app is optimized for Jupiter Mobile with:
- Responsive PWA design
- Touch-optimized controls
- Mobile-exclusive achievements
- 3x XP rewards
- Haptic feedback
- Auto-detection and special UI treatment

## 🔮 Prediction Markets

Daily SOL price prediction game:
- Predict if SOL will be higher or lower in 24 hours
- 1% price movement threshold
- 300 XP for correct predictions
- 50 XP for participation
- Prediction history tracking
- Share results on Twitter

## 🏆 Achievements & Ranks

### Rank Progression
1. **VOID STALKER** (0 XP) - Green
2. **DUST HUNTER** (500 XP) - Green
3. **ENTROPY KILLER** (1000 XP) - Green
4. **SOLANA REAPER** (1500 XP) - Green
5. **JUPITER VANGUARD** (2000 XP) - Cyan
6. **MOBILE LEGEND** (2500 XP) - Orange (Jupiter Mobile only!)
7. **GOD OF VOID** (3000 XP) - Gold

## 🤝 Contributing

This is a competition submission, but feedback and suggestions are welcome!

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Jupiter Team** for the amazing APIs and mobile wallet
- **Solana Foundation** for the blockchain infrastructure
- **Helius** for the DAS API

## 📞 Contact

- Twitter: [@YourTwitter](https://twitter.com/YourTwitter)
- Discord: YourDiscord#0000
- Built for: Jupiter Gamification Track

---

**Built with ❤️ for the Jupiter ecosystem**

🔥 **Turn your dust into yield. Predict the markets. Dominate the leaderboard.** 🔥