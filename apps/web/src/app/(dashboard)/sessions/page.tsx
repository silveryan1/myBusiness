import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateCourte, heure, un, nomComplet } from "@/lib/format";
import { MODES_SESSION, STATUTS_SESSION, libelle } from "@/lib/libelles";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import Stat from "@/components/ui/Stat";

export const metadata: Metadata = { title: "Sessions" };
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const { supabase, user, role, orgId } = await getContexte();
  const admin = estAdmin(role);

  let requete = supabase.from("sessions")
    .select("id, titre, date_debut, date_fin, lieu, mode, status, places_total, places_restantes, formation:formations(titre), formateur:profiles!sessions_formateur_id_fkey(prenom, nom)")
    .eq("organisation_id", orgId ?? "")
    .order("date_debut", { ascending: false });
  if (role === "formateur") requete = requete.eq("formateur_id", user.id);

  let sessions = (await requete).data ?? [];
  if (role === "etudiant") {
    // L'étudiant voit les sessions où il est inscrit (le catalogue sert à en trouver d'autres).
    const { data: ins } = await supabase.from("inscriptions").select("session_id").eq("etudiant_id", user.id).neq("status", "cancelled");
    const mes = new Set((ins ?? []).map((i) => i.session_id));
    sessions = sessions.filter((s) => mes.has(s.id));
  }

  const planifiees = sessions.filter((s) => s.status === "scheduled").length;
  const enCours = sessions.filter((s) => s.status === "ongoing").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <EnTete titre={admin ? "Sessions" : "Mes sessions"}
        sousTitre={admin ? "Planifiez les sessions et suivez leur remplissage" : "Vos sessions, de la plus récente à la plus ancienne"}>
        {admin && <Link href="/sessions/nouveau" className="btn btn-primary">+ Nouvelle session</Link>}
      </EnTete>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total" valeur={sessions.length} icone="📅" />
        <Stat label="Planifiées" valeur={planifiees} icone="⏳" couleur="from-cyan-500 to-blue-600" />
        <Stat label="En cours" valeur={enCours} icone="🟢" couleur="from-emerald-500 to-teal-600" />
      </div>

      {sessions.length === 0 ? (
        <Vide icone="📅" titre="Aucune session"
          texte={admin ? "Planifiez une session à partir d'une formation." : role === "formateur" ? "Aucune session ne vous est encore attribuée." : "Inscrivez-vous à une session depuis le catalogue."}>
          {admin && <Link href="/sessions/nouveau" className="btn btn-primary">Planifier une session</Link>}
          {role === "etudiant" && <Link href="/formations" className="btn btn-primary">Voir le catalogue</Link>}
        </Vide>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const st = libelle(STATUTS_SESSION, s.status);
            const formateur = un(s.formateur);
            return (
              <Link key={s.id} href={`/sessions/${s.id}`} className="glass-card p-5 block hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="font-semibold text-white">{s.titre || un(s.formation)?.titre || "Session"}</h3>
                  <span className={`badge ${st.badge}`}>{st.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span>📅 {dateCourte(s.date_debut)} → {dateCourte(s.date_fin)}</span>
                  <span>🕐 {heure(s.date_debut)}</span>
                  <span>{MODES_SESSION[s.mode ?? "presentiel"]}{s.lieu ? ` · 📍 ${s.lieu}` : ""}</span>
                  {formateur && <span>🧑‍🏫 {nomComplet(formateur)}</span>}
                  {role !== "etudiant" && <span>👥 {s.places_total - s.places_restantes}/{s.places_total} inscrits</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
