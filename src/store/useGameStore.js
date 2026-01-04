import { create } from 'zustand';

export const useGameStore = create((set) => ({
  // Game Flow State
  gameState: 'splash', // splash -> identity -> scanning -> playing
  
  // Player Data
  username: "",
  walletAddress: null,
  score: 0,
  
  // Inventory (NFTs)
  bounties: [], 
  
  // Actions
  setGameState: (state) => set({ gameState: state }),
  setUsername: (name) => set({ username: name }),
  setWalletAddress: (addr) => set({ walletAddress: addr }),
  setBounties: (data) => set({ bounties: data }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  resetGame: () => set({ score: 0, gameState: 'playing' }),
}));