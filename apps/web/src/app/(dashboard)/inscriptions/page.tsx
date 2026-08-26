import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inscriptions" };

const statusBadge: Record<string, string> = {
  pending: "badge-warning",
  confirmed: "badge-success",
  cancelled: "badge-error",
  completed: "badge-primary",
};

const statusLabel: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

export default async function InscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("inscriptions")
    .select(`
      *,
      etudiant:profiles(prenom, nom, email),
      session:sessions(titre, date_debut, formation:formations(titre))
    `)
    .order("date_inscription", { ascending: false });

  if (profile?.role === "etudiant") {
    query = query.eq("etudiant_id", user.id);
  } else {
    query = query.eq("organisation_id", profile?.organisation_id || "");
  }

  const { data: inscriptions } = await query;

  const pending = inscriptions?.filter((i) => i.status === "pending").length || 0;
  const confirmed = inscriptions?.filter((i) => i.status === "confirmed").length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inscriptions</h1>
          <p className="text-slate-400 mt-1">Gérez les inscriptions aux formations</p>
        </div>
        {profile?.role === "etudiant" && (
          <Link href="/dashboard/formations" className="btn btn-primary">
            🎓 Voir les formations
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: inscriptions?.length || 0, color: "from-indigo-500 to-purple-600", icon: "📋" },
          { label: "En attente", value: pending, color: "from-amber-500 to-orange-600", icon: "⏳" },
          { label: "Confirmées", value: confirmed, color: "from-emerald-500 to-teal-600", icon: "✅" },
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

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold text-white">Liste des inscriptions</h2>
        </div>
        {!inscriptions || inscriptions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-400">Aucune inscription pour l'instant</p>
          </div>
        ) : (
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  {profile?.role !== "etudiant" && <th>Étudiant</th>}
                  <th>Formation / Session</th>
                  <th>Date inscription</th>
                  <th>Statut</th>
                  {profile?.role !== "etudiant" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {inscriptions.map((insc) => (
                  <tr key={insc.id}>
                    {profile?.role !== "etudiant" && (
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {insc.etudiant?.prenom?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-white text-sm">{insc.etudiant?.prenom} {insc.etudiant?.nom}</span>
                        </div>
                      </td>
                    )}
                    <td>
                      <div className="text-sm font-medium text-white">
                        {insc.session?.formation?.titre || insc.session?.titre || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {insc.session?.date_debut
                          ? new Date(insc.session.date_debut).toLocaleDateString("fr-FR")
                          : "—"}
                      </div>
                    </td>
                    <td className="text-sm">
                      {new Date(insc.date_inscription).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge[insc.status] || "badge-primary"}`}>
                        {statusLabel[insc.status] || insc.status}
                      </span>
                    </td>
                    {profile?.role !== "etudiant" && (
                      <td>
                        <Link href={`/dashboard/inscriptions/${insc.id}`} className="btn btn-ghost btn-sm">
                          Gérer
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
