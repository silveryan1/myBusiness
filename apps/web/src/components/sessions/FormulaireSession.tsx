"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { creerSession } from "@/app/actions/session";

type Option = { id: string; titre?: string; prenom?: string; nom?: string };

export default function FormulaireSession({ formations, formateurs, formationInitiale }: {
  formations: Option[]; formateurs: Option[]; formationInitiale?: string;
}) {
  const router = useRouter();
  const [f, setF] = useState({
    formation_id: formations.some((x) => x.id === formationInitiale) ? (formationInitiale as string) : "",
    titre: "", formateur_id: "", date_debut: "", date_fin: "", places_total: "20",
    mode: "presentiel", lieu: "", description: "",
  });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const maj = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (f.date_fin < f.date_debut) return setErreur("La date de fin doit suivre la date de début.");
    setEnvoi(true);
    // Les champs datetime-local sont en heure locale : on les convertit ici, dans le navigateur.
    const res = await creerSession({
      ...f,
      date_debut: new Date(f.date_debut).toISOString(),
      date_fin: new Date(f.date_fin).toISOString(),
    });
    setEnvoi(false);
    if (res.erreur) return setErreur(res.erreur);
    router.push(`/sessions/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="glass-card p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="form-label" htmlFor="formation_id">Formation *</label>
          <select id="formation_id" required className="form-input" value={f.formation_id} onChange={(e) => maj("formation_id", e.target.value)}>
            <option value="">Choisir une formation</option>
            {formations.map((x) => <option key={x.id} value={x.id}>{x.titre}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="titre">Titre (facultatif)</label>
          <input id="titre" className="form-input" maxLength={160} value={f.titre} onChange={(e) => maj("titre", e.target.value)}
            placeholder="Par défaut : titre de la formation" />
        </div>
        <div>
          <label className="form-label" htmlFor="date_debut">Début *</label>
          <input id="date_debut" type="datetime-local" required className="form-input" value={f.date_debut} onChange={(e) => maj("date_debut", e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="date_fin">Fin *</label>
          <input id="date_fin" type="datetime-local" required className="form-input" value={f.date_fin} min={f.date_debut} onChange={(e) => maj("date_fin", e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="formateur_id">Formateur</label>
          <select id="formateur_id" className="form-input" value={f.formateur_id} onChange={(e) => maj("formateur_id", e.target.value)}>
            <option value="">À désigner plus tard</option>
            {formateurs.map((x) => <option key={x.id} value={x.id}>{x.prenom} {x.nom}</option>)}
          </select>
          {formateurs.length === 0 && <p className="text-xs text-slate-500 mt-1">Aucun formateur : ajoutez-en depuis « Membres ».</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="places_total">Nombre de places *</label>
          <input id="places_total" type="number" min="1" max="10000" required className="form-input" value={f.places_total} onChange={(e) => maj("places_total", e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="mode">Mode</label>
          <select id="mode" className="form-input" value={f.mode} onChange={(e) => maj("mode", e.target.value)}>
            <option value="presentiel">Présentiel</option>
            <option value="distanciel">À distance</option>
            <option value="hybride">Hybride</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="lieu">Lieu</label>
          <input id="lieu" className="form-input" maxLength={160} value={f.lieu} onChange={(e) => maj("lieu", e.target.value)} placeholder="Ex : Salle 2, Yaoundé – Bastos" />
        </div>
      </div>
      <div>
        <label className="form-label" htmlFor="description">Informations pour les participants</label>
        <textarea id="description" rows={3} className="form-input resize-none" maxLength={2000} value={f.description}
          onChange={(e) => maj("description", e.target.value)} placeholder="Matériel à apporter, horaires détaillés…" />
      </div>
      {erreur && <p className="form-error">{erreur}</p>}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Link href="/sessions" className="btn btn-secondary">Annuler</Link>
        <button type="submit" disabled={envoi} className="btn btn-primary">{envoi ? "Enregistrement…" : "Créer la session"}</button>
      </div>
    </form>
  );
}
