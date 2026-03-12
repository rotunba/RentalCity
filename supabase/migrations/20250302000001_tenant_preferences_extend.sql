-- Extend tenant_preferences for lease preferences form
ALTER TABLE tenant_preferences ADD COLUMN IF NOT EXISTS lease_length_months INTEGER;
ALTER TABLE tenant_preferences ADD COLUMN IF NOT EXISTS has_pets BOOLEAN;
ALTER TABLE tenant_preferences ADD COLUMN IF NOT EXISTS living_situation TEXT;
