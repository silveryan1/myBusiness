-- ============================================================
-- 005 — Sécurité, paiements (FCFA / Mobile Money), certificats vérifiables
-- À exécuter une fois : Supabase › SQL Editor › coller › Run.
-- Peut être relancé sans casse (IF EXISTS / IF NOT EXISTS partout).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Valeurs par défaut adaptées au marché (Cameroun, FCFA)
-- ------------------------------------------------------------
ALTER TABLE organisations ALTER COLUMN pays SET DEFAULT 'Cameroun';
ALTER TABLE paiements ALTER COLUMN devise SET DEFAULT 'XAF';

-- ------------------------------------------------------------
-- 2. Colonnes utilisées par l'application
-- ------------------------------------------------------------
-- Sessions : lieu, mode et description (le formulaire les envoyait déjà, la table ne les avait pas)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS lieu TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'presentiel';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;
DO $$ BEGIN
  ALTER TABLE sessions ADD CONSTRAINT sessions_mode_check
    CHECK (mode IN ('presentiel', 'distanciel', 'hybride'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE sessions ADD CONSTRAINT sessions_dates_check CHECK (date_fin >= date_debut);
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL; END $$;

-- Notes : une note finale par étudiant et par session, sur 20 ou sur 100
-- (doublons éventuels : on garde la plus récente)
DELETE FROM notes a USING notes b
  WHERE a.session_id = b.session_id AND a.etudiant_id = b.etudiant_id
    AND (a.created_at < b.created_at OR (a.created_at IS NOT DISTINCT FROM b.created_at AND a.ctid < b.ctid));
CREATE UNIQUE INDEX IF NOT EXISTS notes_session_etudiant_unique ON notes (session_id, etudiant_id);
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_note_check;
DO $$ BEGIN
  ALTER TABLE notes ADD CONSTRAINT notes_note_bornes CHECK (note >= 0 AND note <= note_max);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE notes ADD CONSTRAINT notes_note_max_valeurs CHECK (note_max IN (20, 100));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL; END $$;

-- Paiements : encaissements enregistrés par l'administration (espèces, MTN MoMo, Orange Money…)
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS reference TEXT;          -- n° de transaction Mobile Money
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS commentaire TEXT;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS enregistre_par UUID REFERENCES profiles(id);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS recu_numero TEXT;
CREATE SEQUENCE IF NOT EXISTS recu_numero_seq;
ALTER TABLE paiements ALTER COLUMN recu_numero
  SET DEFAULT 'REC-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('recu_numero_seq')::text, 5, '0');
UPDATE paiements SET recu_numero = DEFAULT WHERE recu_numero IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS paiements_recu_numero_unique ON paiements (recu_numero);
DO $$ BEGIN
  ALTER TABLE paiements ADD CONSTRAINT paiements_methode_check
    CHECK (methode IS NULL OR methode IN ('especes', 'mtn_momo', 'orange_money', 'virement', 'autre'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE paiements ADD CONSTRAINT paiements_montant_positif CHECK (montant > 0);
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_paiements_organisation ON paiements (organisation_id);
CREATE INDEX IF NOT EXISTS idx_paiements_inscription ON paiements (inscription_id);

-- Certificats : numéro lisible + code de vérification publique
ALTER TABLE certificats ADD COLUMN IF NOT EXISTS mention TEXT;
ALTER TABLE certificats ADD COLUMN IF NOT EXISTS delivre_par UUID REFERENCES profiles(id);
ALTER TABLE certificats ADD COLUMN IF NOT EXISTS code_verification TEXT;
CREATE SEQUENCE IF NOT EXISTS certificat_numero_seq;
ALTER TABLE certificats ALTER COLUMN numero
  SET DEFAULT 'CERT-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('certificat_numero_seq')::text, 5, '0');
ALTER TABLE certificats ALTER COLUMN code_verification
  SET DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
UPDATE certificats SET code_verification = DEFAULT WHERE code_verification IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS certificats_code_unique ON certificats (code_verification);
CREATE UNIQUE INDEX IF NOT EXISTS certificats_session_etudiant_unique ON certificats (session_id, etudiant_id);

-- ------------------------------------------------------------
-- 3. Sécurité des profils
-- ------------------------------------------------------------
-- Avant : « profiles_insert » WITH CHECK (true) et « own_profile_update » permettaient à
-- n'importe quel utilisateur de se donner le rôle admin / super_admin ou de rejoindre
-- n'importe quelle organisation.
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'etudiant' AND organisation_id IS NULL);

DROP POLICY IF EXISTS "admin_update_org_profiles" ON profiles;
CREATE POLICY "admin_update_org_profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (organisation_id = auth_user_org());

-- Champs sensibles (rôle, organisation, actif) : seuls le serveur (clé service_role, SQL Editor)
-- et un administrateur de la MÊME organisation peuvent les changer ; personne ne devient
-- super_admin depuis l'application ; un administrateur ne se retire pas lui-même ses droits.
CREATE OR REPLACE FUNCTION proteger_champs_profil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appelant_role user_role;
  appelant_org UUID;
BEGIN
  IF auth.uid() IS NULL OR coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  SELECT role, organisation_id INTO appelant_role, appelant_org FROM profiles WHERE id = auth.uid();
  IF appelant_role IN ('admin', 'super_admin')
     AND OLD.organisation_id = appelant_org
     AND NEW.organisation_id IS NOT DISTINCT FROM OLD.organisation_id
     AND NEW.id <> auth.uid() THEN
    IF NEW.role = 'super_admin' AND OLD.role <> 'super_admin' THEN
      NEW.role := OLD.role;
    END IF;
    RETURN NEW;
  END IF;
  NEW.role := OLD.role;
  NEW.organisation_id := OLD.organisation_id;
  NEW.is_active := OLD.is_active;
  NEW.email := OLD.email;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_proteger_champs_profil ON profiles;
CREATE TRIGGER trigger_proteger_champs_profil
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION proteger_champs_profil();

-- ------------------------------------------------------------
-- 4. Organisations : créées seulement par le serveur (route /api/setup-organisation)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "org_insert" ON organisations;
DROP POLICY IF EXISTS "org_insert_authenticated" ON organisations;

-- ------------------------------------------------------------
-- 5. Formations : les étudiants ne voient que le catalogue publié
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "org_formations_select" ON formations;
CREATE POLICY "org_formations_select" ON formations
  FOR SELECT USING (
    (organisation_id = auth_user_org() AND (status = 'published' OR auth_user_role() IN ('admin', 'formateur')))
    OR auth_user_role() = 'super_admin'
  );

-- ------------------------------------------------------------
-- 6. Sessions : l'administration gère tout, le formateur met à jour SES sessions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "admin_formateur_sessions_write" ON sessions;
DROP POLICY IF EXISTS "admin_sessions_write" ON sessions;
DROP POLICY IF EXISTS "formateur_sessions_update" ON sessions;
CREATE POLICY "admin_sessions_write" ON sessions
  FOR ALL USING (organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (organisation_id = auth_user_org());
CREATE POLICY "formateur_sessions_update" ON sessions
  FOR UPDATE USING (organisation_id = auth_user_org() AND formateur_id = auth.uid())
  WITH CHECK (organisation_id = auth_user_org() AND formateur_id = auth.uid());

-- ------------------------------------------------------------
-- 7. Inscriptions
-- ------------------------------------------------------------
-- L'étudiant demande une inscription (toujours « pending ») à une session de SON organisation ;
-- l'administration confirme. Le formateur voit les inscrits de ses sessions.
DROP POLICY IF EXISTS "etudiant_inscriptions_insert" ON inscriptions;
CREATE POLICY "etudiant_inscriptions_insert" ON inscriptions
  FOR INSERT WITH CHECK (
    organisation_id = auth_user_org()
    AND etudiant_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM sessions s JOIN formations f ON f.id = s.formation_id
      WHERE s.id = session_id AND s.organisation_id = auth_user_org()
        AND s.status IN ('scheduled', 'ongoing') AND f.status = 'published'
    )
  );
DROP POLICY IF EXISTS "admin_inscriptions_insert" ON inscriptions;
CREATE POLICY "admin_inscriptions_insert" ON inscriptions
  FOR INSERT WITH CHECK (
    organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin')
    AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.organisation_id = auth_user_org())
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = etudiant_id AND p.organisation_id = auth_user_org())
  );
DROP POLICY IF EXISTS "etudiant_inscriptions_annuler" ON inscriptions;
CREATE POLICY "etudiant_inscriptions_annuler" ON inscriptions
  FOR UPDATE USING (etudiant_id = auth.uid() AND status = 'pending')
  WITH CHECK (etudiant_id = auth.uid() AND status = 'cancelled');

-- ------------------------------------------------------------
-- 8. Présences et notes : chacun ne voit que les siennes, l'équipe voit tout
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "org_presences" ON presences;
CREATE POLICY "org_presences" ON presences
  FOR SELECT USING (
    organisation_id = auth_user_org()
    AND (etudiant_id = auth.uid() OR auth_user_role() IN ('formateur', 'admin', 'super_admin'))
  );

-- ------------------------------------------------------------
-- 9. Paiements : enregistrés par l'administration, visibles par l'étudiant concerné
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "paiements_select" ON paiements;
CREATE POLICY "paiements_select" ON paiements
  FOR SELECT USING (
    organisation_id = auth_user_org()
    AND (etudiant_id = auth.uid() OR auth_user_role() IN ('admin', 'super_admin'))
  );
DROP POLICY IF EXISTS "paiements_admin_write" ON paiements;
CREATE POLICY "paiements_admin_write" ON paiements
  FOR ALL USING (organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (
    organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin')
    AND EXISTS (
      SELECT 1 FROM inscriptions i
      WHERE i.id = inscription_id AND i.organisation_id = auth_user_org() AND i.etudiant_id = paiements.etudiant_id
    )
  );

-- ------------------------------------------------------------
-- 10. Certificats : délivrés par l'administration
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "certificats_admin_write" ON certificats;
CREATE POLICY "certificats_admin_write" ON certificats
  FOR ALL USING (organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (
    organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin')
    AND EXISTS (
      SELECT 1 FROM inscriptions i
      WHERE i.session_id = certificats.session_id AND i.etudiant_id = certificats.etudiant_id
        AND i.organisation_id = auth_user_org() AND i.status IN ('confirmed', 'completed')
    )
  );

-- Vérification publique d'un certificat (page /verifier/CODE, sans compte) :
-- ne renvoie que ce qui est imprimé sur le certificat, et seulement pour un code exact.
CREATE OR REPLACE FUNCTION verifier_certificat(code TEXT)
RETURNS TABLE (
  numero TEXT, etudiant TEXT, formation TEXT, organisation TEXT,
  date_delivrance DATE, mention TEXT, is_valide BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.numero, trim(p.prenom || ' ' || p.nom), f.titre, o.nom, c.date_delivrance, c.mention, c.is_valide
  FROM certificats c
  JOIN profiles p ON p.id = c.etudiant_id
  JOIN sessions s ON s.id = c.session_id
  JOIN formations f ON f.id = s.formation_id
  JOIN organisations o ON o.id = c.organisation_id
  WHERE c.code_verification = upper(trim(code))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION verifier_certificat(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verifier_certificat(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------
-- 11. Salles, supports de cours, messages lus
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "org_salles_select" ON salles;
CREATE POLICY "org_salles_select" ON salles FOR SELECT USING (organisation_id = auth_user_org());
DROP POLICY IF EXISTS "admin_salles_write" ON salles;
CREATE POLICY "admin_salles_write" ON salles
  FOR ALL USING (organisation_id = auth_user_org() AND auth_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (organisation_id = auth_user_org());

DROP POLICY IF EXISTS "org_supports_select" ON supports_cours;
CREATE POLICY "org_supports_select" ON supports_cours FOR SELECT USING (organisation_id = auth_user_org());
DROP POLICY IF EXISTS "equipe_supports_write" ON supports_cours;
CREATE POLICY "equipe_supports_write" ON supports_cours
  FOR ALL USING (organisation_id = auth_user_org() AND auth_user_role() IN ('formateur', 'admin', 'super_admin'))
  WITH CHECK (organisation_id = auth_user_org());

DROP POLICY IF EXISTS "messages_marquer_lu" ON messages;
CREATE POLICY "messages_marquer_lu" ON messages
  FOR UPDATE USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());

-- ------------------------------------------------------------
-- 12. Index utiles
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notes_session ON notes (session_id);
CREATE INDEX IF NOT EXISTS idx_certificats_etudiant ON certificats (etudiant_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);

SELECT 'Migration 005 appliquée ✅' AS status;
