-- Add AMC location and AMC amount columns to equipment table
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS amc_location VARCHAR(50),
  ADD COLUMN IF NOT EXISTS amc_amount NUMERIC(12, 2);
