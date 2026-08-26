"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("prenom, nom").eq("id", user.id).single();
      if (data) { setPrenom(data.prenom || ""); setNom(data.nom || ""); }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ prenom, nom }).eq("id", userId);
    setSuccess(true);
    setLoading(false);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <a href="/dashboard/parametres" className="text-slate-400 hover:text-white transition-colors">← Retour</a>
        <h1 className="text-2xl font-bold text-white">Modifier mon profil</h1>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Prénom</label>
            <input className="form-input" value={prenom} onChange={e => setPrenom(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Nom</label>
            <input className="form-input" value={nom} onChange={e => setNom(e.target.value)} required />
          </div>
          {success && <div className="text-emerald-400 text-sm">✅ Profil mis à jour !</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? "Sauvegarde..." : "💾 Sauvegarder"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary btn-sm">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}
