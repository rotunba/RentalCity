-- Allow landlords to read universal application validity for tenants who have applied to their listings.

CREATE POLICY "Landlords can read universal applications for matched tenants"
  ON universal_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.properties p ON p.id = a.property_id
      WHERE a.tenant_id = universal_applications.tenant_id
        AND p.landlord_id = (SELECT auth.uid())
    )
  );
