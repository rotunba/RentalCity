DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can read related profiles'
  ) THEN
    CREATE POLICY "Users can read related profiles" ON profiles
      FOR SELECT USING (
        id = auth.uid()
        OR is_admin()
        OR EXISTS (
          SELECT 1
          FROM applications a
          JOIN properties p ON p.id = a.property_id
          WHERE a.tenant_id = profiles.id
            AND p.landlord_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM applications a
          JOIN properties p ON p.id = a.property_id
          WHERE a.tenant_id = auth.uid()
            AND p.landlord_id = profiles.id
        )
        OR EXISTS (
          SELECT 1
          FROM message_threads mt
          WHERE (mt.tenant_id = auth.uid() AND mt.landlord_id = profiles.id)
             OR (mt.landlord_id = auth.uid() AND mt.tenant_id = profiles.id)
        )
      );
  END IF;
END $$;
