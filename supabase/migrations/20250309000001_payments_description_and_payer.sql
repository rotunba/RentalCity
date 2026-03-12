-- Add description and payer_id to payments for tenant vs landlord charges
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Update RLS: users read own payments (payer or application-related)
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (
    payer_id = auth.uid()
    OR
    application_id IN (
      SELECT id FROM applications WHERE tenant_id = auth.uid()
    )
    OR
    application_id IN (
      SELECT a.id FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE p.landlord_id = auth.uid()
    )
  );

-- Allow insert for payments (typically via backend/webhooks)
