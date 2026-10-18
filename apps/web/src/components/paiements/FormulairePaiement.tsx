"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { enregistrerPaiement } from "@/app/actions/paiement";
import { fcfa } from "@/lib/format";

export type InscriptionPayable = { id: string; libelle: string; prix: number; paye: number };

function aujourdhui() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function FormulairePaiement({ inscriptions, initiale }: { inscriptions: InscriptionPayable[]; initiale?: string }) {
  const router = useRouter();
  const depart = inscriptions.find((i) => i.id === initiale);
  const [f, setF] = useState({
    inscription_id: depart?.id ?? "",
    montant: depart && depart.prix > depart.paye ? String(depart.prix - depart.paye) : "",
    methode: "especes", reference: "", date_paiement: aujourdhui(), commentaire: "",
  });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const choisie = useMemo(() => inscriptions.find((i) => i.id === f.inscription_id), [inscriptions, f.inscription_id]);
  const momo = f.methode === "mtn_momo" || f.methode === "orange_money";
  const maj = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function choisirInscription(id: string) {
    const i = inscriptions.find((x) => x.id === id);
    setF((p) => ({ ...p, inscription_id: id, montant: i && i.prix > i.paye ? String(i.prix - i.paye) : p.montant }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const res = await enregistrerPaiement(f);
    setEnvoi(false);
    if (res.erreur) return setErreur(res.erreur);
    router.push(`/paiements/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="glass-card p-6 space-y-5">
      <div>
        <label className="form-label" htmlFor="inscription">Étudiant et formation *</label>
        <select id="inscription" required className="form-input" value={f.inscription_id} onChange={(e) => choisirInscription(e.target.value)}>
          <option value="">Choisir une inscription</option>
          {inscriptions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.libelle}{i.prix > 0 ? ` — reste ${fcfa(Math.max(0, i.prix - i.paye))}` : ""}
            </option>
          ))}
        </select>
        {choisie && choisie.prix > 0 && (
          <p className="text-xs text-slate-500 mt-1">Prix {fcfa(choisie.prix)} · déjà payé {fcfa(choisie.paye)}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="form-label" htmlFor="montant">Montant reçu (FCFA) *</label>
          <input id="montant" type="number" min="1" step="1" required className="form-input" value={f.montant} onChange={(e) => maj("montant", e.target.value)} placeholder="Ex : 25000" />
        </div>
        <div>
          <label className="form-label" htmlFor="date">Date du paiement *</label>
          <input id="date" type="date" required max={aujourdhui()} className="form-input" value={f.date_paiement} onChange={(e) => maj("date_paiement", e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="methode">Moyen de paiement *</label>
          <select id="methode" className="form-input" value={f.methode} onChange={(e) => maj("methode", e.target.value)}>
            <option value="especes">Espèces</option>
            <option value="mtn_momo">MTN Mobile Money</option>
            <option value="orange_money">Orange Money</option>
            <option value="virement">Virement bancaire</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="reference">{momo ? "ID de la transaction *" : "Référence (facultatif)"}</label>
          <input id="reference" className="form-input" maxLength={80} required={momo} value={f.reference} onChange={(e) => maj("reference", e.target.value)}
            placeholder={momo ? "Figure dans le SMS de confirmation" : "N° de bordereau, de chèque…"} />
        </div>
      </div>
      <div>
        <label className="form-label" htmlFor="commentaire">Commentaire</label>
        <input id="commentaire" className="form-input" maxLength={500} value={f.commentaire} onChange={(e) => maj("commentaire", e.target.value)} placeholder="Ex : 1re tranche" />
      </div>
      {erreur && <p className="form-error">{erreur}</p>}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Link href="/paiements" className="btn btn-secondary">Annuler</Link>
        <button type="submit" disabled={envoi} className="btn btn-primary">{envoi ? "Enregistrement…" : "Enregistrer et voir le reçu"}</button>
      </div>
    </form>
  );
}
