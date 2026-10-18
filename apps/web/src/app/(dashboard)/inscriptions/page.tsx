import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateCourte, fcfa, un, nomComplet } from "@/lib/format";
import { STATUTS_INSCRIPTION, libelle } from "@/lib/libelles";
import { changerStatutInscription, annulerMaDemande } from "@/app/actions/inscription";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import BoutonAction from "@/components/ui/BoutonAction";

export const metadata: Metadata = { title: "Inscriptions" };
export const dynamic = "force-dynamic";

const FILTRES = [
  { cle: "", label: "Toutes" },
  { cle: "pending", label: "En attente" },
  { cle: "confirmed", label: "Confirmées" },
  { cle: "completed", label: "Terminées" },
  { cle: "cancelled", label: "Annulées" },
];

export default async function InscriptionsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const { supabase, user, role, orgId } = await getContexte();
  const admin = estAdmin(role);

  let requete = supabase.from("inscriptions")
    .select("id, status, date_inscription, session_id, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom, email), session:sessions(id, titre, date_debut, formation:formations(titre, prix, is_payante)), paiements(montant, status)")
    .eq("organisation_id", orgId ?? "")
    .order("date_inscription", { ascending: false });
  if (!admin) requete = requete.eq("etudiant_id", user.id);
  const { data } = await requete;
  const toutes = data ?? [];
  const filtre = FILTRES.some((f) => f.cle === statut) ? statut ?? "" : "";
  const inscriptions = filtre ? toutes.filter((i) => i.status === filtre) : toutes;
  const compte = (cle: string) => (cle ? toutes.filter((i) => i.status === cle).length : toutes.length);

  return (
    <div className="space-y-6 animate-fade-in">
      <EnTete titre={admin ? "Inscriptions" : "Mes inscriptions"}
        sousTitre={admin ? "Confirmez les demandes, suivez les paiements et terminez les parcours" : "Vos demandes et vos formations en cours"}>
        {!admin && <Link href="/formations" className="btn btn-primary">Voir le catalogue</Link>}
      </EnTete>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTRES.map((f) => (
          <Link key={f.cle} href={f.cle ? `/inscriptions?statut=${f.cle}` : "/inscriptions"}
            className={`btn btn-sm flex-shrink-0 ${filtre === f.cle ? "btn-primary" : "btn-secondary"}`}>
            {f.label} <span className="opacity-70">({compte(f.cle)})</span>
          </Link>
        ))}
      </div>

      {inscriptions.length === 0 ? (
        <Vide icone="📋" titre="Aucune inscription"
          texte={admin ? "Les demandes des étudiants apparaissent ici. Pour inscrire vous-même un étudiant, ouvrez la session concernée." : "Choisissez une formation dans le catalogue pour demander votre place."}>
          {admin ? <Link href="/sessions" className="btn btn-primary">Voir les sessions</Link> : <Link href="/formations" className="btn btn-primary">Voir le catalogue</Link>}
        </Vide>
      ) : (
        <div className="space-y-3">
          {inscriptions.map((i) => {
            const e = un(i.etudiant);
            const s = un(i.session);
            const f = un(s?.formation ?? null);
            const prix = f?.is_payante ? Number(f.prix) || 0 : 0;
            const paye = (i.paiements ?? []).filter((p) => p.status === "paid").reduce((t, p) => t + Number(p.montant), 0);
            const st = libelle(STATUTS_INSCRIPTION, i.status);
            return (
              <div key={i.id} className="glass-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {admin && <span className="font-semibold text-white">{nomComplet(e)}</span>}
                    <Link href={`/sessions/${i.session_id}`} className={admin ? "text-slate-300 hover:text-white" : "font-semibold text-white hover:text-indigo-300"}>
                      {s?.titre || f?.titre || "Session"}
                    </Link>
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                  </div>
                  <div className="text-sm text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                    {admin && e?.email && <span>{e.email}</span>}
                    <span>Session du {dateCourte(s?.date_debut)}</span>
                    <span>Demande du {dateCourte(i.date_inscription)}</span>
                    {prix > 0 && (
                      <span className={paye >= prix ? "text-emerald-400" : "text-amber-400"}>
                        {paye >= prix ? `Payé (${fcfa(paye)})` : `Payé ${fcfa(paye)} sur ${fcfa(prix)}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  {admin && i.status === "pending" && (
                    <>
                      <BoutonAction action={changerStatutInscription.bind(null, i.id, "confirmed")} libelle="Confirmer" className="btn btn-primary btn-sm" />
                      <BoutonAction action={changerStatutInscription.bind(null, i.id, "cancelled")} libelle="Refuser" confirmer="Confirmer le refus" className="btn btn-ghost btn-sm" />
                    </>
                  )}
                  {admin && i.status === "confirmed" && (
                    <>
                      {prix > paye && <Link href={`/paiements/nouveau?inscription=${i.id}`} className="btn btn-secondary btn-sm">💰 Encaisser</Link>}
                      <Link href={`/certificats?inscription=${i.id}`} className="btn btn-secondary btn-sm">🏅 Certificat</Link>
                      <BoutonAction action={changerStatutInscription.bind(null, i.id, "cancelled")} libelle="Annuler" confirmer="Confirmer l'annulation" className="btn btn-ghost btn-sm" />
                    </>
                  )}
                  {!admin && i.status === "pending" && (
                    <BoutonAction action={annulerMaDemande.bind(null, i.id)} libelle="Retirer ma demande" confirmer="Confirmer le retrait" className="btn btn-ghost btn-sm" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
