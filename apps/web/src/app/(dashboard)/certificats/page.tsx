import type { Metadata } from "next";

export const metadata: Metadata = { title: "Certificats" };

export default function CertificatsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Certificats</h1>
        <p className="text-slate-400 mt-1">Générez les certificats de vos étudiants</p>
      </div>

      <div className="glass-card py-16 text-center">
        <div className="text-5xl mb-4">🏅</div>
        <h2 className="text-xl font-semibold text-white mb-2">Module Certificats</h2>
        <p className="text-slate-400 mb-2">Génération PDF automatique — bientôt disponible</p>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Ce module permettra de générer automatiquement des certificats de réussite
          en PDF pour les étudiants ayant terminé une formation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {["Certificat PDF", "Signature numérique", "QR Code de vérification", "Envoi par email"].map((f) => (
            <span key={f} className="badge badge-warning">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
