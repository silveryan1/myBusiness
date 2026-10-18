"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /** Action serveur déjà liée à ses arguments (action.bind(null, id, …)). */
  action: () => Promise<{ erreur?: string }>;
  libelle: string;
  /** Si renseigné, un 2e clic est demandé (« Confirmer : … »). */
  confirmer?: string;
  className?: string;
}

/** Bouton qui exécute une action serveur, avec confirmation facultative et message d'erreur. */
export default function BoutonAction({ action, libelle, confirmer, className = "btn btn-secondary btn-sm" }: Props) {
  const router = useRouter();
  const [enAttente, demarrer] = useTransition();
  const [aConfirmer, setAConfirmer] = useState(false);
  const [erreur, setErreur] = useState("");

  function cliquer() {
    if (confirmer && !aConfirmer) {
      setAConfirmer(true);
      setTimeout(() => setAConfirmer(false), 4000);
      return;
    }
    setAConfirmer(false);
    setErreur("");
    demarrer(async () => {
      const res = await action();
      if (res?.erreur) setErreur(res.erreur);
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={cliquer} disabled={enAttente} className={className}>
        {enAttente ? "…" : aConfirmer ? confirmer : libelle}
      </button>
      {erreur && <span className="text-xs text-red-400 max-w-[220px] text-right">{erreur}</span>}
    </span>
  );
}
