-- Tenant and landlord questionnaire storage + derived scores

-- Tenants: store raw answers and derived dimension scores
CREATE TABLE IF NOT EXISTS tenant_questionnaire (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  stability_score NUMERIC,          -- 0–10
  payment_risk_score NUMERIC,       -- 0–10 (higher = safer)
  affordability_score NUMERIC,      -- 0–10
  lifestyle_score NUMERIC,          -- 0–10
  space_fit_score NUMERIC,          -- 0–10
  overall_score NUMERIC,            -- 0–100
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tenant_questionnaire_updated_at
BEFORE UPDATE ON tenant_questionnaire
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Landlords: store raw answers and derived preference scores
CREATE TABLE IF NOT EXISTS landlord_questionnaire (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_strictness_score NUMERIC,  -- 0–10 (higher = stricter)
  risk_tolerance_score NUMERIC,     -- 0–10 (higher = more tolerant)
  conflict_style_score NUMERIC,     -- 0–10 (higher = calmer)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER landlord_questionnaire_updated_at
BEFORE UPDATE ON landlord_questionnaire
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE tenant_questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_questionnaire ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tenant questionnaire" ON tenant_questionnaire
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own landlord questionnaire" ON landlord_questionnaire
  FOR ALL USING (user_id = auth.uid());

