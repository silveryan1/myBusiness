"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changerRoleMembre } from "@/app/actions/membre";

/** Administration : changer le rôle d'un membre (pas le sien). */
export default function RoleMembre({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  const [valeur, setValeur] = useState(role);
  const [erreur, setErreur] = useState("");
  const [enAttente, demarrer] = useTransition();

  return (
    <span className="inline-flex flex-col gap-1">
      <select className="form-input py-1 text-sm w-auto" value={valeur} disabled={enAttente} aria-label="Rôle"
        onChange={(e) => {
          const nouveau = e.target.value;
          setValeur(nouveau);
          demarrer(async () => {
            setErreur("");
            const res = await changerRoleMembre(id, nouveau);
            if (res.erreur) { setErreur(res.erreur); setValeur(role); }
            else router.refresh();
          });
        }}>
        <option value="etudiant">Étudiant</option>
        <option value="formateur">Formateur</option>
        <option value="admin">Administrateur</option>
      </select>
      {erreur && <span className="text-xs text-red-400">{erreur}</span>}
    </span>
  );
}
