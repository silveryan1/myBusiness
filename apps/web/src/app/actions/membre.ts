"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { exigerRole } from "@/lib/contexte";
import { createServiceClient } from "@/lib/supabase/admin";

const ROLES_ATTRIBUABLES = ["etudiant", "formateur", "admin"];

export interface DonneesMembre {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
}

/** Mot de passe provisoire lisible (sans caractères ambigus). */
function motDePasseProvisoire() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join("");
}

/**
 * Administration : ajouter un membre. Le compte est créé côté serveur (avant : l'inscription se
 * faisait dans le navigateur de l'administrateur, qui se retrouvait connecté sous le nouveau compte,
 * et le rôle/l'organisation étaient ignorés). Le mot de passe provisoire n'est montré qu'une fois.
 */
export async function ajouterMembre(d: DonneesMembre): Promise<{ erreur?: string; motDePasse?: string; existant?: boolean }> {
  try {
    const { orgId } = await exigerRole(["admin", "super_admin"]);
    const prenom = d.prenom.trim().slice(0, 60);
    const nom = d.nom.trim().slice(0, 60);
    const email = d.email.trim().toLowerCase().slice(0, 160);
    if (!prenom || !nom) return { erreur: "Prénom et nom obligatoires." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erreur: "Adresse e-mail invalide." };
    if (!ROLES_ATTRIBUABLES.includes(d.role)) return { erreur: "Rôle invalide." };

    const service = createServiceClient();
    const motDePasse = motDePasseProvisoire();
    const { data: cree, error } = await service.auth.admin.createUser({
      email, password: motDePasse, email_confirm: true, user_metadata: { prenom, nom },
    });

    let userId = cree?.user?.id ?? null;
    let existant = false;
    if (!userId) {
      // Compte déjà existant : on ne le rattache que s'il n'appartient à aucune organisation.
      if (!/already|registered|exists/i.test(error?.message ?? "")) return { erreur: "Création du compte refusée." };
      const { data: p } = await service.from("profiles").select("id, organisation_id").eq("email", email).maybeSingle();
      if (!p) return { erreur: "Un compte existe déjà avec cet e-mail." };
      if (p.organisation_id) return { erreur: "Cette personne appartient déjà à une organisation." };
      userId = p.id;
      existant = true;
    }

    // Le profil est créé par le déclencheur de la base ; on le complète.
    const { error: errProfil } = await service.from("profiles").upsert({
      id: userId, email, prenom, nom,
      telephone: d.telephone.trim().slice(0, 40) || null,
      role: d.role, organisation_id: orgId, is_active: true,
    });
    if (errProfil) return { erreur: "Compte créé, mais impossible de le rattacher à votre organisation." };
    revalidatePath("/membres");
    return existant ? { existant: true } : { motDePasse };
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

export async function changerRoleMembre(id: string, role: string): Promise<{ erreur?: string }> {
  try {
    const { supabase, user, orgId } = await exigerRole(["admin", "super_admin"]);
    if (id === user.id) return { erreur: "Vous ne pouvez pas changer votre propre rôle." };
    if (!ROLES_ATTRIBUABLES.includes(role)) return { erreur: "Rôle invalide." };
    const { data, error } = await supabase.from("profiles").update({ role })
      .eq("id", id).eq("organisation_id", orgId).select("role");
    if (error || data?.[0]?.role !== role) return { erreur: "Modification refusée." };
    revalidatePath("/membres");
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

export async function activerMembre(id: string, actif: boolean): Promise<{ erreur?: string }> {
  try {
    const { supabase, user, orgId } = await exigerRole(["admin", "super_admin"]);
    if (id === user.id) return { erreur: "Vous ne pouvez pas désactiver votre propre compte." };
    const { data, error } = await supabase.from("profiles").update({ is_active: actif })
      .eq("id", id).eq("organisation_id", orgId).select("is_active");
    if (error || data?.[0]?.is_active !== actif) return { erreur: "Modification refusée." };
    revalidatePath("/membres");
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}
