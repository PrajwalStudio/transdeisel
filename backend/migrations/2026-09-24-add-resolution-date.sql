-- Migration: Add resolution_date column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS resolution_date DATE;
