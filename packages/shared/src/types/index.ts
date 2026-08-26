// ============================================================
// myBusiness — Types TypeScript Partagés
// ============================================================

// ---- ENUMS ----

export type UserRole = 'super_admin' | 'admin' | 'formateur' | 'etudiant';

export type OrganisationStatus = 'active' | 'suspended' | 'trial';

export type FormationStatus = 'draft' | 'published' | 'archived';

export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export type InscriptionStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PaiementStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PresenceStatus = 'present' | 'absent' | 'retard' | 'excuse';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// ---- MODELS ----

export interface Organisation {
  id: string;
  nom: string;
  slug: string;
  description?: string;
  logo_url?: string;
  email_contact?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  status: OrganisationStatus;
  stripe_enabled: boolean;
  stripe_account_id?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organisation_id?: string;
  role: UserRole;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  avatar_url?: string;
  bio?: string;
  date_naissance?: string;
  is_active: boolean;
  fcm_token?: string;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  organisation?: Organisation;
}

export interface Salle {
  id: string;
  organisation_id: string;
  nom: string;
  capacite: number;
  description?: string;
  equipements?: string[];
  is_active: boolean;
  created_at: string;
}

export interface Formation {
  id: string;
  organisation_id: string;
  titre: string;
  description?: string;
  objectifs?: string;
  prerequis?: string;
  duree_heures?: number;
  niveau?: 'debutant' | 'intermediaire' | 'avance';
  categorie?: string;
  image_url?: string;
  prix: number;
  is_payante: boolean;
  status: FormationStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  organisation?: Organisation;
  sessions?: Session[];
}

export interface Session {
  id: string;
  organisation_id: string;
  formation_id: string;
  formateur_id?: string;
  salle_id?: string;
  titre?: string;
  date_debut: string;
  date_fin: string;
  places_total: number;
  places_restantes: number;
  status: SessionStatus;
  notes_formateur?: string;
  created_at: string;
  updated_at: string;
  // Relations
  formation?: Formation;
  formateur?: Profile;
  salle?: Salle;
  inscriptions?: Inscription[];
}

export interface Inscription {
  id: string;
  organisation_id: string;
  session_id: string;
  etudiant_id: string;
  status: InscriptionStatus;
  date_inscription: string;
  date_confirmation?: string;
  notes?: string;
  // Relations
  session?: Session;
  etudiant?: Profile;
  paiement?: Paiement;
}

export interface Presence {
  id: string;
  organisation_id: string;
  session_id: string;
  etudiant_id: string;
  formateur_id?: string;
  status: PresenceStatus;
  date_presence: string;
  heure_arrivee?: string;
  commentaire?: string;
  created_at: string;
  // Relations
  etudiant?: Profile;
  session?: Session;
}

export interface Note {
  id: string;
  organisation_id: string;
  session_id: string;
  etudiant_id: string;
  formateur_id: string;
  note: number;
  note_max: number;
  type_evaluation?: string;
  commentaire?: string;
  date_evaluation: string;
  created_at: string;
  // Relations
  etudiant?: Profile;
  formateur?: Profile;
  session?: Session;
}

export interface Paiement {
  id: string;
  organisation_id: string;
  inscription_id: string;
  etudiant_id: string;
  montant: number;
  devise: string;
  status: PaiementStatus;
  methode?: string;
  stripe_payment_id?: string;
  stripe_session_id?: string;
  date_paiement?: string;
  facture_url?: string;
  created_at: string;
}

export interface Certificat {
  id: string;
  organisation_id: string;
  etudiant_id: string;
  session_id: string;
  numero: string;
  date_delivrance: string;
  pdf_url?: string;
  is_valide: boolean;
  created_at: string;
  // Relations
  etudiant?: Profile;
  session?: Session;
}

export interface SupportCours {
  id: string;
  organisation_id: string;
  session_id: string;
  formateur_id: string;
  titre: string;
  description?: string;
  type?: 'pdf' | 'video' | 'lien' | 'autre';
  fichier_url?: string;
  ordre: number;
  created_at: string;
}

export interface Message {
  id: string;
  organisation_id: string;
  sender_id: string;
  receiver_id?: string;
  type: 'direct' | 'group' | 'system';
  contenu: string;
  fichier_url?: string;
  is_lu: boolean;
  created_at: string;
  // Relations
  sender?: Profile;
  receiver?: Profile;
}

export interface Notification {
  id: string;
  organisation_id?: string;
  user_id: string;
  titre: string;
  message: string;
  type: NotificationType;
  lien?: string;
  is_lu: boolean;
  created_at: string;
}

// ---- API RESPONSES ----

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- DASHBOARD STATS ----

export interface DashboardStats {
  totalFormations: number;
  totalSessions: number;
  totalInscrits: number;
  totalFormateurs: number;
  totalEtudiants: number;
  revenuTotal: number;
  tauxPresence: number;
  sessionsCeMois: number;
}
