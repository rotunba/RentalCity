-- Track when a tenant completed the compatibility survey (so we can gate matches and avoid restarting the survey).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tenant_survey_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.tenant_survey_completed_at IS 'When the tenant completed the compatibility survey; null means not yet completed';

