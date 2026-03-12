-- When set, a pending application is considered "unlocked" by the landlord (can accept/decline).
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;

COMMENT ON COLUMN applications.unlocked_at IS 'When the landlord unlocked this application; pending + unlocked = can accept/decline';
