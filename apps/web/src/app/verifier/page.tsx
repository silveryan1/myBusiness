import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Vérifier un certificat" };

/** Page publique : saisir le code imprimé en bas d'un certificat. */
export default async function VerifierPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const propre = (code ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  if (propre) redirect(`/verifier/${propre}`);

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-app)" }}>
      <div className="mesh-bg" />
      <div className="glass-card p-8 w-full max-w-md relative animate-fade-in">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← myBusiness</Link>
        <h1 className="text-2xl font-bold text-white mt-4 mb-2">Vérifier un certificat</h1>
        <p className="text-slate-400 text-sm mb-6">
          Saisissez le code imprimé en bas du certificat. Vous saurez s&apos;il a bien été délivré, à qui et pour quelle formation.
        </p>
        <form method="get" className="space-y-4">
          <div>
            <label htmlFor="code" className="form-label">Code de vérification</label>
            <input id="code" name="code" className="form-input font-mono uppercase" required minLength={6} maxLength={20}
              placeholder="Ex : 3F9A1C0B7E" autoComplete="off" />
          </div>
          <button type="submit" className="btn btn-primary w-full">Vérifier</button>
        </form>
      </div>
    </main>
  );
}
