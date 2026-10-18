"use server";

import { revalidatePath } from "next/cache";
import { exigerRole } from "@/lib/contexte";

type Resultat = { erreur?: string; id?: string };

export interface DonneesPaiement {
  inscription_id: string;
  montant: string;
  methode: string;
  reference: string;
  date_paiement: string; // AAAA-MM-JJ
  commentaire: string;
}

const METHODES = ["especes", "mtn_momo", "orange_money", "virement", "autre"];

/** Administration : enregistrer un encaissement (le reçu est numéroté par la base). */
export async function enregistrerPaiement(d: DonneesPaiement): Promise<Resultat> {
  try {
    const { supabase, user, orgId } = await exigerRole(["admin", "super_admin"]);
    const montant = Math.round(Number(d.montant));
    if (!Number.isFinite(montant) || montant <= 0) return { erreur: "Montant invalide." };
    if (montant > 100_000_000) return { erreur: "Montant trop élevé." };
    if (!METHODES.includes(d.methode)) return { erreur: "Choisissez un moyen de paiement." };
    const reference = d.reference.trim().slice(0, 80);
    if ((d.methode === "mtn_momo" || d.methode === "orange_money") && !reference) {
      return { erreur: "Indiquez l'identifiant de la transaction Mobile Money (il figure dans le SMS de confirmation)." };
    }
    const date = d.date_paiement ? new Date(`${d.date_paiement}T12:00:00`) : new Date();
    if (isNaN(date.getTime()) || date.getTime() > Date.now() + 86_400_000) return { erreur: "Date invalide." };

    const { data: ins } = await supabase.from("inscriptions").select("id, etudiant_id, status")
      .eq("id", d.inscription_id).eq("organisation_id", orgId).single();
    if (!ins) return { erreur: "Inscription introuvable." };
    if (ins.status === "cancelled") return { erreur: "Cette inscription est annulée." };

    const { data, error } = await supabase.from("paiements").insert({
      organisation_id: orgId,
      inscription_id: ins.id,
      etudiant_id: ins.etudiant_id,
      montant,
      devise: "XAF",
      status: "paid",
      methode: d.methode,
      reference: reference || null,
      commentaire: d.commentaire.trim().slice(0, 500) || null,
      date_paiement: date.toISOString(),
      enregistre_par: user.id,
    }).select("id").single();
    if (error || !data) return { erreur: "Enregistrement refusé." };
    revalidatePath("/paiements");
    revalidatePath("/dashboard");
    return { id: data.id };
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}

/** Administration : marquer un encaissement remboursé ou annulé par erreur. */
export async function changerStatutPaiement(id: string, status: "refunded" | "failed"): Promise<Resultat> {
  try {
    if (status !== "refunded" && status !== "failed") return { erreur: "Statut inconnu." };
    const { supabase, orgId } = await exigerRole(["admin", "super_admin"]);
    const { data, error } = await supabase.from("paiements").update({ status })
      .eq("id", id).eq("organisation_id", orgId).eq("status", "paid").select("id");
    if (error || !data?.length) return { erreur: "Modification refusée." };
    revalidatePath("/paiements");
    revalidatePath(`/paiements/${id}`);
    return {};
  } catch (e) {
    return { erreur: (e as Error).message };
  }
}
