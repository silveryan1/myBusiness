import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import { un, nomComplet } from "@/lib/format";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import FormulairePaiement, { type InscriptionPayable } from "@/components/paiements/FormulairePaiement";

export const metadata: Metadata = { title: "Enregistrer un paiement" };

export default async function NouveauPaiementPage({ searchParams }: { searchParams: Promise<{ inscription?: string }> }) {
  const { inscription } = await searchParams;
  const { supabase, role, orgId } = await getContexte();
  if (!estAdmin(role)) redirect("/paiements");

  const { data } = await supabase.from("inscriptions")
    .select("id, status, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom), session:sessions(titre, formation:formations(titre, prix, is_payante)), paiements(montant, status)")
    .eq("organisation_id", orgId ?? "")
    .in("status", ["pending", "confirmed", "completed"])
    .order("date_inscription", { ascending: false });

  const inscriptions: InscriptionPayable[] = (data ?? []).map((i) => {
    const s = un(i.session);
    const f = un(s?.formation ?? null);
    return {
      id: i.id,
      libelle: `${nomComplet(un(i.etudiant))} — ${s?.titre || f?.titre || "Session"}${i.status === "pending" ? " (en attente)" : ""}`,
      prix: f?.is_payante ? Number(f.prix) || 0 : 0,
      paye: (i.paiements ?? []).filter((p) => p.status === "paid").reduce((t, p) => t + Number(p.montant), 0),
    };
  }).sort((a, b) => (b.prix - b.paye) - (a.prix - a.paye));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <EnTete titre="Enregistrer un paiement" sousTitre="Un reçu numéroté est créé automatiquement." retour="/paiements" />
      {inscriptions.length === 0 ? (
        <Vide icone="📋" titre="Aucune inscription" texte="Un paiement se rattache à l'inscription d'un étudiant à une session.">
          <Link href="/sessions" className="btn btn-primary">Voir les sessions</Link>
        </Vide>
      ) : (
        <FormulairePaiement inscriptions={inscriptions} initiale={inscription} />
      )}
    </div>
  );
}
