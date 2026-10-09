-- Step 1: Add manufacturing_date column after equipment_no
ALTER TABLE equipment
  ADD COLUMN manufacturing_date DATE;

-- Step 2: Rename engine_sno to engine_dgno
ALTER TABLE equipment
  RENAME COLUMN engine_sno TO engine_dgno;

-- Step 3: Add warranty_status column to track In Warranty / Out of Warranty
ALTER TABLE equipment
  ADD COLUMN warranty_status VARCHAR(20) DEFAULT 'Out of Warranty';
