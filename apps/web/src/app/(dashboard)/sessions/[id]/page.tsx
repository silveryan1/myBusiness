import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateLongue, heure, un, nomComplet } from "@/lib/format";
import { MODES_SESSION, STATUTS_SESSION, STATUTS_INSCRIPTION, libelle } from "@/lib/libelles";
import { changerStatutSession } from "@/app/actions/session";
import { changerStatutInscription } from "@/app/actions/inscription";
import EnTete from "@/components/ui/EnTete";
import BoutonAction from "@/components/ui/BoutonAction";
import AjoutParticipant from "@/components/sessions/AjoutParticipant";

export const metadata: Metadata = { title: "Session" };
export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, role, orgId } = await getContexte();
  const admin = estAdmin(role);

  const { data: s } = await supabase.from("sessions")
    .select("*, formation:formations(id, titre), formateur:profiles!sessions_formateur_id_fkey(id, prenom, nom)")
    .eq("id", id).eq("organisation_id", orgId ?? "").single();
  if (!s) notFound();
  const formateur = un(s.formateur);
  const formation = un(s.formation);
  const estMonFormateur = role === "formateur" && formateur?.id === user.id;
  const equipe = admin || estMonFormateur;

  const { data: inscriptions } = equipe
    ? await supabase.from("inscriptions")
        .select("id, status, etudiant_id, date_inscription, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom, email, telephone)")
        .eq("session_id", id).order("date_inscription")
    : await supabase.from("inscriptions").select("id, status, etudiant_id, date_inscription").eq("session_id", id).eq("etudiant_id", user.id);

  let candidats: { id: string; prenom: string; nom: string }[] = [];
  if (admin && ["scheduled", "ongoing"].includes(s.status)) {
    const deja = new Set((inscriptions ?? []).map((i) => i.etudiant_id));
    const { data: etudiants } = await supabase.from("profiles").select("id, prenom, nom")
      .eq("organisation_id", orgId ?? "").eq("role", "etudiant").eq("is_active", true).order("nom");
    candidats = (etudiants ?? []).filter((e) => !deja.has(e.id));
  }

  const st = libelle(STATUTS_SESSION, s.status);
  const inscrits = (inscriptions ?? []).filter((i) => i.status !== "cancelled");
  const monInscription = role === "etudiant" ? (inscriptions ?? [])[0] : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <EnTete titre={s.titre || formation?.titre || "Session"} sousTitre={formation?.titre} retour={role === "etudiant" ? "/sessions" : "/sessions"}>
        <span className={`badge ${st.badge} self-center`}>{st.label}</span>
        {equipe && s.status === "scheduled" && (
          <BoutonAction action={changerStatutSession.bind(null, id, "ongoing")} libelle="Démarrer" className="btn btn-primary btn-sm" />
        )}
        {equipe && s.status === "ongoing" && (
          <BoutonAction action={changerStatutSession.bind(null, id, "completed")} libelle="Terminer la session" confirmer="Confirmer la fin" className="btn btn-primary btn-sm" />
        )}
        {admin && ["scheduled", "ongoing"].includes(s.status) && (
          <BoutonAction action={changerStatutSession.bind(null, id, "cancelled")} libelle="Annuler" confirmer="Confirmer l'annulation" className="btn btn-ghost btn-sm" />
        )}
      </EnTete>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-3 text-sm lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><div className="text-slate-500">Début</div><div className="text-white">{dateLongue(s.date_debut)} à {heure(s.date_debut)}</div></div>
            <div><div className="text-slate-500">Fin</div><div className="text-white">{dateLongue(s.date_fin)} à {heure(s.date_fin)}</div></div>
            <div><div className="text-slate-500">Mode</div><div className="text-white">{MODES_SESSION[s.mode ?? "presentiel"]}</div></div>
            <div><div className="text-slate-500">Lieu</div><div className="text-white">{s.lieu || "—"}</div></div>
            <div><div className="text-slate-500">Formateur</div><div className="text-white">{formateur ? nomComplet(formateur) : "À désigner"}</div></div>
            <div><div className="text-slate-500">Places</div><div className="text-white">{s.places_total - s.places_restantes} inscrits sur {s.places_total}</div></div>
          </div>
          {s.description && <p className="text-slate-300 whitespace-pre-line pt-3 border-t border-white/10">{s.description}</p>}
        </div>
        <div className="glass-card p-6 space-y-2 h-fit">
          {equipe ? (
            <>
              <Link href={`/presences?session=${id}`} className="btn btn-secondary w-full justify-start">✅ Faire l&apos;appel</Link>
              <Link href={`/notes?session=${id}`} className="btn btn-secondary w-full justify-start">📝 Saisir les notes</Link>
              {formation && <Link href={`/formations/${formation.id}`} className="btn btn-ghost w-full justify-start">🎓 Voir la formation</Link>}
            </>
          ) : (
            <>
              <div className="text-sm text-slate-400">Mon inscription</div>
              {monInscription ? (
                <span className={`badge ${libelle(STATUTS_INSCRIPTION, monInscription.status).badge}`}>
                  {libelle(STATUTS_INSCRIPTION, monInscription.status).label}
                </span>
              ) : (
                <p className="text-sm text-slate-500">Vous n&apos;êtes pas inscrit à cette session.</p>
              )}
              {formation && <Link href={`/formations/${formation.id}`} className="btn btn-ghost w-full justify-start mt-2">🎓 Voir la formation</Link>}
            </>
          )}
        </div>
      </div>

      {equipe && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Participants</h2>
              <span className="badge badge-primary">{inscrits.length}</span>
            </div>
            {admin && ["scheduled", "ongoing"].includes(s.status) && <AjoutParticipant sessionId={id} etudiants={candidats} />}
          </div>
          {!inscriptions?.length ? (
            <p className="p-6 text-sm text-slate-500">Aucun participant pour l&apos;instant.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {inscriptions.map((i) => {
                const e = un((i as { etudiant?: unknown }).etudiant as { prenom: string; nom: string; email: string; telephone: string | null } | null);
                const si = libelle(STATUTS_INSCRIPTION, i.status);
                return (
                  <div key={i.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white font-medium">{nomComplet(e)}</div>
                      <div className="text-xs text-slate-500 truncate">{[e?.email, e?.telephone].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${si.badge}`}>{si.label}</span>
                      {admin && i.status === "pending" && (
                        <>
                          <BoutonAction action={changerStatutInscription.bind(null, i.id, "confirmed")} libelle="Confirmer" className="btn btn-primary btn-sm" />
                          <BoutonAction action={changerStatutInscription.bind(null, i.id, "cancelled")} libelle="Refuser" confirmer="Confirmer le refus" className="btn btn-ghost btn-sm" />
                        </>
                      )}
                      {admin && i.status === "confirmed" && (
                        <Link href={`/paiements/nouveau?inscription=${i.id}`} className="btn btn-secondary btn-sm">💰 Paiement</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
