"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { creerFormation, modifierFormation, type DonneesFormation } from "@/app/actions/formation";

const VIDE: DonneesFormation = {
  titre: "", description: "", objectifs: "", prerequis: "", duree_heures: "",
  niveau: "debutant", categorie: "", is_payante: false, prix: "",
};

/** Création et modification d'une formation (prix en FCFA). */
export default function FormulaireFormation({ id, initial }: { id?: string; initial?: Partial<DonneesFormation> }) {
  const router = useRouter();
  const [f, setF] = useState<DonneesFormation>({ ...VIDE, ...initial });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const maj = (champ: keyof DonneesFormation, valeur: string | boolean) => setF((p) => ({ ...p, [champ]: valeur }));

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const res = id ? await modifierFormation(id, f) : await creerFormation(f);
    setEnvoi(false);
    if (res.erreur) return setErreur(res.erreur);
    router.push(`/formations/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="glass-card p-6 md:p-8 space-y-5">
      <div>
        <label htmlFor="titre" className="form-label">Titre de la formation *</label>
        <input id="titre" className="form-input" required maxLength={160} value={f.titre}
          onChange={(e) => maj("titre", e.target.value)} placeholder="Ex : Bureautique (Word, Excel, PowerPoint)" />
      </div>
      <div>
        <label htmlFor="description" className="form-label">Description</label>
        <textarea id="description" className="form-input resize-none" rows={3} maxLength={2000} value={f.description}
          onChange={(e) => maj("description", e.target.value)} placeholder="En quelques lignes, ce que propose la formation…" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="categorie" className="form-label">Catégorie</label>
          <input id="categorie" className="form-input" maxLength={80} value={f.categorie}
            onChange={(e) => maj("categorie", e.target.value)} placeholder="Ex : Informatique" />
        </div>
        <div>
          <label htmlFor="niveau" className="form-label">Niveau</label>
          <select id="niveau" className="form-input" value={f.niveau} onChange={(e) => maj("niveau", e.target.value)}>
            <option value="debutant">Débutant</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="avance">Avancé</option>
          </select>
        </div>
        <div>
          <label htmlFor="duree" className="form-label">Durée (heures)</label>
          <input id="duree" type="number" min="1" step="1" className="form-input" value={f.duree_heures}
            onChange={(e) => maj("duree_heures", e.target.value)} placeholder="Ex : 40" />
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={f.is_payante} onChange={(e) => maj("is_payante", e.target.checked)} className="w-5 h-5" />
        <span className="text-white font-medium">Formation payante</span>
      </label>
      {f.is_payante && (
        <div className="md:w-1/2">
          <label htmlFor="prix" className="form-label">Prix (FCFA) *</label>
          <input id="prix" type="number" min="1" step="1" required className="form-input" value={f.prix}
            onChange={(e) => maj("prix", e.target.value)} placeholder="Ex : 75000" />
        </div>
      )}
      <div className="pt-4 border-t border-white/10 space-y-4">
        <div>
          <label htmlFor="objectifs" className="form-label">Objectifs</label>
          <textarea id="objectifs" className="form-input resize-none" rows={3} maxLength={2000} value={f.objectifs}
            onChange={(e) => maj("objectifs", e.target.value)} placeholder="Ce que les participants sauront faire à la fin…" />
        </div>
        <div>
          <label htmlFor="prerequis" className="form-label">Prérequis</label>
          <textarea id="prerequis" className="form-input resize-none" rows={2} maxLength={1000} value={f.prerequis}
            onChange={(e) => maj("prerequis", e.target.value)} placeholder="Niveau ou matériel nécessaire…" />
        </div>
      </div>
      {erreur && <p className="form-error">{erreur}</p>}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Link href={id ? `/formations/${id}` : "/formations"} className="btn btn-secondary">Annuler</Link>
        <button type="submit" disabled={envoi} className="btn btn-primary">{envoi ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
