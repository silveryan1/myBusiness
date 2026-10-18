import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "super_admin" | "admin" | "formateur" | "etudiant";

export interface ProfilCourant {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: Role;
  organisation_id: string | null;
  is_active: boolean;
}

const CHAMPS_PROFIL = "id, prenom, nom, email, telephone, role, organisation_id, is_active";

async function charger() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profil: null };
  const { data } = await supabase.from("profiles").select(CHAMPS_PROFIL).eq("id", user.id).single();
  return { supabase, user, profil: (data as ProfilCourant | null) };
}

/** Pages : redirige vers la connexion si besoin. */
export async function getContexte() {
  const { supabase, user, profil } = await charger();
  if (!user || !profil) redirect("/login");
  return { supabase, user, profil, role: profil.role, orgId: profil.organisation_id };
}

export const estAdmin = (role: Role) => role === "admin" || role === "super_admin";
export const estEquipe = (role: Role) => estAdmin(role) || role === "formateur";

/**
 * Actions serveur : vérifie la connexion, le compte actif, l'organisation et le rôle.
 * Une action serveur est appelable directement en POST : chaque action DOIT passer par ici.
 */
export async function exigerRole(roles: Role[]) {
  const { supabase, user, profil } = await charger();
  if (!user || !profil) throw new Error("Session expirée : reconnectez-vous.");
  if (!profil.is_active) throw new Error("Votre compte est désactivé.");
  if (!roles.includes(profil.role)) throw new Error("Action réservée à l'administration.");
  if (!profil.organisation_id) throw new Error("Votre compte n'est rattaché à aucune organisation.");
  return { supabase, user, profil, orgId: profil.organisation_id as string };
}
