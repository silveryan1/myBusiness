"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setEnvoi(false);
    // Même message que l'adresse existe ou non : on ne révèle pas qui a un compte.
    if (error && error.status === 429) return setErreur("Trop de demandes : réessayez dans quelques minutes.");
    setEnvoye(true);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mot de passe oublié</h1>
        <p className="text-slate-400">Recevez par e-mail un lien pour en choisir un nouveau.</p>
      </div>
      {envoye ? (
        <div className="space-y-6">
          <p className="text-slate-300">
            Si un compte existe pour <b className="text-white">{email}</b>, un e-mail vient d&apos;être envoyé.
            Ouvrez le lien qu&apos;il contient (pensez à regarder dans les spams).
          </p>
          <Link href="/login" className="btn btn-primary">Retour à la connexion</Link>
        </div>
      ) : (
        <form onSubmit={soumettre} className="space-y-5">
          <div>
            <label htmlFor="email" className="form-label">Adresse e-mail</label>
            <input id="email" type="email" required className="form-input" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com" autoComplete="email" />
          </div>
          {erreur && <p className="form-error">{erreur}</p>}
          <button type="submit" disabled={envoi} className="btn btn-primary btn-lg w-full">{envoi ? "Envoi…" : "Recevoir le lien"}</button>
          <p className="text-center text-sm text-slate-400">
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Retour à la connexion</Link>
          </p>
        </form>
      )}
    </div>
  );
}
