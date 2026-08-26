-- ============================================================
-- myBusiness Platform — Schéma Base de Données
-- Supabase PostgreSQL — Multi-tenant SaaS
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'formateur', 'etudiant');
CREATE TYPE organisation_status AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE formation_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE session_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE inscription_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE paiement_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE presence_status AS ENUM ('present', 'absent', 'retard', 'excuse');
CREATE TYPE message_type AS ENUM ('direct', 'group', 'system');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- ============================================================
-- TABLE: organisations (Multi-tenant root)
-- ============================================================

CREATE TABLE organisations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom           TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  logo_url      TEXT,
  email_contact TEXT,
  telephone     TEXT,
  adresse       TEXT,
  ville         TEXT,
  pays          TEXT DEFAULT 'France',
  status        organisation_status DEFAULT 'trial',
  stripe_enabled BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: profiles (Utilisateurs liés à auth.users)
-- ============================================================

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'etudiant',
  prenom          TEXT NOT NULL,
  nom             TEXT NOT NULL,
  email           TEXT NOT NULL,
  telephone       TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  date_naissance  DATE,
  is_active       BOOLEAN DEFAULT true,
  fcm_token       TEXT,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: salles (Salles de formation)
-- ============================================================

CREATE TABLE salles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  nom             TEXT NOT NULL,
  capacite        INTEGER DEFAULT 20,
  description     TEXT,
  equipements     TEXT[],
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: formations (Catalogue des formations)
-- ============================================================

CREATE TABLE formations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  titre           TEXT NOT NULL,
  description     TEXT,
  objectifs       TEXT,
  prerequis       TEXT,
  duree_heures    INTEGER,
  niveau          TEXT CHECK (niveau IN ('debutant', 'intermediaire', 'avance')),
  categorie       TEXT,
  image_url       TEXT,
  prix            DECIMAL(10,2) DEFAULT 0,
  is_payante      BOOLEAN DEFAULT false,
  status          formation_status DEFAULT 'draft',
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: sessions (Instances d'une formation)
-- ============================================================

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  formation_id    UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  formateur_id    UUID REFERENCES profiles(id),
  salle_id        UUID REFERENCES salles(id),
  titre           TEXT,
  date_debut      TIMESTAMPTZ NOT NULL,
  date_fin        TIMESTAMPTZ NOT NULL,
  places_total    INTEGER DEFAULT 20,
  places_restantes INTEGER DEFAULT 20,
  status          session_status DEFAULT 'scheduled',
  notes_formateur TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: inscriptions (Étudiants inscrits à des sessions)
-- ============================================================

CREATE TABLE inscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  etudiant_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          inscription_status DEFAULT 'pending',
  date_inscription TIMESTAMPTZ DEFAULT NOW(),
  date_confirmation TIMESTAMPTZ,
  notes           TEXT,
  UNIQUE(session_id, etudiant_id)
);

-- ============================================================
-- TABLE: presences (Suivi présences)
-- ============================================================

CREATE TABLE presences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  etudiant_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  formateur_id    UUID REFERENCES profiles(id),
  status          presence_status NOT NULL,
  date_presence   DATE NOT NULL,
  heure_arrivee   TIME,
  commentaire     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, etudiant_id, date_presence)
);

-- ============================================================
-- TABLE: notes (Évaluations)
-- ============================================================

CREATE TABLE notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  etudiant_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  formateur_id    UUID NOT NULL REFERENCES profiles(id),
  note            DECIMAL(5,2) NOT NULL CHECK (note >= 0 AND note <= 20),
  note_max        DECIMAL(5,2) DEFAULT 20,
  type_evaluation TEXT,
  commentaire     TEXT,
  date_evaluation DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: paiements (Historique paiements)
-- ============================================================

CREATE TABLE paiements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id     UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  inscription_id      UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
  etudiant_id         UUID NOT NULL REFERENCES profiles(id),
  montant             DECIMAL(10,2) NOT NULL,
  devise              TEXT DEFAULT 'EUR',
  status              paiement_status DEFAULT 'pending',
  methode             TEXT,
  stripe_payment_id   TEXT,
  stripe_session_id   TEXT,
  date_paiement       TIMESTAMPTZ,
  facture_url         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: certificats (Attestations de formation)
-- ============================================================

CREATE TABLE certificats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  etudiant_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  numero          TEXT UNIQUE NOT NULL,
  date_delivrance DATE DEFAULT CURRENT_DATE,
  pdf_url         TEXT,
  is_valide       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: supports_cours (Supports pédagogiques)
-- ============================================================

CREATE TABLE supports_cours (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  formateur_id    UUID NOT NULL REFERENCES profiles(id),
  titre           TEXT NOT NULL,
  description     TEXT,
  type            TEXT CHECK (type IN ('pdf', 'video', 'lien', 'autre')),
  fichier_url     TEXT,
  ordre           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: messages (Messagerie interne)
-- ============================================================

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  receiver_id     UUID REFERENCES profiles(id),
  type            message_type DEFAULT 'direct',
  contenu         TEXT NOT NULL,
  fichier_url     TEXT,
  is_lu           BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titre           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            notification_type DEFAULT 'info',
  lien            TEXT,
  is_lu           BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FONCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_formations_updated_at
  BEFORE UPDATE ON formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-créer un profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, prenom, nom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'etudiant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Décrémenter places_restantes à l'inscription
CREATE OR REPLACE FUNCTION update_places_session()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE sessions SET places_restantes = places_restantes - 1
    WHERE id = NEW.session_id AND places_restantes > 0;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE sessions SET places_restantes = places_restantes - 1
      WHERE id = NEW.session_id AND places_restantes > 0;
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE sessions SET places_restantes = places_restantes + 1
      WHERE id = NEW.session_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_places
  AFTER INSERT OR UPDATE ON inscriptions
  FOR EACH ROW EXECUTE FUNCTION update_places_session();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Multi-tenant isolation
-- ============================================================

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salles ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificats ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports_cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: récupérer l'organisation de l'utilisateur courant
CREATE OR REPLACE FUNCTION auth_user_org()
RETURNS UUID AS $$
  SELECT organisation_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Super admin voit tout
CREATE POLICY "super_admin_all" ON organisations
  USING (auth_user_role() = 'super_admin');

-- Membres voient leur propre organisation
CREATE POLICY "members_own_org" ON organisations
  FOR SELECT USING (id = auth_user_org());

-- Profiles: chacun voit les profils de son organisation
CREATE POLICY "org_profiles_select" ON profiles
  FOR SELECT USING (
    organisation_id = auth_user_org() OR
    auth_user_role() = 'super_admin'
  );

CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Formations: visibles par tous les membres de l'organisation
CREATE POLICY "org_formations_select" ON formations
  FOR SELECT USING (
    organisation_id = auth_user_org() OR
    auth_user_role() = 'super_admin'
  );

CREATE POLICY "admin_formations_write" ON formations
  FOR ALL USING (
    organisation_id = auth_user_org() AND
    auth_user_role() IN ('admin', 'super_admin')
  );

-- Sessions: même logique
CREATE POLICY "org_sessions_select" ON sessions
  FOR SELECT USING (
    organisation_id = auth_user_org() OR
    auth_user_role() = 'super_admin'
  );

CREATE POLICY "admin_formateur_sessions_write" ON sessions
  FOR ALL USING (
    organisation_id = auth_user_org() AND
    auth_user_role() IN ('admin', 'formateur', 'super_admin')
  );

-- Inscriptions: étudiants voient les leurs, admin/formateur voient toutes de leur org
CREATE POLICY "org_inscriptions_select" ON inscriptions
  FOR SELECT USING (
    organisation_id = auth_user_org() AND (
      etudiant_id = auth.uid() OR
      auth_user_role() IN ('admin', 'formateur', 'super_admin')
    )
  );

CREATE POLICY "etudiant_inscriptions_insert" ON inscriptions
  FOR INSERT WITH CHECK (
    organisation_id = auth_user_org() AND
    etudiant_id = auth.uid()
  );

CREATE POLICY "admin_inscriptions_update" ON inscriptions
  FOR UPDATE USING (
    organisation_id = auth_user_org() AND
    auth_user_role() IN ('admin', 'super_admin')
  );

-- Messages: sender ou receiver
CREATE POLICY "messages_access" ON messages
  FOR SELECT USING (
    organisation_id = auth_user_org() AND (
      sender_id = auth.uid() OR receiver_id = auth.uid() OR
      auth_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    organisation_id = auth_user_org() AND
    sender_id = auth.uid()
  );

-- Notifications: uniquement les siennes
CREATE POLICY "own_notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Presences & Notes: org
CREATE POLICY "org_presences" ON presences
  FOR SELECT USING (organisation_id = auth_user_org());

CREATE POLICY "formateur_presences_write" ON presences
  FOR ALL USING (
    organisation_id = auth_user_org() AND
    auth_user_role() IN ('formateur', 'admin', 'super_admin')
  );

CREATE POLICY "org_notes" ON notes
  FOR SELECT USING (
    organisation_id = auth_user_org() AND (
      etudiant_id = auth.uid() OR
      auth_user_role() IN ('formateur', 'admin', 'super_admin')
    )
  );

CREATE POLICY "formateur_notes_write" ON notes
  FOR ALL USING (
    organisation_id = auth_user_org() AND
    auth_user_role() IN ('formateur', 'admin', 'super_admin')
  );

-- Certificats
CREATE POLICY "certificats_select" ON certificats
  FOR SELECT USING (
    organisation_id = auth_user_org() AND (
      etudiant_id = auth.uid() OR
      auth_user_role() IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- INDEX (Performance)
-- ============================================================

CREATE INDEX idx_profiles_organisation ON profiles(organisation_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_formations_organisation ON formations(organisation_id);
CREATE INDEX idx_sessions_formation ON sessions(formation_id);
CREATE INDEX idx_sessions_organisation ON sessions(organisation_id);
CREATE INDEX idx_inscriptions_session ON inscriptions(session_id);
CREATE INDEX idx_inscriptions_etudiant ON inscriptions(etudiant_id);
CREATE INDEX idx_presences_session ON presences(session_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
