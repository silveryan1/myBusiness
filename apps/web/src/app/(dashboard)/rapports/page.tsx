import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rapports" };

export default async function RapportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles").select("organisation_id").eq("id", user.id).single();
  const orgId = profile?.organisation_id;

  const [{ data: formations }, { data: sessions }, { data: membres }, { data: inscriptions }] = await Promise.all([
    supabase.from("formations").select("id, status").eq("organisation_id", orgId || ""),
    supabase.from("sessions").select("id, status, places_total, places_restantes").eq("organisation_id", orgId || ""),
    supabase.from("profiles").select("id, role, is_active").eq("organisation_id", orgId || ""),
    supabase.from("inscriptions").select("id, status").eq("organisation_id", orgId || ""),
  ]);

  const stats = {
    formations: formations?.length || 0,
    formationsPublished: formations?.filter(f => f.status === "published").length || 0,
    sessions: sessions?.length || 0,
    sessionsOngoing: sessions?.filter(s => s.status === "ongoing").length || 0,
    sessionsCompleted: sessions?.filter(s => s.status === "completed").length || 0,
    membres: membres?.length || 0,
    etudiants: membres?.filter(m => m.role === "etudiant").length || 0,
    formateurs: membres?.filter(m => m.role === "formateur").length || 0,
    actifs: membres?.filter(m => m.is_active).length || 0,
    inscriptions: inscriptions?.length || 0,
    inscriptionsConfirmed: inscriptions?.filter(i => i.status === "confirmed").length || 0,
  };

  const tauxRemplissage = sessions && sessions.length > 0
    ? Math.round((sessions.reduce((a, s) => a + (s.places_total - (s.places_restantes || s.places_total)), 0) / sessions.reduce((a, s) => a + s.places_total, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Rapports & Statistiques</h1>
        <p className="text-slate-400 mt-1">Vue d'ensemble de votre organisation</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Formations", value: stats.formations, sub: `${stats.formationsPublished} publiées`, icon: "🎓", color: "from-indigo-500 to-purple-600" },
          { label: "Sessions", value: stats.sessions, sub: `${stats.sessionsCompleted} terminées`, icon: "📅", color: "from-cyan-500 to-blue-600" },
          { label: "Membres", value: stats.membres, sub: `${stats.actifs} actifs`, icon: "👥", color: "from-emerald-500 to-teal-600" },
          { label: "Inscriptions", value: stats.inscriptions, sub: `${stats.inscriptionsConfirmed} confirmées`, icon: "📋", color: "from-amber-500 to-orange-600" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Taux de remplissage */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4">📈 Taux de remplissage des sessions</h3>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-4xl font-bold text-white">{tauxRemplissage}%</span>
          <span className="text-slate-400 mb-1">des places occupées</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all" style={{ width: `${tauxRemplissage}%` }} />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {tauxRemplissage >= 80 ? "✅ Très bonne fréquentation" : tauxRemplissage >= 50 ? "⚠️ Fréquentation moyenne" : stats.sessions === 0 ? "ℹ️ Aucune session créée" : "❌ Faible fréquentation"}
        </div>
      </div>

      {/* Répartition membres */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4">👥 Répartition des membres</h3>
        {stats.membres === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">Aucun membre dans l'organisation</p>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Étudiants", value: stats.etudiants, color: "from-emerald-500 to-teal-500" },
              { label: "Formateurs", value: stats.formateurs, color: "from-amber-500 to-orange-500" },
              { label: "Admins", value: stats.membres - stats.etudiants - stats.formateurs, color: "from-indigo-500 to-purple-500" },
            ].map((item) => {
              const pct = stats.membres > 0 ? Math.round((item.value / stats.membres) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-400">{item.label}</div>
                  <div className="flex-1 bg-white/10 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-16 text-right text-sm text-white">{item.value} <span className="text-slate-500">({pct}%)</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statut sessions */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4">📅 Statut des sessions</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Planifiées", value: sessions?.filter(s => s.status === "scheduled").length || 0, color: "text-blue-400" },
            { label: "En cours", value: stats.sessionsOngoing, color: "text-emerald-400" },
            { label: "Terminées", value: stats.sessionsCompleted, color: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
