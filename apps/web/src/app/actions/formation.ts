"use server";

import { revalidatePath } from "next/cache";
import { exigerRole } from "@/lib/contexte";

type Resultat = { erreur?: string; id?: string };

export interface DonneesFormation {
  titre: string;
  description: string;
  objectifs: string;
  prerequis: string;
  duree_heures: string;
  niveau: string;
  categorie: string;
  is_payante: boolean;
  prix: string;
}

function nettoyer(d: DonneesFormation) {
  const titre = d.titre.trim().slice(0, 160);
  if (titre.length < 2) throw new Error("Le titre est obligatoire.");
  const prix = d.is_payante ? Math.round(Number(d.prix)) : 0;
  if (d.is_payante && (!Number.isFinite(prix) || prix <= 0)) throw new Error("Indiquez un prix en FCFA.");
  const duree = d.duree_heures ? Number(d.duree_heures) : null;
  return {
    titre,
    description: d.description.trim().slice(0, 2000) || null,
    objectifs: d.objectifs.trim().slice(0, 2000) || null,
    prerequis: d.prerequis.trim().slice(0, 1000) || null,
    duree_heures: duree && duree > 0 ? Math.round(duree) : null,
    niveau: ["debutant", "intermediaire", "avance"].includes(d.niveau) ? d.niveau : "debutant",
    categorie: d.categorie.trim().slice(0, 80) || null,
    is_payante: d.is_payante,
    prix,
  };
}

export async function creerFormation(d: DonneesFormation): Promise<Resultat> {
  try {
    const { supabase, user, orgId } = await exigerRole(["admin", "super_admin"]);
    const { data, error } = await supabase.from("formations")
      .insert({ ...nettoyer(d), organisation_id: orgId, created_by: user.id, status: "draft" })
      .select("id").single();
    if (error || !data) return { erreur: "Enregistrement refusé." };
    revalidatePath("/formations");
    return { id: data.id };
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

export async function modifierFormation(id: string, d: DonneesFormation): Promise<Resultat> {
  try {
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const { error } = await supabase.from("formations").update(nettoyer(d))
      .eq("id", id).eq("organisation_id", orgId);
    if (error) return { erreur: "Enregistrement refusé." };
    revalidatePath("/formations");
    revalidatePath(`/formations/${id}`);
    return { id };
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

export async function changerStatutFormation(id: string, status: "draft" | "published" | "archived"): Promise<Resultat> {
  try {
    if (!["draft", "published", "archived"].includes(status)) return { erreur: "Statut inconnu." };
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const { error } = await supabase.from("formations").update({ status })
      .eq("id", id).eq("organisation_id", orgId);
    if (error) return { erreur: "Modification refusée." };
    revalidatePath("/formations");
    revalidatePath(`/formations/${id}`);
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}
