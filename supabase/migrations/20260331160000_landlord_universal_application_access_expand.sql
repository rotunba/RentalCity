-- Landlords could open a tenant profile (e.g. after rating, invite window, or future flows) without an
-- applications row yet; the universal-application RPC/RLS previously only allowed application or message_thread.
-- Align with legitimate landlord–tenant ties: own rating of tenant, active invite restriction, or existing rules.

CREATE OR REPLACE FUNCTION public.landlord_tenant_universal_application(p_tenant_id uuid)
RETURNS TABLE (status text, valid_until timestamptz, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.properties p ON p.id = a.property_id
      WHERE a.tenant_id = p_tenant_id
        AND p.landlord_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.message_threads mt
      WHERE mt.tenant_id = p_tenant_id
        AND mt.landlord_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.tenant_ratings tr
      WHERE tr.landlord_id = auth.uid()
        AND (
          tr.tenant_external_id = p_tenant_id::text
          OR (tr.tenant_id IS NOT NULL AND tr.tenant_id = p_tenant_id)
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.tenant_invite_restrictions tir
      WHERE tir.tenant_id = p_tenant_id
        AND tir.landlord_id = auth.uid()
        AND tir.ends_at > now()
    )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ua.status, ua.valid_until, ua.created_at
  FROM public.universal_applications ua
  WHERE ua.tenant_id = p_tenant_id
  ORDER BY ua.created_at DESC
  LIMIT 1;
END;
$$;

DROP POLICY IF EXISTS "Landlords can read universal applications for matched tenants" ON universal_applications;

CREATE POLICY "Landlords can read universal applications for matched tenants"
  ON universal_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.message_threads mt
      WHERE mt.tenant_id = universal_applications.tenant_id
        AND mt.landlord_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.properties p ON p.id = a.property_id
      WHERE a.tenant_id = universal_applications.tenant_id
        AND p.landlord_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.tenant_ratings tr
      WHERE tr.landlord_id = (SELECT auth.uid())
        AND (
          tr.tenant_external_id = universal_applications.tenant_id::text
          OR (tr.tenant_id IS NOT NULL AND tr.tenant_id = universal_applications.tenant_id)
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.tenant_invite_restrictions tir
      WHERE tir.tenant_id = universal_applications.tenant_id
        AND tir.landlord_id = (SELECT auth.uid())
        AND tir.ends_at > now()
    )
  );
