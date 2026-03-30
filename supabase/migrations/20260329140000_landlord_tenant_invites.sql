-- Landlord shareable invite links; tenants who redeem are limited to that landlord's
-- active listings for 10 days (enforced via RLS + application insert check).

CREATE TABLE landlord_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_landlord_invite_links_landlord ON landlord_invite_links(landlord_id);

CREATE TABLE tenant_invite_restrictions (
  tenant_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_display_name TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_tenant_invite_restrictions_ends_at ON tenant_invite_restrictions(ends_at);

-- Invoker: current user's active invite landlord, if any
CREATE OR REPLACE FUNCTION active_invite_landlord_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT landlord_id
  FROM tenant_invite_restrictions
  WHERE tenant_id = auth.uid()
    AND ends_at > now()
  ORDER BY ends_at DESC
  LIMIT 1;
$$;

-- Property insert eligibility for tenants (active listing + invite rules)
CREATE OR REPLACE FUNCTION tenant_may_apply_to_property(p_property UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_prop_landlord UUID;
  v_status TEXT;
  v_inv_landlord UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  SELECT landlord_id, status INTO v_prop_landlord, v_status
  FROM properties
  WHERE id = p_property;
  IF v_prop_landlord IS NULL OR v_status IS DISTINCT FROM 'active' THEN
    RETURN FALSE;
  END IF;
  SELECT landlord_id INTO v_inv_landlord
  FROM tenant_invite_restrictions
  WHERE tenant_id = auth.uid()
    AND ends_at > now()
  LIMIT 1;
  IF v_inv_landlord IS NULL THEN
    RETURN TRUE;
  END IF;
  RETURN v_prop_landlord = v_inv_landlord;
END;
$$;

-- Public preview (no auth)
CREATE OR REPLACE FUNCTION preview_landlord_invite(invite_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_landlord_id UUID;
  v_name TEXT;
BEGIN
  SELECT l.landlord_id, p.display_name
  INTO v_landlord_id, v_name
  FROM landlord_invite_links l
  JOIN profiles p ON p.id = l.landlord_id
  WHERE l.token = invite_token
  LIMIT 1;
  IF v_landlord_id IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'landlord_id', v_landlord_id,
    'landlord_name', COALESCE(NULLIF(trim(v_name), ''), 'Your host')
  );
END;
$$;

-- Redeem (authenticated tenants only)
CREATE OR REPLACE FUNCTION redeem_landlord_invite(invite_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_landlord UUID;
  v_role user_role;
  v_name TEXT;
  v_ends TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'tenant' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tenants_only');
  END IF;
  SELECT l.landlord_id, p.display_name
  INTO v_landlord, v_name
  FROM landlord_invite_links l
  JOIN profiles p ON p.id = l.landlord_id
  WHERE l.token = invite_token
  LIMIT 1;
  IF v_landlord IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;
  v_ends := now() + interval '10 days';
  INSERT INTO tenant_invite_restrictions (tenant_id, landlord_id, landlord_display_name, redeemed_at, ends_at)
  VALUES (
    auth.uid(),
    v_landlord,
    COALESCE(NULLIF(trim(v_name), ''), 'Your host'),
    now(),
    v_ends
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    landlord_id = EXCLUDED.landlord_id,
    landlord_display_name = EXCLUDED.landlord_display_name,
    redeemed_at = EXCLUDED.redeemed_at,
    ends_at = EXCLUDED.ends_at;
  RETURN jsonb_build_object('ok', true, 'landlord_id', v_landlord, 'ends_at', v_ends);
END;
$$;

GRANT EXECUTE ON FUNCTION preview_landlord_invite(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION redeem_landlord_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION active_invite_landlord_id() TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_may_apply_to_property(UUID) TO authenticated;

ALTER TABLE landlord_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invite_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords manage own invite links"
  ON landlord_invite_links
  FOR ALL
  USING (landlord_id = auth.uid())
  WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Tenants read own invite restriction"
  ON tenant_invite_restrictions
  FOR SELECT
  USING (tenant_id = auth.uid());

-- Replace public catalog policy with invite-aware rule
DROP POLICY IF EXISTS "Anyone can read active properties" ON properties;

CREATE POLICY "Read properties catalog and own listings"
  ON properties
  FOR SELECT
  USING (
    is_admin()
    OR landlord_id = auth.uid()
    OR (
      status = 'active'
      AND (
        auth.uid() IS NULL
        OR active_invite_landlord_id() IS NULL
        OR landlord_id = active_invite_landlord_id()
      )
    )
  );

-- Split tenant application policy so inserts respect invite window
DROP POLICY IF EXISTS "Tenants can manage own applications" ON applications;

CREATE POLICY "Tenants can select own applications"
  ON applications
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can update own applications"
  ON applications
  FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete own applications"
  ON applications
  FOR DELETE
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert own applications"
  ON applications
  FOR INSERT
  WITH CHECK (
    tenant_id = auth.uid()
    AND tenant_may_apply_to_property(property_id)
  );
