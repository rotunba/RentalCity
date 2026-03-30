-- Add bio and city to profiles for tenant/landlord profile display
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
