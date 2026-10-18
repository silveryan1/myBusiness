import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateLongue, fcfa, un, nomComplet } from "@/lib/format";
import { enLettres } from "@/lib/lettres";
import { METHODES_PAIEMENT, STATUTS_PAIEMENT, libelle } from "@/lib/libelles";
import { changerStatutPaiement } from "@/app/actions/paiement";
import EnTete from "@/components/ui/EnTete";
import BoutonAction from "@/components/ui/BoutonAction";
import BoutonImprimer from "@/components/ui/BoutonImprimer";

export const metadata: Metadata = { title: "Reçu de paiement" };
export const dynamic = "force-dynamic";

export default async function RecuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role, orgId } = await getContexte();
  const admin = estAdmin(role);

  // La base ne renvoie un paiement qu'à l'administration ou à l'étudiant concerné.
  const { data: p } = await supabase.from("paiements")
    .select("*, etudiant:profiles!paiements_etudiant_id_fkey(prenom, nom, email, telephone), agent:profiles!paiements_enregistre_par_fkey(prenom, nom), inscription:inscriptions(id, session:sessions(titre, date_debut, formation:formations(titre, prix, is_payante)), paiements(montant, status)), organisation:organisations(nom, adresse, ville, telephone, email_contact)")
    .eq("id", id).eq("organisation_id", orgId ?? "").single();
  if (!p) notFound();

  const etudiant = un(p.etudiant);
  const agent = un(p.agent);
  const org = un(p.organisation);
  const ins = un(p.inscription);
  const session = un(ins?.session ?? null);
  const formation = un(session?.formation ?? null);
  const prix = formation?.is_payante ? Number(formation.prix) || 0 : 0;
  const totalPaye = (ins?.paiements ?? []).filter((x: { status: string }) => x.status === "paid")
    .reduce((t: number, x: { montant: number }) => t + Number(x.montant), 0);
  const st = libelle(STATUTS_PAIEMENT, p.status);
  const montant = Math.round(Number(p.montant));

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="no-print">
        <EnTete titre={`Reçu ${p.recu_numero}`} retour="/paiements">
          <BoutonImprimer />
          {admin && p.status === "paid" && (
            <BoutonAction action={changerStatutPaiement.bind(null, id, "refunded")} libelle="Marquer remboursé"
              confirmer="Confirmer le remboursement" className="btn btn-ghost btn-sm" />
          )}
          {admin && p.status === "paid" && (
            <BoutonAction action={changerStatutPaiement.bind(null, id, "failed")} libelle="Annuler (erreur de saisie)"
              confirmer="Confirmer l'annulation" className="btn btn-ghost btn-sm" />
          )}
        </EnTete>
      </div>

      <article className="document-imprimable bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-10 space-y-8">
        <header className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="text-xl font-bold">{org?.nom ?? "Centre de formation"}</div>
            <div className="text-sm text-slate-600 mt-1 space-y-0.5">
              {[org?.adresse, org?.ville].filter(Boolean).length > 0 && <div>{[org?.adresse, org?.ville].filter(Boolean).join(", ")}</div>}
              {org?.telephone && <div>Tél. {org.telephone}</div>}
              {org?.email_contact && <div>{org.email_contact}</div>}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-2xl font-bold tracking-wide">REÇU</div>
            <div className="text-sm text-slate-600 mt-1">N° <span className="font-mono font-semibold text-slate-900">{p.recu_numero}</span></div>
            <div className="text-sm text-slate-600">du {dateLongue(p.date_paiement ?? p.created_at)}</div>
            {p.status !== "paid" && (
              <div className="mt-2 inline-block rounded border-2 border-red-600 px-2 py-0.5 text-sm font-bold uppercase text-red-600">{st.label}</div>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-slate-500 uppercase text-xs tracking-wider mb-1">Reçu de</div>
            <div className="font-semibold text-base">{nomComplet(etudiant)}</div>
            {etudiant?.telephone && <div className="text-slate-600">{etudiant.telephone}</div>}
            {etudiant?.email && <div className="text-slate-600">{etudiant.email}</div>}
          </div>
          <div>
            <div className="text-slate-500 uppercase text-xs tracking-wider mb-1">Pour</div>
            <div className="font-semibold text-base">{formation?.titre ?? "Formation"}</div>
            {session?.titre && session.titre !== formation?.titre && <div className="text-slate-600">{session.titre}</div>}
            {session?.date_debut && <div className="text-slate-600">Session du {dateLongue(session.date_debut)}</div>}
          </div>
        </section>

        <section className="rounded-xl bg-slate-50 border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="text-sm text-slate-600">
              <div>Moyen de paiement : <span className="font-medium text-slate-900">{METHODES_PAIEMENT[p.methode ?? ""] ?? "—"}</span></div>
              {p.reference && <div>Référence : <span className="font-mono text-slate-900">{p.reference}</span></div>}
              {p.commentaire && <div>Objet : {p.commentaire}</div>}
            </div>
            <div className="text-3xl font-bold">{fcfa(montant)}</div>
          </div>
          <p className="text-sm mt-4 pt-4 border-t border-slate-200">
            Arrêté le présent reçu à la somme de <span className="font-semibold">{enLettres(montant)} francs CFA</span>.
          </p>
        </section>

        {prix > 0 && (
          <section className="text-sm text-slate-600 flex flex-wrap gap-x-8 gap-y-1">
            <span>Prix de la formation : <b className="text-slate-900">{fcfa(prix)}</b></span>
            <span>Total réglé à ce jour : <b className="text-slate-900">{fcfa(totalPaye)}</b></span>
            <span>Reste à payer : <b className="text-slate-900">{fcfa(Math.max(0, prix - totalPaye))}</b></span>
          </section>
        )}

        <footer className="flex flex-col sm:flex-row justify-between gap-6 pt-6 border-t border-slate-200 text-sm text-slate-600">
          <div>Enregistré par : {agent ? nomComplet(agent) : "l'administration"}</div>
          <div className="sm:text-right">
            <div>Cachet et signature</div>
            <div className="h-16" />
          </div>
        </footer>
      </article>
    </div>
  );
}
