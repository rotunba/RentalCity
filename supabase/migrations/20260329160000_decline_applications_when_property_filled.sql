-- When a listing is filled (leased), reject all
-- still-pending applications for that property. Set unlocked_at so the
-- applications_unlock_before_decision trigger allows pending -> rejected.

CREATE OR REPLACE FUNCTION public.decline_pending_apps_when_property_filled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status = 'leased'
  THEN
    UPDATE public.applications
    SET
      status = 'rejected',
      unlocked_at = COALESCE(unlocked_at, now()),
      updated_at = now()
    WHERE property_id = NEW.id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.decline_pending_apps_when_property_filled() IS
  'Rejects pending applications when property status becomes leased (filled).';

DROP TRIGGER IF EXISTS properties_decline_pending_on_filled ON public.properties;
CREATE TRIGGER properties_decline_pending_on_filled
  AFTER UPDATE OF status ON public.properties
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.decline_pending_apps_when_property_filled();
