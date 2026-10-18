"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { delivrerCertificat } from "@/app/actions/certificat";

const MENTIONS = ["", "Passable", "Assez bien", "Bien", "Très bien"];

/** Choix de la mention puis délivrance (la mention proposée vient de la note finale, si elle existe). */
export default function DelivrerCertificat({ inscriptionId, mentionProposee }: { inscriptionId: string; mentionProposee?: string }) {
  const router = useRouter();
  const [mention, setMention] = useState(mentionProposee ?? "");
  const [erreur, setErreur] = useState("");
  const [enAttente, demarrer] = useTransition();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <select className="form-input sm:w-40 py-1.5 text-sm" value={mention} onChange={(e) => setMention(e.target.value)} aria-label="Mention">
        {MENTIONS.map((m) => <option key={m} value={m}>{m || "Sans mention"}</option>)}
      </select>
      <button type="button" className="btn btn-primary btn-sm" disabled={enAttente}
        onClick={() => demarrer(async () => {
          setErreur("");
          const res = await delivrerCertificat(inscriptionId, mention);
          if (res.erreur) setErreur(res.erreur);
          else if (res.id) router.push(`/certificats/${res.id}`);
        })}>
        {enAttente ? "…" : "Délivrer"}
      </button>
      {erreur && <span className="text-xs text-red-400">{erreur}</span>}
    </div>
  );
}
