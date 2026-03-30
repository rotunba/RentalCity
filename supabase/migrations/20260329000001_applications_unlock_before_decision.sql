-- Pending applications cannot be approved or rejected until unlocked_at is set (same UPDATE may set both).

CREATE OR REPLACE FUNCTION applications_require_unlock_before_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')
     AND COALESCE(NEW.unlocked_at, OLD.unlocked_at) IS NULL THEN
    RAISE EXCEPTION 'Application must be unlocked before approval or rejection';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_unlock_before_decision ON applications;
CREATE TRIGGER applications_unlock_before_decision
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION applications_require_unlock_before_decision();
