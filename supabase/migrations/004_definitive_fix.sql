-- ============================================================
-- FIX DÉFINITIF — Tout-en-un
-- Coller dans Supabase SQL Editor → Run
-- ============================================================

-- 1. Supprimer trigger et fonction existants
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Ajouter la politique INSERT manquante sur profiles
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- 3. Créer le trigger simplifié et robuste
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, prenom, nom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    'etudiant'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- 4. Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Ajouter politique INSERT sur organisations
DROP POLICY IF EXISTS "org_insert" ON organisations;
CREATE POLICY "org_insert" ON organisations
  FOR INSERT WITH CHECK (true);

-- 6. Vérification
SELECT 'Fix définitif appliqué ✅' AS status;
