-- ============================================================
-- FIX COMPLET : Supprimer l'ancien trigger et le recréer
-- Coller dans Supabase SQL Editor → Run
-- ============================================================

-- 1. Supprimer l'ancien trigger et l'ancienne fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recréer la fonction corrigée
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id  UUID;
  org_nom     TEXT;
  org_slug    TEXT;
  membre_role user_role;
BEGIN
  org_nom     := NEW.raw_user_meta_data->>'organisation_nom';
  org_slug    := NEW.raw_user_meta_data->>'organisation_slug';
  membre_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'etudiant'
  );

  -- CAS 1 : Inscription directe → crée son organisation + profil admin
  IF org_nom IS NOT NULL AND org_nom != '' THEN

    INSERT INTO organisations (nom, slug, status)
    VALUES (
      org_nom,
      COALESCE(
        NULLIF(org_slug, ''),
        lower(regexp_replace(org_nom, '[^a-zA-Z0-9]+', '-', 'g'))
      ),
      'trial'
    )
    ON CONFLICT (slug) DO UPDATE SET nom = EXCLUDED.nom
    RETURNING id INTO new_org_id;

    INSERT INTO profiles (id, email, prenom, nom, role, organisation_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
      COALESCE(NEW.raw_user_meta_data->>'nom', ''),
      'admin',
      new_org_id
    );

  -- CAS 2 : Invitation par un admin → rejoint l'organisation existante
  ELSE

    INSERT INTO profiles (id, email, prenom, nom, role, organisation_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
      COALESCE(NEW.raw_user_meta_data->>'nom', ''),
      membre_role,
      NULLIF(NEW.raw_user_meta_data->>'organisation_id', '')::UUID
    );

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- En cas d'erreur, créer quand même un profil minimal
    INSERT INTO profiles (id, email, prenom, nom, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
      COALESCE(NEW.raw_user_meta_data->>'nom', ''),
      'etudiant'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Vérification
SELECT 'Trigger recréé avec succès ✅' AS status;
