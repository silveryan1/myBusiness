"use client";

/** Ouvre la boîte d'impression du navigateur (« Enregistrer au format PDF » pour un fichier). */
export default function BoutonImprimer({ libelle = "🖨️ Imprimer / PDF" }: { libelle?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm no-print">
      {libelle}
    </button>
  );
}
