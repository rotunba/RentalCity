-- Allow notifications to reference a property so "View Property" can link to the specific listing.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

COMMENT ON COLUMN notifications.property_id IS 'When set, frontend can link "View Property" to this property when link is null';
