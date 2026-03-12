CREATE OR REPLACE FUNCTION touch_message_thread_on_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_touch_thread_updated_at ON messages;

CREATE TRIGGER messages_touch_thread_updated_at
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION touch_message_thread_on_message_insert();
