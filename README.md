# Dust Demons

Dust Demons is a mobile-first DeFi application designed to solve the issue of wallet fragmentation on Solana. It identifies low-balance assets ("dust") and scam tokens, allowing users to burn them in bulk to reclaim the 0.002 SOL rent deposit per account.

The application gamifies the wallet cleaning process with a tactical, terminal-style interface while prioritizing safety through Jupiter's strict token lists and price feeds.

## The Problem

Active Solana wallets accumulate significant clutter over time:

1. **Rent Lock:** Each open token account locks ~0.002 SOL. A wallet with 50 dust tokens has ~0.1 SOL ($15+) trapped in useless accounts.
2. **Security Risks:** Scam tokens and "brushing" attacks clutter the portfolio view and pose phishing risks.
3. **UX Friction:** Existing tools for burning tokens are often desktop-only, require signing individual transactions for each burn, or lack safety checks against burning valuable assets.

## The Solution

Dust Demons provides a batched, safety-first environment for wallet hygiene. It uses a "Mission" metaphor to categorize assets by risk level (Safe, Dust, Value) and allows users to sign a single batch transaction to clean dozens of accounts simultaneously.

## Jupiter Integration (Track Focus)

This project is built specifically for the **Gamification, DeFi & Mobile Adventures** track. It integrates deeply with Jupiter infrastructure in three key areas:

1. **Jupiter Price API (V2):**
The application queries the Jupiter V6 Price API (`https://api.jup.ag/price/v2`) for every scanned asset. This prevents users from accidentally burning tokens that have market value. If a token has a value greater than $0.01, it is flagged as "VALUE" instead of "DUST."
2. **Jupiter Token List API:**
We utilize the Jupiter Strict List (`https://token.jup.ag/strict`) to validate legitimate assets. Tokens not found on this list are flagged for higher scrutiny, aiding in scam detection.
3. **Deep Linking for Swaps:**
If a user attempts to select a token that has detected value via the Price API, the application intercepts the action and offers to deep-link the user to `jup.ag/swap`. This converts a potential burn action into a swap volume event for Jupiter.

## Technical Architecture

### Tech Stack

* **Framework:** Next.js 14 (React)
* **Blockchain Interaction:** `@solana/web3.js`, `@solana/spl-token`
* **Wallet Management:** Solana Wallet Adapter (supports Phantom, Solflare, etc.)
* **Styling/Animation:** Framer Motion (for mobile-native feel)
* **Data:** Jupiter Price API V2

### Key Features

**1. Transaction Batching**
To solve the friction of signing multiple transactions, the application groups burn instructions into chunks of 10 instructions per transaction. It utilizes `signAllTransactions` to allow the user to approve the entire cleanup process with a single wallet interaction, regardless of the number of tokens selected.

**2. Rent Recovery Calculation**
The application calculates the precise amount of SOL reclaimed (Total Burns * 0.002039 SOL) and displays this as a "Loot Drop" reward, reinforcing the financial incentive of wallet hygiene.

**3. Safety Heuristics**

* **Whitelist:** A hardcoded list of major assets (USDC, USDT, SOL, JUP) is explicitly blocked from the UI to prevent accidental selection.
* **Price Protection:** Assets with USD value > $0.01 trigger a modal warning rather than a selection event.
* **Scam Detection:** Keyword matching checks for phishing domains in token names.

## Installation & Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dust-demons.git
cd dust-demons

```


2. Install dependencies:
```bash
npm install

```


3. Run the development server:
```bash
npm run dev

```


4. Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser (or use mobile developer tools to test the responsive view).

## Future Development Roadmap

* **Global Leaderboard:** Implementation of a backend service to track total SOL reclaimed across all users, displaying a global high-score list to foster community competition.
* **Ecosystem Token Integration:** A proposed "Burn-to-Earn" mechanism where users receive a native utility token in exchange for cleaning up the network state.
* **Deep Wallet Linking:** Enhanced integration with mobile wallet browsers (Solana Mobile Stack) to support deep-linking for smoother authentication flows on Android devices.