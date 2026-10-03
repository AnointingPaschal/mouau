-- ══════════════════════════════════════════════════════════
-- MOUAU Wallet & Flutterwave Integration — Run in Supabase
-- ══════════════════════════════════════════════════════════

-- 1. Wallets (one per student)
CREATE TABLE IF NOT EXISTS wallets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    TEXT UNIQUE NOT NULL,
  balance       DECIMAL(15,2) DEFAULT 0,
  account_number TEXT,
  bank_name     TEXT,
  account_name  TEXT,
  flw_ref       TEXT,
  order_ref     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('credit','debit')),
  category         TEXT NOT NULL, -- deposit | transfer | airtime | data | betting | electricity | cable | other
  amount           DECIMAL(15,2) NOT NULL,
  fee              DECIMAL(15,2) DEFAULT 0,
  reference        TEXT UNIQUE,
  flw_ref          TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  narration        TEXT,
  recipient_name   TEXT,
  recipient_account TEXT,
  recipient_bank   TEXT,
  phone_number     TEXT,
  network          TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS wallet_transactions_student_idx ON wallet_transactions(student_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_ref_idx     ON wallet_transactions(reference);

-- 4. RLS
ALTER TABLE wallets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions  ENABLE ROW LEVEL SECURITY;

-- Students see only their own wallet & transactions
DROP POLICY IF EXISTS "own wallet"         ON wallets;
DROP POLICY IF EXISTS "own transactions"   ON wallet_transactions;
DROP POLICY IF EXISTS "service all wallet" ON wallets;
DROP POLICY IF EXISTS "service all txn"    ON wallet_transactions;

CREATE POLICY "own wallet"
  ON wallets FOR ALL
  USING (student_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "own transactions"
  ON wallet_transactions FOR ALL
  USING (student_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role bypasses RLS automatically (used by API routes with adminDb)

-- 5. Flutterwave settings keys in app_settings
INSERT INTO app_settings (key, value, category, label, is_secret) VALUES
  ('flw_public_key',    '', 'flutterwave', 'Public Key (FLWPUBK_...)',    false),
  ('flw_secret_key',    '', 'flutterwave', 'Secret Key (FLWSECK_...)',    true),
  ('flw_encryption_key','', 'flutterwave', 'Encryption Key (10 chars)',   true),
  ('flw_webhook_hash',  '', 'flutterwave', 'Webhook Verification Hash',   true)
ON CONFLICT (key) DO NOTHING;
