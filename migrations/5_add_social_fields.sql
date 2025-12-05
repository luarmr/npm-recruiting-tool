-- Migration: Add Social Links and Manual Override Fields
-- Adds columns for LinkedIn, Twitter, and manual overrides for Location/Company

ALTER TABLE saved_candidates
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS twitter_username text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS company text;
