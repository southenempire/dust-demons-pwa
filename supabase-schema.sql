-- Supabase SQL Schema for Leaderboard
-- Run this in Supabase SQL Editor

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  wallet TEXT PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  total_burned INTEGER DEFAULT 0,
  sol_reclaimed DECIMAL(10, 3) DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank TEXT DEFAULT 'VOID STALKER',
  is_mobile BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for leaderboard queries (sorted by XP)
CREATE INDEX IF NOT EXISTS idx_players_xp ON players(xp DESC);

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet);

-- Enable Row Level Security (optional, for security)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON players
  FOR SELECT USING (true);

-- Create policy to allow insert/update (you can restrict this later)
CREATE POLICY "Allow insert/update" ON players
  FOR ALL USING (true);
