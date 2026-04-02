-- Landlord profile: persist onboarding business fields.
-- Adds columns to profiles so they can be edited post-onboarding.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS landlord_property_count_range TEXT,
  ADD COLUMN IF NOT EXISTS landlord_experience_level TEXT;

-- Optional: constrain experience level to known values used in onboarding.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_landlord_experience_level_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_landlord_experience_level_check
      CHECK (
        landlord_experience_level IS NULL
        OR landlord_experience_level IN ('new', '1-3', '4-7', '8+')
      );
  END IF;
END $$;

-- Optional: constrain property count range to known values used in onboarding.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_landlord_property_count_range_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_landlord_property_count_range_check
      CHECK (
        landlord_property_count_range IS NULL
        OR landlord_property_count_range IN ('1', '2-5', '6-10', '10+')
      );
  END IF;
END $$;

