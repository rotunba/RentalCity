-- Return a tenant's universal application row to landlords who have a legitimate relationship
-- (application to their property and/or an existing message thread). Uses SECURITY DEFINER so
-- reads succeed regardless of PostgREST/RLS edge cases on universal_applications.

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

  IF NOT EXISTS (
    SELECT 1
    FROM public.applications a
    INNER JOIN public.properties p ON p.id = a.property_id
    WHERE a.tenant_id = p_tenant_id
      AND p.landlord_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.message_threads mt
    WHERE mt.tenant_id = p_tenant_id
      AND mt.landlord_id = auth.uid()
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

REVOKE ALL ON FUNCTION public.landlord_tenant_universal_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.landlord_tenant_universal_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.landlord_tenant_universal_application(uuid) TO service_role;

-- Align table RLS with the RPC (application OR inbox thread).
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
  );
