import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import { fcfa, dateCourte, heure, un, nomComplet } from "@/lib/format";
import { NIVEAUX, MODES_SESSION, STATUTS_FORMATION, STATUTS_SESSION, STATUTS_INSCRIPTION, libelle } from "@/lib/libelles";
import { changerStatutFormation } from "@/app/actions/formation";
import { demanderInscription } from "@/app/actions/inscription";
import EnTete from "@/components/ui/EnTete";
import BoutonAction from "@/components/ui/BoutonAction";

export const metadata: Metadata = { title: "Formation" };
export const dynamic = "force-dynamic";

export default async function FormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, role, orgId } = await getContexte();
  const admin = estAdmin(role);

  const { data: f } = await supabase.from("formations").select("*").eq("id", id).eq("organisation_id", orgId ?? "").single();
  if (!f) notFound();

  const [{ data: sessions }, { data: mesIns }] = await Promise.all([
    supabase.from("sessions")
      .select("id, titre, date_debut, date_fin, lieu, mode, status, places_total, places_restantes, formateur:profiles!sessions_formateur_id_fkey(prenom, nom)")
      .eq("formation_id", id).order("date_debut"),
    role === "etudiant"
      ? supabase.from("inscriptions").select("session_id, status").eq("etudiant_id", user.id)
      : Promise.resolve({ data: [] as { session_id: string; status: string }[] }),
  ]);
  const statutPour = new Map((mesIns ?? []).map((i) => [i.session_id, i.status]));
  const st = libelle(STATUTS_FORMATION, f.status);
  const listeSessions = (sessions ?? []).filter((s) => admin || s.status !== "cancelled");

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <EnTete titre={f.titre} sousTitre={[f.categorie, NIVEAUX[f.niveau ?? ""], f.duree_heures ? `${f.duree_heures} h` : null].filter(Boolean).join(" · ")} retour="/formations">
        {admin && (
          <>
            <span className={`badge ${st.badge} self-center`}>{st.label}</span>
            {f.status !== "published" && (
              <BoutonAction action={changerStatutFormation.bind(null, id, "published")} libelle="Publier" className="btn btn-primary btn-sm" />
            )}
            {f.status === "published" && (
              <BoutonAction action={changerStatutFormation.bind(null, id, "draft")} libelle="Retirer du catalogue"
                confirmer="Confirmer le retrait" />
            )}
            {f.status !== "archived" && (
              <BoutonAction action={changerStatutFormation.bind(null, id, "archived")} libelle="Archiver"
                confirmer="Confirmer l'archivage" className="btn btn-ghost btn-sm" />
            )}
            <Link href={`/formations/${id}/modifier`} className="btn btn-secondary btn-sm">Modifier</Link>
          </>
        )}
      </EnTete>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-1">Présentation</h2>
            <p className="text-slate-300 whitespace-pre-line text-sm">{f.description || "Aucune description."}</p>
          </div>
          {f.objectifs && (
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-1">Objectifs</h2>
              <p className="text-slate-300 whitespace-pre-line text-sm">{f.objectifs}</p>
            </div>
          )}
          {f.prerequis && (
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-1">Prérequis</h2>
              <p className="text-slate-300 whitespace-pre-line text-sm">{f.prerequis}</p>
            </div>
          )}
        </div>
        <div className="glass-card p-6 h-fit">
          <div className="text-sm text-slate-400">Tarif</div>
          <div className="text-3xl font-bold text-white mt-1">{f.is_payante && Number(f.prix) > 0 ? fcfa(f.prix) : "Gratuit"}</div>
          <p className="text-xs text-slate-500 mt-3">
            {f.is_payante ? "Règlement auprès du centre : espèces, MTN Mobile Money ou Orange Money. Un reçu numéroté vous est remis." : "Formation gratuite."}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Sessions</h2>
          {admin && <Link href={`/sessions/nouveau?formation=${id}`} className="btn btn-secondary btn-sm">+ Planifier une session</Link>}
        </div>
        {listeSessions.length === 0 ? (
          <div className="glass-card p-6 text-sm text-slate-400">
            {admin ? "Aucune session pour cette formation : planifiez-en une pour ouvrir les inscriptions." : "Aucune session n'est encore programmée pour cette formation."}
          </div>
        ) : (
          listeSessions.map((s) => {
            const ss = libelle(STATUTS_SESSION, s.status);
            const monStatut = statutPour.get(s.id);
            const ouverte = ["scheduled", "ongoing"].includes(s.status) && s.places_restantes > 0;
            const formateur = un(s.formateur);
            return (
              <div key={s.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/sessions/${s.id}`} className="font-semibold text-white hover:text-indigo-300">{s.titre || f.titre}</Link>
                    <span className={`badge ${ss.badge}`}>{ss.label}</span>
                  </div>
                  <div className="text-sm text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>📅 {dateCourte(s.date_debut)} → {dateCourte(s.date_fin)} · {heure(s.date_debut)}</span>
                    <span>{MODES_SESSION[s.mode ?? "presentiel"]}{s.lieu ? ` · 📍 ${s.lieu}` : ""}</span>
                    {formateur && <span>🧑‍🏫 {nomComplet(formateur)}</span>}
                    <span>👥 {s.places_restantes}/{s.places_total} places libres</span>
                  </div>
                </div>
                {role === "etudiant" && (
                  <div className="flex-shrink-0">
                    {monStatut === "cancelled" ? (
                      <span className="text-xs text-slate-500">Demande annulée : contactez le centre</span>
                    ) : monStatut ? (
                      <span className={`badge ${libelle(STATUTS_INSCRIPTION, monStatut).badge}`}>
                        {monStatut === "pending" ? "Demande envoyée" : libelle(STATUTS_INSCRIPTION, monStatut).label}
                      </span>
                    ) : ouverte ? (
                      <BoutonAction action={demanderInscription.bind(null, s.id)} libelle="Demander une place"
                        confirmer="Confirmer ma demande" className="btn btn-primary btn-sm" />
                    ) : (
                      <span className="text-xs text-slate-500">{s.places_restantes <= 0 ? "Complet" : "Inscriptions closes"}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
