"use server";

import { revalidatePath } from "next/cache";
import { exigerRole } from "@/lib/contexte";

type Resultat = { erreur?: string };

function rafraichir() {
  revalidatePath("/inscriptions");
  revalidatePath("/sessions", "layout");
  revalidatePath("/formations", "layout");
  revalidatePath("/dashboard");
}

/** L'étudiant demande une place : l'inscription reste « en attente » jusqu'à la confirmation. */
export async function demanderInscription(sessionId: string): Promise<Resultat> {
  try {
    const { supabase, user, orgId } = await exigerRole(["etudiant"]);
    const { data: session } = await supabase.from("sessions")
      .select("id, places_restantes, status").eq("id", sessionId).eq("organisation_id", orgId).single();
    if (!session) return { erreur: "Session introuvable." };
    if (!["scheduled", "ongoing"].includes(session.status)) return { erreur: "Cette session n'accepte plus d'inscriptions." };
    if (session.places_restantes <= 0) return { erreur: "Cette session est complète." };
    const { error } = await supabase.from("inscriptions").insert({
      organisation_id: orgId, session_id: session.id, etudiant_id: user.id, status: "pending",
    });
    if (error?.code === "23505") return { erreur: "Vous avez déjà demandé une place pour cette session." };
    if (error) return { erreur: "Inscription refusée." };
    rafraichir();
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

/** L'étudiant retire une demande encore en attente. */
export async function annulerMaDemande(inscriptionId: string): Promise<Resultat> {
  try {
    const { supabase, user } = await exigerRole(["etudiant"]);
    const { data, error } = await supabase.from("inscriptions").update({ status: "cancelled" })
      .eq("id", inscriptionId).eq("etudiant_id", user.id).eq("status", "pending").select("id");
    if (error || !data?.length) return { erreur: "Annulation impossible." };
    rafraichir();
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

/** Administration : confirmer, terminer ou annuler une inscription. */
export async function changerStatutInscription(
  inscriptionId: string, status: "confirmed" | "completed" | "cancelled"
): Promise<Resultat> {
  try {
    if (!["confirmed", "completed", "cancelled"].includes(status)) return { erreur: "Statut inconnu." };
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const { data: ins } = await supabase.from("inscriptions")
      .select("id, status, session:sessions(places_restantes)").eq("id", inscriptionId).eq("organisation_id", orgId).single();
    if (!ins) return { erreur: "Inscription introuvable." };
    const session = Array.isArray(ins.session) ? ins.session[0] : ins.session;
    if (status === "confirmed" && ins.status !== "confirmed" && (session?.places_restantes ?? 0) <= 0) {
      return { erreur: "Session complète : plus aucune place à confirmer." };
    }
    if (status === "completed" && ins.status !== "confirmed") {
      return { erreur: "Seule une inscription confirmée peut être marquée terminée." };
    }
    const maj: Record<string, unknown> = { status };
    if (status === "confirmed") maj.date_confirmation = new Date().toISOString();
    const { error } = await supabase.from("inscriptions").update(maj).eq("id", inscriptionId).eq("organisation_id", orgId);
    if (error) return { erreur: "Modification refusée." };
    rafraichir();
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

/** Administration : inscrire directement un étudiant (inscription confirmée d'office). */
export async function inscrireEtudiant(sessionId: string, etudiantId: string): Promise<Resultat> {
  try {
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const [{ data: session }, { data: etudiant }] = await Promise.all([
      supabase.from("sessions").select("id, places_restantes, status").eq("id", sessionId).eq("organisation_id", orgId).single(),
      supabase.from("profiles").select("id").eq("id", etudiantId).eq("organisation_id", orgId).eq("role", "etudiant").single(),
    ]);
    if (!session) return { erreur: "Session introuvable." };
    if (!etudiant) return { erreur: "Étudiant introuvable." };
    if (session.status === "cancelled" || session.status === "completed") return { erreur: "Cette session est close." };
    if (session.places_restantes <= 0) return { erreur: "Cette session est complète." };
    const { error } = await supabase.from("inscriptions").insert({
      organisation_id: orgId, session_id: session.id, etudiant_id: etudiant.id,
      status: "confirmed", date_confirmation: new Date().toISOString(),
    });
    if (error?.code === "23505") return { erreur: "Cet étudiant est déjà inscrit à cette session." };
    if (error) return { erreur: "Inscription refusée." };
    rafraichir();
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}
