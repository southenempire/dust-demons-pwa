-- Create referrals table for tracking referral codes and rewards
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_wallet TEXT NOT NULL,
  referrer_code TEXT UNIQUE NOT NULL,
  referee_wallet TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(referrer_wallet, referee_wallet)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrer_code ON referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrer_wallet ON referrals(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referee_wallet ON referrals(referee_wallet);
CREATE INDEX IF NOT EXISTS idx_status ON referrals(status);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read referrals
CREATE POLICY "Referrals are viewable by everyone"
  ON referrals FOR SELECT
  USING (true);

-- Policy: Anyone can insert referrals (for tracking)
CREATE POLICY "Anyone can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- Policy: Only service role can update referrals
CREATE POLICY "Service role can update referrals"
  ON referrals FOR UPDATE
  USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (I,O,0,1)
  result TEXT := 'DUST-';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get referral stats for a wallet
CREATE OR REPLACE FUNCTION get_referral_stats(wallet_address TEXT)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_referrals', COUNT(*),
    'completed_referrals', COUNT(*) FILTER (WHERE status = 'completed'),
    'pending_referrals', COUNT(*) FILTER (WHERE status = 'pending'),
    'total_xp_earned', COALESCE(SUM(xp_awarded), 0),
    'referral_code', MAX(referrer_code)
  ) INTO stats
  FROM referrals
  WHERE referrer_wallet = wallet_address;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  referrer_wallet TEXT,
  total_referrals BIGINT,
  total_xp BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.referrer_wallet,
    COUNT(*) FILTER (WHERE status = 'completed') as total_referrals,
    COALESCE(SUM(xp_awarded), 0) as total_xp
  FROM referrals r
  GROUP BY r.referrer_wallet
  HAVING COUNT(*) FILTER (WHERE status = 'completed') > 0
  ORDER BY total_referrals DESC, total_xp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
