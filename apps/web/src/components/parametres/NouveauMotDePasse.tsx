"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Choix d'un nouveau mot de passe pour l'utilisateur connecté (paramètres, ou lien « mot de passe oublié »). */
export default function NouveauMotDePasse({ apres = "/dashboard", libelle = "Enregistrer" }: { apres?: string; libelle?: string }) {
  const router = useRouter();
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (mdp.length < 8) return setMessage({ ok: false, texte: "8 caractères au minimum." });
    if (mdp !== confirmation) return setMessage({ ok: false, texte: "Les deux mots de passe ne correspondent pas." });
    setEnvoi(true);
    const { error } = await createClient().auth.updateUser({ password: mdp });
    setEnvoi(false);
    if (error) {
      return setMessage({ ok: false, texte: /session|jwt|auth/i.test(error.message)
        ? "Lien expiré : refaites une demande de mot de passe oublié."
        : "Ce mot de passe est refusé : choisissez-en un autre." });
    }
    setMdp("");
    setConfirmation("");
    setMessage({ ok: true, texte: "Mot de passe modifié ✓" });
    setTimeout(() => { router.push(apres); router.refresh(); }, 1200);
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div>
        <label className="form-label" htmlFor="mdp">Nouveau mot de passe</label>
        <input id="mdp" type="password" className="form-input" minLength={8} required value={mdp}
          onChange={(e) => setMdp(e.target.value)} autoComplete="new-password" placeholder="8 caractères au minimum" />
      </div>
      <div>
        <label className="form-label" htmlFor="confirmation">Confirmer</label>
        <input id="confirmation" type="password" className="form-input" minLength={8} required value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
      </div>
      {message && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.texte}</p>}
      <button type="submit" disabled={envoi} className="btn btn-primary">{envoi ? "Enregistrement…" : libelle}</button>
    </form>
  );
}
