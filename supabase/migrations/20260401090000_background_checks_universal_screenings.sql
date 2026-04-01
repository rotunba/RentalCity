-- BackgroundChecks.com integration: store summary-only screening status per universal application window.

CREATE TABLE IF NOT EXISTS universal_application_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  universal_application_id UUID NOT NULL REFERENCES universal_applications(id) ON DELETE CASCADE,

  provider TEXT NOT NULL DEFAULT 'backgroundchecks_com',
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),

  report_sku TEXT,
  applicant_email TEXT,
  report_key TEXT UNIQUE,
  applicant_invite_url TEXT,

  -- Provider status codes (BackgroundChecks.com: A=Awaiting Applicant, P=Pending, C=Complete)
  report_status TEXT,
  background_status TEXT,
  employment_status TEXT,

  -- Rental City summary fields (what we show in-app)
  background_pass BOOLEAN,
  income_pass BOOLEAN,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, universal_application_id)
);

CREATE INDEX IF NOT EXISTS idx_universal_application_screenings_tenant_created_at
  ON universal_application_screenings(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_universal_application_screenings_universal_application
  ON universal_application_screenings(universal_application_id);

CREATE TRIGGER universal_application_screenings_updated_at
  BEFORE UPDATE ON universal_application_screenings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE universal_application_screenings ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own screening rows.
DROP POLICY IF EXISTS "Tenants can manage own universal application screenings" ON universal_application_screenings;
CREATE POLICY "Tenants can manage own universal application screenings"
  ON universal_application_screenings
  FOR ALL
  USING (tenant_id = auth.uid());

-- Landlords can read screenings when they can read the tenant's universal application.
DROP POLICY IF EXISTS "Landlords can read universal application screenings for matched tenants" ON universal_application_screenings;
CREATE POLICY "Landlords can read universal application screenings for matched tenants"
  ON universal_application_screenings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.properties p ON p.id = a.property_id
      WHERE a.tenant_id = universal_application_screenings.tenant_id
        AND p.landlord_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.message_threads mt
      WHERE mt.tenant_id = universal_application_screenings.tenant_id
        AND mt.landlord_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.tenant_ratings tr
      WHERE tr.landlord_id = auth.uid()
        AND (
          tr.tenant_external_id = universal_application_screenings.tenant_id::text
          OR (tr.tenant_id IS NOT NULL AND tr.tenant_id = universal_application_screenings.tenant_id)
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.tenant_invite_restrictions tir
      WHERE tir.tenant_id = universal_application_screenings.tenant_id
        AND tir.landlord_id = auth.uid()
        AND tir.ends_at > now()
    )
  );

