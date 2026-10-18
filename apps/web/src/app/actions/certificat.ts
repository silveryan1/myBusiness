"use server";

import { revalidatePath } from "next/cache";
import { exigerRole } from "@/lib/contexte";

type Resultat = { erreur?: string; id?: string };

/** Administration : délivrer le certificat d'une inscription confirmée ou terminée. */
export async function delivrerCertificat(inscriptionId: string, mentionBrute: string): Promise<Resultat> {
  try {
    const { supabase, user, orgId } = await exigerRole(["admin", "super_admin"]);
    const { data: ins } = await supabase.from("inscriptions").select("id, session_id, etudiant_id, status")
      .eq("id", inscriptionId).eq("organisation_id", orgId).single();
    if (!ins) return { erreur: "Inscription introuvable." };
    if (ins.status !== "confirmed" && ins.status !== "completed") {
      return { erreur: "Seule une inscription confirmée ou terminée donne droit à un certificat." };
    }
    const { data, error } = await supabase.from("certificats").insert({
      organisation_id: orgId,
      session_id: ins.session_id,
      etudiant_id: ins.etudiant_id,
      mention: mentionBrute.trim().slice(0, 60) || null,
      delivre_par: user.id,
    }).select("id").single();
    if (error?.code === "23505") return { erreur: "Un certificat existe déjà pour cette formation." };
    if (error || !data) return { erreur: "Délivrance refusée." };
    // La formation est acquise : l'inscription passe à « terminée ».
    if (ins.status === "confirmed") {
      await supabase.from("inscriptions").update({ status: "completed" }).eq("id", ins.id).eq("organisation_id", orgId);
    }
    revalidatePath("/certificats");
    revalidatePath("/inscriptions");
    return { id: data.id };
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

/** Administration : invalider un certificat (la page de vérification l'affichera « révoqué »). */
export async function revoquerCertificat(id: string): Promise<Resultat> {
  try {
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const { data, error } = await supabase.from("certificats").update({ is_valide: false })
      .eq("id", id).eq("organisation_id", orgId).select("id");
    if (error || !data?.length) return { erreur: "Modification refusée." };
    revalidatePath("/certificats");
    revalidatePath(`/certificats/${id}`);
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}
