"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { creerMonOrganisation } from "@/app/actions/organisation";

/** Compte connecté mais rattaché à aucune organisation : en créer une, ou attendre une invitation. */
export default function SansOrganisation({ prenom }: { prenom?: string | null }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { erreur } = await creerMonOrganisation(nom);
    setEnvoi(false);
    if (erreur) setErreur(erreur);
    else router.refresh();
  }

  async function deconnexion() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-app)" }}>
      <div className="mesh-bg" />
      <div className="glass-card p-8 w-full max-w-md animate-fade-in relative">
        <h1 className="text-2xl font-bold text-white mb-2">Bienvenue{prenom ? `, ${prenom}` : ""} 👋</h1>
        <p className="text-slate-400 mb-6 text-sm">
          Votre compte n&apos;est rattaché à aucun centre de formation. Si un centre vous a invité,
          demandez-lui de vous ajouter depuis sa page « Membres ». Sinon, créez votre propre centre :
        </p>
        <form onSubmit={creer} className="space-y-4">
          <div>
            <label className="form-label" htmlFor="nomOrg">Nom de votre centre de formation</label>
            <input id="nomOrg" className="form-input" value={nom} onChange={(e) => setNom(e.target.value)}
              placeholder="Ex : Centre Excellence Yaoundé" required minLength={2} maxLength={120} />
          </div>
          {erreur && <p className="form-error">{erreur}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={envoi}>
            {envoi ? "Création…" : "Créer mon centre"}
          </button>
        </form>
        <button onClick={deconnexion} className="btn btn-ghost w-full mt-3 text-sm">Se déconnecter</button>
      </div>
    </div>
  );
}
