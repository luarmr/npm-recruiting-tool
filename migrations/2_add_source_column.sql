-- Add source column to saved_candidates table
ALTER TABLE saved_candidates ADD COLUMN IF NOT EXISTS source text DEFAULT 'npm';

-- Backfill existing records (optional, as default handles new ones, but good for clarity)
UPDATE saved_candidates SET source = 'npm' WHERE source IS NULL;
