-- 1) Ensure any authenticated user can SELECT all tenant_ratings rows (shared tenant profile).
--    If 20260331100000 was never applied, landlords only saw their own review.
-- 2) Allow reading other landlords' profiles when they reviewed the same tenant_external_id,
--    so PostgREST embed landlord:landlord_id(display_name) works on review lists.

DROP POLICY IF EXISTS "Landlords can read and create ratings" ON tenant_ratings;

DROP POLICY IF EXISTS "tenant_ratings_select_authenticated" ON tenant_ratings;
CREATE POLICY "tenant_ratings_select_authenticated"
ON tenant_ratings FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "tenant_ratings_insert_own" ON tenant_ratings;
CREATE POLICY "tenant_ratings_insert_own"
ON tenant_ratings FOR INSERT TO authenticated
WITH CHECK (landlord_id = auth.uid());

DROP POLICY IF EXISTS "tenant_ratings_update_own" ON tenant_ratings;
CREATE POLICY "tenant_ratings_update_own"
ON tenant_ratings FOR UPDATE TO authenticated
USING (landlord_id = auth.uid())
WITH CHECK (landlord_id = auth.uid());

DROP POLICY IF EXISTS "tenant_ratings_delete_own" ON tenant_ratings;
CREATE POLICY "tenant_ratings_delete_own"
ON tenant_ratings FOR DELETE TO authenticated
USING (landlord_id = auth.uid());

-- So PostgREST can embed landlord:landlord_id(display_name) on tenant_ratings:
-- - Tenants: read profiles of landlords who rated them (tenant_external_id = auth user).
-- - Landlords: read profiles of anyone who rated a tenant who applied to one of their properties.
DROP POLICY IF EXISTS "profiles_select_co_reviewers_shared_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_shared_reviews_ui" ON profiles;
CREATE POLICY "profiles_select_for_shared_reviews_ui"
ON profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tenant_ratings tr
    WHERE tr.landlord_id = profiles.id
      AND tr.tenant_external_id = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.tenant_ratings tr
    INNER JOIN public.applications a ON a.tenant_id::text = tr.tenant_external_id
    INNER JOIN public.properties p ON p.id = a.property_id AND p.landlord_id = auth.uid()
    WHERE tr.landlord_id = profiles.id
  )
);
