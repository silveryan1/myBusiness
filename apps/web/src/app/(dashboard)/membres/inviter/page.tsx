"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function InviterMembrePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    role: "etudiant",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    // Récupérer l'organisation du créateur
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non authentifié."); setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    // Créer le compte via signUp
    // On passe organisation_id pour que le trigger lie l'utilisateur à l'org
    // On ne passe PAS organisation_nom → le trigger sait que c'est un invité
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password || Math.random().toString(36).slice(-10),
      options: {
        data: {
          prenom: form.prenom,
          nom: form.nom,
          role: form.role,
          // Pas d'organisation_nom → le trigger détecte un invité
          organisation_id: profile?.organisation_id,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Membre invité ! 🎉</h2>
          <p className="text-slate-400 mb-6">
            Un email de confirmation a été envoyé à <strong className="text-white">{form.email}</strong>.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSuccess(false); setForm({ prenom: "", nom: "", email: "", role: "etudiant", password: "" }); }} className="btn btn-secondary">
              Inviter un autre
            </button>
            <Link href="/membres" className="btn btn-primary">
              Voir les membres
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/membres" className="btn btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Inviter un membre</h1>
          <p className="text-slate-400 text-sm">Ajoutez un nouveau membre à votre organisation</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Prénom</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="form-input"
                placeholder="Marie"
                required
              />
            </div>
            <div>
              <label className="form-label">Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="form-input"
                placeholder="Curie"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-input"
              placeholder="marie@exemple.com"
              required
            />
          </div>

          <div>
            <label className="form-label">Rôle</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="form-input"
            >
              <option value="etudiant">🎓 Étudiant</option>
              <option value="formateur">🧑‍🏫 Formateur</option>
              <option value="admin">🛡️ Administrateur</option>
            </select>
          </div>

          <div>
            <label className="form-label">Mot de passe temporaire</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="form-input"
              placeholder="Laissez vide pour générer automatiquement"
              minLength={8}
            />
            <p className="text-xs text-slate-500 mt-1">
              Le membre pourra le changer après sa première connexion
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/membres" className="btn btn-secondary flex-1">
              Annuler
            </Link>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? <><div className="spinner" /> Envoi...</> : "Inviter le membre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
