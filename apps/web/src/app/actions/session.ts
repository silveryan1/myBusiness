"use server";

import { revalidatePath } from "next/cache";
import { exigerRole } from "@/lib/contexte";

type Resultat = { erreur?: string; id?: string };

export interface DonneesSession {
  formation_id: string;
  titre: string;
  formateur_id: string;
  date_debut: string; // ISO (converti par le navigateur depuis l'heure locale)
  date_fin: string;
  places_total: string;
  mode: string;
  lieu: string;
  description: string;
}

export async function creerSession(d: DonneesSession): Promise<Resultat> {
  try {
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const debut = new Date(d.date_debut);
    const fin = new Date(d.date_fin);
    if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return { erreur: "Dates invalides." };
    if (fin < debut) return { erreur: "La date de fin doit suivre la date de début." };
    const places = Math.round(Number(d.places_total));
    if (!Number.isFinite(places) || places < 1 || places > 10000) return { erreur: "Nombre de places invalide." };

    const { data: formation } = await supabase.from("formations").select("id, titre")
      .eq("id", d.formation_id).eq("organisation_id", orgId).single();
    if (!formation) return { erreur: "Formation introuvable." };

    let formateurId: string | null = null;
    if (d.formateur_id) {
      const { data: f } = await supabase.from("profiles").select("id")
        .eq("id", d.formateur_id).eq("organisation_id", orgId).eq("role", "formateur").single();
      if (!f) return { erreur: "Formateur introuvable." };
      formateurId = f.id;
    }

    const { data, error } = await supabase.from("sessions").insert({
      organisation_id: orgId,
      formation_id: formation.id,
      formateur_id: formateurId,
      titre: d.titre.trim().slice(0, 160) || formation.titre,
      date_debut: debut.toISOString(),
      date_fin: fin.toISOString(),
      places_total: places,
      places_restantes: places,
      status: "scheduled",
      mode: ["presentiel", "distanciel", "hybride"].includes(d.mode) ? d.mode : "presentiel",
      lieu: d.lieu.trim().slice(0, 160) || null,
      description: d.description.trim().slice(0, 2000) || null,
    }).select("id").single();
    if (error || !data) return { erreur: "Enregistrement refusé." };
    revalidatePath("/sessions");
    return { id: data.id };
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

export async function changerStatutSession(
  id: string, status: "scheduled" | "ongoing" | "completed" | "cancelled"
): Promise<Resultat> {
  try {
    if (!["scheduled", "ongoing", "completed", "cancelled"].includes(status)) return { erreur: "Statut inconnu." };
    // Le formateur peut faire avancer SA session (la base le vérifie aussi).
    const { supabase, orgId } = await exigerRole(["admin", "super_admin", "formateur"]);
    const { data, error } = await supabase.from("sessions").update({ status })
      .eq("id", id).eq("organisation_id", orgId).select("id");
    if (error || !data?.length) return { erreur: "Modification refusée." };
    revalidatePath("/sessions");
    revalidatePath(`/sessions/${id}`);
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}
