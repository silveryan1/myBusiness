"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Formation { id: string; titre: string; }
interface Formateur { id: string; prenom: string; nom: string; }
interface Salle { id: string; nom: string; capacite: number; }

export default function NouvelleSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formations, setFormations] = useState<Formation[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);

  const [form, setForm] = useState({
    formation_id: "",
    formateur_id: "",
    salle_id: "",
    titre: "",
    date_debut: "",
    date_fin: "",
    places_total: 20,
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .single();

      const orgId = profile?.organisation_id;
      if (!orgId) return;

      const [f, fmt, s] = await Promise.all([
        supabase.from("formations").select("id, titre").eq("organisation_id", orgId).eq("status", "published"),
        supabase.from("profiles").select("id, prenom, nom").eq("organisation_id", orgId).eq("role", "formateur"),
        supabase.from("salles").select("id, nom, capacite").eq("organisation_id", orgId).eq("is_active", true),
      ]);

      setFormations(f.data || []);
      setFormateurs(fmt.data || []);
      setSalles(s.data || []);
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    const { error: insertError } = await supabase.from("sessions").insert({
      organisation_id: profile?.organisation_id,
      formation_id: form.formation_id,
      formateur_id: form.formateur_id || null,
      salle_id: form.salle_id || null,
      titre: form.titre || null,
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      places_total: form.places_total,
      places_restantes: form.places_total,
      status: "scheduled",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/sessions");
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/sessions" className="btn btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nouvelle session</h1>
          <p className="text-slate-400 text-sm">Planifiez une nouvelle session de formation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div>
          <label className="form-label">Formation *</label>
          <select
            value={form.formation_id}
            onChange={(e) => setForm({ ...form, formation_id: e.target.value })}
            className="form-input"
            required
          >
            <option value="">Sélectionner une formation</option>
            {formations.map((f) => (
              <option key={f.id} value={f.id}>{f.titre}</option>
            ))}
          </select>
          {formations.length === 0 && (
            <p className="text-xs text-amber-400 mt-1">
              ⚠️ Aucune formation publiée.{" "}
              <Link href="/dashboard/formations/nouveau" className="underline">Créer une formation</Link> d'abord.
            </p>
          )}
        </div>

        <div>
          <label className="form-label">Titre personnalisé (optionnel)</label>
          <input
            type="text"
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
            className="form-input"
            placeholder="Ex: Session intensive weekend"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Date & heure de début *</label>
            <input
              type="datetime-local"
              value={form.date_debut}
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">Date & heure de fin *</label>
            <input
              type="datetime-local"
              value={form.date_fin}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Formateur</label>
            <select
              value={form.formateur_id}
              onChange={(e) => setForm({ ...form, formateur_id: e.target.value })}
              className="form-input"
            >
              <option value="">Non assigné</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Salle</label>
            <select
              value={form.salle_id}
              onChange={(e) => setForm({ ...form, salle_id: e.target.value })}
              className="form-input"
            >
              <option value="">Non assignée</option>
              {salles.map((s) => (
                <option key={s.id} value={s.id}>{s.nom} ({s.capacite} places)</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Nombre de places</label>
          <input
            type="number"
            value={form.places_total}
            onChange={(e) => setForm({ ...form, places_total: parseInt(e.target.value) || 20 })}
            className="form-input"
            min={1}
            max={500}
          />
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
          <Link href="/dashboard/sessions" className="btn btn-secondary flex-1">Annuler</Link>
          <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
            {loading ? <><div className="spinner" /> Création...</> : "Créer la session"}
          </button>
        </div>
      </form>
    </div>
  );
}
