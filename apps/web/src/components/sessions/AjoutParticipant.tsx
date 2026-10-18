"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inscrireEtudiant } from "@/app/actions/inscription";

/** Administration : inscrire directement un étudiant du centre à la session. */
export default function AjoutParticipant({ sessionId, etudiants }: {
  sessionId: string; etudiants: { id: string; prenom: string; nom: string }[];
}) {
  const router = useRouter();
  const [choix, setChoix] = useState("");
  const [erreur, setErreur] = useState("");
  const [enAttente, demarrer] = useTransition();

  if (etudiants.length === 0) {
    return <p className="text-xs text-slate-500">Tous les étudiants du centre sont déjà inscrits (ou aucun étudiant : ajoutez-en depuis « Membres »).</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <select className="form-input sm:flex-1" value={choix} onChange={(e) => setChoix(e.target.value)} aria-label="Étudiant à inscrire">
        <option value="">Inscrire un étudiant…</option>
        {etudiants.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
      </select>
      <button type="button" className="btn btn-primary btn-sm" disabled={!choix || enAttente}
        onClick={() => demarrer(async () => {
          setErreur("");
          const res = await inscrireEtudiant(sessionId, choix);
          if (res.erreur) setErreur(res.erreur);
          else { setChoix(""); router.refresh(); }
        })}>
        {enAttente ? "…" : "Inscrire"}
      </button>
      {erreur && <p className="text-xs text-red-400 sm:self-center">{erreur}</p>}
    </div>
  );
}
