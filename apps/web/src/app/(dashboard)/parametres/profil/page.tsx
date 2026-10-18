"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("prenom, nom, telephone, bio").eq("id", user.id).single();
      if (data) {
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setTelephone(data.telephone || "");
        setBio(data.bio || "");
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    const { error } = await createClient().from("profiles").update({
      prenom: prenom.trim().slice(0, 60),
      nom: nom.trim().slice(0, 60),
      telephone: telephone.trim().slice(0, 40) || null,
      bio: bio.trim().slice(0, 500) || null,
    }).eq("id", userId);
    setLoading(false);
    setMessage(error ? { ok: false, texte: "Enregistrement refusé : vérifiez votre connexion." } : { ok: true, texte: "Profil mis à jour ✓" });
    if (!error) router.refresh();
  }

  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/parametres" className="btn btn-ghost btn-sm" aria-label="Retour">←</Link>
        <h1 className="text-2xl font-bold text-white">Modifier mon profil</h1>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="prenom">Prénom</label>
              <input id="prenom" className="form-input" value={prenom} onChange={e => setPrenom(e.target.value)} required maxLength={60} />
            </div>
            <div>
              <label className="form-label" htmlFor="nom">Nom</label>
              <input id="nom" className="form-input" value={nom} onChange={e => setNom(e.target.value)} required maxLength={60} />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="telephone">Téléphone / WhatsApp</label>
            <input id="telephone" type="tel" className="form-input" value={telephone} onChange={e => setTelephone(e.target.value)} maxLength={40} placeholder="Ex : 6XX XX XX XX" />
          </div>
          <div>
            <label className="form-label" htmlFor="bio">À propos de moi</label>
            <textarea id="bio" rows={3} className="form-input resize-none" value={bio} onChange={e => setBio(e.target.value)} maxLength={500} />
          </div>
          {message && <div className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.texte}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? "Enregistrement…" : "💾 Enregistrer"}
            </button>
            <Link href="/parametres" className="btn btn-secondary btn-sm">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
