import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sessions" };

const statusBadge: Record<string, string> = {
  scheduled: "badge-info",
  ongoing: "badge-success",
  completed: "badge-primary",
  cancelled: "badge-error",
};

const statusLabel: Record<string, string> = {
  scheduled: "Planifiée",
  ongoing: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("sessions")
    .select("*, formation:formations(titre), formateur:profiles(prenom, nom), salle:salles(nom)")
    .order("date_debut", { ascending: true });

  if (profile?.role === "formateur") {
    query = query.eq("formateur_id", user.id);
  } else {
    query = query.eq("organisation_id", profile?.organisation_id || "");
  }

  const { data: sessions } = await query;

  const now = new Date();
  const upcoming = sessions?.filter((s) => new Date(s.date_debut) > now && s.status === "scheduled") || [];
  const ongoing = sessions?.filter((s) => s.status === "ongoing") || [];
  const total = sessions?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sessions de formation</h1>
          <p className="text-slate-400 mt-1">Planifiez et suivez toutes les sessions</p>
        </div>
        {profile?.role !== "etudiant" && (
          <Link href="/sessions/nouveau" className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle session
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: total, icon: "📅", color: "from-indigo-500 to-purple-600" },
          { label: "À venir", value: upcoming.length, icon: "⏳", color: "from-cyan-500 to-blue-600" },
          { label: "En cours", value: ongoing.length, icon: "🔴", color: "from-emerald-500 to-teal-600" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg mb-3`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      {!sessions || sessions.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-slate-400 mb-4">Aucune session planifiée</p>
          {profile?.role !== "etudiant" && (
            <Link href="/sessions/nouveau" className="btn btn-primary">
              Planifier une session
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="glass-card p-5 hover:border-indigo-500/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {session.titre || session.formation?.titre || "Session sans titre"}
                    </h3>
                    <span className={`badge ${statusBadge[session.status] || "badge-primary"} flex-shrink-0`}>
                      {statusLabel[session.status] || session.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      📅 {new Date(session.date_debut).toLocaleDateString("fr-FR", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      🕐 {new Date(session.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {" → "}
                      {new Date(session.date_fin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {session.formateur && (
                      <span className="flex items-center gap-1">
                        🧑‍🏫 {session.formateur.prenom} {session.formateur.nom}
                      </span>
                    )}
                    {session.salle && (
                      <span className="flex items-center gap-1">
                        📍 {session.salle.nom}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      👥 {session.places_restantes}/{session.places_total} places
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/dashboard/sessions/${session.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Détails
                  </Link>
                  {(profile?.role === "admin" || profile?.role === "formateur") && (
                    <Link
                      href={`/dashboard/presences?session=${session.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      ✅ Présences
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
