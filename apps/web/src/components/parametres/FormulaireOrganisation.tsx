"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierOrganisation } from "@/app/actions/organisation";

type Org = { nom: string; telephone: string; email_contact: string; adresse: string; ville: string; description: string };

/** Coordonnées du centre : elles figurent sur les reçus et les certificats. */
export default function FormulaireOrganisation({ initial }: { initial: Org }) {
  const router = useRouter();
  const [f, setF] = useState<Org>(initial);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const maj = (k: keyof Org, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    const res = await modifierOrganisation(f);
    setEnvoi(false);
    setMessage(res.erreur ? { ok: false, texte: res.erreur } : { ok: true, texte: "Enregistré ✓" });
    if (!res.erreur) router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="org-nom">Nom du centre *</label>
          <input id="org-nom" className="form-input" required maxLength={120} value={f.nom} onChange={(e) => maj("nom", e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="org-tel">Téléphone</label>
          <input id="org-tel" type="tel" className="form-input" maxLength={40} value={f.telephone} onChange={(e) => maj("telephone", e.target.value)} placeholder="Ex : 6XX XX XX XX" />
        </div>
        <div>
          <label className="form-label" htmlFor="org-email">E-mail de contact</label>
          <input id="org-email" type="email" className="form-input" maxLength={160} value={f.email_contact} onChange={(e) => maj("email_contact", e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="org-adresse">Adresse</label>
          <input id="org-adresse" className="form-input" maxLength={200} value={f.adresse} onChange={(e) => maj("adresse", e.target.value)} placeholder="Ex : Rue 1.234, Bastos" />
        </div>
        <div>
          <label className="form-label" htmlFor="org-ville">Ville</label>
          <input id="org-ville" className="form-input" maxLength={80} value={f.ville} onChange={(e) => maj("ville", e.target.value)} placeholder="Ex : Yaoundé" />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="org-desc">Présentation</label>
          <textarea id="org-desc" rows={3} className="form-input resize-none" maxLength={1000} value={f.description} onChange={(e) => maj("description", e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-slate-500">Le nom, l&apos;adresse, la ville et le téléphone figurent sur les reçus et les certificats.</p>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={envoi} className="btn btn-primary btn-sm">{envoi ? "Enregistrement…" : "Enregistrer"}</button>
        {message && <span className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.texte}</span>}
      </div>
    </form>
  );
}
