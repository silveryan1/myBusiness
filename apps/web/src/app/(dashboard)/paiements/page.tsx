import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Paiements" };

export default function PaiementsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Paiements</h1>
        <p className="text-slate-400 mt-1">Gérez les paiements de vos formations</p>
      </div>

      <div className="glass-card py-16 text-center">
        <div className="text-5xl mb-4">💳</div>
        <h2 className="text-xl font-semibold text-white mb-2">Module Paiements</h2>
        <p className="text-slate-400 mb-2">Intégration Stripe — bientôt disponible</p>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Ce module permettra aux organisations d'encaisser les frais de formation
          directement via la plateforme (Stripe).
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {["Paiement en ligne", "Factures PDF", "Suivi des transactions", "Remboursements"].map((f) => (
            <span key={f} className="badge badge-primary">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
