-- Tenants browsing matches need to read landlord profiles for listings they can see (embed + profile page).
-- Complements "Users can read related profiles" (application / message based).

DROP POLICY IF EXISTS "profiles_select_landlords_with_active_listings" ON public.profiles;
CREATE POLICY "profiles_select_landlords_with_active_listings"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.landlord_id = profiles.id
      AND p.status = 'active'
  )
);
