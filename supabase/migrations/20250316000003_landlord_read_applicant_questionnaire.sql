-- Allow landlords to read tenant_questionnaire for tenants who have applied to their property
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tenant_questionnaire'
      AND policyname = 'Landlords can read applicant questionnaire'
  ) THEN
    CREATE POLICY "Landlords can read applicant questionnaire" ON tenant_questionnaire
      FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM applications a
          JOIN properties p ON p.id = a.property_id
          WHERE a.tenant_id = tenant_questionnaire.user_id
            AND p.landlord_id = auth.uid()
        )
      );
  END IF;
END $$;
