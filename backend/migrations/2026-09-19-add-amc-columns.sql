-- Add AMC columns to equipment table
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS in_amc BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS amc_start_date DATE,
  ADD COLUMN IF NOT EXISTS amc_end_date DATE;
