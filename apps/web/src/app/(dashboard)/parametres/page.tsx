import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paramètres" };

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  const org = profile?.organisation as any;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 mt-1">Gérez votre profil et votre organisation</p>
      </div>

      {/* Mon profil */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-white text-lg border-b border-white/10 pb-3">👤 Mon profil</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
            {profile?.prenom?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="font-semibold text-white text-lg">{profile?.prenom} {profile?.nom}</div>
            <div className="text-slate-400 text-sm">{profile?.email}</div>
            <span className="badge badge-primary mt-1">{profile?.role}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-slate-500 mb-1">Prénom</div><div className="text-white">{profile?.prenom || "—"}</div></div>
          <div><div className="text-slate-500 mb-1">Nom</div><div className="text-white">{profile?.nom || "—"}</div></div>
          <div><div className="text-slate-500 mb-1">Email</div><div className="text-white">{profile?.email}</div></div>
          <div><div className="text-slate-500 mb-1">Rôle</div><div className="text-white capitalize">{profile?.role}</div></div>
        </div>
        <div className="pt-2">
          <a href="/dashboard/parametres/profil" className="btn btn-secondary btn-sm">✏️ Modifier mon profil</a>
        </div>
      </div>

      {/* Organisation */}
      {org && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white text-lg border-b border-white/10 pb-3">🏢 Mon organisation</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-slate-500 mb-1">Nom</div><div className="text-white font-medium">{org.nom}</div></div>
            <div><div className="text-slate-500 mb-1">Slug</div><div className="text-indigo-400 font-mono">/{org.slug}</div></div>
            <div>
              <div className="text-slate-500 mb-1">Statut</div>
              <span className={`badge ${org.status === "active" ? "badge-success" : org.status === "trial" ? "badge-warning" : "badge-error"}`}>
                {org.status === "trial" ? "Période d'essai" : org.status}
              </span>
            </div>
            <div><div className="text-slate-500 mb-1">Créée le</div><div className="text-white">{new Date(org.created_at).toLocaleDateString("fr-FR")}</div></div>
          </div>
        </div>
      )}

      {/* Sécurité */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-white text-lg border-b border-white/10 pb-3">🔒 Sécurité</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Mot de passe</div>
            <div className="text-slate-400 text-sm">Modifiez votre mot de passe de connexion</div>
          </div>
          <a href="/dashboard/parametres/mot-de-passe" className="btn btn-secondary btn-sm">Changer</a>
        </div>
      </div>
    </div>
  );
}
