-- ════════════════════════════════════════════════════════════
-- 🔥 KILOS MORTALES — SETUP DE SUPABASE (v2 — métrico)
-- ════════════════════════════════════════════════════════════

-- Drop existentes (no hay datos aún)
DROP TABLE IF EXISTS weight_entries CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

-- Admin
CREATE TABLE admin (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participantes (todo en unidades base: cm y lbs)
CREATE TABLE participants (
  id BIGSERIAL PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  height_cm DECIMAL(5,1) NOT NULL,
  age INTEGER NOT NULL,
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'heavy', 'very_heavy')),
  starting_weight_lbs DECIMAL(5,1) NOT NULL,
  unit_preference TEXT NOT NULL DEFAULT 'metric' CHECK (unit_preference IN ('metric', 'imperial')),
  weight_unit TEXT NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  height_unit TEXT NOT NULL DEFAULT 'metric' CHECK (height_unit IN ('metric', 'imperial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight entries (almacenado en lbs y cm siempre)
CREATE TABLE weight_entries (
  id BIGSERIAL PRIMARY KEY,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  weight_lbs DECIMAL(5,1) NOT NULL,
  waist_cm DECIMAL(5,1),
  body_fat_pct DECIMAL(4,1),
  activities TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_weight_entries_participant ON weight_entries(participant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_participants_nickname ON participants(nickname);

-- Row Level Security
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all admin" ON admin;
DROP POLICY IF EXISTS "Allow all participants" ON participants;
DROP POLICY IF EXISTS "Allow all weight_entries" ON weight_entries;

CREATE POLICY "Allow all admin" ON admin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all weight_entries" ON weight_entries FOR ALL USING (true) WITH CHECK (true);

-- ═══ Migration v3 (semanal + métricas) ═══
-- Run if table already exists with old schema:
-- ALTER TABLE weight_entries ADD COLUMN IF NOT EXISTS waist_cm DECIMAL(5,1);
-- ALTER TABLE weight_entries ADD COLUMN IF NOT EXISTS body_fat_pct DECIMAL(4,1);
-- ALTER TABLE weight_entries ADD COLUMN IF NOT EXISTS activities TEXT;

-- ═══ Migration v4 (peso/altura por separado) ═══
-- ALTER TABLE participants ADD COLUMN IF NOT EXISTS weight_unit TEXT NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs'));
-- ALTER TABLE participants ADD COLUMN IF NOT EXISTS height_unit TEXT NOT NULL DEFAULT 'metric' CHECK (height_unit IN ('metric', 'imperial'));
