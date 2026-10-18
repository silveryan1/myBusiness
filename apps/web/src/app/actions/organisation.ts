"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { creerOrganisationPour } from "@/lib/organisation";
import { exigerRole } from "@/lib/contexte";

/** Le visiteur connecté crée son centre (écran « Bienvenue »). */
export async function creerMonOrganisation(nom: string): Promise<{ erreur?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée : reconnectez-vous." };
  const res = await creerOrganisationPour(user, nom);
  if (!res.erreur) revalidatePath("/", "layout");
  return res;
}

/** Coordonnées de l'organisation (administration). */
export async function modifierOrganisation(donnees: {
  nom: string; telephone: string; email_contact: string; adresse: string; ville: string; description: string;
}): Promise<{ erreur?: string }> {
  try {
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const nom = donnees.nom.trim().slice(0, 120);
    if (nom.length < 2) return { erreur: "Le nom est obligatoire." };
    const { error } = await supabase.from("organisations").update({
      nom,
      telephone: donnees.telephone.trim().slice(0, 40) || null,
      email_contact: donnees.email_contact.trim().slice(0, 160) || null,
      adresse: donnees.adresse.trim().slice(0, 200) || null,
      ville: donnees.ville.trim().slice(0, 80) || null,
      description: donnees.description.trim().slice(0, 1000) || null,
    }).eq("id", orgId);
    if (error) return { erreur: "Enregistrement refusé." };
    revalidatePath("/", "layout");
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}
