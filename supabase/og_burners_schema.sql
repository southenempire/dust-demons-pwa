-- OG Burner NFT Tracking Table
-- Run this in Supabase SQL Editor

CREATE TABLE og_burners (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  burn_count INTEGER DEFAULT 0,
  first_burn_timestamp TIMESTAMPTZ,
  last_burn_timestamp TIMESTAMPTZ,
  nft_minted BOOLEAN DEFAULT FALSE,
  nft_mint_address TEXT,
  nft_minted_at TIMESTAMPTZ,
  og_number INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_og_burners_wallet ON og_burners(wallet_address);
CREATE INDEX idx_og_burners_number ON og_burners(og_number);
CREATE INDEX idx_og_burners_minted ON og_burners(nft_minted);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_og_burners_updated_at BEFORE UPDATE
    ON og_burners FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE og_burners ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can view OG burners"
  ON og_burners FOR SELECT
  USING (true);

-- Policy: Service role can insert/update
CREATE POLICY "Service role can manage OG burners"
  ON og_burners FOR ALL
  USING (auth.role() = 'service_role');
