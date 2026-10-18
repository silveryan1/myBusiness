"use client";

import { useState } from "react";
import Link from "next/link";
import { ajouterMembre } from "@/app/actions/membre";

const VIDE = { prenom: "", nom: "", email: "", telephone: "", role: "etudiant" };

export default function AjouterMembrePage() {
  const [form, setForm] = useState(VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState<{ motDePasse?: string; existant?: boolean } | null>(null);
  const [copie, setCopie] = useState(false);
  const maj = (k: keyof typeof VIDE, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const res = await ajouterMembre(form);
    setEnvoi(false);
    if (res.erreur) return setErreur(res.erreur);
    setResultat(res);
  }

  const lienConnexion = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const message = resultat?.motDePasse
    ? `Bonjour ${form.prenom}, votre compte est prêt.\nConnexion : ${lienConnexion}\nE-mail : ${form.email}\nMot de passe provisoire : ${resultat.motDePasse}\nPensez à le changer dans Paramètres.`
    : "";

  if (resultat) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="glass-card p-8 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-bold text-white">{form.prenom} {form.nom} fait partie du centre</h2>
          </div>
          {resultat.existant ? (
            <p className="text-slate-400 text-sm text-center">
              Cette personne avait déjà un compte : elle se connecte avec son mot de passe habituel ({form.email}).
            </p>
          ) : (
            <>
              <p className="text-slate-400 text-sm">
                Transmettez-lui ces informations (par WhatsApp ou SMS). <b className="text-white">Le mot de passe provisoire ne sera plus affiché.</b>
              </p>
              <pre className="whitespace-pre-wrap rounded-xl bg-black/30 border border-white/10 p-4 text-sm text-slate-200">{message}</pre>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={async () => {
                  try { await navigator.clipboard.writeText(message); setCopie(true); } catch { setCopie(false); }
                }}>{copie ? "Copié ✓" : "📋 Copier le message"}</button>
                <a className="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/${form.telephone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`}>
                  💬 Envoyer par WhatsApp
                </a>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setResultat(null); setForm(VIDE); setCopie(false); }} className="btn btn-secondary flex-1">Ajouter un autre</button>
            <Link href="/membres" className="btn btn-primary flex-1">Voir les membres</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/membres" className="btn btn-ghost btn-sm" aria-label="Retour">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Ajouter un membre</h1>
          <p className="text-slate-400 text-sm">Le compte est créé tout de suite, avec un mot de passe provisoire.</p>
        </div>
      </div>
      <form onSubmit={soumettre} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="prenom">Prénom *</label>
            <input id="prenom" className="form-input" required maxLength={60} value={form.prenom} onChange={(e) => maj("prenom", e.target.value)} />
          </div>
          <div>
            <label className="form-label" htmlFor="nom">Nom *</label>
            <input id="nom" className="form-input" required maxLength={60} value={form.nom} onChange={(e) => maj("nom", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="email">E-mail *</label>
          <input id="email" type="email" className="form-input" required maxLength={160} value={form.email} onChange={(e) => maj("email", e.target.value)} placeholder="nom@exemple.com" />
        </div>
        <div>
          <label className="form-label" htmlFor="telephone">Téléphone / WhatsApp</label>
          <input id="telephone" type="tel" className="form-input" maxLength={40} value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} placeholder="Ex : 237 6XX XX XX XX" />
        </div>
        <div>
          <label className="form-label" htmlFor="role">Rôle</label>
          <select id="role" className="form-input" value={form.role} onChange={(e) => maj("role", e.target.value)}>
            <option value="etudiant">🎓 Étudiant</option>
            <option value="formateur">🧑‍🏫 Formateur</option>
            <option value="admin">🛡️ Administrateur</option>
          </select>
        </div>
        {erreur && <p className="form-error">{erreur}</p>}
        <div className="flex gap-3 pt-2">
          <Link href="/membres" className="btn btn-secondary flex-1">Annuler</Link>
          <button type="submit" className="btn btn-primary flex-1" disabled={envoi}>{envoi ? "Création…" : "Créer le compte"}</button>
        </div>
      </form>
    </div>
  );
}
