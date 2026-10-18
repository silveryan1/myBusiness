// Libellés et couleurs des statuts (valeurs des types ENUM de la base).

type Libelle = { label: string; badge: string };

export const ROLES: Record<string, Libelle> = {
  super_admin: { label: "Super admin", badge: "badge-error" },
  admin: { label: "Administrateur", badge: "badge-primary" },
  formateur: { label: "Formateur", badge: "badge-warning" },
  etudiant: { label: "Étudiant", badge: "badge-success" },
};

export const STATUTS_FORMATION: Record<string, Libelle> = {
  draft: { label: "Brouillon", badge: "badge-warning" },
  published: { label: "Publiée", badge: "badge-success" },
  archived: { label: "Archivée", badge: "badge-error" },
};

export const STATUTS_SESSION: Record<string, Libelle> = {
  scheduled: { label: "Planifiée", badge: "badge-info" },
  ongoing: { label: "En cours", badge: "badge-success" },
  completed: { label: "Terminée", badge: "badge-primary" },
  cancelled: { label: "Annulée", badge: "badge-error" },
};

export const STATUTS_INSCRIPTION: Record<string, Libelle> = {
  pending: { label: "En attente", badge: "badge-warning" },
  confirmed: { label: "Confirmée", badge: "badge-success" },
  completed: { label: "Terminée", badge: "badge-primary" },
  cancelled: { label: "Annulée", badge: "badge-error" },
};

export const STATUTS_PAIEMENT: Record<string, Libelle> = {
  pending: { label: "En attente", badge: "badge-warning" },
  paid: { label: "Payé", badge: "badge-success" },
  failed: { label: "Échoué", badge: "badge-error" },
  refunded: { label: "Remboursé", badge: "badge-info" },
};

export const METHODES_PAIEMENT: Record<string, string> = {
  especes: "Espèces",
  mtn_momo: "MTN Mobile Money",
  orange_money: "Orange Money",
  virement: "Virement bancaire",
  autre: "Autre",
};

export const MODES_SESSION: Record<string, string> = {
  presentiel: "Présentiel",
  distanciel: "À distance",
  hybride: "Hybride",
};

export const NIVEAUX: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export function libelle(table: Record<string, Libelle>, cle: string | null | undefined): Libelle {
  return (cle && table[cle]) || { label: cle || "—", badge: "badge-primary" };
}
