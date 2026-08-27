import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // Statistiques selon le rôle
  let stats = [];
  let recentActivity: { label: string; time: string; type: string }[] = [];

  if (role === "admin" || role === "super_admin") {
    const [
      { count: totalFormations },
      { count: totalMembres },
      { count: totalSessions },
      { count: totalInscriptions },
    ] = await Promise.all([
      supabase.from("formations").select("*", { count: "exact", head: true })
        .eq("organisation_id", profile?.organisation_id || ""),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("organisation_id", profile?.organisation_id || "").eq("role", "etudiant"),
      supabase.from("sessions").select("*", { count: "exact", head: true })
        .eq("organisation_id", profile?.organisation_id || ""),
      supabase.from("inscriptions").select("*", { count: "exact", head: true })
        .eq("organisation_id", profile?.organisation_id || ""),
    ]);

    stats = [
      { label: "Formations", value: totalFormations || 0, icon: "🎓", color: "from-indigo-500 to-purple-600", trend: "+12%" },
      { label: "Membres", value: totalMembres || 0, icon: "👥", color: "from-cyan-500 to-blue-600", trend: "+5%" },
      { label: "Sessions", value: totalSessions || 0, icon: "📅", color: "from-emerald-500 to-teal-600", trend: "+8%" },
      { label: "Inscriptions", value: totalInscriptions || 0, icon: "📋", color: "from-orange-500 to-amber-600", trend: "+20%" },
    ];

    recentActivity = [
      { label: "Nouvelle inscription — Formation JavaScript", time: "Il y a 5 min", type: "success" },
      { label: "Session annulée — Formation React", time: "Il y a 30 min", type: "warning" },
      { label: "Paiement reçu — 150€", time: "Il y a 1h", type: "info" },
      { label: "Nouveau membre inscrit", time: "Il y a 2h", type: "success" },
    ];
  } else if (role === "formateur") {
    const { count: mesSessions } = await supabase
      .from("sessions").select("*", { count: "exact", head: true })
      .eq("formateur_id", user.id);

    stats = [
      { label: "Mes sessions", value: mesSessions || 0, icon: "📅", color: "from-indigo-500 to-purple-600", trend: "" },
      { label: "Étudiants total", value: 0, icon: "👥", color: "from-cyan-500 to-blue-600", trend: "" },
      { label: "Notes saisies", value: 0, icon: "📝", color: "from-emerald-500 to-teal-600", trend: "" },
      { label: "Cours uploadés", value: 0, icon: "📚", color: "from-orange-500 to-amber-600", trend: "" },
    ];
  } else {
    // Étudiant
    const { count: mesInscriptions } = await supabase
      .from("inscriptions").select("*", { count: "exact", head: true })
      .eq("etudiant_id", user.id);

    const { count: mesCertificats } = await supabase
      .from("certificats").select("*", { count: "exact", head: true })
      .eq("etudiant_id", user.id);

    stats = [
      { label: "Mes formations", value: mesInscriptions || 0, icon: "🎓", color: "from-indigo-500 to-purple-600", trend: "" },
      { label: "En cours", value: 0, icon: "📅", color: "from-cyan-500 to-blue-600", trend: "" },
      { label: "Terminées", value: 0, icon: "✅", color: "from-emerald-500 to-teal-600", trend: "" },
      { label: "Certificats", value: mesCertificats || 0, icon: "🏅", color: "from-orange-500 to-amber-600", trend: "" },
    ];
  }

  const org = profile?.organisation as { nom?: string } | null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-slate-400 mt-1">
          {role === "admin" && org?.nom
            ? `Vue d'ensemble de ${org.nom}`
            : role === "super_admin"
            ? "Vue d'ensemble de la plateforme"
            : "Votre espace personnel"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-lg`}>
                {stat.icon}
              </div>
              {stat.trend && (
                <span className="badge badge-success text-xs">
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stat.value.toLocaleString("fr-FR")}
            </div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <span>⚡</span> Activité récente
            </h2>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.type === "success" ? "bg-emerald-400" :
                    item.type === "warning" ? "bg-amber-400" :
                    "bg-blue-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{item.label}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <span>🚀</span> Actions rapides
          </h2>
          <div className="space-y-2">
            {role === "admin" || role === "super_admin" ? (
              <>
                <a href="/formations/nouveau" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>🎓</span> Nouvelle formation
                </a>
                <a href="/membres/inviter" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>👤</span> Inviter un membre
                </a>
                <a href="/sessions/nouveau" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>📅</span> Planifier une session
                </a>
                <a href="/rapports" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>📊</span> Voir les rapports
                </a>
              </>
            ) : role === "formateur" ? (
              <>
                <a href="/presences" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>✅</span> Prendre les présences
                </a>
                <a href="/notes" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>📝</span> Saisir des notes
                </a>
                <a href="/supports" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>📚</span> Uploader un support
                </a>
              </>
            ) : (
              <>
                <a href="/formations" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>🎓</span> Voir les formations
                </a>
                <a href="/mon-planning" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>📅</span> Mon planning
                </a>
                <a href="/certificats" className="btn btn-secondary w-full justify-start gap-3 text-sm">
                  <span>🏅</span> Mes certificats
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
