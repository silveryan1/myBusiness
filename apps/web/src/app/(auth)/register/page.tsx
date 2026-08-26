"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    organisationNom: "",
    organisationSlug: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "organisationNom") {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setForm((prev) => ({ ...prev, organisationSlug: slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();

    // Étape 1 : Créer le compte Supabase (trigger crée le profil de base)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          prenom: form.prenom,
          nom: form.nom,
          role: "admin",
          // NE PAS passer organisation_nom ici pour éviter le trigger complexe
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Étape 2 : Créer l'organisation via l'API (plus fiable qu'un trigger)
    if (authData.user) {
      const res = await fetch("/api/setup-organisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationNom: form.organisationNom,
          organisationSlug: form.organisationSlug,
          userId: authData.user.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Organisation setup error:", err);
        // On continue quand même — l'admin pourra configurer son org plus tard
      }
    }

    setSuccess(true);
    setLoading(false);
  }


  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Compte créé ! 🎉</h2>
        <p className="text-slate-400 mb-6">
          Vérifiez votre email <strong className="text-white">{form.email}</strong> pour confirmer votre compte.
        </p>
        <Link href="/login" className="btn btn-primary">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Créer un compte 🚀</h1>
        <p className="text-slate-400">
          Configurez votre organisation en quelques minutes
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-slate-500 border border-white/10"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            <span className={`text-xs ${step >= s ? "text-indigo-400" : "text-slate-600"}`}>
              {s === 1 ? "Votre profil" : "Organisation"}
            </span>
            {s < 2 && <div className={`flex-1 h-px mx-2 w-8 ${step > s ? "bg-indigo-600" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => updateForm("prenom", e.target.value)}
                  className="form-input"
                  placeholder="Jean"
                  required
                />
              </div>
              <div>
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => updateForm("nom", e.target.value)}
                  className="form-input"
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className="form-input"
                placeholder="jean@exemple.com"
                required
              />
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                className="form-input"
                placeholder="Minimum 8 caractères"
                required
              />
            </div>

            <div>
              <label className="form-label">Confirmer le mot de passe</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
              Continuer
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="form-label">Nom de l'organisation</label>
              <input
                type="text"
                value={form.organisationNom}
                onChange={(e) => updateForm("organisationNom", e.target.value)}
                className="form-input"
                placeholder="Centre de Formation Alpha"
                required
              />
            </div>

            <div>
              <label className="form-label">Identifiant unique (slug)</label>
              <div className="flex items-center">
                <span className="form-input rounded-r-none border-r-0 text-slate-500 text-sm bg-white/[0.02] w-auto px-3 whitespace-nowrap">
                  mybusiness.app/
                </span>
                <input
                  type="text"
                  value={form.organisationSlug}
                  onChange={(e) => updateForm("organisationSlug", e.target.value)}
                  className="form-input rounded-l-none flex-1"
                  placeholder="centre-alpha"
                  required
                  pattern="[a-z0-9-]+"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Lettres minuscules, chiffres et tirets uniquement</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary flex-1"
              >
                Retour
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? <><div className="spinner" /> Création...</> : "Créer mon compte"}
              </button>
            </div>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
