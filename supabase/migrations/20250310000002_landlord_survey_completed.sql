-- Track when a landlord completed the compatibility survey (so we can redirect them back if they log in before finishing).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS landlord_survey_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.landlord_survey_completed_at IS 'When the landlord completed the onboarding compatibility survey; null means not yet completed';
