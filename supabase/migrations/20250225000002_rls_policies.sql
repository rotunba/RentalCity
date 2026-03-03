-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Helper: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is landlord
CREATE OR REPLACE FUNCTION is_landlord()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'landlord'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());

-- tenant_preferences
CREATE POLICY "Tenants can manage own preferences" ON tenant_preferences
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can read all preferences" ON tenant_preferences FOR SELECT USING (is_admin());

-- properties
CREATE POLICY "Anyone can read active properties" ON properties
  FOR SELECT USING (status = 'active' OR landlord_id = auth.uid() OR is_admin());
CREATE POLICY "Landlords can insert own properties" ON properties
  FOR INSERT WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "Landlords can update own properties" ON properties
  FOR UPDATE USING (landlord_id = auth.uid());
CREATE POLICY "Landlords can delete own properties" ON properties
  FOR DELETE USING (landlord_id = auth.uid());
CREATE POLICY "Admins can manage all properties" ON properties FOR ALL USING (is_admin());

-- applications
CREATE POLICY "Tenants can manage own applications" ON applications
  FOR ALL USING (tenant_id = auth.uid());
CREATE POLICY "Landlords can read applications for own properties" ON applications
  FOR SELECT USING (
    property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
  );
CREATE POLICY "Landlords can update applications for own properties" ON applications
  FOR UPDATE USING (
    property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
  );
CREATE POLICY "Admins can manage all applications" ON applications FOR ALL USING (is_admin());

-- message_threads
CREATE POLICY "Participants can read own threads" ON message_threads
  FOR SELECT USING (tenant_id = auth.uid() OR landlord_id = auth.uid());
CREATE POLICY "Participants can insert threads" ON message_threads
  FOR INSERT WITH CHECK (tenant_id = auth.uid() OR landlord_id = auth.uid());
CREATE POLICY "Admins can read all threads" ON message_threads FOR SELECT USING (is_admin());

-- messages
CREATE POLICY "Thread participants can read messages" ON messages
  FOR SELECT USING (
    thread_id IN (
      SELECT id FROM message_threads WHERE tenant_id = auth.uid() OR landlord_id = auth.uid()
    )
  );
CREATE POLICY "Thread participants can insert messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    thread_id IN (
      SELECT id FROM message_threads WHERE tenant_id = auth.uid() OR landlord_id = auth.uid()
    )
  );
CREATE POLICY "Admins can read all messages" ON messages FOR SELECT USING (is_admin());

-- notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can read all notifications" ON notifications FOR SELECT USING (is_admin());

-- reports
CREATE POLICY "Landlords can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Landlords can read own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (is_admin());

-- tenant_ratings
CREATE POLICY "Landlords can read and create ratings" ON tenant_ratings
  FOR ALL USING (landlord_id = auth.uid());
CREATE POLICY "Admins can manage all ratings" ON tenant_ratings FOR ALL USING (is_admin());

-- payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM applications WHERE tenant_id = auth.uid()
    ) OR
    application_id IN (
      SELECT a.id FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE p.landlord_id = auth.uid()
    )
  );
CREATE POLICY "Admins can read all payments" ON payments FOR SELECT USING (is_admin());
