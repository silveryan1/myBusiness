import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { dateLongue } from "@/lib/format";

export const metadata: Metadata = { title: "Vérification de certificat", robots: { index: false } };
export const dynamic = "force-dynamic";

type Resultat = {
  numero: string; etudiant: string; formation: string; organisation: string;
  date_delivrance: string; mention: string | null; is_valide: boolean;
};

/** Page publique : la base ne renvoie que ce qui est imprimé sur le certificat, pour un code exact. */
export default async function VerificationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const propre = decodeURIComponent(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  const supabase = await createClient();
  const { data, error } = propre
    ? await supabase.rpc("verifier_certificat", { code: propre })
    : { data: null, error: null };
  const c = (Array.isArray(data) ? data[0] : data) as Resultat | null | undefined;

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-app)" }}>
      <div className="mesh-bg" />
      <div className="glass-card p-8 w-full max-w-lg relative animate-fade-in">
        <Link href="/verifier" className="text-sm text-slate-400 hover:text-white">← Vérifier un autre code</Link>
        {error ? (
          <div className="mt-6">
            <h1 className="text-xl font-bold text-white mb-2">Vérification indisponible</h1>
            <p className="text-slate-400 text-sm">Le service ne répond pas pour le moment. Réessayez plus tard.</p>
          </div>
        ) : !c ? (
          <div className="mt-6">
            <div className="text-4xl mb-3">❌</div>
            <h1 className="text-xl font-bold text-white mb-2">Aucun certificat ne correspond</h1>
            <p className="text-slate-400 text-sm">
              Le code <span className="font-mono text-white">{propre || "—"}</span> ne correspond à aucun certificat délivré. Vérifiez la saisie.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{c.is_valide ? "✅" : "⚠️"}</div>
              <div>
                <h1 className="text-xl font-bold text-white">{c.is_valide ? "Certificat authentique" : "Certificat révoqué"}</h1>
                <p className="text-sm text-slate-400">{c.is_valide ? "Délivré par le centre ci-dessous et toujours valide." : "Il a été délivré, puis annulé par le centre."}</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Titulaire</dt><dd className="text-white font-medium">{c.etudiant}</dd></div>
              <div><dt className="text-slate-500">Formation</dt><dd className="text-white font-medium">{c.formation}</dd></div>
              <div><dt className="text-slate-500">Délivré par</dt><dd className="text-white">{c.organisation}</dd></div>
              <div><dt className="text-slate-500">Date</dt><dd className="text-white">{dateLongue(c.date_delivrance)}</dd></div>
              <div><dt className="text-slate-500">Numéro</dt><dd className="text-white font-mono">{c.numero}</dd></div>
              <div><dt className="text-slate-500">Mention</dt><dd className="text-white">{c.mention || "—"}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </main>
  );
}
