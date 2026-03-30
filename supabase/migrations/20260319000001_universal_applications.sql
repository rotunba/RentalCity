-- Universal rental application (new vs renewal) validity tracking

CREATE TABLE universal_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'withdrawn')),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_universal_applications_tenant_created_at
  ON universal_applications(tenant_id, created_at DESC);

CREATE INDEX idx_universal_applications_tenant_valid_until
  ON universal_applications(tenant_id, valid_until);

-- updated_at trigger
CREATE TRIGGER universal_applications_updated_at
  BEFORE UPDATE ON universal_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Row Level Security
ALTER TABLE universal_applications ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own universal applications
CREATE POLICY "Tenants can manage own universal applications"
  ON universal_applications
  FOR ALL
  USING (tenant_id = auth.uid());

-- Backfill for existing tenants (legacy behavior was derived from property-specific applications).
-- We use the earliest property application as the start of the universal 6-month window.
ALTER TABLE universal_applications DISABLE ROW LEVEL SECURITY;

INSERT INTO universal_applications (tenant_id, status, valid_until, created_at)
SELECT
  a.tenant_id,
  CASE
    WHEN (MIN(a.created_at) + interval '6 months') > now() THEN 'active'
    ELSE 'expired'
  END AS status,
  (MIN(a.created_at) + interval '6 months') AS valid_until,
  MIN(a.created_at) AS created_at
FROM applications a
WHERE a.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM universal_applications ua WHERE ua.tenant_id = a.tenant_id
  )
GROUP BY a.tenant_id;

ALTER TABLE universal_applications ENABLE ROW LEVEL SECURITY;

