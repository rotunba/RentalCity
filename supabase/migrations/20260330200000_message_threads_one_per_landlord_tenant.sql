-- Person–person inbox: one thread per (landlord_id, tenant_id).
-- Optional listing context: property_id on thread (last focus) and on each message.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

UPDATE messages m
SET property_id = mt.property_id
FROM message_threads mt
WHERE m.thread_id = mt.id
  AND m.property_id IS NULL
  AND mt.property_id IS NOT NULL;

-- Merge duplicate threads (same landlord + tenant) into one row each.
WITH ranked AS (
  SELECT
    id,
    landlord_id,
    tenant_id,
    ROW_NUMBER() OVER (
      PARTITION BY landlord_id, tenant_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC, id ASC
    ) AS rn
  FROM message_threads
)
UPDATE messages m
SET thread_id = c.canonical_id
FROM ranked r
JOIN (
  SELECT landlord_id, tenant_id, id AS canonical_id
  FROM ranked
  WHERE rn = 1
) c ON c.landlord_id = r.landlord_id AND c.tenant_id = r.tenant_id
WHERE m.thread_id = r.id
  AND r.rn > 1;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY landlord_id, tenant_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC, id ASC
    ) AS rn
  FROM message_threads
)
DELETE FROM message_threads mt
USING ranked r
WHERE mt.id = r.id
  AND r.rn > 1;

ALTER TABLE message_threads
  ALTER COLUMN property_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_message_threads_landlord_tenant
  ON message_threads (landlord_id, tenant_id);

-- Landlords/tenants can refresh listing context on an existing thread
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'message_threads'
      AND policyname = 'Participants can update own threads'
  ) THEN
    CREATE POLICY "Participants can update own threads" ON message_threads
      FOR UPDATE
      USING (tenant_id = auth.uid() OR landlord_id = auth.uid())
      WITH CHECK (tenant_id = auth.uid() OR landlord_id = auth.uid());
  END IF;
END $$;
