-- ============================================================
-- TRIGGER SIMPLIFIÉ — Version corrigée
-- Coller dans Supabase SQL Editor → Run
-- ============================================================

-- 1. Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recréer le trigger simplifié
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, prenom, nom, role, organisation_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'etudiant'),
    NULLIF(NEW.raw_user_meta_data->>'organisation_id', '')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Politiques pour organisations (DROP avant CREATE)
DROP POLICY IF EXISTS "service_role_organisations_insert" ON organisations;
DROP POLICY IF EXISTS "service_role_organisations_all" ON organisations;
DROP POLICY IF EXISTS "members_own_org" ON organisations;
DROP POLICY IF EXISTS "super_admin_all" ON organisations;

CREATE POLICY "org_insert_authenticated" ON organisations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "org_select_own" ON organisations
  FOR SELECT USING (
    id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "org_update_admin" ON organisations
  FOR UPDATE USING (
    id IN (
      SELECT organisation_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 4. Vérification
SELECT 'Trigger simplifié recréé ✅' AS status;
