-- Reviews are visible to all authenticated users (listing on tenant profile).
-- Only the authoring landlord may insert/update/delete their own row.

DROP POLICY IF EXISTS "Landlords can read and create ratings" ON tenant_ratings;

CREATE POLICY "tenant_ratings_select_authenticated"
ON tenant_ratings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "tenant_ratings_insert_own"
ON tenant_ratings FOR INSERT TO authenticated
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "tenant_ratings_update_own"
ON tenant_ratings FOR UPDATE TO authenticated
USING (landlord_id = auth.uid())
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "tenant_ratings_delete_own"
ON tenant_ratings FOR DELETE TO authenticated
USING (landlord_id = auth.uid());
