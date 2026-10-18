import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NouveauMotDePasse from "@/components/parametres/NouveauMotDePasse";

export const dynamic = "force-dynamic";

/** Arrivée depuis le lien « mot de passe oublié » (la session est ouverte par /auth/callback). */
export default async function ReinitialiserPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nouveau mot de passe</h1>
        <p className="text-slate-400">{user ? `Compte : ${user.email}` : "Ce lien a expiré ou a déjà servi."}</p>
      </div>
      {user ? (
        <NouveauMotDePasse libelle="Enregistrer et me connecter" />
      ) : (
        <Link href="/forgot-password" className="btn btn-primary">Demander un nouveau lien</Link>
      )}
    </div>
  );
}
