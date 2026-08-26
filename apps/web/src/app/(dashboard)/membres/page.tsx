import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Membres" };

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  formateur: "Formateur",
  etudiant: "Étudiant",
};

const roleBadge: Record<string, string> = {
  super_admin: "badge-error",
  admin: "badge-primary",
  formateur: "badge-warning",
  etudiant: "badge-success",
};

export default async function MembresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  const { data: membres } = await supabase
    .from("profiles")
    .select("*")
    .eq("organisation_id", currentProfile?.organisation_id || "")
    .order("created_at", { ascending: false });

  const stats = {
    total: membres?.length || 0,
    admins: membres?.filter((m) => m.role === "admin").length || 0,
    formateurs: membres?.filter((m) => m.role === "formateur").length || 0,
    etudiants: membres?.filter((m) => m.role === "etudiant").length || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Membres</h1>
          <p className="text-slate-400 mt-1">Gérez les membres de votre organisation</p>
        </div>
        <Link href="/dashboard/membres/inviter" className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Inviter un membre
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: "👥", color: "from-indigo-500 to-purple-600" },
          { label: "Admins", value: stats.admins, icon: "🛡️", color: "from-red-500 to-pink-600" },
          { label: "Formateurs", value: stats.formateurs, icon: "🧑‍🏫", color: "from-amber-500 to-orange-600" },
          { label: "Étudiants", value: stats.etudiants, icon: "🎓", color: "from-emerald-500 to-teal-600" },
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
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white">Liste des membres</h2>
          <span className="badge badge-primary">{stats.total} membres</span>
        </div>

        {!membres || membres.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-400 mb-4">Aucun membre pour l'instant</p>
            <Link href="/dashboard/membres/inviter" className="btn btn-primary">
              Inviter le premier membre
            </Link>
          </div>
        ) : (
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {membres.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {m.prenom?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-white">
                          {m.prenom} {m.nom}
                        </span>
                      </div>
                    </td>
                    <td>{m.email}</td>
                    <td>
                      <span className={`badge ${roleBadge[m.role] || "badge-primary"}`}>
                        {roleLabels[m.role] || m.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${m.is_active ? "badge-success" : "badge-error"}`}>
                        {m.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/membres/${m.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Voir
                        </Link>
                      </div>
                    </td>
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
