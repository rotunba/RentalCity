-- Allow landlords to read tenant_preferences for tenants who have applied to their property
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tenant_preferences'
      AND policyname = 'Landlords can read applicant preferences'
  ) THEN
    CREATE POLICY "Landlords can read applicant preferences" ON tenant_preferences
      FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM applications a
          JOIN properties p ON p.id = a.property_id
          WHERE a.tenant_id = tenant_preferences.user_id
            AND p.landlord_id = auth.uid()
        )
      );
  END IF;
END $$;
