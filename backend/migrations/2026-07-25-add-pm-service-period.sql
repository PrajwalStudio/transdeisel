-- Add pm_service_period column to service_request table for PM call categories
ALTER TABLE service_request
  ADD COLUMN IF NOT EXISTS pm_service_period VARCHAR(20);
