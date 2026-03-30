-- Sample listing images for dev landlord (seed user). Only fills rows with no photos yet.
DO $$
DECLARE
  landlord_uid uuid;
BEGIN
  SELECT id INTO landlord_uid
  FROM auth.users
  WHERE email = 'landlord@test.rentalcity.com'
  LIMIT 1;

  IF landlord_uid IS NULL THEN
    RAISE NOTICE 'No auth.users row for landlord@test.rentalcity.com; skipping sample property photos';
    RETURN;
  END IF;

  UPDATE public.properties
  SET photo_urls = ARRAY[
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&h=800&fit=crop'
  ]
  WHERE landlord_id = landlord_uid
    AND address_line1 = '123 Oak Street, Apt 4B'
    AND cardinality(photo_urls) = 0;

  UPDATE public.properties
  SET photo_urls = ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop'
  ]
  WHERE landlord_id = landlord_uid
    AND address_line1 = '456 Pine Avenue, Unit 2A'
    AND cardinality(photo_urls) = 0;

  UPDATE public.properties
  SET photo_urls = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop'
  ]
  WHERE landlord_id = landlord_uid
    AND address_line1 = '789 Maple Drive, Suite 1C'
    AND cardinality(photo_urls) = 0;
END $$;
