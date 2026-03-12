-- Support requests for authenticated users
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_user ON support_requests(user_id);
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_requests'
      AND policyname = 'Users can create own support requests'
  ) THEN
    CREATE POLICY "Users can create own support requests" ON support_requests
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_requests'
      AND policyname = 'Users can read own support requests'
  ) THEN
    CREATE POLICY "Users can read own support requests" ON support_requests
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_requests'
      AND policyname = 'Admins can manage all support requests'
  ) THEN
    CREATE POLICY "Admins can manage all support requests" ON support_requests
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'support_requests_updated_at'
  ) THEN
    CREATE TRIGGER support_requests_updated_at
      BEFORE UPDATE ON support_requests
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Extend tenant ratings to support current landlord tenant-rating flow
ALTER TABLE tenant_ratings
  ADD COLUMN IF NOT EXISTS tenant_external_id TEXT,
  ADD COLUMN IF NOT EXISTS tenant_name TEXT,
  ADD COLUMN IF NOT EXISTS property_name TEXT,
  ADD COLUMN IF NOT EXISTS property_address TEXT;

UPDATE tenant_ratings
SET tenant_external_id = tenant_id::text
WHERE tenant_external_id IS NULL
  AND tenant_id IS NOT NULL;

ALTER TABLE tenant_ratings
  ALTER COLUMN tenant_id DROP NOT NULL,
  ALTER COLUMN tenant_external_id SET NOT NULL;

ALTER TABLE tenant_ratings
  DROP CONSTRAINT IF EXISTS tenant_ratings_landlord_id_tenant_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_ratings_landlord_external_unique
  ON tenant_ratings(landlord_id, tenant_external_id);
