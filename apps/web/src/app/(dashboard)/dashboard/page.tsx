import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estAdmin } from "@/lib/contexte";
import { fcfa, dateCourte, heure, ilYa, un, nomComplet } from "@/lib/format";
import { STATUTS_INSCRIPTION, libelle } from "@/lib/libelles";
import Stat from "@/components/ui/Stat";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

type Activite = { label: string; quand: string; type: "success" | "warning" | "info" };

function debutDuMois() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export default async function DashboardPage() {
  const { supabase, user, profil, role, orgId } = await getContexte();
  const org = orgId ?? "";
  const maintenant = new Date().toISOString();

  let stats: { label: string; valeur: string | number; icone: string; sous?: string; couleur: string }[] = [];
  let activites: Activite[] = [];
  let prochaines: { id: string; titre: string | null; date_debut: string; lieu?: string | null }[] = [];

  if (estAdmin(role)) {
    const [formations, etudiants, sessionsAVenir, enAttente, paiementsMois, dernIns, dernPaie] = await Promise.all([
      supabase.from("formations").select("id", { count: "exact", head: true }).eq("organisation_id", org).eq("status", "published"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organisation_id", org).eq("role", "etudiant"),
      supabase.from("sessions").select("id, titre, date_debut, lieu").eq("organisation_id", org)
        .in("status", ["scheduled", "ongoing"]).gte("date_fin", maintenant).order("date_debut").limit(5),
      supabase.from("inscriptions").select("id", { count: "exact", head: true }).eq("organisation_id", org).eq("status", "pending"),
      supabase.from("paiements").select("montant").eq("organisation_id", org).eq("status", "paid").gte("date_paiement", debutDuMois()),
      supabase.from("inscriptions").select("id, status, date_inscription, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom), session:sessions(titre)")
        .eq("organisation_id", org).order("date_inscription", { ascending: false }).limit(5),
      supabase.from("paiements").select("id, montant, created_at, etudiant:profiles!paiements_etudiant_id_fkey(prenom, nom)")
        .eq("organisation_id", org).eq("status", "paid").order("created_at", { ascending: false }).limit(5),
    ]);
    const encaisse = (paiementsMois.data ?? []).reduce((s, p) => s + Number(p.montant), 0);
    stats = [
      { label: "Formations publiées", valeur: formations.count ?? 0, icone: "🎓", couleur: "from-indigo-500 to-purple-600" },
      { label: "Étudiants", valeur: etudiants.count ?? 0, icone: "👥", couleur: "from-cyan-500 to-blue-600" },
      { label: "Demandes à traiter", valeur: enAttente.count ?? 0, icone: "📋", couleur: "from-orange-500 to-amber-600", sous: "inscriptions en attente" },
      { label: "Encaissé ce mois", valeur: fcfa(encaisse), icone: "💰", couleur: "from-emerald-500 to-teal-600" },
    ];
    prochaines = sessionsAVenir.data ?? [];
    activites = [
      ...(dernIns.data ?? []).map((i) => ({
        label: `${nomComplet(un(i.etudiant))} — ${un(i.session)?.titre ?? "session"} (${libelle(STATUTS_INSCRIPTION, i.status).label.toLowerCase()})`,
        quand: i.date_inscription as string, type: (i.status === "pending" ? "warning" : "success") as Activite["type"],
      })),
      ...(dernPaie.data ?? []).map((p) => ({
        label: `Paiement de ${fcfa(p.montant)} — ${nomComplet(un(p.etudiant))}`,
        quand: p.created_at as string, type: "info" as const,
      })),
    ].sort((a, b) => (b.quand ?? "").localeCompare(a.quand ?? "")).slice(0, 6);
  } else if (role === "formateur") {
    const { data: mesSessions } = await supabase.from("sessions").select("id, titre, date_debut, lieu, status")
      .eq("formateur_id", user.id).order("date_debut");
    const ids = (mesSessions ?? []).map((s) => s.id);
    const [suivis, notes] = await Promise.all([
      ids.length
        ? supabase.from("inscriptions").select("id", { count: "exact", head: true }).in("session_id", ids).in("status", ["confirmed", "completed"])
        : Promise.resolve({ count: 0 }),
      supabase.from("notes").select("id", { count: "exact", head: true }).eq("formateur_id", user.id),
    ]);
    const aVenir = (mesSessions ?? []).filter((s) => ["scheduled", "ongoing"].includes(s.status));
    stats = [
      { label: "Mes sessions", valeur: mesSessions?.length ?? 0, icone: "📅", couleur: "from-indigo-500 to-purple-600" },
      { label: "À venir ou en cours", valeur: aVenir.length, icone: "⏳", couleur: "from-cyan-500 to-blue-600" },
      { label: "Étudiants suivis", valeur: suivis.count ?? 0, icone: "👥", couleur: "from-emerald-500 to-teal-600" },
      { label: "Notes saisies", valeur: notes.count ?? 0, icone: "📝", couleur: "from-orange-500 to-amber-600" },
    ];
    prochaines = aVenir.slice(0, 5);
  } else {
    const [{ data: mesIns }, { count: certificats }, { data: mesPaie }] = await Promise.all([
      supabase.from("inscriptions").select("id, status, session:sessions(id, titre, date_debut, lieu, status)").eq("etudiant_id", user.id),
      supabase.from("certificats").select("id", { count: "exact", head: true }).eq("etudiant_id", user.id).eq("is_valide", true),
      supabase.from("paiements").select("montant").eq("etudiant_id", user.id).eq("status", "paid"),
    ]);
    const ins = mesIns ?? [];
    stats = [
      { label: "Formations suivies", valeur: ins.filter((i) => ["confirmed", "completed"].includes(i.status)).length, icone: "🎓", couleur: "from-indigo-500 to-purple-600" },
      { label: "Demandes en attente", valeur: ins.filter((i) => i.status === "pending").length, icone: "⏳", couleur: "from-cyan-500 to-blue-600" },
      { label: "Certificats", valeur: certificats ?? 0, icone: "🏅", couleur: "from-orange-500 to-amber-600" },
      { label: "Total payé", valeur: fcfa((mesPaie ?? []).reduce((s, p) => s + Number(p.montant), 0)), icone: "💰", couleur: "from-emerald-500 to-teal-600" },
    ];
    prochaines = ins
      .filter((i) => i.status === "confirmed")
      .map((i) => un(i.session))
      .filter((s): s is NonNullable<typeof s> => !!s && ["scheduled", "ongoing"].includes(s.status))
      .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
      .slice(0, 5);
  }

  const actions = estAdmin(role)
    ? [
        { href: "/inscriptions?statut=pending", icone: "📋", label: "Traiter les demandes" },
        { href: "/paiements/nouveau", icone: "💰", label: "Enregistrer un paiement" },
        { href: "/sessions/nouveau", icone: "📅", label: "Planifier une session" },
        { href: "/membres/inviter", icone: "👤", label: "Ajouter un membre" },
      ]
    : role === "formateur"
    ? [
        { href: "/presences", icone: "✅", label: "Faire l'appel" },
        { href: "/notes", icone: "📝", label: "Saisir des notes" },
        { href: "/sessions", icone: "📅", label: "Mes sessions" },
      ]
    : [
        { href: "/formations", icone: "🎓", label: "Voir le catalogue" },
        { href: "/inscriptions", icone: "📋", label: "Mes inscriptions" },
        { href: "/certificats", icone: "🏅", label: "Mes certificats" },
      ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-slate-400 mt-1">
          {estAdmin(role) ? "Vue d'ensemble de votre centre" : role === "formateur" ? "Vos sessions et vos étudiants" : `Bienvenue ${profil.prenom}, voici votre parcours`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-white mb-4">📅 Prochaines sessions</h2>
            {prochaines.length === 0 ? (
              <p className="text-sm text-slate-500">
                {estAdmin(role) ? "Aucune session planifiée." : role === "formateur" ? "Aucune session à venir." : "Aucune session confirmée à venir. Parcourez le catalogue pour vous inscrire."}
              </p>
            ) : (
              <div className="space-y-1">
                {prochaines.map((s) => (
                  <Link key={s.id} href={`/sessions/${s.id}`} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{s.titre || "Session"}</p>
                      {s.lieu && <p className="text-xs text-slate-500 truncate">📍 {s.lieu}</p>}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{dateCourte(s.date_debut)} · {heure(s.date_debut)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {estAdmin(role) && (
            <div className="glass-card p-6">
              <h2 className="text-base font-semibold text-white mb-4">⚡ Activité récente</h2>
              {activites.length === 0 ? (
                <p className="text-sm text-slate-500">Les inscriptions et les paiements apparaîtront ici.</p>
              ) : (
                <div className="space-y-1">
                  {activites.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.type === "success" ? "bg-emerald-400" : a.type === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                      <p className="flex-1 min-w-0 text-sm text-slate-300 truncate">{a.label}</p>
                      <span className="text-xs text-slate-500 flex-shrink-0">{ilYa(a.quand)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-card p-6 h-fit">
          <h2 className="text-base font-semibold text-white mb-4">🚀 Actions rapides</h2>
          <div className="space-y-2">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className="btn btn-secondary w-full justify-start gap-3 text-sm">
                <span>{a.icone}</span> {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
